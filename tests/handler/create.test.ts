import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createCreateHandler } from '../../src/handler/create';
import { type EnrichModel, stringSchema, createEnrichedModelSchema } from '../../src/model';
import type { PersistModel } from '../../src/repository';

describe('create', () => {
  describe('createCreateHandler', () => {
    const inputModelSchema = v.object({ name: stringSchema });
    const embeddedModelSchema = v.optional(v.object({ key: stringSchema }));
    const enrichedModelSchema = createEnrichedModelSchema(inputModelSchema, embeddedModelSchema);

    test('successfully', async () => {
      const newName = 'name1';

      const inputData = { name: newName };
      const encodedInputData = JSON.stringify(inputData);

      const serverRequest = new ServerRequest('https://example.com/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        attributes: { accept: 'application/json', contentType: 'application/json' },
        body: encodedInputData,
      });

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [encodedInputData, 'application/json'], return: inputData },
      ]);

      const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([
        {
          callback: async (givenModel) => {
            expect(givenModel).toEqual({
              id: expect.any(String),
              createdAt: expect.any(Date),
              name: newName,
            });

            return givenModel;
          },
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          callback: (givenData, givenContentType) => {
            expect(givenData).toEqual({
              id: expect.any(String),
              createdAt: expect.any(String),
              name: newName,
              _embedded: { key: 'value' },
            });

            expect(givenContentType).toBe('application/json');

            return JSON.stringify(givenData);
          },
        },
      ]);

      const [enrichModel, enrichModelMocks] = useFunctionMock<
        EnrichModel<typeof inputModelSchema, typeof embeddedModelSchema>
      >([
        {
          callback: async (givenModel, givenContext) => {
            expect(givenModel).toEqual({
              id: expect.any(String),
              createdAt: expect.any(Date),
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

      const createHandler = createCreateHandler(
        decoder,
        inputModelSchema,
        persistModel,
        enrichedModelSchema,
        encoder,
        enrichModel,
      );

      const response = await createHandler(serverRequest);

      expect(response.status).toBe(201);
      expect(response.statusText).toBe('Created');
      expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        name: newName,
        _embedded: {
          key: 'value',
        },
      });

      expect((responseBody as { id: string }).id[14]).toBe('7');

      expect(decoderMocks).toHaveLength(0);
      expect(persistModelMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
      expect(enrichModelMocks).toHaveLength(0);
    });

    test('successfully without enrich mode', async () => {
      const newName = 'name1';

      const inputData = { name: newName };
      const encodedInputData = JSON.stringify(inputData);

      const serverRequest = new ServerRequest('https://example.com/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        attributes: { accept: 'application/json', contentType: 'application/json' },
        body: encodedInputData,
      });

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [encodedInputData, 'application/json'], return: inputData },
      ]);

      const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([
        {
          callback: async (givenModel) => {
            expect(givenModel).toEqual({
              id: expect.any(String),
              createdAt: expect.any(Date),
              name: newName,
            });

            return givenModel;
          },
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          callback: (givenData, givenContentType) => {
            expect(givenData).toEqual({
              id: expect.any(String),
              createdAt: expect.any(String),
              name: newName,
            });

            expect(givenContentType).toBe('application/json');

            return JSON.stringify(givenData);
          },
        },
      ]);

      const createHandler = createCreateHandler(decoder, inputModelSchema, persistModel, enrichedModelSchema, encoder);

      const response = await createHandler(serverRequest);

      expect(response.status).toBe(201);
      expect(response.statusText).toBe('Created');
      expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        name: newName,
      });

      expect(decoderMocks).toHaveLength(0);
      expect(persistModelMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
    });

    test('could not parse', async () => {
      const inputData = { key: 'value' };
      const encodedInputData = JSON.stringify(inputData);

      const serverRequest = new ServerRequest('https://example.com/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        attributes: { accept: 'application/json', contentType: 'application/json' },
        body: encodedInputData,
      });

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [encodedInputData, 'application/json'], return: inputData },
      ]);

      const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const createHandler = createCreateHandler(decoder, inputModelSchema, persistModel, enrichedModelSchema, encoder);

      try {
        await createHandler(serverRequest);
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

      expect(decoderMocks).toHaveLength(0);
      expect(persistModelMocks).toHaveLength(0);
      expect(encoderMocks).toHaveLength(0);
    });
  });
});
