import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  generatePolandBookkeepingReport,
  clearTableByWeekAndYearAndAutoParkId,
  loadJsonToTable,
  createOrResetTableByName,
} from '../bq-utils.mjs';
import { polandBookkeepingReportTableSchema } from '../schemas.mjs';
import { DateTime } from 'luxon';

const bqTableId = 'poland_bookkeeping';

const accountNumbers = [
  {
    ownerName: 'Planet of Cars',
    ownerId: '9a61d72b-23df-4edb-9617-df46916a9799',
    accountNumber: '21 1020 1185 0000 4102 0330 3666',
  },
  {
    ownerName: 'Auto Świat',
    ownerId: '369a4630-080d-4761-b5cb-10cf56b83035',
    accountNumber: '72 1020 1185 0000 4802 0379 7396',
  },
];

const modelPrices = [
  {
    autoParkId: 'de4bf8ba-30c2-452c-a688-104063052961',
    autoParkName: 'Warsaw',
    modelPrices: [
      {
        modelId: 'aab580c5-478b-4777-a586-ae6a0b6e0c2d',
        price: 350,
      },
      {
        modelId: 'eecf951d-5876-4645-8057-2dd9921a50f6',
        price: 350,
      },
      {
        modelId: '7fec2de9-f6d8-4fa0-905e-24ba5d536741',
        price: 350,
      },
      {
        modelId: '12ca3c60-9697-4368-8d5e-891a1f2f22c3',
        price: 450,
      },
      {
        modelId: 'bb255f3c-eb36-497a-9f34-d47135bfe99d',
        price: 300,
      },
      {
        modelId: 'c233743e-d445-4db4-be2b-fe9d47b0555c',
        price: 400,
      },
      {
        modelId: 'ddac496c-8ae8-4911-bf4a-c882c23572c6',
        price: 300,
      },
      {
        modelId: 'c40bd141-bb74-4db3-8b71-af806bc8af26',
        price: 350,
      },
      {
        modelId: '36c039b2-27eb-463d-9579-ff285c14dd86',
        price: 350,
      },
      {
        modelId: '4a0720ad-943f-487c-b3c8-ddc7d913d93a',
        price: 400,
      },
      {
        modelId: '2cb35d95-63c0-46e3-b192-705d792b3bb2',
        price: 350,
      },
      {
        modelId: '2e0a41e8-eda5-4ce2-9d85-96c1c62ebd5f',
        price: 400,
      },
      {
        modelId: 'e4057ffd-7ebc-4dfb-8666-88af50d84554',
        price: 450,
      },
      {
        modelId: 'bb908a00-5d51-46a6-bf18-5dfeab6cf21b',
        price: 450,
      },
      {
        modelId: '6c50c99f-de09-4fc8-b989-83f3475ae5de',
        price: 450,
      },
      {
        modelId: '772116f2-ff35-4b7f-9b98-40fe18264896',
        price: 400,
      },
      {
        modelId: '4ca92c4c-3d99-4c1f-b653-52444813a3dd',
        price: 450,
      },
      {
        modelId: '89707902-7b4c-4c6c-8067-0ae7cd548d7f',
        price: 450,
      },
      {
        modelId: '3f0672d0-cbc7-481f-a94d-e473730cda59',
        price: 400,
      },
      {
        modelId: '0e1a5449-3f84-40e9-975a-3b3a86550f79',
        price: 450,
      },
      {
        modelId: '3114d264-299e-4863-a3d0-aa03e09d4452',
        price: 450,
      },
    ],
  },
  {
    autoParkId: 'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b',
    autoParkName: 'Kraków',
    modelPrices: [
      {
        modelId: 'ed7f1ad6-4508-4603-8843-e9827f28a2dd',
        price: 400,
      },
      {
        modelId: 'aab580c5-478b-4777-a586-ae6a0b6e0c2d',
        price: 300,
      },
      {
        modelId: 'eecf951d-5876-4645-8057-2dd9921a50f6',
        price: 300,
      },
      {
        modelId: '7fec2de9-f6d8-4fa0-905e-24ba5d536741',
        price: 300,
      },
      {
        modelId: '12ca3c60-9697-4368-8d5e-891a1f2f22c3',
        price: 400,
      },
      {
        modelId: 'bb255f3c-eb36-497a-9f34-d47135bfe99d',
        price: 250,
      },
      {
        modelId: 'c233743e-d445-4db4-be2b-fe9d47b0555c',
        price: 350,
      },
      {
        modelId: 'ddac496c-8ae8-4911-bf4a-c882c23572c6',
        price: 250,
      },
      {
        modelId: 'c40bd141-bb74-4db3-8b71-af806bc8af26',
        price: 300,
      },
      {
        modelId: '36c039b2-27eb-463d-9579-ff285c14dd86',
        price: 300,
      },
      {
        modelId: '4a0720ad-943f-487c-b3c8-ddc7d913d93a',
        price: 350,
      },
      {
        modelId: '2cb35d95-63c0-46e3-b192-705d792b3bb2',
        price: 300,
      },
      {
        modelId: '2e0a41e8-eda5-4ce2-9d85-96c1c62ebd5f',
        price: 350,
      },
      {
        modelId: 'e4057ffd-7ebc-4dfb-8666-88af50d84554',
        price: 400,
      },
      {
        modelId: 'bb908a00-5d51-46a6-bf18-5dfeab6cf21b',
        price: 400,
      },
      {
        modelId: '6c50c99f-de09-4fc8-b989-83f3475ae5de',
        price: 400,
      },
      {
        modelId: '772116f2-ff35-4b7f-9b98-40fe18264896',
        price: 350,
      },
      {
        modelId: '4ca92c4c-3d99-4c1f-b653-52444813a3dd',
        price: 400,
      },
      {
        modelId: '89707902-7b4c-4c6c-8067-0ae7cd548d7f',
        price: 400,
      },
      {
        modelId: '3f0672d0-cbc7-481f-a94d-e473730cda59',
        price: 400,
      },
      {
        modelId: '0e1a5449-3f84-40e9-975a-3b3a86550f79',
        price: 400,
      },
      {
        modelId: '3114d264-299e-4863-a3d0-aa03e09d4452',
        price: 400,
      },
    ],
  },
];

