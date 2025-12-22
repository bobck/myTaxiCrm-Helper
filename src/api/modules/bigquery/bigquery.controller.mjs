import { loadRemonlineOrderProductPricesToBQ } from '../../../bq/modules/load-remonline-order-product-prices.mjs';
import { api_status_codes } from '../../api.constants.mjs';
import { controllerWrapper } from '../../api.utils.mjs';

const { OK } = api_status_codes;

export const forceUpdateRemonlineOrderProductPrices = controllerWrapper({
  handlerCB: async (req, res) => {
    await loadRemonlineOrderProductPricesToBQ();
    return res.status(OK).json({ message: 'loaded' });
  },
  handlingServiceName: 'forceUpdateRemonlineOrderProductPrices',
});
