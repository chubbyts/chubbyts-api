import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Handler, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response } from '@chubbyts/chubbyts-undici-server/dist/server';
import { parse as parseQuery } from 'qs';
import type { GenericSchema, InferOutput } from 'valibot';
import { parse as parseSchema, safeParse } from 'valibot';
import { valibotToInvalidParameters } from '../valibot-to-invalid-parameters.js';
import { valueToData } from '../response.js';

type ObjectSchema = GenericSchema<unknown, { [key: string]: unknown }>;

type HeadersSchema = GenericSchema<unknown, { [key: string]: string }>;

type ContentTypeAttributesSchema = GenericSchema<unknown, { contentType: string }>;

type AcceptAttributesSchema = GenericSchema<unknown, { accept: string }>;

type ContentTypeAndAcceptAttributesSchema = GenericSchema<unknown, { contentType: string; accept: string }>;

type RequestOutput<S> = S extends GenericSchema ? InferOutput<S> : Record<never, never>;

type ResponseOutput<S> = S extends GenericSchema ? InferOutput<S> : { [key: string]: never };

type RequestSchema<
  RequestAttributesSchema extends ObjectSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
> = {
  attributes: RequestAttributesSchema;
  headers?: RequestHeadersSchema;
  query?: RequestQuerySchema;
};

type RequestWithBodySchema<
  RequestAttributesSchema extends ObjectSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
  RequestBodySchema extends ObjectSchema,
> = RequestSchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema> & {
  body: RequestBodySchema;
};

type ResponseSchema<ResponseHeadersSchema extends HeadersSchema | undefined> = {
  headers?: ResponseHeadersSchema;
};

type ResponseWithBodySchema<
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends ObjectSchema,
> = ResponseSchema<ResponseHeadersSchema> & {
  body: ResponseBodySchema;
};

type HandlerRequest<
  RequestAttributesSchema extends ObjectSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
> = {
  attributes: InferOutput<RequestAttributesSchema>;
  headers: RequestOutput<RequestHeadersSchema>;
  query: RequestOutput<RequestQuerySchema>;
};

type HandlerRequestWithBody<
  RequestAttributesSchema extends ObjectSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
  RequestBodySchema extends ObjectSchema,
> = HandlerRequest<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema> & {
  body: InferOutput<RequestBodySchema>;
};

type HandlerResponseBase<ResponseHeadersSchema extends HeadersSchema | undefined> = {
  status: number;
  statusText?: string;
  headers?: ResponseOutput<ResponseHeadersSchema>;
};

type HandlerResponseWithBody<ResponseHeadersSchema extends HeadersSchema | undefined, ResponseBody> = Promise<
  HandlerResponseBase<ResponseHeadersSchema> & { body: ResponseBody }
>;

type HandlerResponse<ResponseHeadersSchema extends HeadersSchema | undefined, ResponseBody> = [ResponseBody] extends [
  undefined,
]
  ? Promise<HandlerResponseBase<ResponseHeadersSchema>>
  : HandlerResponseWithBody<ResponseHeadersSchema, ResponseBody>;

export type WithRequestAndResponse<
  RequestAttributesSchema extends ContentTypeAndAcceptAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
  RequestBodySchema extends ObjectSchema,
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends ObjectSchema,
> = {
  request: RequestWithBodySchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema, RequestBodySchema>;
  response: ResponseWithBodySchema<ResponseHeadersSchema, ResponseBodySchema>;
  handler: (
    request: HandlerRequestWithBody<
      RequestAttributesSchema,
      RequestHeadersSchema,
      RequestQuerySchema,
      RequestBodySchema
    >,
  ) => HandlerResponseWithBody<ResponseHeadersSchema, InferOutput<ResponseBodySchema>>;
  decoder: Decoder;
  encoder: Encoder;
};

export type WithRequestOnly<
  RequestAttributesSchema extends ContentTypeAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
  RequestBodySchema extends ObjectSchema,
  ResponseHeadersSchema extends HeadersSchema | undefined,
> = {
  request: RequestWithBodySchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema, RequestBodySchema>;
  response: ResponseSchema<ResponseHeadersSchema>;
  handler: (
    request: HandlerRequestWithBody<
      RequestAttributesSchema,
      RequestHeadersSchema,
      RequestQuerySchema,
      RequestBodySchema
    >,
  ) => HandlerResponse<ResponseHeadersSchema, undefined>;
  decoder: Decoder;
};

export type WithResponseOnly<
  RequestAttributesSchema extends AcceptAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends ObjectSchema,
> = {
  request: RequestSchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema>;
  response: ResponseWithBodySchema<ResponseHeadersSchema, ResponseBodySchema>;
  handler: (
    request: HandlerRequest<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema>,
  ) => HandlerResponseWithBody<ResponseHeadersSchema, InferOutput<ResponseBodySchema>>;
  encoder: Encoder;
};

export type WithNeither<
  RequestAttributesSchema extends ObjectSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined,
