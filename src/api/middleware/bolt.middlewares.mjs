import { authorizeAPIClient } from '../endpoints-utils.mjs';
import { api_status_codes } from '../api.constants.mjs';
const { SUCCESS_AUTH, BAD_REQUEST, MISSING_API_KEY } = api_status_codes;
export const boltAuthorizationMiddleware = (req, res, next) => {
  console.log('This middleware is specific to specialRouter');
  const { api_key } = req.query;
  const { code, status, message } = authorizeAPIClient({ api_key });

  if (code !== SUCCESS_AUTH) {
    res.status(code).json({ status, message });
    return;
  }
  next();
};
