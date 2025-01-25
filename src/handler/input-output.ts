import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ZodType, z } from 'zod';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { parseRequestBody } from '../request';
import { stringifyResponseBody } from '../response';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters';

export const createInputOutputHandler = <A extends ZodType | undefined, I extends ZodType, O extends ZodType>(
  attributesSchema: A,
  decoder: Decoder,
  inputSchema: I,
  handle: ({
    attributes,
    input,
    request,
  }: {
    attributes: A extends ZodType ? z.infer<A> : undefined;
    input: z.infer<I>;
    request: ServerRequest;
  }) => Promise<z.infer<O>>,
  outputSchema: O,
  encoder: Encoder,
  responseFactory: ResponseFactory,
  status: number,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    type Attributes = A extends ZodType ? z.infer<A> : undefined;

    // eslint-disable-next-line functional/no-let
    let attributes: Attributes;

    if (attributesSchema) {
      const attributesResult = attributesSchema.safeParse(request.attributes);

      if (!attributesResult.success) {
        throw createBadRequest({ invalidParameters: zodToInvalidParameters(attributesResult.error) });
      }

      attributes = attributesResult.data;
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      attributes = undefined;
    }

    const inputResult = inputSchema.safeParse(await parseRequestBody(decoder, request));

    if (!inputResult.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(inputResult.error) });
    }

    const input = inputResult.data;

    const output = await handle({ attributes, input, request });

    return stringifyResponseBody(request, responseFactory(status), encoder, outputSchema.parse(output));
  };
};

export const createOutputHandler = <A extends ZodType | undefined, O extends ZodType>(
  attributesSchema: A,
  handle: ({
    attributes,
    request,
  }: {
    attributes: A extends ZodType ? z.infer<A> : undefined;
    request: ServerRequest;
  }) => Promise<z.infer<O>>,
  outputSchema: O,
  encoder: Encoder,
  responseFactory: ResponseFactory,
  status: number,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    type Attributes = A extends ZodType ? z.infer<A> : undefined;

    // eslint-disable-next-line functional/no-let
    let attributes: Attributes;

    if (attributesSchema) {
      const attributesResult = attributesSchema.safeParse(request.attributes);

      if (!attributesResult.success) {
        throw createBadRequest({ invalidParameters: zodToInvalidParameters(attributesResult.error) });
      }

      attributes = attributesResult.data;
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      attributes = undefined;
    }

    const output = await handle({ attributes, request });

    return stringifyResponseBody(request, responseFactory(status), encoder, outputSchema.parse(output));
  };
};
