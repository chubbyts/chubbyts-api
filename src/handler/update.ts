import { STATUS_CODES } from 'node:http';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import * as v from 'valibot';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { FindModelById, PersistModel } from '../repository.js';
import type { EmbeddedSchema, EnrichedModel, EnrichModel, EnrichedModelSchema, InputModelSchema } from '../model.js';
import { createTypedHandler } from './typed.js';

export const createUpdateHandler = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  findModelById: FindModelById<IMS>,
  decoder: Decoder,
  inputModelSchema: IMS,
  persistModel: PersistModel<IMS>,
  enrichedModelSchema: EnrichedModelSchema<IMS, EMS>,
  encoder: Encoder,
  enrichModel: EnrichModel<IMS, EMS> = async (model) => model as EnrichedModel<IMS, EMS>,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ contentType: v.string(), accept: v.string(), id: v.string() }),
      body: inputModelSchema,
    },
    response: {
      body: enrichedModelSchema,
    },
    handler: async ({ attributes, body }) => {
      const model = await findModelById(attributes.id);

      if (!model) {
        throw createNotFound({ detail: `There is no entry with id "${attributes.id}"` });
      }

      const persistedModel = await persistModel({
        id: model.id,
        createdAt: model.createdAt,
        updatedAt: new Date(),
        ...body,
      });

      const enrichedModel = await enrichModel(persistedModel);

      return {
        status: 200,
        statusText: STATUS_CODES[200],
        body: enrichedModel,
      };
    },
    decoder,
    encoder,
  });
};
