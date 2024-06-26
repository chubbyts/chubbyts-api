import { describe, expect, test } from 'vitest';
import { ZodError } from 'zod';
import { zodToInvalidParameters } from '../src/zod-to-invalid-parameters';

describe('zodToInvalidParameters', () => {
  test('with one error', () => {
    const error = new ZodError([{ code: 'custom', message: 'Error1', path: ['path', 'to', 'field'] }]);

    expect(zodToInvalidParameters(error)).toMatchInlineSnapshot(`
      [
        {
          "context": {
            "code": "custom",
          },
          "name": "path[to][field]",
          "reason": "Error1",
        },
      ]
    `);
  });

  test('with multiple error', () => {
    const error = new ZodError([
      {
        code: 'invalid_type',
        message: 'Invalid type',
        path: ['path', 0, 'to', 0, 'field'],
        expected: 'string',
        received: 'number',
      },
      {
        code: 'invalid_literal',
        message: 'Invalid literal',
        path: ['path', 0, 'to', 0, 'field'],
        expected: 'a',
        received: 'b',
      },
      {
        code: 'custom',
        message: 'Custom',
        path: ['path', 0, 'to', 14, 'field'],
        params: { key1: 'value', key2: new Date('2022-06-09T19:43:12.326Z'), key3: new Error('error') },
      },
      {
        code: 'invalid_union',
        message: 'Invalid union',
        path: ['path', 0, 'to', 3, 'field'],
        unionErrors: [new ZodError([{ code: 'custom', message: 'Custom', path: [0, 1, 2] }])],
      },
      {
        code: 'invalid_union_discriminator',
        message: 'Invalid union discriminator',
        path: ['path', 0, 'to', 4, 'field'],
        options: ['option', 1, 1.1, true],
      },
      {
        code: 'invalid_enum_value',
        message: 'Invalid enum value',
        path: ['path', 0, 'to', 5, 'field'],
        options: ['option', 1],
        received: 2,
      },
      {
        code: 'unrecognized_keys',
        message: 'Unrecognized keys',
        path: ['path', 0, 'to', 2, 'field'],
        keys: ['key1', 'key2'],
      },
      {
        code: 'invalid_arguments',
        message: 'Invalid arguments',
        path: ['path', 0, 'to', 6, 'field'],
        argumentsError: new ZodError([{ code: 'custom', message: 'Custom', path: [0, 'key', 1] }]),
      },
      {
        code: 'invalid_return_type',
        message: 'Invalid return type',
        path: ['path', 0, 'to', 7, 'field'],
        returnTypeError: new ZodError([{ code: 'custom', message: 'Custom', path: ['key1', 0, 'key2'] }]),
      },
      {
        code: 'invalid_date',
        message: 'Invalid date',
        path: ['path', 0, 'to', 8, 'field'],
      },
      {
        code: 'invalid_string',
        message: 'Invalid_string',
        path: ['path', 0, 'to', 9, 'field'],
        validation: 'email',
      },
      {
        code: 'too_small',
        message: 'Too small',
        path: ['path', 0, 'to', 10, 'field'],
        minimum: 1,
        inclusive: true,
        type: 'string',
      },
      {
        code: 'too_big',
        message: 'Too big',
        path: ['path', 0, 'to', 11, 'field'],
        maximum: 10,
        inclusive: true,
        type: 'string',
      },
      {
        code: 'invalid_intersection_types',
        message: 'Invalid intersection types',
        path: ['path', 0, 'to', 12, 'field'],
      },
      {
        code: 'not_multiple_of',
        message: 'Not multiple of',
        path: ['path', 0, 'to', 13, 'field'],
        multipleOf: 2,
      },
      {
        code: 'not_finite',
        message: 'Not finite',
        path: ['path', 0, 'to', 13, 'field'],
      },
    ]);

    expect(zodToInvalidParameters(error)).toMatchInlineSnapshot(`
      [
        {
          "context": {
            "code": "invalid_type",
            "expected": "string",
            "received": "number",
          },
          "name": "path[0][to][0][field]",
          "reason": "Invalid type",
        },
        {
          "context": {
            "code": "invalid_literal",
            "expected": "a",
            "received": "b",
          },
          "name": "path[0][to][0][field]",
          "reason": "Invalid literal",
        },
        {
          "context": {
            "code": "custom",
            "params": {
              "key1": "value",
              "key2": "2022-06-09T19:43:12.326Z",
              "key3": "**filtered**",
            },
          },
          "name": "path[0][to][14][field]",
          "reason": "Custom",
        },
        {
          "context": {
            "code": "invalid_union",
            "unionErrors": [
              [
                {
                  "context": {
                    "code": "custom",
                  },
                  "name": "0[1][2]",
                  "reason": "Custom",
                },
              ],
            ],
          },
          "name": "path[0][to][3][field]",
          "reason": "Invalid union",
        },
        {
          "context": {
            "code": "invalid_union_discriminator",
            "options": [
              "option",
              1,
              1.1,
              true,
            ],
          },
          "name": "path[0][to][4][field]",
          "reason": "Invalid union discriminator",
        },
        {
          "context": {
            "code": "invalid_enum_value",
            "options": [
              "option",
              1,
            ],
            "received": 2,
          },
          "name": "path[0][to][5][field]",
          "reason": "Invalid enum value",
        },
        {
          "context": {
            "code": "unrecognized_keys",
            "keys": [
              "key1",
              "key2",
            ],
          },
          "name": "path[0][to][2][field]",
          "reason": "Unrecognized keys",
        },
        {
          "context": {
            "argumentsError": [
              {
                "context": {
                  "code": "custom",
                },
                "name": "0[key][1]",
                "reason": "Custom",
              },
            ],
            "code": "invalid_arguments",
          },
          "name": "path[0][to][6][field]",
          "reason": "Invalid arguments",
        },
        {
          "context": {
            "code": "invalid_return_type",
            "returnTypeError": [
              {
                "context": {
                  "code": "custom",
                },
                "name": "key1[0][key2]",
                "reason": "Custom",
              },
            ],
          },
          "name": "path[0][to][7][field]",
          "reason": "Invalid return type",
        },
        {
          "context": {
            "code": "invalid_date",
          },
          "name": "path[0][to][8][field]",
          "reason": "Invalid date",
        },
        {
          "context": {
            "code": "invalid_string",
            "validation": "email",
          },
          "name": "path[0][to][9][field]",
          "reason": "Invalid_string",
        },
        {
          "context": {
            "code": "too_small",
            "inclusive": true,
            "minimum": 1,
            "type": "string",
          },
          "name": "path[0][to][10][field]",
          "reason": "Too small",
        },
        {
          "context": {
            "code": "too_big",
            "inclusive": true,
            "maximum": 10,
            "type": "string",
          },
          "name": "path[0][to][11][field]",
          "reason": "Too big",
        },
        {
          "context": {
            "code": "invalid_intersection_types",
          },
          "name": "path[0][to][12][field]",
          "reason": "Invalid intersection types",
        },
        {
          "context": {
            "code": "not_multiple_of",
            "multipleOf": 2,
          },
          "name": "path[0][to][13][field]",
          "reason": "Not multiple of",
        },
        {
          "context": {
            "code": "not_finite",
          },
          "name": "path[0][to][13][field]",
          "reason": "Not finite",
        },
      ]
    `);
  });
});
