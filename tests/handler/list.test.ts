import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { stringify } from 'qs';
import { createListHandler } from '../../src/handler/list';
import { createEnrichedModelListSchema, numberSchema, sortSchema, stringSchema } from '../../src/model';
import type {
  EnrichedModel,
  Model,
  EnrichedModelList,
  EnrichModelList,
  InputModelList,
  ModelList,
} from '../../src/model';
import type { ResolveModelList } from '../../src/repository';

describe('list', () => {
  describe('createListHandler', () => {
    const inputModelSchema = v.strictObject({ name: stringSchema });
    const embeddedModelSchema = v.optional(v.object({ key1: stringSchema }));
    const inputModelListSchema = v.strictObject({
      offset: v.optional(numberSchema, 0),
      limit: v.optional(numberSchema, 20),
      filters: v.optional(v.strictObject({ name: v.optional(stringSchema) }), {}),
      sort: v.optional(v.strictObject({ name: sortSchema }), {}),
    });
    const embeddedModelListSchema = v.optional(v.object({ key2: stringSchema }));

    const enrichedModelListSchema = createEnrichedModelListSchema(
      inputModelSchema,
      inputModelListSchema,
      embeddedModelSchema,
      embeddedModelListSchema,
    );

    test('successfully', async () => {
      const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
      const createdAt = new Date('2022-06-11T12:36:26.012Z');
      const updatedAt = new Date('2022-06-11T12:36:26.012Z');
      const name = 'name1';

      const model: Model<typeof inputModelSchema> = {
        id,
        createdAt,
        updatedAt,
        name,
      };

      const search: Partial<InputModelList<typeof inputModelListSchema>> = {
        filters: { name: 'test' },
      };

      const inputModelList: InputModelList<typeof inputModelListSchema> = {
        offset: 0,
        limit: 20,
        filters: {},
        sort: {},
        ...search,
      };

      const modelList: ModelList<typeof inputModelSchema, typeof inputModelListSchema> = {
        ...inputModelList,
        count: 0,
        items: [model],
      };

      const enrichedModel: EnrichedModel<typeof inputModelSchema, typeof embeddedModelSchema> = {
        ...model,
        _embedded: {
          key1: 'value1',
        },
      };

      const enrichedModelList: EnrichedModelList<
        typeof inputModelSchema,
        typeof inputModelListSchema,
        typeof embeddedModelSchema,
        typeof embeddedModelListSchema
      > = {
        ...inputModelList,
        count: 0,
        items: [enrichedModel],
        _embedded: {
          key2: 'value2',
        },
      };

      const serverRequest = new ServerRequest(`https://example.com/${stringify(search, { addQueryPrefix: true })}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        attributes: { accept: 'application/json' },
      });

      const [resolveModelList, resolveModelListMocks] = useFunctionMock<
        ResolveModelList<typeof inputModelSchema, typeof inputModelListSchema>
      >([
        {
          parameters: [inputModelList],
          return: Promise.resolve(modelList),
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          callback: (data, contentType) => {
            expect(data).toMatchInlineSnapshot(`
            {
              "_embedded": {
                "key2": "value2",
              },
              "count": 0,
              "filters": {
                "name": "test",
              },
              "items": [
                {
                  "_embedded": {
                    "key1": "value1",
                  },
                  "createdAt": "2022-06-11T12:36:26.012Z",
                  "id": "93cf0de1-e83e-4f68-800d-835e055a6fe8",
                  "name": "name1",
                  "updatedAt": "2022-06-11T12:36:26.012Z",
                },
              ],
              "limit": 20,
              "offset": 0,
              "sort": {},
            }
          `);
            expect(contentType).toBe('application/json');

            return JSON.stringify(data);
          },
        },
      ]);

      const [enrichList, enrichModelListMocks] = useFunctionMock<
        EnrichModelList<
          typeof inputModelSchema,
          typeof inputModelListSchema,
          typeof embeddedModelSchema,
          typeof embeddedModelListSchema
        >
      >([
        {
          parameters: [modelList],
          return: Promise.resolve(enrichedModelList),
        },
      ]);

      const listHandler = createListHandler(
        inputModelListSchema,
        resolveModelList,
        enrichedModelListSchema,
        encoder,
        enrichList,
      );

      const response = await listHandler(serverRequest);

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toMatchInlineSnapshot(`
        {
          "_embedded": {
            "key2": "value2",
          },
          "count": 0,
          "filters": {
            "name": "test",
          },
          "items": [
            {
              "_embedded": {
                "key1": "value1",
              },
              "createdAt": "2022-06-11T12:36:26.012Z",
              "id": "93cf0de1-e83e-4f68-800d-835e055a6fe8",
              "name": "name1",
              "updatedAt": "2022-06-11T12:36:26.012Z",
            },
          ],
          "limit": 20,
          "offset": 0,
          "sort": {},
        }
      `);

      expect(resolveModelListMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
      expect(enrichModelListMocks).toHaveLength(0);
    });

    test('successfully without enrichList', async () => {
      const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
      const createdAt = new Date('2022-06-11T12:36:26.012Z');
      const updatedAt = new Date('2022-06-11T12:36:26.012Z');
      const name = 'name1';

      const model: Model<typeof inputModelSchema> = {
        id,
        createdAt,
        updatedAt,
        name,
      };

      const search: Partial<InputModelList<typeof inputModelListSchema>> = {
        filters: { name: 'test' },
      };

      const inputModelList: InputModelList<typeof inputModelListSchema> = {
        offset: 0,
        limit: 20,
        filters: {},
        sort: {},
        ...search,
      };

      const modelList: ModelList<typeof inputModelSchema, typeof inputModelListSchema> = {
        ...inputModelList,
        count: 0,
        items: [model],
      };

      const serverRequest = new ServerRequest(`https://example.com/${stringify(search, { addQueryPrefix: true })}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        attributes: { accept: 'application/json' },
      });

      const [resolveModelList, resolveModelListMocks] = useFunctionMock<
        ResolveModelList<typeof inputModelSchema, typeof inputModelListSchema>
      >([
        {
          parameters: [inputModelList],
          return: Promise.resolve(modelList),
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          callback: (data, contentType) => {
            expect(data).toMatchInlineSnapshot(`
            {
              "count": 0,
              "filters": {
                "name": "test",
              },
              "items": [
                {
                  "createdAt": "2022-06-11T12:36:26.012Z",
                  "id": "93cf0de1-e83e-4f68-800d-835e055a6fe8",
                  "name": "name1",
                  "updatedAt": "2022-06-11T12:36:26.012Z",
                },
              ],
              "limit": 20,
              "offset": 0,
              "sort": {},
            }
          `);
            expect(contentType).toBe('application/json');

            return JSON.stringify(data);
          },
        },
      ]);

      const listHandler = createListHandler(inputModelListSchema, resolveModelList, enrichedModelListSchema, encoder);

      const response = await listHandler(serverRequest);

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toMatchInlineSnapshot(`
        {
          "count": 0,
          "filters": {
            "name": "test",
          },
          "items": [
            {
              "createdAt": "2022-06-11T12:36:26.012Z",
              "id": "93cf0de1-e83e-4f68-800d-835e055a6fe8",
              "name": "name1",
              "updatedAt": "2022-06-11T12:36:26.012Z",
            },
          ],
          "limit": 20,
          "offset": 0,
          "sort": {},
        }
      `);

      expect(resolveModelListMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
    });

    test('could not parse', async () => {
      const search = { filters: { key: 'value' } };

      const serverRequest = new ServerRequest(`https://example.com/${stringify(search, { addQueryPrefix: true })}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        attributes: { accept: 'application/json' },
      });

      const [resolveModelList, resolveModelListMocks] = useFunctionMock<
        ResolveModelList<typeof inputModelSchema, typeof inputModelListSchema>
      >([]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const listHandler = createListHandler(inputModelListSchema, resolveModelList, enrichedModelListSchema, encoder);

      try {
        await listHandler(serverRequest);
        throw new Error('Expect Error');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "BadRequest",
            "context": "query",
            "invalidParameters": [
              {
                "details": {
                  "expected": "never",
                  "kind": "schema",
                  "received": ""key"",
                  "type": "strict_object",
                },
                "name": "filters[key]",
                "reason": "Invalid key: Expected never but received "key"",
              },
            ],
            "status": 400,
            "title": "Bad Request",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
          }
        `);
      }

      expect(resolveModelListMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
    });
  });
});
