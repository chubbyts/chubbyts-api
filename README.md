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

A set of crud middlewares/handlers for chubbyts-undici-server.

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

```ts
npm i @chubbyts/chubbyts-undici-api@^2.4.0
```

## Usage

### Handler

```ts
import { z } from 'zod';
import { createEncoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createJsonTypeEncoder }
  from '@chubbyts/chubbyts-decode-encode/dist/encoder/json-type-encoder';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createDecoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { createJsonTypeDecoder }
  from '@chubbyts/chubbyts-decode-encode/dist/decoder/json-type-decoder';
import { createListHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/list';
import type {
  FindModelById,
  PersistModel,
  RemoveModel,
  ResolveModelList,
} from '@chubbyts/chubbyts-undici-api/dist/repository';
import { createCreateHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/create';
import { createReadHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/read';
import { createUpdateHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/update';
import { createDeleteHandler } from '@chubbyts/chubbyts-undici-api/dist/handler/delete';
import {
  numberSchema,
  sortSchema,
  stringSchema,
  createEnrichedModelListSchema,
  createModelSchema,
  createModelListSchema,
  createEnrichedModelSchema,
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

export const inputMyModelSchema = z.object({
  name: stringSchema,
  value: stringSchema,
}).strict();

export type InputMyModelSchema = typeof inputMyModelSchema;
export type InputMyModel = InputModel<InputMyModelSchema>;

export const inputMyModelListSchema = z
  .object({
    offset: numberSchema.default(0),
    limit: numberSchema.default(20),
    filters: z.object({ name: stringSchema.optional() }).strict().default({}),
    sort: z.object({ name: sortSchema }).strict().default({}),
  })
  .strict();

export type InputMyModelListSchema = typeof inputMyModelListSchema;

export type InputMyModelList = InputModelList<InputMyModelListSchema>;

export type MyModelSchema = ModelSchema<InputMyModelSchema>;

export const myModelSchema: MyModelSchema = createModelSchema(inputMyModelSchema);

export type MyModel = Model<InputMyModelSchema>;

export type MyModelListSchema = ModelListSchema<InputMyModelSchema, InputMyModelListSchema>;

export const myModelListSchema: MyModelListSchema = createModelListSchema(
  inputMyModelSchema,
  inputMyModelListSchema,
);

export type MyModelList = ModelList<InputMyModelSchema, InputMyModelListSchema>;

export type EnrichedMyModelSchema = EnrichedModelSchema<InputMyModelSchema>;

export const enrichedMyModelSchema: EnrichedMyModelSchema = createEnrichedModelSchema(
  inputMyModelSchema,
);

export type EnrichedMyModel = EnrichedModel<InputMyModelSchema>;

export type EnrichedMyModelListSchema = EnrichedModelListSchema<
  InputMyModelSchema,
  InputMyModelListSchema,
>;

export const enrichedMyModelListSchema: EnrichedMyModelListSchema =
  createEnrichedModelListSchema(
    inputMyModelSchema,
    inputMyModelListSchema,
  );

export type EnrichedMyModelList = EnrichedModelList<
  InputMyModelSchema,
  InputMyModelListSchema,
>;

// decoder / encoder

const decoder = createDecoder([createJsonTypeDecoder()]);
const encoder = createEncoder([createJsonTypeEncoder()]);

// repository

const resolveModelList: ResolveModelList<InputMyModelSchema, InputMyModelListSchema> = (
  modelList: InputModelList<InputMyModelListSchema>,
): Promise<ModelList<InputMyModelSchema>> => {};

const findModelById: FindModelById<InputMyModelSchema> = async (
  id: string,
): Promise<Model<InputMyModelSchema> | undefined> => {};

const persistModel: PersistModel<InputMyModelSchema> = (
  model: Model<InputMyModelSchema>,
): Promise<Model<InputMyModelSchema>> => {};

const removeModel: RemoveModel<InputMyModelSchema> = (
  model: Model<InputMyModelSchema>,
): Promise<void> => {};

// handler

const listHandler = createListHandler(
  inputMyModelListSchema,
  resolveModelList,
  enrichedMyModelListSchema,
  encoder,
);

(async () => {
  const serverRequest = new ServerRequest(
    'http://localhost:8080/api/pets',
    { method: 'GET' },
  );
  const response = await listHandler(serverRequest);
})();

const createHandler = createCreateHandler(
  decoder,
  inputMyModelSchema,
  persistModel,
  enrichedMyModelSchema,
  encoder,
);

(async () => {
  const serverRequest = new ServerRequest(
    'http://localhost:8080/api/pets',
    { method: 'POST' },
  );
  const response = await createHandler(serverRequest);
})();

const readHandler = createReadHandler<InputMyModelSchema>(
  findModelById,
  enrichedMyModelSchema,
  encoder,
);

(async () => {
  const serverRequest = new ServerRequest(
    'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d',
    { method: 'GET' },
  );
  const response = await readHandler(serverRequest);
})();

const updateHandler = createUpdateHandler(
  findModelById,
  decoder,
  inputMyModelSchema,
  persistModel,
  enrichedMyModelSchema,
  encoder,
);

(async () => {
  const serverRequest = new ServerRequest(
    'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d',
    { method: 'PUT' },
  );
  const response = await updateHandler(serverRequest);
})();

const deleteHandler = createDeleteHandler<InputMyModelSchema>(
  findModelById,
  removeModel,
);

(async () => {
  const serverRequest = new ServerRequest(
    'http://localhost:8080/api/pets/8ba9661b-ba7f-436b-bd25-c0606f911f7d',
    { method: 'DELETE' },
  );
  const response = await deleteHandler(serverRequest);
})();
```

#### createTypedHandler

See [typed][20] if you want/need more flexibility and prefer a typed generic handler?

### Middleware

#### createAcceptLanguageNegotiationMiddleware

#### createAcceptNegotiationMiddleware

#### createContentTypeNegotiationMiddleware

#### createErrorMiddleware

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

 * `acceptLanguageNegotiationMiddlewareServiceFactory`: `acceptLanguageNegotiator` (default `acceptLanguageNegotiatorServiceFactory`)
 * `acceptNegotiationMiddlewareServiceFactory`: `acceptNegotiator` (default `acceptNegotiatorServiceFactory`, the content types of the `encoder`)
 * `contentTypeNegotiationMiddlewareServiceFactory`: `contentTypeNegotiator` (default `contentTypeNegotiatorServiceFactory`, the content types of the `decoder`)
 * `errorMiddlewareServiceFactory`: `encoder` (default `encoderServiceFactory`), `mapToHttpError` (default `mapToHttpErrorServiceFactory`, rethrows), `errorMiddlewareLoggableAttributeNames` (default `errorMiddlewareLoggableAttributeNamesServiceFactory`, `[]`), `debug` from `config.debug` and a `logger` service if registered

#### With names

The same factories can be registered multiple times with a name: the name gets appended to each service id (`errorMiddlewareapi`, `encoderapi`, `mapToHttpErrorapi`, ...) and passed down to the reused factories of the other packages.

```ts
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
