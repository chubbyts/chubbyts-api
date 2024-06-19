import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { createAcceptNegotiationMiddleware } from '../../src/middleware/accept-negotiation-middleware';

describe('createAcceptNegotiationMiddleware', () => {
  test('successfully', async () => {
    const request = { headers: { accept: ['application/json'] } } as unknown as ServerRequest;
    const response = {} as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        callback: async (givenRequest: ServerRequest) => {
          expect(givenRequest).toMatchInlineSnapshot(`
            {
              "attributes": {
                "accept": "application/json",
              },
              "headers": {
                "accept": [
                  "application/json",
                ],
              },
            }
          `);

          return response;
        },
      },
    ]);

    const [acceptNegotiator, acceptNegotiatorMocks] = useObjectMock<Negotiator>([
      {
        name: 'negotiate',
        parameters: ['application/json'],
        return: { value: 'application/json', attributes: { q: '1.0' } },
      },
    ]);

    const acceptNegotiationMiddleware = createAcceptNegotiationMiddleware(acceptNegotiator);

    expect(await acceptNegotiationMiddleware(request, handler)).toBe(response);

    expect(handlerMocks.length).toBe(0);
    expect(acceptNegotiatorMocks.length).toBe(0);
  });

  test('no negotiated value', async () => {
    const request = { headers: { accept: ['application/xml', 'application/x-yaml'] } } as unknown as ServerRequest;

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    const [acceptNegotiator, acceptNegotiatorMocks] = useObjectMock<Negotiator>([
      {
        name: 'negotiate',
        parameters: ['application/xml,application/x-yaml'],
        return: undefined,
      },
      {
        name: 'supportedValues',
        value: ['application/json', 'application/x-something'],
      },
    ]);

    const acceptNegotiationMiddleware = createAcceptNegotiationMiddleware(acceptNegotiator);

    try {
      await acceptNegotiationMiddleware(request, handler);
      throw new Error('Expect Error');
    } catch (e) {
      expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "NotAcceptable",
          "detail": "Allowed accepts: "application/json", "application/x-something"",
          "status": 406,
          "supportedValues": [
            "application/json",
            "application/x-something",
          ],
          "title": "Not Acceptable",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.7",
        }
      `);
    }

    expect(handlerMocks.length).toBe(0);
    expect(acceptNegotiatorMocks.length).toBe(0);
  });

  test('missing header', async () => {
    const request = { headers: {} } as unknown as ServerRequest;

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    const [acceptNegotiator, acceptNegotiatorMocks] = useObjectMock<Negotiator>([
      {
        name: 'supportedValues',
        value: ['application/json', 'application/x-something'],
      },
    ]);

    const acceptNegotiationMiddleware = createAcceptNegotiationMiddleware(acceptNegotiator);

    try {
      await acceptNegotiationMiddleware(request, handler);
      throw new Error('Expect Error');
    } catch (e) {
      expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "NotAcceptable",
          "detail": "Missing accept: "application/json", "application/x-something"",
          "status": 406,
          "supportedValues": [
            "application/json",
            "application/x-something",
          ],
          "title": "Not Acceptable",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.7",
        }
      `);
    }

    expect(handlerMocks.length).toBe(0);
    expect(acceptNegotiatorMocks.length).toBe(0);
  });
});
