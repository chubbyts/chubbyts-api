import { PassThrough } from 'stream';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { z } from 'zod';
import { createReadHandler } from '../../src/handler/read';
import { createEnrichedModelSchema, stringSchema, type EnrichModel, type Model } from '../../src/model';
import type { FindModelById } from '../../src/repository';
import { streamToString } from '../../src/stream';

describe('createReadHandler', () => {
  const inputModelSchema = z.object({ name: stringSchema });
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

    const modelResponse = {
      ...model,
      createdAt: model.createdAt.toJSON(),
      updatedAt: model.createdAt.toJSON(),
    };

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [FindModelById, FindModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [200],
        return: response,
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData, givenContentType) => {
          expect(givenData).toEqual({
            ...modelResponse,
            _embedded: {
              key: 'value',
            },
          });

          expect(givenContentType).toBe('application/json');

          return JSON.stringify(givenData);
        },
      },
    ]);

    const [enrichModel, enrichModelMocks] = useFunctionMock<EnrichModel<typeof inputModelSchema>>([
      {
        callback: async (givenModel, givenContext) => {
          expect(givenModel).toEqual(model);
          expect(givenContext).toEqual({ request });

          return {
            ...givenModel,
            _embedded: { key: 'value' },
          };
        },
      },
    ]);

    const readHandler = createReadHandler<typeof inputModelSchema>(
      FindModelById,
      responseFactory,
      enrichedModelSchema,
      encoder,
      enrichModel,
    );

    expect(await readHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual({
      ...modelResponse,
      _embedded: {
        key: 'value',
      },
    });

    expect(FindModelByIdMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(enrichModelMocks.length).toBe(0);
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

    const modelResponse = {
      ...model,
      createdAt: model.createdAt.toJSON(),
      updatedAt: model.createdAt.toJSON(),
    };

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [FindModelById, FindModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [200],
        return: response,
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData, givenContentType) => {
          expect(givenData).toEqual(modelResponse);

          expect(givenContentType).toBe('application/json');

          return JSON.stringify(givenData);
        },
      },
    ]);

    const readHandler = createReadHandler(FindModelById, responseFactory, enrichedModelSchema, encoder);

    expect(await readHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual(modelResponse);

    expect(FindModelByIdMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('not found', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
      {
        parameters: [id],
        return: Promise.resolve(undefined),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const readHandler = createReadHandler(findModelById, responseFactory, enrichedModelSchema, encoder);

    try {
      await readHandler(request);
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

    expect(findModelByIdMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });
});
