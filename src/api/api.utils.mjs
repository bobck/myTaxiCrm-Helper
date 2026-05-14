import { api_status_codes } from './api.constants.mjs';

const {
  OK: SUCCESS_AUTH,
  BAD_REQUEST,
  MISSING_API_KEY,
  INTERNAL_SERVER_ERROR,
} = api_status_codes;
export const controllerWrapper = ({
  handlerCB,
  handlingServiceName,
  errorHandler,
}) => {
  return async (req, res) => {
    try {
      await handlerCB(req, res);
    } catch (error) {
      console.error({
        message: `error occured in ${handlingServiceName}`,
        date: new Date(),
        error,
      });
      const { code, message } = error;
      if (error instanceof Error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ message: 'Internal Server Error', status: 'error' });
        return;
      }

      if (errorHandler) {
        await errorHandler(error);
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ message: 'Internal Server Error', status: 'error' });
        return;
      }

      res.status(code).json({ message, status: 'error' });
    }
  };
};
export const authorizeAPIClient = ({ api_key }) => {
  let auth_result;
  if (api_key === null || api_key === undefined) {
    auth_result = {
      code: MISSING_API_KEY,
      status: 'error',
      message:
        'unauthorized request attemption. Please pass the api_key query parameter',
    };
  } else if (api_key !== process.env.MYTAXICRM_HELPER_API_KEY) {
    auth_result = {
      code: BAD_REQUEST,
      status: 'error',
      message: 'wrong api_key',
    };
  } else {
    auth_result = {
      code: SUCCESS_AUTH,
      status: 'ok',
      message: 'successfull authorization',
    };
  }
  return auth_result;
};
