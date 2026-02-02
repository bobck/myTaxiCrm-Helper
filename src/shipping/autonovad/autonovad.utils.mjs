export const AUTONOVAD_BASE_URL_DEV = 'https://api.autonovad.ua/dev';
export const AUTONOVAD_BASE_URL_STABLE = 'https://api.autonovad.ua/stable';

export function getAutonovadBaseUrl() {
  return (
    process.env.AUTONOVAD_API_BASE_URL ||
    AUTONOVAD_BASE_URL_DEV
  );
}

export function isAuthError(status) {
  return status === 401 || status === 403;
}
