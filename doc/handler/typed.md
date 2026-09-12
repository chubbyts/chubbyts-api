# Typed

`createTypedHandler` is the generic building block behind the CRUD handlers of this library. It turns a set of [valibot][2] schemas plus a plain async function into a [@chubbyts/chubbyts-undici-server][1] `Handler`.

Reach for it when the CRUD handlers do not fit: custom status codes, additional route attributes, validated headers, a response without a body, or business logic beyond find / persist / remove.

## How it works

```ts
import { createTypedHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/typed';

const handler = createTypedHandler({
  request: {
    attributes, // required: valibot object schema for serverRequest.attributes
    headers,    // optional: valibot object schema for the request headers
    query,      // optional: valibot object schema for the parsed (qs) query string
    body,       // optional: valibot object schema for the decoded request body
  },
  response: {
    headers,    // optional: valibot object schema for the response headers
    body,       // optional: valibot object schema for the response body
  },
  handler: async ({ attributes, headers, query, body }) => ({ status, statusText, headers, body }),
  decoder,      // required when request.body is set
  encoder,      // required when response.body is set
});
```

Per request it:

 1. Parses `serverRequest.attributes` with `request.attributes`.
 2. Parses the request headers, the query string (via [qs][3]) and the decoded body with the given schemas. Each failure throws a `400 Bad Request` with `invalidParameters` and a `context` of `headers`, `query` or `body`.
 3. Calls your `handler` with the fully typed values.
 4. Parses the returned `headers` and `body` with the response schemas, encodes the body with the negotiated `accept` content type and returns a `Response`.

Which shape you get is determined by the presence of `request.body` and `response.body`. The attributes schema has to include what the variant needs:

| `request.body` | `response.body` | Required attributes       | Required codecs        |
|----------------|-----------------|---------------------------|------------------------|
| yes            | yes             | `contentType`, `accept`   | `decoder`, `encoder`   |
| yes            | no              | `contentType`             | `decoder`              |
| no             | yes             | `accept`                  | `encoder`              |
| no             | no              | –                         | –                      |

The `attributes` schema may of course declare more keys, like `id` for a route parameter.

## Usage

A pet API with embedded vaccinations. The five handlers below are functionally what `createListHandler`, `createCreateHandler`, `createReadHandler`, `createUpdateHandler` and `createDeleteHandler` do.

