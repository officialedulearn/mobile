/**
 * API JSON: prefer ISO strings. Client-only code may still use Date.
 */
export type IsoDateString = string;

/** Postgres numeric serialized in JSON */
export type NumericString = string;

export type UuidString = string;

export type ApiMessageResponse = {
  message: string;
  success?: boolean;
};

export type PaginatedQuery = {
  limit?: number;
  offset?: number;
};
