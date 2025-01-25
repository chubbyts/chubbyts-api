import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { ZodObject, ZodType } from 'zod';
import { z } from 'zod';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { FindOneById, Persist } from '../repository';
import { valueToData } from '../response';
import type { EnrichModel } from '../model';
import { createInputOutputHandler } from './input-output';

export const createUpdateHandler = <C>(
  findOneById: FindOneById<C>,
  decoder: Decoder,
  inputSchema: ZodType,
  persist: Persist<C>,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
  enrichModel: EnrichModel<C> = async (model) => model,
): Handler => {
  const attributesSchema = z.object({ id: z.string() });
  const extendedInputSchema = z.object({
    id: z.any().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional(),
    _embedded: z.any().optional(),
    _links: z.any().optional(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(inputSchema as ZodObject<any>).shape,
  });

  return createInputOutputHandler<typeof attributesSchema, typeof extendedInputSchema, typeof outputSchema>(
    attributesSchema,
    decoder,
    extendedInputSchema,
    async ({ attributes, input, request }) => {
      const model = await findOneById(attributes.id);

      if (!model) {
        throw createNotFound({ detail: `There is no entry with id "${attributes.id}"` });
      }

      const { id: _, createdAt: __, updatedAt: ___, _embedded: ____, _links: _____, ...rest } = input;

      return valueToData(await enrichModel(await persist({ ...model, updatedAt: new Date(), ...rest }), { request }));
    },
    outputSchema,
    encoder,
    responseFactory,
    200,
  );
};
