import { authorizeAPIClient } from '../../api.utils.mjs';
import { api_status_codes } from '../../api.constants.mjs';
const { OK: SUCCESS_AUTH } = api_status_codes;
export const authorizationMiddleware = (req, res, next) => {
  const { api_key } = req.query;
  const { code, status, message } = authorizeAPIClient({ api_key });

  if (code !== SUCCESS_AUTH) {
    console.log(`failed authorization under api key ${api_key}`);
    res.status(code).json({ status, message });
    return;
  }
  // console.log(`successful authorization under api key ${api_key}`);
  next();
};
export const loggerMiddleware = (req, res, next) => {
  console.log({
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
  });
  next();
};
