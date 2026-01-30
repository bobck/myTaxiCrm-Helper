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
  {
    ownerName: 'STALVERO',
    ownerId: '8b9125a0-df02-4f74-a21c-145995b29b6f',
    accountNumber: '83 1020 1185 0000 4502 0425 6640',
  },
];

const modelPrices = [
  {
    autoParkId: 'de4bf8ba-30c2-452c-a688-104063052961',
    autoParkName: 'Warsaw',
    modelPrices: [
      { modelId: 'aab580c5-478b-4777-a586-ae6a0b6e0c2d', price: 350 },
      { modelId: 'eecf951d-5876-4645-8057-2dd9921a50f6', price: 350 },
      { modelId: '7fec2de9-f6d8-4fa0-905e-24ba5d536741', price: 350 },
      { modelId: '12ca3c60-9697-4368-8d5e-891a1f2f22c3', price: 450 },
      { modelId: 'bb255f3c-eb36-497a-9f34-d47135bfe99d', price: 300 },
      { modelId: 'c233743e-d445-4db4-be2b-fe9d47b0555c', price: 400 },
      { modelId: 'ddac496c-8ae8-4911-bf4a-c882c23572c6', price: 300 },
      { modelId: 'c40bd141-bb74-4db3-8b71-af806bc8af26', price: 350 },
      { modelId: '36c039b2-27eb-463d-9579-ff285c14dd86', price: 350 },
      { modelId: '4a0720ad-943f-487c-b3c8-ddc7d913d93a', price: 400 },
      { modelId: '2cb35d95-63c0-46e3-b192-705d792b3bb2', price: 350 },
      { modelId: '2e0a41e8-eda5-4ce2-9d85-96c1c62ebd5f', price: 400 },
      { modelId: 'e4057ffd-7ebc-4dfb-8666-88af50d84554', price: 450 },
      { modelId: 'bb908a00-5d51-46a6-bf18-5dfeab6cf21b', price: 450 },
      { modelId: '6c50c99f-de09-4fc8-b989-83f3475ae5de', price: 450 },
      { modelId: '772116f2-ff35-4b7f-9b98-40fe18264896', price: 400 },
      { modelId: '4ca92c4c-3d99-4c1f-b653-52444813a3dd', price: 450 },
      { modelId: '89707902-7b4c-4c6c-8067-0ae7cd548d7f', price: 450 },
      { modelId: '3f0672d0-cbc7-481f-a94d-e473730cda59', price: 400 },
      { modelId: '0e1a5449-3f84-40e9-975a-3b3a86550f79', price: 450 },
      { modelId: '3114d264-299e-4863-a3d0-aa03e09d4452', price: 450 },
    ],
  },
  {
    autoParkId: 'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b',
    autoParkName: 'Kraków',
    modelPrices: [
      { modelId: 'ed7f1ad6-4508-4603-8843-e9827f28a2dd', price: 400 },
      { modelId: 'aab580c5-478b-4777-a586-ae6a0b6e0c2d', price: 300 },
      { modelId: 'eecf951d-5876-4645-8057-2dd9921a50f6', price: 300 },
      { modelId: '7fec2de9-f6d8-4fa0-905e-24ba5d536741', price: 300 },
      { modelId: '12ca3c60-9697-4368-8d5e-891a1f2f22c3', price: 400 },
      { modelId: 'bb255f3c-eb36-497a-9f34-d47135bfe99d', price: 250 },
      { modelId: 'c233743e-d445-4db4-be2b-fe9d47b0555c', price: 350 },
      { modelId: 'ddac496c-8ae8-4911-bf4a-c882c23572c6', price: 250 },
      { modelId: 'c40bd141-bb74-4db3-8b71-af806bc8af26', price: 300 },
      { modelId: '36c039b2-27eb-463d-9579-ff285c14dd86', price: 300 },
      { modelId: '4a0720ad-943f-487c-b3c8-ddc7d913d93a', price: 350 },
      { modelId: '2cb35d95-63c0-46e3-b192-705d792b3bb2', price: 300 },
      { modelId: '2e0a41e8-eda5-4ce2-9d85-96c1c62ebd5f', price: 350 },
      { modelId: 'e4057ffd-7ebc-4dfb-8666-88af50d84554', price: 400 },
      { modelId: 'bb908a00-5d51-46a6-bf18-5dfeab6cf21b', price: 400 },
      { modelId: '6c50c99f-de09-4fc8-b989-83f3475ae5de', price: 400 },
      { modelId: '772116f2-ff35-4b7f-9b98-40fe18264896', price: 350 },
      { modelId: '4ca92c4c-3d99-4c1f-b653-52444813a3dd', price: 400 },
      { modelId: '89707902-7b4c-4c6c-8067-0ae7cd548d7f', price: 400 },
      { modelId: '3f0672d0-cbc7-481f-a94d-e473730cda59', price: 400 },
      { modelId: '0e1a5449-3f84-40e9-975a-3b3a86550f79', price: 400 },
      { modelId: '3114d264-299e-4863-a3d0-aa03e09d4452', price: 400 },
    ],
  },
  {
    autoParkId: '58ea1e9e-ebdd-4c4d-870c-6ef06e868c60',
    autoParkName: 'Warsaw 2',
    modelPrices: [
      { modelId: 'aab580c5-478b-4777-a586-ae6a0b6e0c2d', price: 350 },
      { modelId: 'eecf951d-5876-4645-8057-2dd9921a50f6', price: 350 },
      { modelId: '7fec2de9-f6d8-4fa0-905e-24ba5d536741', price: 350 },
      { modelId: '12ca3c60-9697-4368-8d5e-891a1f2f22c3', price: 450 },
      { modelId: 'bb255f3c-eb36-497a-9f34-d47135bfe99d', price: 300 },
      { modelId: 'c233743e-d445-4db4-be2b-fe9d47b0555c', price: 400 },
      { modelId: 'ddac496c-8ae8-4911-bf4a-c882c23572c6', price: 300 },
      { modelId: 'c40bd141-bb74-4db3-8b71-af806bc8af26', price: 350 },
      { modelId: '36c039b2-27eb-463d-9579-ff285c14dd86', price: 350 },
      { modelId: '4a0720ad-943f-487c-b3c8-ddc7d913d93a', price: 400 },
      { modelId: '2cb35d95-63c0-46e3-b192-705d792b3bb2', price: 350 },
      { modelId: '2e0a41e8-eda5-4ce2-9d85-96c1c62ebd5f', price: 400 },
      { modelId: 'e4057ffd-7ebc-4dfb-8666-88af50d84554', price: 450 },
      { modelId: 'bb908a00-5d51-46a6-bf18-5dfeab6cf21b', price: 450 },
      { modelId: '6c50c99f-de09-4fc8-b989-83f3475ae5de', price: 450 },
      { modelId: '772116f2-ff35-4b7f-9b98-40fe18264896', price: 400 },
      { modelId: '4ca92c4c-3d99-4c1f-b653-52444813a3dd', price: 450 },
      { modelId: '89707902-7b4c-4c6c-8067-0ae7cd548d7f', price: 450 },
      { modelId: '3f0672d0-cbc7-481f-a94d-e473730cda59', price: 400 },
      { modelId: '0e1a5449-3f84-40e9-975a-3b3a86550f79', price: 450 },
      { modelId: '3114d264-299e-4863-a3d0-aa03e09d4452', price: 450 },
    ],
  },
  {
    autoParkId: '21b543d1-a14a-43c6-a719-5becbd25a4e3',
    autoParkName: 'Łódź',
    modelPrices: [
      { modelId: 'ed7f1ad6-4508-4603-8843-e9827f28a2dd', price: 400 },
      { modelId: 'aab580c5-478b-4777-a586-ae6a0b6e0c2d', price: 300 },
      { modelId: 'eecf951d-5876-4645-8057-2dd9921a50f6', price: 300 },
      { modelId: '7fec2de9-f6d8-4fa0-905e-24ba5d536741', price: 300 },
      { modelId: '12ca3c60-9697-4368-8d5e-891a1f2f22c3', price: 400 },
      { modelId: 'bb255f3c-eb36-497a-9f34-d47135bfe99d', price: 250 },
      { modelId: 'c233743e-d445-4db4-be2b-fe9d47b0555c', price: 350 },
      { modelId: 'ddac496c-8ae8-4911-bf4a-c882c23572c6', price: 250 },
      { modelId: 'c40bd141-bb74-4db3-8b71-af806bc8af26', price: 300 },
      { modelId: '36c039b2-27eb-463d-9579-ff285c14dd86', price: 300 },
      { modelId: '4a0720ad-943f-487c-b3c8-ddc7d913d93a', price: 350 },
      { modelId: '2cb35d95-63c0-46e3-b192-705d792b3bb2', price: 300 },
      { modelId: '2e0a41e8-eda5-4ce2-9d85-96c1c62ebd5f', price: 350 },
      { modelId: 'e4057ffd-7ebc-4dfb-8666-88af50d84554', price: 400 },
      { modelId: 'bb908a00-5d51-46a6-bf18-5dfeab6cf21b', price: 400 },
      { modelId: '6c50c99f-de09-4fc8-b989-83f3475ae5de', price: 400 },
      { modelId: '772116f2-ff35-4b7f-9b98-40fe18264896', price: 350 },
      { modelId: '4ca92c4c-3d99-4c1f-b653-52444813a3dd', price: 400 },
      { modelId: '89707902-7b4c-4c6c-8067-0ae7cd548d7f', price: 400 },
      { modelId: '3f0672d0-cbc7-481f-a94d-e473730cda59', price: 400 },
      { modelId: '0e1a5449-3f84-40e9-975a-3b3a86550f79', price: 400 },
      { modelId: '3114d264-299e-4863-a3d0-aa03e09d4452', price: 400 },
    ],
  },
  {
    autoParkId: '444afd80-52d5-4c87-b02a-c43db8982bef',
    autoParkName: 'Katowice',
    modelPrices: [
      { modelId: 'ed7f1ad6-4508-4603-8843-e9827f28a2dd', price: 400 },
      { modelId: 'aab580c5-478b-4777-a586-ae6a0b6e0c2d', price: 300 },
      { modelId: 'eecf951d-5876-4645-8057-2dd9921a50f6', price: 300 },
      { modelId: '7fec2de9-f6d8-4fa0-905e-24ba5d536741', price: 300 },
      { modelId: '12ca3c60-9697-4368-8d5e-891a1f2f22c3', price: 400 },
      { modelId: 'bb255f3c-eb36-497a-9f34-d47135bfe99d', price: 250 },
      { modelId: 'c233743e-d445-4db4-be2b-fe9d47b0555c', price: 350 },
      { modelId: 'ddac496c-8ae8-4911-bf4a-c882c23572c6', price: 250 },
      { modelId: 'c40bd141-bb74-4db3-8b71-af806bc8af26', price: 300 },
      { modelId: '36c039b2-27eb-463d-9579-ff285c14dd86', price: 300 },
      { modelId: '4a0720ad-943f-487c-b3c8-ddc7d913d93a', price: 350 },
      { modelId: '2cb35d95-63c0-46e3-b192-705d792b3bb2', price: 300 },
      { modelId: '2e0a41e8-eda5-4ce2-9d85-96c1c62ebd5f', price: 350 },
      { modelId: 'e4057ffd-7ebc-4dfb-8666-88af50d84554', price: 400 },
      { modelId: 'bb908a00-5d51-46a6-bf18-5dfeab6cf21b', price: 400 },
      { modelId: '6c50c99f-de09-4fc8-b989-83f3475ae5de', price: 400 },
      { modelId: '772116f2-ff35-4b7f-9b98-40fe18264896', price: 350 },
      { modelId: '4ca92c4c-3d99-4c1f-b653-52444813a3dd', price: 400 },
      { modelId: '89707902-7b4c-4c6c-8067-0ae7cd548d7f', price: 400 },
      { modelId: '3f0672d0-cbc7-481f-a94d-e473730cda59', price: 400 },
      { modelId: '0e1a5449-3f84-40e9-975a-3b3a86550f79', price: 400 },
      { modelId: '3114d264-299e-4863-a3d0-aa03e09d4452', price: 400 },
    ],
  },
];

