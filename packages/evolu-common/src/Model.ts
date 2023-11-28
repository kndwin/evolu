import * as S from "@effect/schema/Schema";
import { Brand } from "effect";
import { maybeJson } from "./Sqlite.js";

/**
 * Branded Id Schema for any table Id. To create Id Schema for a specific table,
 * use {@link id}.
 */
export const Id = S.string.pipe(S.pattern(/^[\w-]{21}$/), S.brand("Id"));
export type Id = S.Schema.To<typeof Id>;

/**
 * A factory function to create {@link Id} Schema for a specific table.
 *
 * ### Example
 *
 * ```ts
 * import * as S from "@effect/schema/Schema";
 * import * as Evolu from "@evolu/react";
 *
 * const TodoId = Evolu.id("Todo");
 * type TodoId = S.Schema.To<typeof TodoId>;
 * ```
 */
export const id = <T extends string>(
  table: T,
): S.BrandSchema<string, string & Brand.Brand<"Id"> & Brand.Brand<T>> =>
  Id.pipe(S.brand(table));

/**
 * SQLite doesn't support the Date type, so Evolu uses SqliteDate instead. Use
 * the {@link cast} helper to cast SqliteDate from Date and back.
 * https://www.sqlite.org/quirks.html#no_separate_datetime_datatype
 */
export const SqliteDate = S.string.pipe(
  S.filter((s) => !isNaN(Date.parse(s))),
  S.brand("SqliteDate"),
);
export type SqliteDate = S.Schema.To<typeof SqliteDate>;

/**
 * SQLite doesn't support the boolean type, so Evolu uses SqliteBoolean instead.
 * Use the {@link cast} helper to cast SqliteBoolean from boolean and back.
 * https://www.sqlite.org/quirks.html#no_separate_boolean_datatype
 */
export const SqliteBoolean = S.number.pipe(
  S.int(),
  S.filter((s) => s === 0 || s === 1),
  S.brand("SqliteBoolean"),
);
export type SqliteBoolean = S.Schema.To<typeof SqliteBoolean>;

/**
 * A helper for casting types not supported by SQLite. SQLite doesn't support
 * Date nor Boolean types, so Evolu emulates them with {@link SqliteBoolean} and
 * {@link SqliteDate}.
 *
 * ### Example
 *
 * ```ts
 * const allTodosNotDeleted = evolu.createQuery((db) =>
 *   db
 *     .selectFrom("todo")
 *     .selectAll()
 *     // isDeleted is SqliteBoolean
 *     .where("isDeleted", "is not", Evolu.cast(true)),
 * );
 * ```
 */
export function cast(value: boolean): SqliteBoolean;
export function cast(value: SqliteBoolean): boolean;
export function cast(value: Date): SqliteDate;
export function cast(value: SqliteDate): Date;
export function cast(
  value: boolean | SqliteBoolean | Date | SqliteDate,
): boolean | SqliteBoolean | Date | SqliteDate {
  if (typeof value === "boolean")
    return (value === true ? 1 : 0) as SqliteBoolean;
  if (typeof value === "number") return value === 1;
  if (value instanceof Date) return value.toISOString() as SqliteDate;
  return new Date(value);
}

/**
 * String schema represents a string that is not stringified JSON. Using String
 * schema for strings stored in SQLite is crucial to ensure a stored string is
 * not automatically parsed to a JSON object or array when retrieved. Use String
 * schema for all string-based schemas.
 */
export const String = S.string.pipe(
  S.filter(
    (s) => {
      if (!maybeJson(s)) return true;
      try {
        JSON.parse(s);
      } catch (e) {
        return true;
      }
      return false;
    },
    { message: () => "a string that is not stringified JSON" },
  ),
  S.brand("String"),
);
export type String = S.Schema.To<typeof String>;

/**
 * A string with a maximum length of 1000 characters.
 *
 * ### Example
 *
 * ```ts
 * import * as S from "@effect/schema/Schema";
 * import * as Evolu from "@evolu/react";
 *
 * S.parse(Evolu.String1000)(value);
 * ```
 */
export const String1000 = String.pipe(S.maxLength(1000), S.brand("String1000"));
export type String1000 = S.Schema.To<typeof String1000>;

/**
 * A nonempty string with a maximum length of 1000 characters.
 *
 * ### Example
 *
 * ```ts
 * import * as S from "@effect/schema/Schema";
 * import * as Evolu from "@evolu/react";
 *
 * S.parse(Evolu.NonEmptyString1000)(value);
 * ```
 */
export const NonEmptyString1000 = String.pipe(
  S.minLength(1),
  S.maxLength(1000),
  S.brand("NonEmptyString1000"),
);
export type NonEmptyString1000 = S.Schema.To<typeof NonEmptyString1000>;

/**
 * A positive integer.
 *
 * ### Example
 *
 * ```ts
 * import * as S from "@effect/schema/Schema";
 * import * as Evolu from "@evolu/react";
 *
 * S.parse(Evolu.PositiveInt)(value);
 * ```
 */
export const PositiveInt = S.number.pipe(
  S.int(),
  S.positive(),
  S.brand("PositiveInt"),
);
export type PositiveInt = S.Schema.To<typeof PositiveInt>;