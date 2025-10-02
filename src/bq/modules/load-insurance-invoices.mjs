import { cityListWithAssignedBy } from '../../bitrix/bitrix.constants.mjs';
import { getInsuranceInvoices } from '../../bitrix/bitrix.utils.mjs';
import { devLog } from '../../shared/shared.utils.mjs';
import { createOrResetTableByName, loadRowsViaJSONFile } from '../bq-utils.mjs';
import { insuranceInvoicesTableSchema } from '../schemas.mjs';

const insuranceInvoiceBegginingDate = '2025-08-01';

export async function resetInsuranceInvoicesTable() {
  await createOrResetTableByName({
    bqTableId: 'insurance_invoices',
    schema: insuranceInvoicesTableSchema,
    dataSetId: 'Bitrix',
  });
}

export const loadInsuranceInvoices = async () => {
  const logData = {
    message: 'loadInsuranceInvoices',
    date: new Date(),
  };
  let invoices;
  try {
    invoices = await getInsuranceInvoices({
      date: insuranceInvoiceBegginingDate,
    });
  } catch (error) {
    console.error({
      logData,
      error,
      summary: 'Failed invoice fetching from Bitrix',
    });
    return;
  }

  const processedInvoices = invoices.map((invoice) => {
    const bitrixCity = cityListWithAssignedBy.find(
      (city) => city.cityId == invoice['UF_CRM_1527615815']
    );
    return {
      id: Number(invoice['ID']),
      payment_date: invoice['UF_CRM_1642522045721'].slice(0, 10),
      created_at: invoice['DATE_CREATE'].slice(0, 10),
      sum: Number(invoice['UF_CRM_1654075469']),
      auto_park_id: bitrixCity ? bitrixCity.auto_park_id : null,
      auto_park_name: bitrixCity ? bitrixCity.cityName : null,
    };
  });
  devLog({ processedInvoices });

  try {
    await loadRowsViaJSONFile({
      dataset_id: 'Bitrix',
      table_id: 'insurance_invoices',
      rows: processedInvoices,
      schema: insuranceInvoicesTableSchema,
    });
    logData.processedInvoices = processedInvoices.length;
  } catch (error) {
    console.error({
      logData,
      error,
      summary: 'Failed invoice loading up to Big Query',
    });
    return;
  }
  console.log(logData);
};

if (process.env.ENV == 'TEST') {
  await resetInsuranceInvoicesTable();
  loadInsuranceInvoices();
}
