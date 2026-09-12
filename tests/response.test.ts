import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { EncodeError } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { describe, expect, test } from 'vitest';
import { ValiError } from 'valibot';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createResponseWithData, valueToData } from '../src/response';

describe('response', () => {
  describe('valueToData', () => {
    test('with supported data', () => {
      expect(
        valueToData({
          key1: 'value',
          key2: 2,
          key3: true,
          key4: null,
          key5: undefined,
          key6: new Date('2022-06-09T19:43:12.326Z'),
          key7: ['value', 2, true, null, undefined, new Date('2022-06-09T19:43:12.326Z')],
          key8: {
            key1: 'value',
            key2: 2,
            key3: true,
            key4: null,
            key5: undefined,
            key6: new Date('2022-06-09T19:43:12.326Z'),
            key7: ['value', 2, true, null, undefined, new Date('2022-06-09T19:43:12.326Z')],
          },
        }),
      ).toMatchInlineSnapshot(`
      {
        "key1": "value",
        "key2": 2,
        "key3": true,
        "key4": null,
        "key6": "2022-06-09T19:43:12.326Z",
        "key7": [
          "value",
          2,
          true,
          null,
          "2022-06-09T19:43:12.326Z",
        ],
        "key8": {
          "key1": "value",
          "key2": 2,
          "key3": true,
          "key4": null,
          "key6": "2022-06-09T19:43:12.326Z",
          "key7": [
            "value",
            2,
            true,
            null,
            "2022-06-09T19:43:12.326Z",
          ],
        },
      }
    `);
    });

    test('with http error', () => {
      expect(
        valueToData({
          error: createNotFound({
            detail: 'missing',
            instance: '/api/pets/1',
            headers: { 'retry-after': '10' },
            createdAt: new Date('2022-06-09T19:43:12.326Z'),
            reasons: ['a', undefined, 'b'],
          }),
          errors: [createNotFound({ detail: 'missing' })],
        }),
      ).toMatchInlineSnapshot(`
        {
          "error": {
            "_httpError": "NotFound",
            "createdAt": "2022-06-09T19:43:12.326Z",
            "detail": "missing",
            "headers": {
              "retry-after": "10",
            },
            "instance": "/api/pets/1",
            "reasons": [
              "a",
              "b",
            ],
            "status": 404,
            "title": "Not Found",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
          },
          "errors": [
            {
              "_httpError": "NotFound",
              "detail": "missing",
              "status": 404,
              "title": "Not Found",
              "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
            },
          ],
        }
      `);
    });

    test('with unsupported object', () => {
      try {
        valueToData({
          key: {
            errors: [
              new ValiError([
                {
                  kind: 'schema',
                  type: 'string',
                  input: 'data',
                  expected: 'string',
                  received: '"data"',
                  message: 'Custom',
                },
              ]),
            ],
          },
        });
        throw new Error('Expect Error');
      } catch (e) {
        expect(e).toMatchInlineSnapshot('[Error: Unsupported value of type ValiError]');
      }
    });

    test('with unsupported function', () => {
      try {
        valueToData({ key: { functions: [() => undefined] } });
        throw new Error('Expect Error');
      } catch (e) {
        expect(e).toMatchInlineSnapshot('[Error: Unsupported value of type function]');
      }
    });
  });

  describe('createResponseWithData', () => {
    test('without given accept attribute', () => {
      const data = {};

      const serverRequest = new ServerRequest('https://example.com/');

      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      try {
        createResponseWithData(serverRequest, encoder, data, 200, 'OK');
        throw new Error('Expect Error');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(
          '[Error: Use createAcceptNegotiationMiddleware to assign request.attributes.accept.]',
        );
      }

      expect(encoderMocks).toHaveLength(0);
    });

    test('with data', async () => {
      const data = {
        key1: 'value',
        key2: 2,
        key3: true,
        key4: null,
        key5: ['value', 2, true, null],
        key6: {
          key1: 'value',
          key2: 2,
          key3: true,
          key4: null,
          key5: ['value', 2, true, null],
        },
      };

      const serverRequest = new ServerRequest('https://example.com/', {
        attributes: { accept: 'application/json' },
      });

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          parameters: [data, 'application/json', { serverRequest }],
          return: JSON.stringify(data),
        },
      ]);

      const response = createResponseWithData(serverRequest, encoder, data, 200, 'OK');

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
      {
        "content-type": "application/json",
      }
    `);
      expect(await response.json()).toEqual(data);

      expect(encoderMocks).toHaveLength(0);
    });

    test('with data and headers', async () => {
      const data = {
        key1: 'value',
      };

      const serverRequest = new ServerRequest('https://example.com/', {
        attributes: { accept: 'application/json' },
      });

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          parameters: [data, 'application/json', { serverRequest }],
          return: JSON.stringify(data),
        },
      ]);

      const response = createResponseWithData(serverRequest, encoder, data, 405, 'Method Not Allowed', {
        allow: 'POST',
        'content-type': 'text/html',
      });

      expect(response.status).toBe(405);
      expect(response.statusText).toBe('Method Not Allowed');
      expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
        {
          "allow": "POST",
          "content-type": "application/json",
        }
      `);
      expect(await response.json()).toEqual(data);

      expect(encoderMocks).toHaveLength(0);
    });

    test('with data, but with decode error', () => {
      const error = new EncodeError('something went wrong');

      const data = {
        key1: 'value',
      };

      const serverRequest = new ServerRequest('https://example.com/', {
        attributes: { accept: 'application/json' },
      });

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        { name: 'encode', parameters: [data, 'application/json', { serverRequest }], error },
      ]);

      try {
        createResponseWithData(serverRequest, encoder, data, 200, 'OK');
        throw new Error('Expect Error');
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(encoderMocks).toHaveLength(0);
    });
  });
});
