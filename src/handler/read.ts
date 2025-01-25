import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { ZodType } from 'zod';
import { z } from 'zod';
import { valueToData } from '../response';
import type { FindOneById } from '../repository';
import type { EnrichModel } from '../model';
import { createOutputHandler } from './input-output';

export const createReadHandler = <C>(
  findOneById: FindOneById<C>,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
  enrichModel: EnrichModel<C> = async (model) => model,
): Handler => {
  const attributesSchema = z.object({ id: z.string() });
  return createOutputHandler<typeof attributesSchema, typeof outputSchema>(
    attributesSchema,
    async ({ attributes, request }) => {
      const model = await findOneById(attributes.id);

      if (!model) {
        throw createNotFound({ detail: `There is no entry with id "${attributes.id}"` });
      }

      return valueToData(await enrichModel(model, { request }));
    },
    outputSchema,
    encoder,
    responseFactory,
    200,
  );
};
