import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { createModelSchema, stringSchema } from '../src/model';

describe('createModelSchema', () => {
  test('creates a usable model schema', async () => {
    const modelSchema = createModelSchema(v.strictObject({ name: stringSchema }));

    expect(v.parse(modelSchema, { id: 'id1', createdAt: new Date('2025-07-15T10:00:00.000Z'), name: 'test1' }))
      .toMatchInlineSnapshot(`
        {
          "createdAt": 2025-07-15T10:00:00.000Z,
          "id": "id1",
          "name": "test1",
        }
      `);
  });

  test('accepts every object schema variant as input', async () => {
    const entries = { name: stringSchema };
    const input = { id: 'id1', createdAt: new Date('2025-07-15T10:00:00.000Z'), name: 'test1' };

    expect(v.parse(createModelSchema(v.object(entries)), input)).toEqual(input);
    expect(v.parse(createModelSchema(v.strictObject(entries)), input)).toEqual(input);
    expect(v.parse(createModelSchema(v.looseObject(entries)), input)).toEqual(input);
    expect(v.parse(createModelSchema(v.objectWithRest(entries, v.string())), input)).toEqual(input);
  });

  test('derived schema is strict even for an objectWithRest input', async () => {
    const modelSchema = createModelSchema(v.objectWithRest({ name: stringSchema }, v.string()));

    expect(
      v.safeParse(modelSchema, {
        id: 'id1',
        createdAt: new Date('2025-07-15T10:00:00.000Z'),
        name: 'test1',
        extra: 'value',
      }).success,
    ).toBe(false);
  });
});
