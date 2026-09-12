import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import * as v from 'valibot';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createDeleteHandler } from '../../src/handler/delete';
import type { FindModelById, RemoveModel } from '../../src/repository';
import { stringSchema } from '../../src/model';

describe('delete', () => {
  describe('createDeleteHandler', () => {
    const inputModelSchema = v.object({ name: stringSchema });

    test('successfully', async () => {
      const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

      const serverRequest = new ServerRequest(`https://example.com/${id}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        attributes: { accept: 'application/json', id },
      });

      const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
        {
          parameters: [id],
          return: Promise.resolve({
            id,
            createdAt: new Date('2022-06-11T12:36:26.012Z'),
            updatedAt: new Date('2022-06-11T12:36:44.372Z'),
            name: 'test',
          }),
        },
      ]);

      const [removeModel, removeModelMocks] = useFunctionMock<RemoveModel<typeof inputModelSchema>>([
        {
          callback: async (givenModel) => {
            expect(givenModel).toEqual({
              id: expect.any(String),
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
              name: 'test',
            });
          },
        },
      ]);

      const deleteHandler = createDeleteHandler<typeof inputModelSchema>(findModelById, removeModel);

      const response = await deleteHandler(serverRequest);

      expect(response.status).toBe(204);
      expect(response.statusText).toBe('No Content');
      expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot('{}');

      expect(findModelByIdMocks).toHaveLength(0);
      expect(removeModelMocks).toHaveLength(0);
    });

    test('not found', async () => {
      const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

      const serverRequest = new ServerRequest(`https://example.com/${id}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        attributes: { accept: 'application/json', id },
      });

      const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
        {
          parameters: [id],
          return: Promise.resolve(undefined),
        },
      ]);

      const [removeModel, removeModelMocks] = useFunctionMock<RemoveModel<typeof inputModelSchema>>([]);

      const deleteHandler = createDeleteHandler<typeof inputModelSchema>(findModelById, removeModel);

      try {
        await deleteHandler(serverRequest);
        throw new Error('Expect fail');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "NotFound",
            "detail": "There is no entry with id "93cf0de1-e83e-4f68-800d-835e055a6fe8"",
            "status": 404,
            "title": "Not Found",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
          }
        `);
      }

      expect(findModelByIdMocks).toHaveLength(0);
      expect(removeModelMocks).toHaveLength(0);
    });
  });
});
