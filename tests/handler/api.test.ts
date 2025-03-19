import { PassThrough } from 'stream';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Response, ServerRequest, Uri } from '@chubbyts/chubbyts-http-types/dist/message';
import type { StreamFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { createApiHandlerAdapterFactory, createApiResponse } from '../../src/handler/api';

describe('createApiHandlerAdapterFactory', () => {
  test('not matching query', async () => {
    const serverRequest: ServerRequest = {
      protocolVersion: '1.0',
      method: 'POST',
      uri: {
        schema: 'https',
        userInfo: 'user:password',
        host: 'localhost',
        port: 443,
        path: '/path',
        query: {},
        fragment: 'fragment',
      },
      attributes: {},
      headers: {},
      body: new PassThrough(),
    };

    const [decoder, decoderMocks] = useObjectMock<Decoder>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const [streamFactory, streamFactoryMocks] = useFunctionMock<StreamFactory>([]);

    const apiHandlerAdapterFactory = createApiHandlerAdapterFactory(decoder, encoder, streamFactory);

    const apiHandlerAdapter = apiHandlerAdapterFactory(
      {
        serverRequest: {
          uri: {
            query: z.object({ serverRequestQueryKey: z.string() }),
          },
          attributes: z.object({
            contentType: z.string(),
            accept: z.string(),
            serverRequestAttributeKey: z.string(),
          }),
          body: z.object({ serverRequestBodyKey: z.string() }),
        },
        response: {
          body: z.object({ responseBodyKey: z.string() }),
        },
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      async () => {},
    );

    try {
      await apiHandlerAdapter(serverRequest);
      throw new Error('expect fail');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);

      expect({ ...e }).toMatchInlineSnapshot(`
        {
          "_httpError": "BadRequest",
          "detail": "Invalid query",
          "invalidParameters": [
            {
              "context": {
                "code": "invalid_type",
                "expected": "string",
                "received": "undefined",
              },
              "name": "serverRequestQueryKey",
              "reason": "Required",
            },
          ],
          "status": 400,
          "title": "Bad Request",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
        }
      `);
    }

    expect(decoderMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(streamFactoryMocks.length).toBe(0);
  });

  test('not matching attributes', async () => {
    const serverRequest: ServerRequest = {
      protocolVersion: '1.0',
      method: 'POST',
      uri: {
        schema: 'https',
        userInfo: 'user:password',
        host: 'localhost',
        port: 443,
        path: '/path',
        query: {
          serverRequestQueryKey: 'serverRequestQueryValue',
        },
        fragment: 'fragment',
      },
      attributes: {},
      headers: {},
      body: new PassThrough(),
    };

    const [decoder, decoderMocks] = useObjectMock<Decoder>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const [streamFactory, streamFactoryMocks] = useFunctionMock<StreamFactory>([]);

    const apiHandlerAdapterFactory = createApiHandlerAdapterFactory(decoder, encoder, streamFactory);

    const apiHandlerAdapter = apiHandlerAdapterFactory(
      {
        serverRequest: {
          uri: {
            query: z.object({ serverRequestQueryKey: z.string() }),
          },
          attributes: z.object({
            contentType: z.string(),
            accept: z.string(),
            serverRequestAttributeKey: z.string(),
          }),
          body: z.object({ serverRequestBodyKey: z.string() }),
        },
        response: {
          body: z.object({ responseBodyKey: z.string() }),
        },
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      async () => {},
    );

    try {
      await apiHandlerAdapter(serverRequest);
      throw new Error('expect fail');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);

      expect({ ...e }).toMatchInlineSnapshot(`
        {
          "_httpError": "InternalServerError",
          "detail": "Invalid attributes",
          "invalidParameters": [
            {
              "context": {
                "code": "invalid_type",
                "expected": "string",
                "received": "undefined",
              },
              "name": "contentType",
              "reason": "Required",
            },
            {
              "context": {
                "code": "invalid_type",
                "expected": "string",
                "received": "undefined",
              },
              "name": "accept",
              "reason": "Required",
            },
            {
              "context": {
                "code": "invalid_type",
                "expected": "string",
                "received": "undefined",
              },
              "name": "serverRequestAttributeKey",
              "reason": "Required",
            },
          ],
          "status": 500,
          "title": "Internal Server Error",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1",
        }
      `);
    }

    expect(decoderMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(streamFactoryMocks.length).toBe(0);
  });

  test('successfully', async () => {
    const serverRequestUriQuery = {
      serverRequestQueryKey: 'serverRequestQueryValue',
    };

    const serverRequestUri: Uri = {
      schema: 'https',
      userInfo: 'user:password',
      host: 'localhost',
      port: 443,
      path: '/path',
      query: serverRequestUriQuery,
      fragment: 'fragment',
    };

    const serverRequestAttributes = {
      contentType: 'application/json',
      accept: 'application/json',
      serverRequestAttributeKey: 'serverRequestAttributeValue',
    };

    const serverRequestHeaders = {
      'content-type': ['application/json'],
      accept: ['application/json'],
    };

    const serverRequestData = { serverRequestBodyKey: 'serverRequestBodyValue' };

    const serverRequestBody = new PassThrough();
    serverRequestBody.write(JSON.stringify(serverRequestData));
    serverRequestBody.end();

    const serverRequest: ServerRequest = {
      protocolVersion: '1.0',
      method: 'POST',
      uri: serverRequestUri,
      attributes: serverRequestAttributes,
      headers: serverRequestHeaders,
      body: serverRequestBody,
    };

    const responseData = { responseBodyKey: 'responseBodyValue' };

    const responseBody = new PassThrough();
    responseBody.write(JSON.stringify(responseData));
    responseBody.end();

    const response: Response = {
      protocolVersion: '1.0',
      status: 200,
      reasonPhrase: 'OK',
      headers: {
        'content-type': ['application/json'],
      },
      body: responseBody,
    };

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      {
        name: 'decode',
        parameters: [JSON.stringify(serverRequestData), 'application/json', { request: serverRequest }],
        return: serverRequestData,
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        parameters: [responseData, 'application/json', { request: serverRequest }],
        return: JSON.stringify(responseData),
      },
    ]);

    const [streamFactory, streamFactoryMocks] = useFunctionMock<StreamFactory>([
      { parameters: [JSON.stringify(responseData)], return: responseBody },
    ]);

    const apiHandlerAdapterFactory = createApiHandlerAdapterFactory(decoder, encoder, streamFactory);

    const apiHandlerAdapter = apiHandlerAdapterFactory(
      {
        serverRequest: {
          uri: {
            query: z.object({ serverRequestQueryKey: z.string() }),
          },
          attributes: z.object({
            contentType: z.string(),
            accept: z.string(),
            serverRequestAttributeKey: z.string(),
          }),
          body: z.object({ serverRequestBodyKey: z.string() }),
        },
        response: {
          body: z.object({ responseBodyKey: z.string() }),
        },
      },
      async (apiServerRequest) => {
        expect(apiServerRequest.protocolVersion).toBe('1.0');
        expect(apiServerRequest.method).toBe('POST');
        expect(apiServerRequest.uri).toStrictEqual(serverRequestUri);
        expect(apiServerRequest.attributes).toStrictEqual(serverRequestAttributes);
        expect(apiServerRequest.headers).toStrictEqual(serverRequestHeaders);
        expect(apiServerRequest.body).toStrictEqual(serverRequestData);

        return createApiResponse({ responseBodyKey: 'responseBodyValue' }, 200);
      },
    );

    expect(await apiHandlerAdapter(serverRequest)).toStrictEqual(response);

    expect(
      await apiHandlerAdapter._apiHandler({
        protocolVersion: '1.0',
        method: 'POST',
        uri: { ...serverRequestUri, query: serverRequestUriQuery },
        attributes: serverRequestAttributes,
        headers: serverRequestHeaders,
        body: serverRequestData,
      }),
    ).toStrictEqual({ ...response, headers: {}, body: { responseBodyKey: 'responseBodyValue' } });

    expect(decoderMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(streamFactoryMocks.length).toBe(0);
  });
});
