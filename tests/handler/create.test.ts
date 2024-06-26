import { PassThrough } from 'stream';
import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from 'vitest';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { createCreateHandler } from '../../src/handler/create';
import type { EnrichModel, Model } from '../../src/model';
import type { Persist } from '../../src/repository';
import { streamToString } from '../../src/stream';

describe('createCreateHandler', () => {
  test('successfully', async () => {
    const newName = 'name1';

    const inputData = { name: newName };
    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { accept: 'application/json', contentType: 'application/json' },
      body: requestBody,
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'safeParse',
        parameters: [inputData],
        return: {
          success: true,
          data: { ...inputData },
        },
      },
    ]);

    const [persist, persistMocks] = useFunctionMock<Persist<{ name: string }>>([
      {
        callback: async (givenModel: Model<{ name: string }>): Promise<Model<{ name: string }>> => {
          expect(givenModel).toEqual({
            id: expect.any(String),
            createdAt: expect.any(Date),
            name: newName,
          });

          return givenModel;
        },
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [201],
        return: response,
      },
    ]);

    const [outputSchema, outputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'parse',
        callback: (givenData: Record<string, string>) => {
          expect(givenData).toEqual({
            id: expect.any(String),
            createdAt: expect.any(String),
            name: newName,
            _embedded: { key: 'value' },
          });

          return givenData;
        },
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData: Data, givenContentType: string): string => {
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

    const [enrichModel, enrichModelMocks] = useFunctionMock<EnrichModel<{ name: string }>>([
      {
        callback: async <C>(givenModel: Model<C>, givenContext: { [key: string]: unknown }) => {
          expect(givenModel).toEqual({
            id: expect.any(String),
            createdAt: expect.any(Date),
            name: newName,
          });

          expect(givenContext).toEqual({ request });

          return {
            ...givenModel,
            _embedded: { key: 'value' },
          };
        },
      },
    ]);

    const createHandler = createCreateHandler<{ name: string }>(
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
      enrichModel,
    );

    expect(await createHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      name: newName,
      _embedded: {
        key: 'value',
      },
    });

    expect(decoderMocks.length).toBe(0);
    expect(inputSchemaMocks.length).toBe(0);
    expect(persistMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(enrichModelMocks.length).toBe(0);
  });

  test('successfully without enrich model', async () => {
    const newName = 'name1';

    const inputData = { name: newName };
    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { accept: 'application/json', contentType: 'application/json' },
      body: requestBody,
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'safeParse',
        parameters: [inputData],
        return: {
          success: true,
          data: { ...inputData },
        },
      },
    ]);

    const [persist, persistMocks] = useFunctionMock<Persist<{ name: string }>>([
      {
        callback: async (givenModel: Model<{ name: string }>): Promise<Model<{ name: string }>> => {
          expect(givenModel).toEqual({
            id: expect.any(String),
            createdAt: expect.any(Date),
            name: newName,
          });

          return givenModel;
        },
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [201],
        return: response,
      },
    ]);

    const [outputSchema, outputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'parse',
        callback: (givenData: Record<string, string>) => {
          expect(givenData).toEqual({
            id: expect.any(String),
            createdAt: expect.any(String),
            name: newName,
          });

          return givenData;
        },
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData: Data, givenContentType: string): string => {
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

    const createHandler = createCreateHandler<{ name: string }>(
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    expect(await createHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      name: newName,
    });

    expect(decoderMocks.length).toBe(0);
    expect(inputSchemaMocks.length).toBe(0);
    expect(persistMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('could not parse', async () => {
    const inputData = { key: 'value' };
    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { contentType: 'application/json' },
      body: requestBody,
    } as unknown as ServerRequest;

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'safeParse',
        parameters: [inputData],
        return: {
          success: false,
          error: new ZodError([{ code: 'custom', message: 'Invalid length', path: ['path', 0, 'field'] }]),
        },
      },
    ]);

    const [persist, persistMocks] = useFunctionMock<Persist<{ name: string }>>([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [outputSchema, outputSchemaMocks] = useObjectMock<ZodType>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const createHandler = createCreateHandler<{ name: string }>(
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    try {
      await createHandler(request);
      throw new Error('Expect Error');
    } catch (e) {
      expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "BadRequest",
          "invalidParameters": [
            {
              "context": {
                "code": "custom",
              },
              "name": "path[0][field]",
              "reason": "Invalid length",
            },
          ],
          "status": 400,
          "title": "Bad Request",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
        }
      `);
    }

    expect(decoderMocks.length).toBe(0);
    expect(inputSchemaMocks.length).toBe(0);
    expect(persistMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });
});
