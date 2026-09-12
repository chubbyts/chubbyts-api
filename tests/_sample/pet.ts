import { STATUS_CODES } from 'node:http';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import * as v from 'valibot';
import { v7 as uuid } from 'uuid';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { createTypedHandler } from '../../src/handler/typed';
import type {
  EnrichedModel,
  EnrichedModelList,
  EnrichedModelListSchema,
  EnrichedModelSchema,
  InputModel,
  InputModelList,
  Model,
  ModelList,
} from '../../src/model';
import {
  createEnrichedModelListSchema,
  createEnrichedModelSchema,
  dateSchema,
  numberSchema,
  sortSchema,
  stringSchema,
} from '../../src/model';

const inputVaccinationSchema = v.object({ name: stringSchema });

type InputVaccinationSchema = typeof inputVaccinationSchema;

export type Vaccination = Model<InputVaccinationSchema>;

type EnrichedVaccinationSchema = EnrichedModelSchema<InputVaccinationSchema>;

const enrichedVaccinationSchema: EnrichedVaccinationSchema = createEnrichedModelSchema(inputVaccinationSchema);

export type EnrichedVaccination = EnrichedModel<InputVaccinationSchema>;

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

export type EnrichPet = (pet: Pet) => Promise<EnrichedPet>;
export type EnrichPetList = (petList: PetList) => Promise<EnrichedPetList>;
export type FindPetById = (id: string) => Promise<Pet | undefined>;
export type PersistPet = (pet: Pet) => Promise<Pet>;
export type RemovePet = (pet: Pet) => Promise<void>;
export type ResolvePetList = (inputPetList: InputPetList) => Promise<PetList>;

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