> = {
  request: RequestSchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema>;
  response: ResponseSchema<ResponseHeadersSchema>;
  handler: (
    request: HandlerRequest<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema>,
  ) => HandlerResponse<ResponseHeadersSchema, undefined>;
};

export type TypedHandlerConfig<
  RequestAttributesSchema extends ObjectSchema | undefined,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
  RequestBodySchema extends ObjectSchema | undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends ObjectSchema | undefined,
> = RequestAttributesSchema extends ContentTypeAndAcceptAttributesSchema
  ? RequestBodySchema extends ObjectSchema
    ? ResponseBodySchema extends ObjectSchema
      ? WithRequestAndResponse<
          RequestAttributesSchema,
          RequestHeadersSchema,
          RequestQuerySchema,
          RequestBodySchema,
          ResponseHeadersSchema,
          ResponseBodySchema
        >
      : never
    : never
  : RequestAttributesSchema extends ContentTypeAttributesSchema
    ? RequestBodySchema extends ObjectSchema
      ? ResponseBodySchema extends undefined
        ? WithRequestOnly<
            RequestAttributesSchema,
            RequestHeadersSchema,
            RequestQuerySchema,
            RequestBodySchema,
            ResponseHeadersSchema
          >
        : never
      : never
    : RequestAttributesSchema extends AcceptAttributesSchema
      ? RequestBodySchema extends undefined
        ? ResponseBodySchema extends ObjectSchema
          ? WithResponseOnly<
              RequestAttributesSchema,
              RequestHeadersSchema,
              RequestQuerySchema,
              ResponseHeadersSchema,
              ResponseBodySchema
            >
          : never
        : never
      : RequestAttributesSchema extends ObjectSchema
        ? RequestBodySchema extends undefined
          ? ResponseBodySchema extends undefined
            ? WithNeither<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema, ResponseHeadersSchema>
            : never
          : never
        : never;

const resolveRequestHeaders = (
  serverRequest: ServerRequest,
  request: { headers?: HeadersSchema },
): InferOutput<HeadersSchema> => {
  if (undefined === request.headers) {
    return {};
  }

  const requestHeadersResult = safeParse(request.headers, Object.fromEntries(serverRequest.headers.entries()));

  if (!requestHeadersResult.success) {
    throw createBadRequest({
      invalidParameters: valibotToInvalidParameters(requestHeadersResult.issues),
      context: 'headers',
    });
  }

  return requestHeadersResult.output;
};

const resolveRequestQuery = (
  serverRequest: ServerRequest,
  request: { query?: ObjectSchema },
): InferOutput<ObjectSchema> => {
  if (undefined === request.query) {
    return {};
  }

  const requestQueryResult = safeParse(request.query, parseQuery(new URL(serverRequest.url).search.substring(1)));

  if (!requestQueryResult.success) {
    throw createBadRequest({
      invalidParameters: valibotToInvalidParameters(requestQueryResult.issues),
      context: 'query',
    });
  }

  return requestQueryResult.output;
};

const resolveRequestBody = async (
  serverRequest: ServerRequest,
  decoder: Decoder,
  contentType: string,
  body: ObjectSchema,
): Promise<InferOutput<ObjectSchema>> => {
  const requestBodyResult = safeParse(body, decoder.decode(await serverRequest.text(), contentType));

  if (!requestBodyResult.success) {
    throw createBadRequest({
      invalidParameters: valibotToInvalidParameters(requestBodyResult.issues),
      context: 'body',
    });
  }

  return requestBodyResult.output;
};

export function createTypedHandler<
  RequestAttributesSchema extends ContentTypeAndAcceptAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined = undefined,
  RequestQuerySchema extends ObjectSchema | undefined = undefined,
  RequestBodySchema extends ObjectSchema = ObjectSchema,
  ResponseHeadersSchema extends HeadersSchema | undefined = undefined,
  ResponseBodySchema extends ObjectSchema = ObjectSchema,
>(
  _: WithRequestAndResponse<
    RequestAttributesSchema,
    RequestHeadersSchema,
    RequestQuerySchema,
    RequestBodySchema,
    ResponseHeadersSchema,
    ResponseBodySchema
  >,
): Handler;
export function createTypedHandler<
  RequestAttributesSchema extends ContentTypeAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined = undefined,
  RequestQuerySchema extends ObjectSchema | undefined = undefined,
  RequestBodySchema extends ObjectSchema = ObjectSchema,
  ResponseHeadersSchema extends HeadersSchema | undefined = undefined,
>(
  _: WithRequestOnly<
    RequestAttributesSchema,
    RequestHeadersSchema,
    RequestQuerySchema,
    RequestBodySchema,
    ResponseHeadersSchema
  >,
): Handler;
export function createTypedHandler<
  RequestAttributesSchema extends AcceptAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined = undefined,
  RequestQuerySchema extends ObjectSchema | undefined = undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined = undefined,
  ResponseBodySchema extends ObjectSchema = ObjectSchema,
