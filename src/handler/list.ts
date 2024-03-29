import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { ZodType } from 'zod';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { ResolveList } from '../repository';
import { stringifyResponseBody, valueToData } from '../response';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters';
import type { EnrichList } from '../model';

export const createListHandler = <C>(
  inputSchema: ZodType,
  resolveList: ResolveList<C>,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
  enrichList: EnrichList<C> = async (list) => list,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const result = inputSchema.safeParse(request.uri.query);

    if (!result.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(result.error) });
    }

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      outputSchema.parse(valueToData(await enrichList(await resolveList(result.data), { request }))),
    );
  };
};
