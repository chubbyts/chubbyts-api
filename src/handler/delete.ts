import { STATUS_CODES } from 'node:http';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import * as v from 'valibot';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { FindModelById, RemoveModel } from '../repository.js';
import type { InputModelSchema } from '../model.js';
import { createTypedHandler } from './typed.js';

export const createDeleteHandler = <IMS extends InputModelSchema>(
  findModelById: FindModelById<IMS>,
  removeModel: RemoveModel<IMS>,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: v.object({ id: v.string() }),
    },
    response: {},
    handler: async ({ attributes }) => {
      const model = await findModelById(attributes.id);

      if (!model) {
        throw createNotFound({ detail: `There is no entry with id "${attributes.id}"` });
      }

      await removeModel(model);

      return {
        status: 204,
        statusText: STATUS_CODES[204],
      };
    },
  });
};
