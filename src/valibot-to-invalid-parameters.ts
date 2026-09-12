import { isArray, isBoolean, isNull, isNumber, isObject, isString } from '@chubbyts/chubbyts-decode-encode/dist/data';
import type { BaseIssue, IssuePathItem } from 'valibot';

type InvalidParameter = {
  name: string;
  reason: string;
  details: { [key: string]: unknown };
};

const resolveName = (path: ReadonlyArray<IssuePathItem> | undefined): string => {
  return (path ?? [])
    .map((pathItem, i) => {
      return i > 0 ? `[${String(pathItem.key)}]` : String(pathItem.key);
    })
    .join('');
};

const filterDetails = (rest: unknown): unknown => {
  if (isObject(rest)) {
    return Object.fromEntries(
      Object.entries(rest)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, filterDetails(value)]),
    );
  }

  if (isArray(rest)) {
    return rest.map(filterDetails);
  }

  if (isNull(rest) || isBoolean(rest) || isNumber(rest) || isString(rest)) {
    return rest;
  }

  if (rest instanceof Date) {
    return rest.toJSON();
  }

  return '**filtered**';
};

const issueToInvalidParameter = (issue: BaseIssue<unknown>): InvalidParameter => {
  const {
    path,
    message,
    issues,
    input: _input,
    lang: _lang,
    abortEarly: _abortEarly,
    abortPipeEarly: _abortPipeEarly,
    ...details
  } = issue;

  return {
    name: resolveName(path),
    reason: message,
    details: filterDetails({
      ...details,
      ...(issues ? { issues: issues.map(issueToInvalidParameter) } : {}),
    }) as InvalidParameter['details'],
  };
};

export const valibotToInvalidParameters = (issues: ReadonlyArray<BaseIssue<unknown>>): Array<InvalidParameter> => {
  return issues.map(issueToInvalidParameter);
};