const fakeDatesMap = new Map([
  ['fd6afdb0-a00e-4bbd-9e61-0a1e771dde90', '2026-01-09'],
  ['357d344b-9943-4787-b28c-b5f9522c3ad8', '2026-01-09'],
  ['a5cc9a02-d155-4cfc-980d-04104600e4a0', '2026-01-09'],
  ['82c61900-5c43-4d5f-bd11-eb6052fa2cd0', '2026-01-09'],
  ['5723d6f2-7d58-4f7a-91b1-24445de88acc', '2026-01-09'],
  ['47e031a3-ea0a-46a7-9d49-fd9ebbf31c44', '2026-01-09'],
  ['47e031a3-ea0a-46a7-9d49-fd9ebbf31c44', '2026-01-09'],
  ['51ae81f6-bae9-4e5b-8b6e-a9788c67e2a4', '2026-01-10'],
  ['742f5d59-b631-41a6-9368-eef6225a55f3', '2026-01-09'],
  ['bcd426bc-6f9e-4a5d-9303-ca26d15ca35b', '2026-01-09'],
  ['50f44b58-b7c3-4553-aaef-023516864922', '2026-01-09'],
  ['010be42b-372e-4bb1-90b9-e0dc1be2f10d', '2026-01-09'],
  ['010be42b-372e-4bb1-90b9-e0dc1be2f10d', '2026-01-09'],
  ['4e42abe1-e862-4616-99d5-bea775b3e172', '2026-01-08'],
  ['f4b14f69-8581-44d1-ad21-3b44ba715206', '2026-01-08'],
  ['7d37172a-d6f7-4dde-a2af-4d8db0d04526', '2026-01-08'],
  ['0f6870d1-3e68-43fe-bdd6-fffc166a60b6', '2026-01-08'],
  ['f1220ba6-1a19-4995-b6c1-96abe4a21264', '2026-01-09'],
  ['586791ce-26a6-43a5-b5f5-4942710f0948', '2026-01-08'],
  ['c2d304f3-bf34-4dc4-8fd7-f8dd5778f520', '2026-01-08'],
  ['ff069e24-a45f-43a5-a919-ceffd40456b8', '2026-01-10'],
  ['79cbe538-10d8-468c-b89b-2e15dc6fa487', '2026-01-09'],
  ['b775bed9-afae-4fe0-a7b5-55183f7234c4', '2026-01-08'],
  ['bc390195-066a-4275-99da-570fa3383a39', '2026-01-08'],
  ['35381fce-4ac8-44a9-ae58-e2d9f85b9df1', '2026-01-08'],
]);

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

  try {
    const jsonData = rows.map((row) => {
      const {
        license_plate,
        car_id,
        driver_name,
        bill_period_start,
        bill_period_end,
        bill_days,
        auto_park_name,
        auto_park_id,
        model_id,
        owner_id,
        car_owner_name,
        owner_account_number,
      } = row;

      let { car_contract_start_date } = row;

      if (!owner_id) {
        throw {
          message: 'Missed owner_id',
          bill_days,
          license_plate: row?.license_plate,
        };
      }

      const [accountNumber] = accountNumbers.filter(
        (c) => c.ownerId == owner_id
      );

      const [autoParkModelPrices] = modelPrices.filter(
        (a) => a.autoParkId == autoParkId
      );

      const [priceRow] = autoParkModelPrices.modelPrices.filter(
        (m) => m.modelId == model_id
      );
      const kwota = Math.round((priceRow.price / 7) * bill_days, 0);

      const fake_car_contract_start_date = fakeDatesMap.get(car_id);

      if (fake_car_contract_start_date) {
        const originalDate = new Date(car_contract_start_date);
        const fakeDate = new Date(fake_car_contract_start_date);

        if (originalDate < fakeDate) {
          car_contract_start_date = fake_car_contract_start_date;
        }
      }

      return {
        license_plate,
        driver_name,
        bill_period_start,
        bill_period_end,
        bill_days,
        car_contract_start_date,
        auto_park_name,
        auto_park_id,
        model_id,
        car_owner_name,
        owner_account_number,
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
  } catch (e) {
    console.error({
      e,
      autoParkId,
      function: 'generateAndSavePolandBookkeepingReport',
    });
  }
}

if (process.env.ENV == 'TEST') {
  // await createOrResetTableByName({ bqTableId, schema: polandBookkeepingReportTableSchema })
  await generateAndSavePolandBookkeepingReport({
    autoParkId: 'de4bf8ba-30c2-452c-a688-104063052961',
  });
  await generateAndSavePolandBookkeepingReport({
    autoParkId: 'be6ab23a-d6ba-4add-b0f7-cfb8abd0586b',
  });
  await generateAndSavePolandBookkeepingReport({
    autoParkId: '58ea1e9e-ebdd-4c4d-870c-6ef06e868c60',
  });
  await generateAndSavePolandBookkeepingReport({
    autoParkId: '21b543d1-a14a-43c6-a719-5becbd25a4e3',
  });
  await generateAndSavePolandBookkeepingReport({
    autoParkId: '444afd80-52d5-4c87-b02a-c43db8982bef',
  });
}
