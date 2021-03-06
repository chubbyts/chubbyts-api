import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from '@jest/globals';
import * as getStream from 'get-stream';
import { PassThrough } from 'stream';
import { ZodError, ZodType } from 'zod';
import { createUpdateHandler } from '../../src/handler/update';
import { Model } from '../../src/model';
import { FindById, Persist } from '../../src/repository';

describe('createUpdateHandler', () => {
  test('successfully', async () => {
    const inputData = { name: 'name2' };
    const encodedInputData = JSON.stringify(inputData);

    let encodedOutputData = '';

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { accept: 'application/json', contentType: 'application/json' },
      body: requestBody,
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const model: Model & { name: string } = {
      id: '93cf0de1-e83e-4f68-800d-835e055a6fe8',
      createdAt: new Date('2022-06-11T12:36:26.012Z'),
      name: 'name1',
    };

    const findById: FindById = jest.fn(async (id: string): Promise<Model> => {
      return model;
    });

    const decode: Decoder['decode'] = jest.fn((givenEncodedData: string, givenContentType: string): Data => {
      expect(givenEncodedData).toBe(encodedInputData);
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      return inputData;
    });

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    const safeParse: ZodType['safeParse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual(inputData);

      return {
        success: true,
        data: { ...givenData },
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const persist: Persist = jest.fn(async (model: Model): Promise<Model> => {
      expect(model).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        name: 'name2',
      });

      return model;
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toMatchInlineSnapshot(`200`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        name: 'name2',
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        name: 'name2',
      });

      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      encodedOutputData = JSON.stringify(givenData);

      return encodedOutputData;
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const updateHandler = createUpdateHandler(
      findById,
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    expect(await updateHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(await getStream(response.body)).toBe(encodedOutputData);

    expect(findById).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(1);
    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('not found', async () => {
    const request = {
      attributes: {},
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const findById: FindById = jest.fn(async (id: string): Promise<undefined> => {
      return undefined;
    });

    const decode: Decoder['decode'] = jest.fn();

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    const safeParse: ZodType['safeParse'] = jest.fn();

    const inputSchema: ZodType = { safeParse } as ZodType;

    const persist: Persist = jest.fn();

    const responseFactory: ResponseFactory = jest.fn();

    const parse: ZodType['parse'] = jest.fn();

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const updateHandler = createUpdateHandler(
      findById,
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    try {
      await updateHandler(request);
      fail('Expect fail');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
        Object {
          "_httpError": "NotFound",
          "detail": "There is no entry with id undefined",
          "status": 404,
          "title": "Not Found",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
        }
      `);
    }

    expect(findById).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(0);
    expect(safeParse).toHaveBeenCalledTimes(0);
    expect(persist).toHaveBeenCalledTimes(0);
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(parse).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });

  test('could not parse', async () => {
    const inputData = { name: 'name2' };
    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { contentType: 'application/json' },
      body: requestBody,
    } as unknown as ServerRequest;

    const model: Model & { name: string } = {
      id: '93cf0de1-e83e-4f68-800d-835e055a6fe8',
      createdAt: new Date('2022-06-11T12:36:26.012Z'),
      name: 'name1',
    };

    const findById: FindById = jest.fn(async (id: string): Promise<Model> => {
      return model;
    });

    const decode: Decoder['decode'] = jest.fn((givenEncodedData: string, givenContentType: string): Data => {
      expect(givenEncodedData).toBe(encodedInputData);
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      return inputData;
    });

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    const safeParse: ZodType['safeParse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual(inputData);

      return {
        success: false,
        error: new ZodError([{ code: 'custom', message: 'test', path: ['field'] }]),
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const persist: Persist = jest.fn();

    const responseFactory: ResponseFactory = jest.fn();

    const parse: ZodType['parse'] = jest.fn();

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const updateHandler = createUpdateHandler(
      findById,
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    try {
      await updateHandler(request);
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
        Object {
          "_httpError": "BadRequest",
          "status": 400,
          "title": "Bad Request",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
          "validation": [ZodError: [
          {
            "code": "custom",
            "message": "test",
            "path": [
              "field"
            ]
          }
        ]],
        }
      `);
    }

    expect(findById).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(1);
    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(0);
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(parse).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });
});
