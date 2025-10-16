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
  В: 'B',
  Е: 'E',
  К: 'K',
  М: 'M',
  Н: 'H',
  О: 'O',
  Р: 'P',
  С: 'C',
  Т: 'T',
  Х: 'X',
};
export function parseCyrillicToLatinChars(str) {
  const s = String(str);
  return s
    .split('')
    .map((char) =>
      cyrillicToLatinMap[char] ? cyrillicToLatinMap[char] : char
    );
}
