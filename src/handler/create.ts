import { STATUS_CODES } from 'node:http';
import { v7 } from 'uuid';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import * as v from 'valibot';
import type { PersistModel } from '../repository.js';
import type { EmbeddedSchema, EnrichedModel, EnrichedModelSchema, EnrichModel, InputModelSchema } from '../model.js';
import { createTypedHandler } from './typed.js';

export const createCreateHandler = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  decoder: Decoder,
  inputModelSchema: IMS,
  persistModel: PersistModel<IMS>,
  enrichedModelSchema: EnrichedModelSchema<IMS, EMS>,
  encoder: Encoder,
  enrichModel: EnrichModel<IMS, EMS> = async (model) => model as EnrichedModel<IMS, EMS>,
  uuid: () => string = v7,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ contentType: v.string(), accept: v.string() }),
      body: inputModelSchema,
    },
    response: {
      body: enrichedModelSchema,
    },
    handler: async ({ body }) => {
      const persistedModel = await persistModel({ id: uuid(), createdAt: new Date(), ...body });
      const enrichedModel = await enrichModel(persistedModel);

      return {
        status: 201,
        statusText: STATUS_CODES[201],
        body: enrichedModel,
      };
    },
    decoder,
    encoder,
  });
};
