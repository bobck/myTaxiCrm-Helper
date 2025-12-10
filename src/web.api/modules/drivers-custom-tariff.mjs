import {
  assignDriversToCatalogTariff,
  getDiscountTariffsForAutoparksByDay,
  getDriversCandidatsForCustomTerms,
  makeCRMRequestlimited,
} from '../web.api.utlites.mjs';

import {
  saveCreatedDriverCustomTariffId,
  markDriverCustomTariffAsDeleted,
  getUndeletedDriversCustomTariffIds,
} from '../web.api.queries.mjs';
// import { devLog } from '../../shared/shared.utils.mjs';
import { DateTime } from 'luxon';
// const mapping = [
//   {
//     auto_park_id: 'a7bb17b7-fc87-4617-a915-d2f9ec83cfa0',
//     rule_ids: [
//       'aa7c9842-db8a-4150-a955-b53ab7e39ccc',
//       '61810a1d-121e-40a6-b0f0-94d76c04f56d',
//       'd3a04ca1-1fa2-4ef8-91a2-e48b78d71df4',
//       'dee58426-4736-4d97-874c-fdbf54bb6d94',
//     ],
//   },

//   {
//     auto_park_id: 'd78cf363-5b82-41b2-8a53-79bb74969ba7',
//     rule_ids: [
//       '1c85f15f-65d7-4c7a-8e8f-ce9cd7cf7291',
//       'a4683603-0f4d-46c8-8f40-b792d03a9140',
//       '0032a65b-98b5-44b6-b9df-4c02c897d4b8',
//       '446948b6-d3f1-40c9-898c-ace153c54e2e',
//     ],
//   },

//   {
//     auto_park_id: 'e4df553f-4ec2-43a8-b012-4795259e983a',
//     rule_ids: [
//       '91acb170-b55a-41db-9ed7-26b2c08b026f',
//       'ee788e26-6a60-4a41-b5f5-9767fa31619d',
//       'a2d89184-df41-4c37-ac53-55365841257f',
//       '8637acdc-3547-4f58-96d0-001e41b50158',
//     ],
//   },

//   {
//     auto_park_id: '45dcaa21-bceb-45f2-bba9-5c72bbac441f',
//     rule_ids: [
//       '2dfac958-4729-4070-b700-edca4be9ef0f',
//       '7a475116-c750-4592-8809-d26356afac11',
//       '39607444-089a-439a-9a2f-92b5353c4efc',
//       '1909bd61-e928-4b3f-ad40-e0697258e166',
//     ],
//   },

//   {
//     auto_park_id: '052da49c-2175-4033-8010-c8e1f9a755ab',
//     rule_ids: [
//       '4298ddaf-2934-4685-8eec-1dfb4cebf463',
//       'd6409c4c-a5c2-4dda-baf1-be3e4d138de4',
//       '9b98e955-e3d1-4777-b7f1-985c43becb4e',
//       '967d5a08-05cc-4ba0-ae49-01576703fe90',
//     ],
//   },

//   {
//     auto_park_id: '1e8a6a0d-aa34-4d77-a87c-d0c86fab5577',
//     rule_ids: [
//       '87a1fa50-3adf-4006-a5e3-5cf5885cf2d6',
//       '0be928ee-b14d-4955-a1fa-fcbd853b1bc2',
//       '18c5bf31-0b10-481f-b43d-242b949b55e6',
//       '0ca405ba-007e-4b29-af90-28a564d5054b',
//     ],
//   },

//   {
//     auto_park_id: '472c4d3e-3fe7-45ea-9c94-a77f364bbd86',
//     rule_ids: [
//       '554cbb08-20f4-4f76-8fd5-6774d35034f5',
//       'a1df1ee7-237d-4786-8b27-af6d79ce1e3a',
//       '89a1e9af-6ac8-45c2-8684-036e947263cc',
//       '788cc870-7353-49dd-a3a9-d34a69a0b9d8',
//     ],
//   },

//   {
//     auto_park_id: '2bfb0c23-33d8-4bc3-ab03-442d6ba13712',
//     rule_ids: [
//       '970f402b-170e-406e-91db-6253dae502d7',
//       '911d6698-16d0-4b55-90c5-1d62f28b8df4',
//       'ad2578fe-e51f-4285-9738-2236f4b4f84e',
//       'e073b019-87f3-463a-b5d7-3ce429f0837b',
//     ],
//   },

