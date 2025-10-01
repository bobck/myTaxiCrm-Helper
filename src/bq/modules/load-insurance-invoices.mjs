import { cityListWithAssignedBy } from '../../bitrix/bitrix.constants.mjs';
import { getInsuranceInvoices } from '../../bitrix/bitrix.utils.mjs';

export const loadInsuranceInvoices = async () => {
  const logData = {
    message: 'loadInsuranceInvoices',
    date: new Date(),
  };

  const invoices = await getInsuranceInvoices({ date: '2025-08-01' });
  const processedInvoices = invoices.map((invoice) => {
    const bitrixCity = cityListWithAssignedBy.find(
      (city) => city.cityId == invoice['UF_CRM_1527615815']
    );
    return {
      id: invoice['ID'],
      date: invoice['UF_CRM_1642522045721'],
      created_at: invoice['DATE_CREATE'],
      sum: invoice['UF_CRM_1654075469'],
      auto_park_id: bitrixCity ? bitrixCity.auto_park_id : null,
    };
  });
  console.log({ processedInvoices });

  console.log(logData);
};

if (process.env.ENV == 'TEST') {
  loadInsuranceInvoices();
}
