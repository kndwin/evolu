/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/no-let */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-loop-statement */

import { Patch, ReplaceAtPatch, SQLiteRowRecord } from "./types";

// For now, we detect only a change in the whole result and in-place edits.
// In the future, we will add more heuristics. We will probably not implement
// the Myers diff algorithm because it's faster to rerender all than
// to compute many detailed patches. We will only implement a logic
// a developer would implement manually, if necessary.
export const createPatches = (
  previous: readonly SQLiteRowRecord[] | undefined,
  next: readonly SQLiteRowRecord[]
): readonly Patch[] => {
  if (previous === undefined) return [{ op: "replaceAll", value: next }];
  if (previous.length === 0 && next.length === 0) return [];
  if (previous.length !== next.length)
    return [{ op: "replaceAll", value: next }];

  const replaceAtOps: ReplaceAtPatch[] = [];

  for (let i = 0; i < previous.length; i++) {
    const pItem = previous[i];
    const nItem = next[i];
    for (const key in pItem) {
      if (pItem[key] !== nItem[key]) {
        replaceAtOps.push({ op: "replaceAt", value: nItem, index: i });
        break;
      }
    }
  }

  if (replaceAtOps.length === 0) return [];
  if (replaceAtOps.length === previous.length)
    return [{ op: "replaceAll", value: next }];

  return replaceAtOps;
};

export const applyPatches =
  (patches: readonly Patch[]) =>
  (
    current: readonly SQLiteRowRecord[] | undefined
  ): readonly SQLiteRowRecord[] | undefined =>
    patches.reduce((a, patch) => {
      switch (patch.op) {
        case "replaceAll":
          return patch.value;
        case "replaceAt": {
          if (a === undefined) return a;
          const next = [...a];
          // eslint-disable-next-line functional/immutable-data
          next[patch.index] = patch.value;
          return next;
        }
        case "purge":
          return undefined;
      }
    }, current);