//   {
//     auto_park_id: 'b0328dc5-71be-485d-b6ec-786d9ce52112',
//     rule_ids: [
//       'c12d8d70-532a-4464-bb99-e1b6656649f6',
//       'b91b5c1f-7bb4-4da4-8684-6b277466f8bd',
//       'ebbfcfbd-0fed-4b24-b529-50f7c949a948',
//       'cd2f312b-5c06-4d6d-81f4-48e9a90d2f26',
//     ],
//   },

//   {
//     auto_park_id: '6897e6f0-b33d-405a-b110-8c623c864cfc',
//     rule_ids: [
//       'cfd565d9-d99a-426a-bb77-ef369dc5f290',
//       'd1610474-7095-43b2-bb9f-483a524aa98e',
//       '18a98d69-0937-4a6c-a566-772d9f480288',
//       '99b868cd-2f3b-4652-86e6-779fadebe19f',
//     ],
//   },

//   {
//     auto_park_id: 'c6dc6608-1cb3-488d-97f6-3f1132732bb9',
//     rule_ids: [
//       '8d9aeda4-0ab1-42dd-97b3-b97ec832ee16',
//       'fc5c6514-1b44-49b4-9c14-85001807905a',
//       'e078339f-6e24-4ea1-b049-db2098bc9f0e',
//       'c8d3502e-ff76-4f6a-bb33-ef3b47b02132',
//     ],
//   },

//   {
//     auto_park_id: '4dd93df2-c172-488c-846f-d81452ddba70',
//     rule_ids: [
//       '76ccf9a7-d9ff-4d7c-966c-184591658907',
//       '847693bb-d93e-41dc-8826-069def670f99',
//       '38d619cf-1bda-4749-ad38-b245c82d08db',
//       'ecf21a73-222b-4492-9372-4905a68413b2',
//     ],
//   },

//   {
//     auto_park_id: 'ff2368ca-dce1-4315-af7b-9850056ab3ce',
//     rule_ids: [
//       '243198e6-f7d0-415a-8cd7-c86ff2e142b1',
//       '86fbf8c7-9fa5-42f5-aab6-b9873a2594b3',
//       'f1fa18d2-0d7d-4726-9140-0bbdcee63a73',
//       '9ac7c6b9-bfaf-457d-b25c-457d1ea9028e',
//     ],
//   },

//   {
//     auto_park_id: 'ee12f8cd-570e-4eab-8ec8-1ead1c619bb7',
//     rule_ids: [
//       'a7fd41da-0079-4fde-8db0-666161503f1f',
//       '858bd8ed-a558-4ac9-ade0-311bc2dd76bf',
//       '94fc83b3-c0bd-4133-9121-d3b777e798d9',
//       '7543253b-ecd3-45ea-a3b3-7a1d935a9fdc',
//     ],
//   },

//   {
//     auto_park_id: '9c8bae55-2aa2-4b25-a1e0-c93ab4bbb3ad',
//     rule_ids: [
//       'cc1bce33-ee75-4dda-a1d0-37d15b63d6d7',
//       'f98c0b12-e207-4b4b-bdc6-0b9353ced6af',
//       'faceaac4-055f-41f2-b732-0d436964f944',
//       '095318e8-bf7d-4887-baf9-7a697294fa3d',
//     ],
//   },

//   {
//     auto_park_id: '2f4c5352-0296-4fba-859b-9f8955f3f2a0',
//     rule_ids: [
//       '50c91e83-34f0-49a4-8276-190b740fb271',
//       '0a16e3c0-9e3b-4ed8-95d2-2fbd86950661',
//       '377114e4-0fae-4e2e-b336-fdd47c4e700a',
//       '9940ac81-d12e-4fba-98da-dff98512c904',
//     ],
//   },

//   {
//     auto_park_id: 'd34e7c17-ccf3-49d1-875c-67e4378c4562',
//     rule_ids: [
//       '3020666c-036b-4b68-afc8-c7dce54fd8d8',
//       'c12b34b0-e6c3-4b31-91dc-7776db490d1f',
//       'e43fd3bd-ee4a-4f08-bff4-0689d7dca435',
//       '78a184d2-74fb-45ff-9f28-d949ba8ff8dd',
//     ],
//   },
// ];

