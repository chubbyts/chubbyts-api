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
});
