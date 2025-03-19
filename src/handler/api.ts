import type { ZodTypeAny, z } from 'zod';
import type { ServerRequest, Response } from '@chubbyts/chubbyts-http-types/dist/message';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { createBadRequest, createInternalServerError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { StreamFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { statusMap } from '@chubbyts/chubbyts-http-types/dist/message';
import { streamToString } from '../stream';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters';

type InferOrUndefined<T> = T extends ZodTypeAny ? z.infer<T> : undefined;

export type ApiServerRequest<ReqQuery, ReqAttributes, ReqBody> = Omit<ServerRequest, 'uri' | 'attributes' | 'body'> & {
  uri: Omit<ServerRequest['uri'], 'query'> & { query: ReqQuery };
  attributes: ReqAttributes;
  body: ReqBody;
};

export type ApiResponse<ResBody> = Omit<Response, 'body'> & {
  body: ResBody;
};

export const createApiResponse = <B>(body: B, status: number, reasonPhrase?: string): ApiResponse<B> => {
  return {
    status,
    reasonPhrase: reasonPhrase ?? statusMap.get(status) ?? '',
    protocolVersion: '1.0',
    headers: {},
    body,
  };
};

type ApiHandlerSchema = {
  serverRequest: {
    uri: { query: ZodTypeAny };
    attributes: ZodTypeAny;
    body?: ZodTypeAny;
  };
  response: {
    body?: ZodTypeAny;
  };
};

type Normalized<Schema extends ApiHandlerSchema> = {
  serverRequest: {
    uri: Schema['serverRequest']['uri'];
    attributes: Schema['serverRequest']['attributes'];
    body: 'body' extends keyof Schema['serverRequest'] ? Schema['serverRequest']['body'] : undefined;
  };
  response: {
    body: 'body' extends keyof Schema['response'] ? Schema['response']['body'] : undefined;
  };
};

type RequiredAttributes<Schema extends ApiHandlerSchema> =
  (Normalized<Schema>['serverRequest']['body'] extends undefined
    ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {}
    : { contentType: string }) &
    (Normalized<Schema>['response']['body'] extends undefined
      ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        {}
      : { accept: string });

type ValidateApiHandlerSchema<Schema extends ApiHandlerSchema> =
  z.infer<Schema['serverRequest']['attributes']> extends RequiredAttributes<Schema> ? Schema : never;

export type CreateApiHandlerAdapter = <Schema extends ApiHandlerSchema>(
  schema: ValidateApiHandlerSchema<Schema>,
  apiHandler: (
    apiServerRequest: ApiServerRequest<
      z.infer<Schema['serverRequest']['uri']['query']>,
      z.infer<Schema['serverRequest']['attributes']>,
      InferOrUndefined<Schema['serverRequest']['body']>
    >,
  ) => Promise<ApiResponse<InferOrUndefined<Schema['response']['body']>>>,
) => Handler & { _apiHandler: typeof apiHandler };

export const createApiHandlerAdapterFactory = (
  decoder: Decoder,
  encoder: Encoder,
  streamFactory: StreamFactory,
): CreateApiHandlerAdapter => {
  return <Schema extends ApiHandlerSchema>(
    schema: Schema,
    apiHandler: (
      apiServerRequest: ApiServerRequest<
        z.infer<Schema['serverRequest']['uri']['query']>,
        z.infer<Schema['serverRequest']['attributes']>,
        InferOrUndefined<Schema['serverRequest']['body']>
      >,
    ) => Promise<ApiResponse<InferOrUndefined<Schema['response']['body']>>>,
  ): Handler & { _apiHandler: typeof apiHandler } => {
    const resolveServerRequestUriQuery = (serverRequest: ServerRequest) => {
      const serverRequestUriQueryResult = schema.serverRequest.uri.query.safeParse(serverRequest.uri.query);
      if (!serverRequestUriQueryResult.success) {
        throw createBadRequest({
          detail: 'Invalid query',
          invalidParameters: zodToInvalidParameters(serverRequestUriQueryResult.error),
        });
      }

      return serverRequestUriQueryResult.data;
    };

    const resolveServerRequestAttributes = (serverRequest: ServerRequest) => {
      const serverRequestAttributesResult = schema.serverRequest.attributes.safeParse(serverRequest.attributes);
      if (!serverRequestAttributesResult.success) {
        throw createInternalServerError({
          detail: 'Invalid attributes',
          invalidParameters: zodToInvalidParameters(serverRequestAttributesResult.error),
        });
      }

      return serverRequestAttributesResult.data;
    };

    const resolveServerRequestBody = async (
      serverRequest: ServerRequest,
      serverRequestAttributes: { contentType?: string },
    ) => {
      if (!schema.serverRequest.body || !serverRequestAttributes['contentType']) {
        return undefined;
      }

      const serverRequestBodyResult = schema.serverRequest.body.safeParse(
        decoder.decode(await streamToString(serverRequest.body), serverRequestAttributes.contentType, {
          request: serverRequest,
        }),
      );

      if (!serverRequestBodyResult.success) {
        throw createBadRequest({
          detail: 'Invalid body',
          invalidParameters: zodToInvalidParameters(serverRequestBodyResult.error),
        });
      }

      return serverRequestBodyResult.data;
    };

    const resolveResponseBody = (
      serverRequest: ServerRequest,
      serverRequestAttributes: { accept?: string },
      apiResponse: Schema['response'],
    ) => {
      if (!schema.response.body || !serverRequestAttributes['accept']) {
        return streamFactory('');
      }

      const apiResponseBodyResult = schema.response.body.safeParse(apiResponse.body);

      if (!apiResponseBodyResult.success) {
        throw createInternalServerError({
          detail: 'Invalid body',
          invalidParameters: zodToInvalidParameters(apiResponseBodyResult.error),
        });
      }

      return streamFactory(
        encoder.encode(apiResponseBodyResult.data, serverRequestAttributes.accept, {
          request: serverRequest,
        }),
      );
    };

    const handler = async (serverRequest: ServerRequest): Promise<Response> => {
      const serverRequestUriQuery = resolveServerRequestUriQuery(serverRequest);
      const serverRequestAttributes = resolveServerRequestAttributes(serverRequest);
      const serverRequestBody = await resolveServerRequestBody(serverRequest, serverRequestAttributes);

      const apiResponse = await apiHandler({
        ...serverRequest,
        uri: {
          ...serverRequest.uri,
          query: serverRequestUriQuery,
        },
        attributes: serverRequestAttributes,
        body: serverRequestBody,
      });

      const responseBody = resolveResponseBody(serverRequest, serverRequestAttributes, apiResponse);

      return {
        ...apiResponse,
        headers: {
          ...apiResponse.headers,
          'content-type': responseBody ? [serverRequestAttributes.accept] : [],
        },
        body: responseBody,
      };
    };

    // eslint-disable-next-line functional/immutable-data
    handler._apiHandler = apiHandler;

    return handler;
  };
};
