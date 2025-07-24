export function devLog(...args) {
  if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
    console.log(...args);
  }
}
