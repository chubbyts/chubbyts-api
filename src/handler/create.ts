import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { ZodType } from 'zod';
import { v4 as uuid } from 'uuid';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Persist } from '../repository';
import { valueToData } from '../response';
import type { EnrichModel } from '../model';
import { createInputOutputHandler } from './input-output';

export const createCreateHandler = <C>(
  decoder: Decoder,
  inputSchema: ZodType,
  persist: Persist<C>,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
  enrichModel: EnrichModel<C> = async (model) => model,
): Handler => {
  return createInputOutputHandler(
    undefined,
    decoder,
    inputSchema,
    async ({ input, request }) =>
      valueToData(await enrichModel(await persist({ id: uuid(), createdAt: new Date(), ...input }), { request })),
    outputSchema,
    encoder,
    responseFactory,
    201,
  );
};
