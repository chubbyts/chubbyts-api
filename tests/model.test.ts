import { describe, expect, test } from 'vitest';

import * as v from 'valibot';
import {
  createEnrichedModelListSchema,
  createEnrichedModelSchema,
  createModelListSchema,
  createModelSchema,
  dateSchema,
  numberSchema,
  sortSchema,
  stringSchema,
} from '../src/model';

describe('model', () => {
  describe('stringSchema', () => {
    test('success', async () => {
      expect(v.parse(stringSchema, 't')).toBe('t');
    });

    test('failed', async () => {
      try {
        v.parse(stringSchema, '');
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`[ValiError: Invalid length: Expected >=1 but received 0]`);
      }
    });
  });

  describe('numberSchema', () => {
    test('success', async () => {
      expect(v.parse(numberSchema, '1')).toBe(1);
      expect(v.parse(numberSchema, 1)).toBe(1);
    });

    test('failed', async () => {
      try {
        v.parse(numberSchema, 't');
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`[ValiError: Invalid type: Expected number but received NaN]`);
      }
    });
  });

  describe('dateSchema', () => {
    test('success', async () => {
      const date = new Date();

      expect(v.parse(dateSchema, date)).toEqual(date);
      expect(v.parse(dateSchema, date.toJSON())).toEqual(date);
      expect(v.parse(dateSchema, date.getTime())).toEqual(date);
    });

    test('failed', async () => {
      try {
        v.parse(dateSchema, 't');
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`[ValiError: Invalid type: Expected Date but received "Invalid Date"]`);
      }
    });
  });

  describe('sortSchema', () => {
    test('success', async () => {
      expect(v.parse(sortSchema, 'asc')).toBe('asc');
      expect(v.parse(sortSchema, 'desc')).toBe('desc');
    });

    test('failed', async () => {
      try {
        v.parse(sortSchema, '');
        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`[ValiError: Invalid type: Expected ("asc" | "desc") but received ""]`);
      }
    });
  });

  describe('model schemas', () => {
    const inputModelSchema = v.strictObject({ name: stringSchema });
    const inputModelListSchema = v.strictObject({
      offset: v.optional(numberSchema, 0),
      limit: v.optional(numberSchema, 20),
      filters: v.optional(v.strictObject({ name: v.optional(stringSchema) }), {}),
      sort: v.optional(v.strictObject({ name: sortSchema }), {}),
    });

    const modelSchema = createModelSchema(inputModelSchema);
    const modelListSchema = createModelListSchema(inputModelSchema, inputModelListSchema);

    const enrichedModelSchema = createEnrichedModelSchema(inputModelSchema);
    const enrichedModelListSchema = createEnrichedModelListSchema(inputModelSchema, inputModelListSchema);

    describe('enrichedModel', () => {
      const createdAt = new Date('2025-07-15T10:00:00.000Z');
      const updatedAt = new Date('2025-07-15T10:05:00.000Z');

      const model1: v.InferOutput<typeof modelSchema> = { id: 'id1', createdAt, name: 'test1' };
      const model2: v.InferOutput<typeof modelSchema> = { id: 'id2', createdAt, updatedAt, name: 'test2' };

      const modelList: v.InferOutput<typeof modelListSchema> = {
        offset: 0,
        limit: 20,
        filters: { name: 'test' },
        sort: { name: 'asc' },
        items: [model1, model2],
        count: 2,
      };

      describe('createModelSchema', () => {
        test('success', async () => {
          expect(v.parse(modelSchema, model1)).toMatchInlineSnapshot(`
            {
              "createdAt": 2025-07-15T10:00:00.000Z,
              "id": "id1",
              "name": "test1",
            }
          `);
          expect(v.parse(modelSchema, model2)).toMatchInlineSnapshot(`
            {
              "createdAt": 2025-07-15T10:00:00.000Z,
              "id": "id2",
              "name": "test2",
              "updatedAt": 2025-07-15T10:05:00.000Z,
            }
          `);
        });

        test('failed', async () => {
          try {
            v.parse(modelSchema, { id: 'id', createdAt, name: 'test', unknown: 'unknown' });
            throw new Error('expect fail');
          } catch (e) {
            expect(e).toMatchInlineSnapshot(`[ValiError: Invalid key: Expected never but received "unknown"]`);
          }
        });
      });

      describe('createModelListSchema', () => {
        test('success', async () => {
          expect(v.parse(modelListSchema, modelList)).toMatchInlineSnapshot(`
            {
              "count": 2,
              "filters": {
                "name": "test",
              },
              "items": [
                {
                  "createdAt": 2025-07-15T10:00:00.000Z,
                  "id": "id1",
                  "name": "test1",
                },
                {
                  "createdAt": 2025-07-15T10:00:00.000Z,
                  "id": "id2",
                  "name": "test2",
                  "updatedAt": 2025-07-15T10:05:00.000Z,
                },
              ],
              "limit": 20,
              "offset": 0,
              "sort": {
                "name": "asc",
              },
            }
          `);
        });

        test('failed', async () => {
          try {
            v.parse(modelListSchema, {
              ...modelList,
              unknown: 'unknown',
            });
            throw new Error('expect fail');
          } catch (e) {
            expect(e).toMatchInlineSnapshot(`[ValiError: Invalid key: Expected never but received "unknown"]`);
          }
        });
      });
    });

    describe('enrichedModel', () => {
      const createdAt = new Date('2025-07-15T10:00:00.000Z');
      const updatedAt = new Date('2025-07-15T10:05:00.000Z');

      const enrichedModel1: v.InferOutput<typeof enrichedModelSchema> = {
        id: 'id',
        createdAt,
        name: 'test',
      };

      const enrichedModel2: v.InferOutput<typeof enrichedModelSchema> = {
        id: 'id',
        createdAt,
        updatedAt,
        name: 'test',
        _embedded: { key: 'value' },
        _links: {
          read: { href: '/api/model/id', name: 'read', templated: false },
          update: { href: '/api/model/id', key: 'value' },
          other: [{ href: '/api/model/id/some-thing' }, { href: '/api/model/id/another-thing' }],
        },
      };

      const enrichedModelList1: v.InferOutput<typeof enrichedModelListSchema> = {
        offset: 0,
        limit: 20,
        filters: { name: 'test' },
        sort: { name: 'asc' },
        items: [enrichedModel1, enrichedModel2],
        count: 2,
      };

      const enrichedModelList2: v.InferOutput<typeof enrichedModelListSchema> = {
        offset: 0,
        limit: 20,
        filters: { name: 'test' },
        sort: { name: 'asc' },
        items: [enrichedModel1, enrichedModel2],
        count: 2,
        _embedded: { key: 'value' },
        _links: {
          create: { href: '/api/model', name: 'create', templated: false },
          other: [{ href: '/api/model/id/some-list-thing' }, { href: '/api/model/id/another-list-thing' }],
        },
      };

      describe('createEnrichedModelSchema', () => {
        test('success', async () => {
          expect(v.parse(enrichedModelSchema, enrichedModel1)).toMatchInlineSnapshot(`
            {
              "createdAt": 2025-07-15T10:00:00.000Z,
              "id": "id",
              "name": "test",
            }
          `);
          expect(v.parse(enrichedModelSchema, enrichedModel2)).toMatchInlineSnapshot(`
            {
              "_embedded": {
                "key": "value",
              },
              "_links": {
                "other": [
                  {
                    "href": "/api/model/id/some-thing",
                  },
                  {
                    "href": "/api/model/id/another-thing",
                  },
                ],
                "read": {
                  "href": "/api/model/id",
                  "name": "read",
                  "templated": false,
                },
                "update": {
                  "href": "/api/model/id",
                  "key": "value",
                },
              },
              "createdAt": 2025-07-15T10:00:00.000Z,
              "id": "id",
              "name": "test",
              "updatedAt": 2025-07-15T10:05:00.000Z,
            }
          `);
        });

        test('failed', async () => {
          try {
            v.parse(enrichedModelSchema, { ...enrichedModel1, unknown: 'unknown' });
            throw new Error('expect fail');
          } catch (e) {
            expect(e).toMatchInlineSnapshot(`[ValiError: Invalid key: Expected never but received "unknown"]`);
          }
        });

        test('failed with invalid link', async () => {
          try {
            v.parse(enrichedModelSchema, { ...enrichedModel1, _links: { read: { name: 'read' } } });
            throw new Error('expect fail');
          } catch (e) {
            expect(e).toMatchInlineSnapshot(`[ValiError: Invalid type: Expected (Object | Array) but received Object]`);
          }
        });
      });

      describe('createEnrichedModelListSchema', () => {
        test('success', async () => {
          expect(v.parse(enrichedModelListSchema, enrichedModelList1)).toMatchInlineSnapshot(`
            {
              "count": 2,
              "filters": {
                "name": "test",
              },
              "items": [
                {
                  "createdAt": 2025-07-15T10:00:00.000Z,
                  "id": "id",
                  "name": "test",
                },
                {
                  "_embedded": {
                    "key": "value",
                  },
                  "_links": {
                    "other": [
                      {
                        "href": "/api/model/id/some-thing",
                      },
                      {
                        "href": "/api/model/id/another-thing",
                      },
                    ],
                    "read": {
                      "href": "/api/model/id",
                      "name": "read",
                      "templated": false,
                    },
                    "update": {
                      "href": "/api/model/id",
                      "key": "value",
                    },
                  },
                  "createdAt": 2025-07-15T10:00:00.000Z,
                  "id": "id",
                  "name": "test",
                  "updatedAt": 2025-07-15T10:05:00.000Z,
                },
              ],
              "limit": 20,
              "offset": 0,
              "sort": {
                "name": "asc",
              },
            }
          `);
          expect(v.parse(enrichedModelListSchema, enrichedModelList2)).toMatchInlineSnapshot(`
            {
              "_embedded": {
                "key": "value",
              },
              "_links": {
                "create": {
                  "href": "/api/model",
                  "name": "create",
                  "templated": false,
                },
                "other": [
                  {
                    "href": "/api/model/id/some-list-thing",
                  },
                  {
                    "href": "/api/model/id/another-list-thing",
                  },
                ],
              },
              "count": 2,
              "filters": {
                "name": "test",
              },
              "items": [
                {
                  "createdAt": 2025-07-15T10:00:00.000Z,
                  "id": "id",
                  "name": "test",
                },
                {
                  "_embedded": {
                    "key": "value",
                  },
                  "_links": {
                    "other": [
                      {
                        "href": "/api/model/id/some-thing",
                      },
                      {
                        "href": "/api/model/id/another-thing",
                      },
                    ],
                    "read": {
                      "href": "/api/model/id",
                      "name": "read",
                      "templated": false,
                    },
                    "update": {
                      "href": "/api/model/id",
                      "key": "value",
                    },
                  },
                  "createdAt": 2025-07-15T10:00:00.000Z,
                  "id": "id",
                  "name": "test",
                  "updatedAt": 2025-07-15T10:05:00.000Z,
                },
              ],
              "limit": 20,
              "offset": 0,
              "sort": {
                "name": "asc",
              },
            }
          `);
        });

        test('failed', async () => {
          try {
            v.parse(enrichedModelListSchema, { ...enrichedModelList1, unknown: 'unknown' });
            throw new Error('expect fail');
          } catch (e) {
            expect(e).toMatchInlineSnapshot(`[ValiError: Invalid key: Expected never but received "unknown"]`);
          }
        });
      });
    });
  });
});
