import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createUpdateHandler } from '../../src/handler/update';
import { createEnrichedModelSchema, stringSchema, type EnrichModel, type Model } from '../../src/model';
import type { FindModelById, PersistModel } from '../../src/repository';

describe('update', () => {
  describe('createUpdateHandler', () => {
    const inputModelSchema = v.object({ name: stringSchema });
    const enrichedModelSchema = createEnrichedModelSchema(inputModelSchema);

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

      const newName = 'name2';

      const inputData = {
        id,
        createdAt: createdAt.toJSON(),
        updatedAt: updatedAt.toJSON(),
        name: newName,
        _embedded: {
          key1: 'value1',
        },
        _links: {
          self: { href: '/sample/path' },
        },
      };

      const encodedInputData = JSON.stringify(inputData);

      const serverRequest = new ServerRequest(`https://example.com/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        attributes: { accept: 'application/json', contentType: 'application/json', id },
        body: encodedInputData,
      });

      const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
        {
          parameters: [id],
          return: Promise.resolve({ ...model, unknown: 'unknown' }),
        },
      ]);

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [encodedInputData, 'application/json'], return: inputData },
      ]);

      const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([
        {
          callback: async (givenModel) => {
            expect(givenModel).toEqual({
              id,
              createdAt,
              updatedAt: expect.any(Date),
              name: newName,
            });

            return givenModel;
          },
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          callback: (givenData, givenContentType): string => {
            expect(givenData).toEqual({
              id,
              createdAt: createdAt.toJSON(),
              updatedAt: expect.any(String),
              name: newName,
              _embedded: { key: 'value' },
            });

            expect(givenContentType).toBe('application/json');

            return JSON.stringify(givenData);
          },
        },
      ]);

      const [enrichModel, enrichModelMocks] = useFunctionMock<EnrichModel<typeof inputModelSchema>>([
        {
          callback: async (givenModel, givenContext) => {
            expect(givenModel).toEqual({
              id,
              createdAt,
              updatedAt: expect.any(Date),
              name: newName,
            });

            expect(givenContext).toBeUndefined();

            return {
              ...givenModel,
              _embedded: { key: 'value' },
            };
          },
        },
      ]);

      const updateHandler = createUpdateHandler(
        findModelById,
        decoder,
        inputModelSchema,
        persistModel,
        enrichedModelSchema,
        encoder,
        enrichModel,
      );

      const response = await updateHandler(serverRequest);

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        updatedAt: expect.any(String),
        name: newName,
        _embedded: {
          key: 'value',
        },
      });

      expect(findModelByIdMocks).toHaveLength(0);
      expect(decoderMocks).toHaveLength(0);
      expect(persistModelMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
      expect(enrichModelMocks).toHaveLength(0);
    });

    test('successfully without enrich model', async () => {
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

      const newName = 'name2';

      const inputData = {
        id,
        createdAt: createdAt.toJSON(),
        updatedAt: updatedAt.toJSON(),
        name: newName,
        _embedded: {
          key1: 'value1',
        },
        _links: {
          self: { href: '/sample/path' },
        },
      };

      const encodedInputData = JSON.stringify(inputData);

      const serverRequest = new ServerRequest(`https://example.com/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        attributes: { accept: 'application/json', contentType: 'application/json', id },
        body: encodedInputData,
      });

      const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
        {
          parameters: [id],
          return: Promise.resolve({ ...model, unknown: 'unknown' }),
        },
      ]);

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [encodedInputData, 'application/json'], return: inputData },
      ]);

      const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([
        {
          callback: async (givenModel) => {
            expect(givenModel).toEqual({
              id,
              createdAt,
              updatedAt: expect.any(Date),
              name: newName,
            });

            return givenModel;
          },
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          callback: (givenData, givenContentType): string => {
            expect(givenData).toEqual({
              id,
              createdAt: createdAt.toJSON(),
              updatedAt: expect.any(String),
              name: newName,
            });

            expect(givenContentType).toBe('application/json');

            return JSON.stringify(givenData);
          },
        },
      ]);

      const updateHandler = createUpdateHandler(
        findModelById,
        decoder,
        inputModelSchema,
        persistModel,
        enrichedModelSchema,
        encoder,
      );

      const response = await updateHandler(serverRequest);

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        updatedAt: expect.any(String),
        name: newName,
      });

      expect(findModelByIdMocks).toHaveLength(0);
      expect(decoderMocks).toHaveLength(0);
      expect(persistModelMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
    });

    test('not found', async () => {
      const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
      const createdAt = new Date('2022-06-11T12:36:26.012Z');
      const updatedAt = new Date('2022-06-11T12:36:26.012Z');

      const newName = 'name2';

      const inputData = {
        id,
        createdAt: createdAt.toJSON(),
        updatedAt: updatedAt.toJSON(),
        name: newName,
        _embedded: {
          key1: 'value1',
        },
        _links: {
          self: { href: '/sample/path' },
        },
      };

      const encodedInputData = JSON.stringify(inputData);

      const serverRequest = new ServerRequest(`https://example.com/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        attributes: { accept: 'application/json', contentType: 'application/json', id },
        body: encodedInputData,
      });

      const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
        {
          parameters: [id],
          return: Promise.resolve(undefined),
        },
      ]);

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [encodedInputData, 'application/json'], return: inputData },
      ]);

      const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const updateHandler = createUpdateHandler(
        findModelById,
        decoder,
        inputModelSchema,
        persistModel,
        enrichedModelSchema,
        encoder,
      );

      try {
        await updateHandler(serverRequest);
        throw new Error('Expect fail');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "NotFound",
            "detail": "There is no entry with id "93cf0de1-e83e-4f68-800d-835e055a6fe8"",
            "status": 404,
            "title": "Not Found",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
          }
        `);
      }

      expect(findModelByIdMocks).toHaveLength(0);
      expect(decoderMocks).toHaveLength(0);
      expect(persistModelMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
    });

    test('could not parse', async () => {
      const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

      const inputData = { key: 'value' };
      const encodedInputData = JSON.stringify(inputData);

      const serverRequest = new ServerRequest(`https://example.com/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        attributes: { accept: 'application/json', contentType: 'application/json', id },
        body: encodedInputData,
      });

      const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([]);

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [encodedInputData, 'application/json'], return: inputData },
      ]);

      const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const updateHandler = createUpdateHandler(
        findModelById,
        decoder,
        inputModelSchema,
        persistModel,
        enrichedModelSchema,
        encoder,
      );

      try {
        await updateHandler(serverRequest);
        throw new Error('Expect Error');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "BadRequest",
            "context": "body",
            "invalidParameters": [
              {
                "details": {
                  "expected": ""name"",
                  "kind": "schema",
                  "received": "undefined",
                  "type": "object",
                },
                "name": "name",
                "reason": "Invalid key: Expected "name" but received undefined",
              },
            ],
            "status": 400,
            "title": "Bad Request",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
          }
        `);
      }

      expect(findModelByIdMocks).toHaveLength(0);
      expect(decoderMocks).toHaveLength(0);
      expect(persistModelMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
    });
  });
});
