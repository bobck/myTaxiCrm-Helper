export function devLog(...args) {
  if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
    console.log(...args);
  }
}

export function isUuid(str) {
  if (typeof str !== 'string' || str.length === 0) {
    return false;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(str);
}

/**
 * Calculates the difference between two sets, returning the unique elements from each.
 *
 * This function computes two new sets:
 * 1. Elements that exist in the first set but not in the second.
 * 2. Elements that exist in the second set but not in the first.
 *
 * @param {Set} setA The first set.
 * @param {Set} setB The second set.
 * @returns {[Set, Set]} An array containing two sets: [differenceA, differenceB].
 */
export function getSetDifferences(setA, setB) {
  const differenceA = new Set();
  const differenceB = new Set();

  for (const elem of setA) {
    if (!setB.has(elem)) {
      differenceA.add(elem);
    }
  }

  for (const elem of setB) {
    if (!setA.has(elem)) {
      differenceB.add(elem);
    }
  }

  return [differenceB, differenceA];
}

const cyrillicToLatinMap = {
  А: 'A',
  а: 'a',
  В: 'B',
  в: 'b',
  Е: 'E',
  е: 'e',
  К: 'K',
  к: 'k',
  М: 'M',
  м: 'm',
  Н: 'H',
  н: 'h',
  О: 'O',
  о: 'o',
  Р: 'P',
  р: 'p',
  С: 'C',
  с: 'c',
  Т: 'T',
  т: 't',
  Х: 'X',
  х: 'x',
  І: 'I',
  і: 'i',
  И: 'I',
  и: 'i',
};

export function transliterateLicensePlate(text) {
  if (!text) return text;
  return text
    .split('')
    .map((char) => cyrillicToLatinMap[char] ?? char)
    .join('');
}

/**
 * Parse an ISO-8601 string (or unix-ms timestamp) into a `Date`. Returns null
 * for empty/invalid input. Date-only `"YYYY-MM-DD"` is padded to UTC midnight
 * so it round-trips through both BQ `TIMESTAMP` and Postgres `TIMESTAMP` types.
 */
export function isoOrNull(value) {
  if (!value) return null;
  if (!Number.isFinite(Date.parse(value))) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00Z`);
  return new Date(value);
}

/**
 * Coerce to finite Number or null. Accepts numeric strings (eg. `"217.80"`).
 */
export function toFloat(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Stringify an object/array as JSON, or return null for empty/missing values.
 * Empty objects (`{}`) and empty arrays (`[]`) collapse to null so downstream
 * consumers can rely on `IS NULL` instead of parsing empty containers.
 */
export function jsonOrNull(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return JSON.stringify(value);
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) return null;
  return JSON.stringify(value);
}