>(
  _: WithResponseOnly<
    RequestAttributesSchema,
    RequestHeadersSchema,
    RequestQuerySchema,
    ResponseHeadersSchema,
    ResponseBodySchema
  >,
): Handler;
export function createTypedHandler<
  RequestAttributesSchema extends ObjectSchema,
  RequestHeadersSchema extends HeadersSchema | undefined = undefined,
  RequestQuerySchema extends ObjectSchema | undefined = undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined = undefined,
>(_: WithNeither<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema, ResponseHeadersSchema>): Handler;
export function createTypedHandler<
  RequestAttributesSchema extends ObjectSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends ObjectSchema | undefined,
  RequestBodySchema extends ObjectSchema | undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends ObjectSchema | undefined,
>(
  _: TypedHandlerConfig<
    RequestAttributesSchema,
    RequestHeadersSchema,
    RequestQuerySchema,
    RequestBodySchema,
    ResponseHeadersSchema,
    ResponseBodySchema
  >,
): Handler {
  return async (serverRequest: ServerRequest): Promise<Response> => {
    if (
      'decoder' in _ &&
      undefined !== _.decoder &&
      'body' in _.request &&
      undefined !== _.request.body &&
      'encoder' in _ &&
      undefined !== _.encoder &&
      'body' in _.response &&
      undefined !== _.response.body
    ) {
      const config = _ as WithRequestAndResponse<
        ContentTypeAndAcceptAttributesSchema,
        HeadersSchema | undefined,
        ObjectSchema | undefined,
        ObjectSchema,
        HeadersSchema | undefined,
        ObjectSchema
      >;
      const requestAttributes = parseSchema(config.request.attributes, serverRequest.attributes);

      const typedResponse = await config.handler({
        attributes: requestAttributes,
        headers: resolveRequestHeaders(serverRequest, config.request),
        query: resolveRequestQuery(serverRequest, config.request),
        body: await resolveRequestBody(
          serverRequest,
          config.decoder,
          requestAttributes.contentType,
          config.request.body,
        ),
      });

      return new Response(
        config.encoder.encode(
          valueToData(parseSchema(config.response.body, typedResponse.body)),
          requestAttributes.accept,
        ),
        {
          status: typedResponse.status,
          statusText: typedResponse.statusText,
          headers: {
            'content-type': requestAttributes.accept,
            ...(config.response.headers ? parseSchema(config.response.headers, typedResponse.headers) : {}),
          },
        },
      );
    }

    if ('decoder' in _ && undefined !== _.decoder && 'body' in _.request && undefined !== _.request.body) {
      const config = _ as WithRequestOnly<
        ContentTypeAttributesSchema,
        HeadersSchema | undefined,
        ObjectSchema | undefined,
        ObjectSchema,
        HeadersSchema | undefined
      >;

      const requestAttributes = parseSchema(config.request.attributes, serverRequest.attributes);

      const typedResponse = await config.handler({
        attributes: requestAttributes,
        headers: resolveRequestHeaders(serverRequest, config.request),
        query: resolveRequestQuery(serverRequest, config.request),
        body: await resolveRequestBody(
          serverRequest,
          config.decoder,
          requestAttributes.contentType,
          config.request.body,
        ),
      });

      return new Response(null, {
        status: typedResponse.status,
        statusText: typedResponse.statusText,
        headers: {
          ...(config.response.headers ? parseSchema(config.response.headers, typedResponse.headers) : {}),
        },
      });
    }

    if ('encoder' in _ && undefined !== _.encoder && 'body' in _.response && undefined !== _.response.body) {
      const config = _ as WithResponseOnly<
        AcceptAttributesSchema,
        HeadersSchema | undefined,
        ObjectSchema | undefined,
        HeadersSchema | undefined,
        ObjectSchema
      >;

      const requestAttributes = parseSchema(config.request.attributes, serverRequest.attributes);

      const typedResponse = await config.handler({
        attributes: requestAttributes,
        headers: resolveRequestHeaders(serverRequest, config.request),
        query: resolveRequestQuery(serverRequest, config.request),
      });

      return new Response(
        config.encoder.encode(
          valueToData(parseSchema(config.response.body, typedResponse.body)),
          requestAttributes.accept,
        ),
        {
          status: typedResponse.status,
          statusText: typedResponse.statusText,
          headers: {
            'content-type': requestAttributes.accept,
            ...(config.response.headers ? parseSchema(config.response.headers, typedResponse.headers) : {}),
          },
        },
      );
    }

    const config = _ as WithNeither<
      ObjectSchema,
      HeadersSchema | undefined,
      ObjectSchema | undefined,
      HeadersSchema | undefined
    >;

    const requestAttributes = parseSchema(config.request.attributes, serverRequest.attributes);

    const typedResponse = await config.handler({
      attributes: requestAttributes,
      headers: resolveRequestHeaders(serverRequest, config.request),
      query: resolveRequestQuery(serverRequest, config.request),
    });

    return new Response(null, {
      status: typedResponse.status,
      statusText: typedResponse.statusText,
      headers: {
        ...(config.response.headers ? parseSchema(config.response.headers, typedResponse.headers) : {}),
      },
    });
  };
}