const mapping = [
  {
    auto_park_id: 'e2017b70-8418-4a1b-9bf8-aec8a3ad5241',
    rule_ids: [
      'ec32afc8-f21c-414c-9d45-4cdb671b656c',
      'ec32afc8-f21c-414c-9d45-4cdb671b656c',
      'ec32afc8-f21c-414c-9d45-4cdb671b656c',
      'ec32afc8-f21c-414c-9d45-4cdb671b656c',
    ],
  },
];

export async function setDriversCustomTariff() {
  const autoParksIds = mapping.map((ruleset) => ruleset.auto_park_id);
  const allRuleIds = mapping.map((ruleset) => ruleset.rule_ids).flat();

  const timeZone = 'Europe/Kiev';

  const kievDateTime = DateTime.now().setZone(timeZone);

  const isoDate = kievDateTime.toISODate();

  const { weekNumber, year } = kievDateTime;

  const companyId = process.env.WEB_API_TARGET_CONPANY_ID;

  const { driversCandidatsForCustomTerms } =
    await getDriversCandidatsForCustomTerms({
      isoDate,
      companyId,
      autoParksIds,
      weekNumber,
      year,
      allRuleIds,
    });

  const driversForCustomTerms = driversCandidatsForCustomTerms.filter(
    (driver) => {
      const { was_fired_days, custom_tariff_enabled, rent_event_id } = driver;
      return (
        (was_fired_days >= 14 || !was_fired_days) &&
        (!custom_tariff_enabled || custom_tariff_enabled == null) &&
        !rent_event_id
      );
    }
  );


  const attachDriverToTariffInputs = [];

  for (let driver of driversForCustomTerms) {
    const { auto_park_id, id: driver_id, start_working_at } = driver;
    const { rule_ids } = mapping.find(
      (ruleset) => ruleset.auto_park_id == auto_park_id
    );

    const firstWorkingDayDate = new DateTime(start_working_at);
    const ruleIndex = firstWorkingDayDate.weekday - 2; // because first rule is for tuesday the last one for friday
    const accordingRuleId = rule_ids[ruleIndex];
    const vars = {
      autoParkId: auto_park_id,
      driverIds: [driver_id],
      catalogTariffId: accordingRuleId,
    };
    attachDriverToTariffInputs.push(vars);
  }

  for (let attachTariffToDriverInput of attachDriverToTariffInputs) {
    try {
      await assignDriversToCatalogTariff(attachTariffToDriverInput);
      await saveCreatedDriverCustomTariffId({
        tariffId: attachTariffToDriverInput.catalogTariffId,
        driverId: attachTariffToDriverInput.driverIds[0],
        autoParkId: attachDriverToTariffInputs.autoParkId,
      });
    } catch (e) {
      console.error({
        module: 'setDriversCustomTariff',
        date: new Date(),
        attachTariffToDriverInput,
        message: e?.message,
      });
      continue;
    }
  }
  console.log({
    module: 'setDriversCustomTariff',
    newDrivers: attachDriverToTariffInputs.length,
    date: new Date(),
  });
}

export async function deleteDriversCustomTariff() {
  const { undeletedDriversCustomTariffIds } =
    await getUndeletedDriversCustomTariffIds();

  for (let deleteDriverCustomTariffInput of undeletedDriversCustomTariffIds) {
    // console.log({ deleteDriverCustomTariffInput })
    const { tariff_id: tariffId, driver_id: driverId } =
      deleteDriverCustomTariffInput;

    const body = {
      operationName: 'DeleteDriverCustomTariff',
      variables: {
        deleteDriverCustomTariffInput: { tariffId, driverId },
      },
      query:
        'mutation DeleteDriverCustomTariff($deleteDriverCustomTariffInput: DeleteDriverCustomTariffInput!) {\n  deleteDriverCustomTariff(\n    deleteDriverCustomTariffInput: $deleteDriverCustomTariffInput\n  ) {\n    success\n    __typename\n  }\n}\n',
    };

    try {
      const response = await makeCRMRequestlimited({ body });
      const { data } = response;
      // console.log({ data })
      await markDriverCustomTariffAsDeleted({ tariffId });
    } catch (e) {
      console.error({
        date: new Date(),
        tariffId,
        message: e?.message,
        function: 'deleteDriversCustomTariff',
      });
      continue;
    }
  }
}

if (process.env.ENV == 'SET') {
  setDriversCustomTariff();
}

if (process.env.ENV == 'DEL') {
  deleteDriversCustomTariff();
}
