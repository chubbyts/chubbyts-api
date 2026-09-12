import { describe, expect, test } from 'vitest';
import type { BaseIssue } from 'valibot';
import * as v from 'valibot';
import { valibotToInvalidParameters } from '../src/valibot-to-invalid-parameters';
import { dateSchema, numberSchema, sortSchema, stringSchema } from '../src/model';

const invalidParametersOf = (schema: v.GenericSchema, input: unknown) => {
  const result = v.safeParse(schema, input);

  expect(result.success).toBe(false);

  return valibotToInvalidParameters(result.issues ?? []);
};

describe('valibot-to-invalid-parameters', () => {
  describe('valibotToInvalidParameters', () => {
    test('with schema issues', () => {
      expect(
        invalidParametersOf(
          v.strictObject({
            name: stringSchema,
            number: numberSchema,
            date: dateSchema,
            sort: sortSchema,
            items: v.array(v.object({ flag: v.boolean() })),
          }),
          { number: 't', date: 't', sort: '', items: [{ flag: 'yes' }], unknown: 'unknown' },
        ),
      ).toMatchInlineSnapshot(`
        [
          {
            "details": {
              "expected": ""name"",
              "kind": "schema",
              "received": "undefined",
              "type": "strict_object",
            },
            "name": "name",
            "reason": "Invalid key: Expected "name" but received undefined",
          },
          {
            "details": {
              "expected": "number",
              "kind": "schema",
              "received": "NaN",
              "type": "number",
            },
            "name": "number",
            "reason": "Invalid type: Expected number but received NaN",
          },
          {
            "details": {
              "expected": "Date",
              "kind": "schema",
              "received": ""Invalid Date"",
              "type": "date",
            },
            "name": "date",
            "reason": "Invalid type: Expected Date but received "Invalid Date"",
          },
          {
            "details": {
              "expected": "("asc" | "desc")",
              "kind": "schema",
              "received": """",
              "type": "picklist",
            },
            "name": "sort",
            "reason": "Invalid type: Expected ("asc" | "desc") but received """,
          },
          {
            "details": {
              "expected": "boolean",
              "kind": "schema",
              "received": ""yes"",
              "type": "boolean",
            },
            "name": "items[0][flag]",
            "reason": "Invalid type: Expected boolean but received "yes"",
          },
          {
            "details": {
              "expected": "never",
              "kind": "schema",
              "received": ""unknown"",
              "type": "strict_object",
            },
            "name": "unknown",
            "reason": "Invalid key: Expected never but received "unknown"",
          },
        ]
      `);
    });

    test('with validation issues', () => {
      expect(
        invalidParametersOf(
          v.object({
            name: v.pipe(v.string(), v.minLength(1), v.regex(/^[a-z]+$/)),
            number: v.pipe(v.number(), v.maxValue(10)),
            date: v.pipe(v.date(), v.minValue(new Date('2025-07-15T10:00:00.000Z'))),
          }),
          { name: '', number: 11, date: new Date('2025-07-14T10:00:00.000Z') },
        ),
      ).toMatchInlineSnapshot(`
        [
          {
            "details": {
              "expected": ">=1",
              "kind": "validation",
              "received": "0",
              "requirement": 1,
              "type": "min_length",
            },
            "name": "name",
            "reason": "Invalid length: Expected >=1 but received 0",
          },
          {
            "details": {
              "expected": "/^[a-z]+$/",
              "kind": "validation",
              "received": """",
              "requirement": "**filtered**",
              "type": "regex",
            },
            "name": "name",
            "reason": "Invalid format: Expected /^[a-z]+$/ but received """,
          },
          {
            "details": {
              "expected": "<=10",
              "kind": "validation",
              "received": "11",
              "requirement": 10,
              "type": "max_value",
            },
            "name": "number",
            "reason": "Invalid value: Expected <=10 but received 11",
          },
          {
            "details": {
              "expected": ">=2025-07-15T10:00:00.000Z",
              "kind": "validation",
              "received": "2025-07-14T10:00:00.000Z",
              "requirement": "2025-07-15T10:00:00.000Z",
              "type": "min_value",
            },
            "name": "date",
            "reason": "Invalid value: Expected >=2025-07-15T10:00:00.000Z but received 2025-07-14T10:00:00.000Z",
          },
        ]
      `);
    });

    test('with nested union issues', () => {
      expect(
        invalidParametersOf(
          v.object({ link: v.union([v.object({ href: v.string() }), v.array(v.object({ href: v.string() }))]) }),
          { link: { name: 'read' } },
        ),
      ).toMatchInlineSnapshot(`
        [
          {
            "details": {
              "expected": "(Object | Array)",
              "issues": [
                {
                  "details": {
                    "expected": ""href"",
                    "kind": "schema",
                    "received": "undefined",
                    "type": "object",
                  },
                  "name": "href",
                  "reason": "Invalid key: Expected "href" but received undefined",
                },
                {
                  "details": {
                    "expected": "Array",
                    "kind": "schema",
                    "received": "Object",
                    "type": "array",
                  },
                  "name": "",
                  "reason": "Invalid type: Expected Array but received Object",
                },
              ],
              "kind": "schema",
              "received": "Object",
              "type": "union",
            },
            "name": "link",
            "reason": "Invalid type: Expected (Object | Array) but received Object",
          },
        ]
      `);
    });

    test('with issues without path and with unsupported values', () => {
      const issues: Array<BaseIssue<unknown>> = [
        {
          kind: 'validation',
          type: 'custom',
          input: 'data',
          expected: null,
          received: '"data"',
          message: 'Custom',
          requirement: () => true,
          lang: 'en',
          abortEarly: true,
          abortPipeEarly: false,
        },
        {
          kind: 'validation',
          type: 'custom',
          input: 'data',
          expected: null,
          received: '"data"',
          message: 'Custom',
          requirement: {
            null: null,
            bool: true,
            number: 42,
            string: 'test',
            date: new Date('2025-07-15T10:00:00.000Z'),
          },
          path: [
            { type: 'map', origin: 'value', input: new Map(), key: new Map(), value: 'data' },
            { type: 'set', origin: 'value', input: new Set(), key: null, value: 'data' },
            { type: 'unknown', origin: 'value', input: {}, key: true, value: 'data' },
          ],
        },
      ];

      expect(valibotToInvalidParameters(issues)).toMatchInlineSnapshot(`
        [
          {
            "details": {
              "expected": null,
              "kind": "validation",
              "received": ""data"",
              "requirement": "**filtered**",
              "type": "custom",
            },
            "name": "",
            "reason": "Custom",
          },
          {
            "details": {
              "expected": null,
              "kind": "validation",
              "received": ""data"",
              "requirement": {
                "bool": true,
                "date": "2025-07-15T10:00:00.000Z",
                "null": null,
                "number": 42,
                "string": "test",
              },
              "type": "custom",
            },
            "name": "[object Map][null][true]",
            "reason": "Custom",
          },
        ]
      `);
    });
  });
});
