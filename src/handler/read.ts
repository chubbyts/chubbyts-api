import { STATUS_CODES } from 'node:http';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import * as v from 'valibot';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { FindModelById } from '../repository.js';
import type { EmbeddedSchema, EnrichedModel, EnrichedModelSchema, EnrichModel, InputModelSchema } from '../model.js';
import { createTypedHandler } from './typed.js';

export const createReadHandler = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  findModelById: FindModelById<IMS>,
  enrichedModelSchema: EnrichedModelSchema<IMS, EMS>,
  encoder: Encoder,
  enrichModel: EnrichModel<IMS, EMS> = async (model) => model as EnrichedModel<IMS, EMS>,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ accept: v.string(), id: v.string() }),
    },
    response: {
      body: enrichedModelSchema,
    },
    handler: async ({ attributes }) => {
      const model = await findModelById(attributes.id);

      if (!model) {
        throw createNotFound({ detail: `There is no entry with id "${attributes.id}"` });
      }

      const enrichedModel = await enrichModel(model);

      return {
        status: 200,
        statusText: STATUS_CODES[200],
        body: enrichedModel,
      };
    },
    encoder,
  });
};