export async function generateAndSavePolandBookkeepingReport({ autoParkId }) {
  const pastWeek = DateTime.now().setZone('Europe/Warsaw').minus({ days: 2 });
  const periodFrom = pastWeek.startOf('week').toFormat('yyyy-MM-dd');
  const periodTo = pastWeek.endOf('week').toFormat('yyyy-MM-dd');
  const year = pastWeek.year;
  const week = pastWeek.weekNumber;

  console.log({
    time: new Date(),
    periodFrom,
    periodTo,
    year,
    week,
    autoParkId,
    message: 'generateAndSavePolandBookkeepingReport',
  });

  await clearTableByWeekAndYearAndAutoParkId({
    bqTableId,
    year,
    week,
    autoParkId,
  });
  const { rows } = await generatePolandBookkeepingReport({
    periodFrom,
    periodTo,
    autoParkId,
  });

  if (rows.length == 0) {
    return;
  }
  const jsonData = rows.map((row) => {
    const { owner_id, model_id, bill_days } = row;

    const [accountNumber] = accountNumbers.filter((c) => c.ownerId == owner_id);
    const [autoParkModelPrices] = modelPrices.filter(
      (a) => a.autoParkId == autoParkId
    );

    const [priceRow] = autoParkModelPrices.modelPrices.filter(
      (m) => m.modelId == model_id
    );
    const kwota = Math.round((priceRow.price / 7) * bill_days, 0);
    return {
      ...row,
      owner_account_number: accountNumber.accountNumber,
      model_price: priceRow.price,
      kwota,
      period_from: periodFrom,
      period_to: periodTo,
      year,
      week,
    };
  });

  const tempFilePath = path.join(
    os.tmpdir(),
    `temp_data_poland_bookkeeping_report_${autoParkId}.json`
  );
  const jsonString = jsonData.map(JSON.stringify).join('\n');
  fs.writeFileSync(tempFilePath, jsonString);

  await loadJsonToTable({
    json: tempFilePath,
    bqTableId,
    schema: polandBookkeepingReportTableSchema,
  });
  fs.unlinkSync(tempFilePath);
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: polandBookkeepingReportTableSchema })
  generateAndSavePolandBookkeepingReport({
    autoParkId: 'de4bf8ba-30c2-452c-a688-104063052961',
  });
  generateAndSavePolandBookkeepingReport({
    autoParkId: 'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b',
  });
}