```ts
import { STATUS_CODES } from 'node:http';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import * as v from 'valibot';
import { v7 as uuid } from 'uuid';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { createTypedHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/typed';
import type {
  EnrichedModel,
  EnrichedModelList,
  EnrichedModelListSchema,
  EnrichedModelSchema,
  InputModel,
  InputModelList,
  Model,
  ModelList,
} from '@chubbyts/chubbyts-undici-api/dist/model';
import {
  createEnrichedModelListSchema,
  createEnrichedModelSchema,
  dateSchema,
  numberSchema,
  sortSchema,
  stringSchema,
} from '@chubbyts/chubbyts-undici-api/dist/model';

// vaccination: a second model that gets embedded into a pet

const inputVaccinationSchema = v.object({ name: stringSchema });

type InputVaccinationSchema = typeof inputVaccinationSchema;

export type Vaccination = Model<InputVaccinationSchema>;

type EnrichedVaccinationSchema = EnrichedModelSchema<InputVaccinationSchema>;

const enrichedVaccinationSchema: EnrichedVaccinationSchema = createEnrichedModelSchema(inputVaccinationSchema);

export type EnrichedVaccination = EnrichedModel<InputVaccinationSchema>;

// pet

const inputPetSchema = v.strictObject({
  name: stringSchema,
  tag: v.optional(stringSchema),
  vaccinations: v.array(
    v.strictObject({
      id: stringSchema,
      injectedAt: dateSchema,
    }),
  ),
});

type InputPetSchema = typeof inputPetSchema;

export type InputPet = InputModel<InputPetSchema>;

const inputPetListSchema = v.strictObject({
  offset: v.optional(numberSchema, 0),
  limit: v.optional(numberSchema, 20),
  filters: v.optional(v.strictObject({ name: v.optional(stringSchema) }), {}),
  sort: v.optional(v.strictObject({ name: sortSchema }), {}),
});

type InputPetListSchema = typeof inputPetListSchema;

export type InputPetList = InputModelList<InputPetListSchema>;

export type Pet = Model<InputPetSchema>;

export type PetList = ModelList<InputPetSchema, InputPetListSchema>;

// typed _embedded for the enriched pet

const embeddedPetSchema = v.optional(
  v.strictObject({
    vaccinations: v.array(v.optional(enrichedVaccinationSchema)),
  }),
);

type EmbeddedPetSchema = typeof embeddedPetSchema;

type EnrichedPetSchema = EnrichedModelSchema<InputPetSchema>;

const enrichedPetSchema: EnrichedPetSchema = createEnrichedModelSchema(inputPetSchema, embeddedPetSchema);

export type EnrichedPet = EnrichedModel<InputPetSchema, EmbeddedPetSchema>;

type EnrichedPetListSchema = EnrichedModelListSchema<InputPetSchema, InputPetListSchema, EmbeddedPetSchema>;

const enrichedPetListSchema: EnrichedPetListSchema = createEnrichedModelListSchema(
  inputPetSchema,
  inputPetListSchema,
  embeddedPetSchema,
);

export type EnrichedPetList = EnrichedModelList<InputPetSchema, InputPetListSchema, EmbeddedPetSchema>;

// repository / enrichment contracts

export type EnrichPet = (pet: Pet) => Promise<EnrichedPet>;
export type EnrichPetList = (petList: PetList) => Promise<EnrichedPetList>;
export type FindPetById = (id: string) => Promise<Pet | undefined>;
export type PersistPet = (pet: Pet) => Promise<Pet>;
export type RemovePet = (pet: Pet) => Promise<void>;
export type ResolvePetList = (inputPetList: InputPetList) => Promise<PetList>;

// handlers

export const createPetListHandler = (
  resolvePetList: ResolvePetList,
  enrichPetList: EnrichPetList,
  encoder: Encoder,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ accept: v.string() }),
      query: inputPetListSchema,
    },
    response: {
      body: enrichedPetListSchema,
    },
    handler: async ({ query }) => {
      const petList = await resolvePetList(query);
      const enrichedPetList = await enrichPetList(petList);

      return {
        status: 200,
        statusText: STATUS_CODES[200],
        body: enrichedPetList,
      };
    },
    encoder,
  });
};

export const createPetCreateHandler = (
  decoder: Decoder,
  persistPet: PersistPet,
  enrichPet: EnrichPet,
  encoder: Encoder,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ contentType: v.string(), accept: v.string() }),
      body: inputPetSchema,
    },
    response: {
      body: enrichedPetSchema,
    },
    handler: async ({ body }) => {
      const persistedPet = await persistPet({ ...body, id: uuid(), createdAt: new Date(), updatedAt: undefined });
      const enrichedPet = await enrichPet(persistedPet);

      return {
        status: 201,
        statusText: STATUS_CODES[201],
        body: enrichedPet,
      };
    },
    decoder,
    encoder,
  });
};

export const createPetReadHandler = (findPetById: FindPetById, enrichPet: EnrichPet, encoder: Encoder): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ accept: v.string(), id: v.string() }),
    },
    response: {
      body: enrichedPetSchema,
    },
    handler: async ({ attributes }) => {
      const pet = await findPetById(attributes.id);

      if (!pet) {
        throw createNotFound({ detail: `There is no pet with id "${attributes.id}"` });
      }

      const enrichedPet = await enrichPet(pet);

      return {
        status: 200,
        statusText: STATUS_CODES[200],
        body: enrichedPet,
      };
    },
    encoder,
  });
};

export const createPetUpdateHandler = (
  decoder: Decoder,
  findPetById: FindPetById,
  persistPet: PersistPet,
  enrichPet: EnrichPet,
  encoder: Encoder,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ contentType: v.string(), accept: v.string(), id: v.string() }),
      body: inputPetSchema,
    },
    response: {
      body: enrichedPetSchema,
    },
    handler: async ({ attributes, body }) => {
      const pet = await findPetById(attributes.id);

      if (!pet) {
        throw createNotFound({ detail: `There is no pet with id "${attributes.id}"` });
      }

      const persistedPet = await persistPet({
        ...body,
        id: pet.id,
        createdAt: pet.createdAt,
        updatedAt: new Date(),
      });

      const enrichedPet = await enrichPet(persistedPet);

      return {
        status: 200,
        statusText: STATUS_CODES[200],
        body: enrichedPet,
      };
    },
    decoder,
    encoder,
  });
};

export const createPetDeleteHandler = (findPetById: FindPetById, removePet: RemovePet): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ id: v.string() }),
    },
    response: {},
    handler: async ({ attributes }) => {
      const pet = await findPetById(attributes.id);

      if (!pet) {
        throw createNotFound({ detail: `There is no pet with id "${attributes.id}"` });
      }

      await removePet(pet);

      return {
        status: 204,
        statusText: STATUS_CODES[204],
      };
    },
  });
};
```

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-server
[2]: https://www.npmjs.com/package/valibot
[3]: https://www.npmjs.com/package/qs
