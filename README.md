# chubbyts-undici-api

[![CI](https://github.com/chubbyts/chubbyts-undici-api/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-undici-api/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-undici-api/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-undici-api?branch=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fchubbyts%2Fchubbyts-undici-api%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-undici-api/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-undici-api.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-undici-api)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-api&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-api)

## Description

Type-safe CRUD handlers and middlewares for [chubbyts-undici-server][7].

You describe a model once as a [zod][10] schema. The package derives the list, persisted and enriched (HAL style `_embedded` / `_links`) variants from it, validates incoming attributes, query, headers and body against them, and encodes the response in the content type negotiated with the client.

It ships:

 * CRUD handlers: `createListHandler`, `createCreateHandler`, `createReadHandler`, `createUpdateHandler`, `createDeleteHandler`
 * A generic, fully typed request/response handler: [`createTypedHandler`][20]
 * Middlewares for `accept-language`, `accept` and `content-type` negotiation, and an error middleware that turns thrown errors into encoded [http-error][3] responses
 * Model schema helpers and repository function types
 * Service factories for [chubbyts-dic-config][13]

## Requirements

 * node: 22
 * [@chubbyts/chubbyts-decode-encode][2]: ^2.5.1
 * [@chubbyts/chubbyts-dic-config-factory][11]: ^1.0.0
 * [@chubbyts/chubbyts-dic-types][12]: ^2.3.0
 * [@chubbyts/chubbyts-http-error][3]: ^3.5.0
 * [@chubbyts/chubbyts-log-types][4]: ^3.3.0
 * [@chubbyts/chubbyts-negotiation][5]: ^4.5.1
 * [@chubbyts/chubbyts-throwable-to-error][6]: ^2.3.0
 * [@chubbyts/chubbyts-undici-server][7]: ^1.2.0
 * [qs][8]: ^6.15.3
 * [uuid][9]: ^14.0.1
 * [zod][10]: ^4.4.3

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-undici-api][1].

```sh
npm i @chubbyts/chubbyts-undici-api@^2.4.1
```

## Usage

The pieces fit together like this:

 1. The negotiation middlewares read the `accept-language`, `accept` and `content-type` headers and store the negotiated values in `serverRequest.attributes` as `acceptLanguage`, `accept` and `contentType`. Your router adds route parameters such as `id` the same way.
 2. The handlers validate those attributes, the query string and the decoded body against your schemas, call your repository functions and encode the response body with the negotiated `accept` content type.
 3. The error middleware catches whatever is thrown (`400` for validation failures, `404` for missing models, `406` / `415` from negotiation, anything else you map) and encodes it as an error response.

### Model

Start from an *input* schema describing what a client may send. Everything else is derived from it.

```ts
import { z } from 'zod';
import {
  createEnrichedModelListSchema,
  createEnrichedModelSchema,
  createModelListSchema,
  createModelSchema,
  numberSchema,
  sortSchema,
  stringSchema,
} from '@chubbyts/chubbyts-undici-api/dist/model';
import type {
  EnrichedModel,
  EnrichedModelList,
  EnrichedModelListSchema,
  EnrichedModelSchema,
  InputModel,
  InputModelList,
  Model,
  ModelList,
  ModelListSchema,
  ModelSchema,
} from '@chubbyts/chubbyts-undici-api/dist/model';

// what a client sends on create / update
export const inputPetSchema = z.object({ name: stringSchema, tag: stringSchema.optional() }).strict();
export type InputPetSchema = typeof inputPetSchema;
export type InputPet = InputModel<InputPetSchema>;

// what a client sends as query string on list (offset, limit, filters and sort are required keys)
export const inputPetListSchema = z
  .object({
    offset: numberSchema.default(0),
    limit: numberSchema.default(20),
    filters: z.object({ name: stringSchema.optional() }).strict().default({}),
    sort: z.object({ name: sortSchema }).strict().default({}),
  })
  .strict();
export type InputPetListSchema = typeof inputPetListSchema;
export type InputPetList = InputModelList<InputPetListSchema>;

// persisted model: input + id, createdAt, updatedAt
export const petSchema: ModelSchema<InputPetSchema> = createModelSchema(inputPetSchema);
export type Pet = Model<InputPetSchema>;

// persisted list: list input + count, items
export const petListSchema: ModelListSchema<InputPetSchema, InputPetListSchema> = createModelListSchema(
  inputPetSchema,
  inputPetListSchema,
);
export type PetList = ModelList<InputPetSchema, InputPetListSchema>;

// response model / list: persisted + optional _embedded and _links
export const enrichedPetSchema: EnrichedModelSchema<InputPetSchema> = createEnrichedModelSchema(inputPetSchema);
export type EnrichedPet = EnrichedModel<InputPetSchema>;

export const enrichedPetListSchema: EnrichedModelListSchema<InputPetSchema, InputPetListSchema> =
  createEnrichedModelListSchema(inputPetSchema, inputPetListSchema);
export type EnrichedPetList = EnrichedModelList<InputPetSchema, InputPetListSchema>;
```

Reusable field schemas: `stringSchema` (non-empty string), `numberSchema` and `dateSchema` (coerced, so they accept query string values) and `sortSchema` (`'asc' | 'desc' | undefined`).

To type `_embedded`, pass an embedded schema as the last argument of `createEnrichedModelSchema` / `createEnrichedModelListSchema`. See the [typed handler guide][20] for an example with embedded vaccinations.

### Repository

The handlers talk to your storage through four function types. Implement them however you like.

```ts
import type {
  FindModelById,
  PersistModel,
  RemoveModel,
  ResolveModelList,
} from '@chubbyts/chubbyts-undici-api/dist/repository';

const resolvePetList: ResolveModelList<InputPetSchema, InputPetListSchema> = async (inputPetList) => {
  // return { ...inputPetList, count, items }
};

const findPetById: FindModelById<InputPetSchema> = async (id) => {
  // return the pet or undefined
};

const persistPet: PersistModel<InputPetSchema> = async (pet) => {
  // insert or update, return the persisted pet
};

const removePet: RemoveModel<InputPetSchema> = async (pet) => {
  // delete
};
```

### Handler

| Handler               | Reads                       | Required attributes           | Success | Errors     |
|-----------------------|-----------------------------|-------------------------------|---------|------------|
| `createListHandler`   | query string                | `accept`                      | `200`   | `400`      |
| `createCreateHandler` | body                        | `contentType`, `accept`       | `201`   | `400`      |
| `createReadHandler`   | –                           | `accept`, `id`                | `200`   | `404`      |
| `createUpdateHandler` | body                        | `contentType`, `accept`, `id` | `200`   | `400`, `404` |
| `createDeleteHandler` | –                           | `id`                          | `204`   | `404`      |

```ts
import { createDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { createJsonTypeDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/json-type-decoder';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createCreateHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/create';
import { createDeleteHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/delete';
import { createListHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/list';
import { createReadHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/read';
import { createUpdateHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/update';

const decoder = createDecoder([createJsonTypeDecoder()]);
const encoder = createEncoder([createJsonTypeEncoder()]);

const listHandler = createListHandler(inputPetListSchema, resolvePetList, enrichedPetListSchema, encoder);
const createHandler = createCreateHandler(decoder, inputPetSchema, persistPet, enrichedPetSchema, encoder);
const readHandler = createReadHandler(findPetById, enrichedPetSchema, encoder);
const updateHandler = createUpdateHandler(findPetById, decoder, inputPetSchema, persistPet, enrichedPetSchema, encoder);
const deleteHandler = createDeleteHandler(findPetById, removePet);

// in production the middlewares and your router populate the attributes
const response = await readHandler(
  new ServerRequest('http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d', {
    method: 'GET',
    attributes: { accept: 'application/json', id: '8ba9661b-ba7f-436b-bd25-c0606f911f7d' },
  }),
);
```

Behavior worth knowing:

 * `createCreateHandler` sets `id` (uuid v7 by default, override through the last `uuid` parameter) and `createdAt`; `createUpdateHandler` keeps `id` and `createdAt` of the stored model and sets `updatedAt`. Properties of the request body with the same names would win, so keep your input schemas `.strict()` (as above) to reject them.
 * The list, create, read and update handlers accept an optional `enrichModel` / `enrichModelList` callback as parameter after the `encoder`. Use it to add `_links` and `_embedded` before encoding. The default returns the model unchanged.
 * Validation failures throw a `400 Bad Request` whose `invalidParameters` list one entry per zod issue (`name`, `reason`, `context`), plus a `context` of `query`, `headers` or `body` telling where it came from.
 * A missing model throws a `404 Not Found`.
 * `Date` values are serialized as ISO strings and `undefined` properties are dropped when the response body is encoded.

#### createTypedHandler

All CRUD handlers are built on `createTypedHandler`. Use it directly when you need other request attributes, headers, status codes or a response shape the CRUD handlers do not cover. See the [typed handler guide][20].

### Middleware

Register the negotiation middlewares in front of the handlers. Each one reads a header, negotiates it against the supported values of the given [negotiator][5] and stores the result in `serverRequest.attributes`. A missing or unsupported header aborts the request with an [http-error][3] listing the `supportedValues`.

| Middleware                                  | Header            | Attribute        | Error                        |
|---------------------------------------------|-------------------|------------------|------------------------------|
| `createAcceptLanguageNegotiationMiddleware` | `accept-language` | `acceptLanguage` | `406 Not Acceptable`         |
| `createAcceptNegotiationMiddleware`         | `accept`          | `accept`         | `406 Not Acceptable`         |
| `createContentTypeNegotiationMiddleware`    | `content-type`    | `contentType`    | `415 Unsupported Media Type` |

#### createAcceptLanguageNegotiationMiddleware

```ts
import { createAcceptLanguageNegotiator } from '@chubbyts/chubbyts-negotiation/dist/accept-language-negotiator';
import { createAcceptLanguageNegotiationMiddleware }
  from '@chubbyts/chubbyts-undici-api/dist/middleware/accept-language-negotiation-middleware';

const acceptLanguageNegotiationMiddleware = createAcceptLanguageNegotiationMiddleware(
  createAcceptLanguageNegotiator(['en', 'de']),
);
```

#### createAcceptNegotiationMiddleware

Feed it the content types your encoder can produce.

```ts
import { createAcceptNegotiator } from '@chubbyts/chubbyts-negotiation/dist/accept-negotiator';
import { createAcceptNegotiationMiddleware }
  from '@chubbyts/chubbyts-undici-api/dist/middleware/accept-negotiation-middleware';

const acceptNegotiationMiddleware = createAcceptNegotiationMiddleware(createAcceptNegotiator(encoder.contentTypes));
```

#### createContentTypeNegotiationMiddleware

Feed it the content types your decoder can parse. Only needed on routes with a request body.

```ts
import { createContentTypeNegotiator } from '@chubbyts/chubbyts-negotiation/dist/content-type-negotiator';
import { createContentTypeNegotiationMiddleware }
  from '@chubbyts/chubbyts-undici-api/dist/middleware/content-type-negotiation-middleware';

const contentTypeNegotiationMiddleware = createContentTypeNegotiationMiddleware(
  createContentTypeNegotiator(decoder.contentTypes),
);
```

#### createErrorMiddleware

Catches every error thrown by the wrapped handler and answers with an encoded [http-error][3].

```ts
import { createInternalServerError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { createErrorMiddleware } from '@chubbyts/chubbyts-undici-api/dist/middleware/error-middleware';

const errorMiddleware = createErrorMiddleware(
  encoder,
  (e: unknown) => createInternalServerError({ cause: e }), // mapToHttpError, default: rethrow
  false, // debug
  logger, // @chubbyts/chubbyts-log-types Logger, default: noop logger
  ['acceptLanguage'], // attribute names to add to the log context
);
```

 * An [http-error][3] is used as is. Anything else goes through `mapToHttpError`; if that throws too (the default), the result is a `500 Internal Server Error` carrying `name`, `message` and `stack` of the original error.
 * Errors below `500` are logged as `info`, others as `error`, together with `method`, `pathnameSearch` and the requested attributes.
 * The response body contains the full error for client errors or when `debug` is `true`. Otherwise it is reduced to `type`, `status` and `title`, so internals never leak in production.
 * Headers of the http-error (for example `allow`) are copied to the response.
 * The response is encoded with the `accept` attribute, so the accept negotiation middleware has to run *before* this one.

### Helpers

 * `parseRequestBody(decoder, serverRequest)` from `dist/request`: decodes the body using `attributes.contentType`.
 * `createResponseWithData(serverRequest, encoder, data, status, statusText, headers)` from `dist/response`: encodes `data` using `attributes.accept` and sets the `content-type` header.
 * `valueToData(value)` from `dist/response`: converts models (dates, http-errors, nested objects) into encodable data.
 * `zodToInvalidParameters(zodError)` from `dist/zod-to-invalid-parameters`: maps zod issues to the `invalidParameters` format used by [http-error][3].

### Service factories (chubbyts-dic-config)

The package ships service factories (abstract factories built on [chubbyts-dic-config-factory][11]) for a [chubbyts-dic-config][13] (or any [chubbyts-dic-types][12] compatible) container within `@chubbyts/chubbyts-undici-api/dist/service-factory`, one per middleware. They reuse the service factories of [chubbyts-decode-encode][2] and [chubbyts-negotiation][5]:

```ts
import type { ConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import { createContainerByConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import { decoderServiceFactory, encoderServiceFactory } from '@chubbyts/chubbyts-decode-encode/dist/service-factory';
import {
  acceptLanguageNegotiationMiddlewareServiceFactory,
  acceptNegotiationMiddlewareServiceFactory,
  contentTypeNegotiationMiddlewareServiceFactory,
  errorMiddlewareServiceFactory,
} from '@chubbyts/chubbyts-undici-api/dist/service-factory';
import type { Middleware } from '@chubbyts/chubbyts-undici-server/dist/server';

const container = createContainerByConfigFactory({
  debug: false, // used by the error middleware (and the type encoders)
  dependencies: {
    factories: new Map<string, ConfigFactory>([
      ['decoder', decoderServiceFactory()],
      ['encoder', encoderServiceFactory()],
      ['acceptLanguageNegotiatorSupportedValues', (): Array<string> => ['en', 'de']],
      ['acceptLanguageNegotiationMiddleware', acceptLanguageNegotiationMiddlewareServiceFactory()],
      ['acceptNegotiationMiddleware', acceptNegotiationMiddlewareServiceFactory()],
      ['contentTypeNegotiationMiddleware', contentTypeNegotiationMiddlewareServiceFactory()],
      ['errorMiddleware', errorMiddlewareServiceFactory()],
    ]),
  },
})();

const acceptLanguageNegotiationMiddleware = container.get<Middleware>('acceptLanguageNegotiationMiddleware');
const acceptNegotiationMiddleware = container.get<Middleware>('acceptNegotiationMiddleware');
const contentTypeNegotiationMiddleware = container.get<Middleware>('contentTypeNegotiationMiddleware');
const errorMiddleware = container.get<Middleware>('errorMiddleware');
```

Each factory uses the related services of the container if registered, and creates them through the shipped factories of the other packages otherwise. Register any of them under its name to replace it or to share it with other services:

| Factory                                             | Resolved services (default)                                                                                                                                                                                                                                                       |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `acceptLanguageNegotiationMiddlewareServiceFactory` | `acceptLanguageNegotiator` (`acceptLanguageNegotiatorServiceFactory`, needs `acceptLanguageNegotiatorSupportedValues`)                                                                                                                                                             |
| `acceptNegotiationMiddlewareServiceFactory`         | `acceptNegotiator` (`acceptNegotiatorServiceFactory`, the content types of `encoder`)                                                                                                                                                                                             |
| `contentTypeNegotiationMiddlewareServiceFactory`    | `contentTypeNegotiator` (`contentTypeNegotiatorServiceFactory`, the content types of `decoder`)                                                                                                                                                                                   |
| `errorMiddlewareServiceFactory`                     | `encoder` (`encoderServiceFactory`), `mapToHttpError` (`mapToHttpErrorServiceFactory`, rethrows), `errorMiddlewareLoggableAttributeNames` (`errorMiddlewareLoggableAttributeNamesServiceFactory`, `[]`), `debug` from `config.debug`, `logger` if registered |

#### With names

The same factories can be registered multiple times with a name: the name gets appended to each service id (`errorMiddlewareapi`, `encoderapi`, `mapToHttpErrorapi`, ...) and passed down to the reused factories of the other packages.

```ts
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { createInternalServerError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { MapToHttpError } from '@chubbyts/chubbyts-undici-api/dist/middleware/error-middleware';

const container = createContainerByConfigFactory({
  dependencies: {
    factories: new Map<string, ConfigFactory>([
      ['encoderapi', encoderServiceFactory('api')],
      ['mapToHttpErrorapi', (): MapToHttpError => (e: unknown): HttpError => createInternalServerError({ cause: e })],
      ['errorMiddlewareapi', errorMiddlewareServiceFactory('api')],
    ]),
  },
})();

const apiErrorMiddleware = container.get<Middleware>('errorMiddlewareapi');
```

## Migration

 * [1.x to 2.x][30]

## Copyright

2026 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-api
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-decode-encode
[3]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-error
[4]: https://www.npmjs.com/package/@chubbyts/chubbyts-log-types
[5]: https://www.npmjs.com/package/@chubbyts/chubbyts-negotiation
[6]: https://www.npmjs.com/package/@chubbyts/chubbyts-throwable-to-error
[7]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-server
[8]: https://www.npmjs.com/package/qs
[9]: https://www.npmjs.com/package/uuid
[10]: https://www.npmjs.com/package/zod
[11]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config-factory
[12]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-types
[13]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config

[20]: doc/handler/typed.md

[30]: doc/migration/1.x-2.x.md
