import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { ZodType } from 'zod';
import { v4 as uuid } from 'uuid';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { PersistModel } from '../repository.js';
import { parseRequestBody } from '../request.js';
import { stringifyResponseBody, valueToData } from '../response.js';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters.js';
import type { EnrichModel } from '../model.js';

export const createCreateHandler = <C>(
  decoder: Decoder,
  modelRequestSchema: ZodType,
  persistModel: PersistModel<C>,
  responseFactory: ResponseFactory,
  modelResponseSchema: ZodType,
  encoder: Encoder,
  enrichModel: EnrichModel<C> = async (model) => model,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const modelRequestResult = modelRequestSchema.safeParse(await parseRequestBody(decoder, request));

    if (!modelRequestResult.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(modelRequestResult.error) });
    }

    const model = await persistModel({ id: uuid(), createdAt: new Date(), ...modelRequestResult.data });

    return stringifyResponseBody(
      request,
      responseFactory(201),
      encoder,
      modelResponseSchema.parse(valueToData(await enrichModel(model, { request }))),
    );
  };
};
