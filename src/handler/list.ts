import { STATUS_CODES } from 'node:http';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import * as v from 'valibot';
import type { ResolveModelList } from '../repository.js';
import type {
  EmbeddedSchema,
  EnrichedModelList,
  EnrichedModelListSchema,
  EnrichModelList,
  InputModelListSchema,
  InputModelSchema,
} from '../model.js';
import { createTypedHandler } from './typed.js';

export const createListHandler = <
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
>(
  inputModelListSchema: IMLS,
  resolveModelList: ResolveModelList<IMS, IMLS>,
  enrichedModelListSchema: EnrichedModelListSchema<IMS, IMLS, EMS, EMLS>,
  encoder: Encoder,
  enrichModelList: EnrichModelList<IMS, IMLS, EMS, EMLS> = async (list) =>
    list as EnrichedModelList<IMS, IMLS, EMS, EMLS>,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ accept: v.string() }),
      query: inputModelListSchema,
    },
    response: {
      body: enrichedModelListSchema,
    },
    handler: async ({ query }) => {
      const modelList = await resolveModelList(query);
      const enrichedModelList = await enrichModelList(modelList);

      return {
        status: 200,
        statusText: STATUS_CODES[200],
        body: enrichedModelList,
      };
    },
    encoder,
  });
};
