import { getManifoldDeals, getDeals, getContacts } from '../bitrix.utils.mjs';

import {
  clearManifoldDealsTable,
  insertManifoldDeals,
  // getSavedManifoldDeals,
  updateManifoldDealsAncidentData,
  getSavedManifoldDealsWithNoAncidentData,
  getSavedManifoldDealsWithNoContactId,
  updateManifoldDealsContactId,
  getSavedManifoldContactIdsWithNoPhone,
  updateManifoldDealsPhone,
} from '../bitrix.queries.mjs';

import { cityListWithAssignedBy } from '../bitrix.constants.mjs';

export async function saveNewManifoldDeals() {
  console.log({ time: new Date(), message: 'saveNewManifoldDeals' });

  const result = await getManifoldDeals();

  console.log({ getManifoldDeals: result.length });

  if (result.length == 0) {
    return;
  }

  // const { manifoldDealsIds } = await getSavedManifoldDeals()
  // const manifoldDealsIdsArray = manifoldDealsIds.map(row => row.id)

  const jsonData = [];

  for (let row of result) {
    const {
      ID,
      DATE_CREATE,
      STAGE_ID,
      UF_CRM_1527615815: city_id,
      ASSIGNED_BY_ID,
      TITLE,
    } = row;
    //TODO create separate updating process for STAGE_ID only
    // if (manifoldDealsIdsArray.includes(ID)) {
    //     continue
    // }

    const matchingCity = cityListWithAssignedBy.find(
      (city) => city.cityId === city_id
    );

    jsonData.push({
      id: ID,
      deal_created_at: DATE_CREATE,
      stage_id: STAGE_ID,
      city_name: matchingCity?.cityName || '?',
      assigned_by_id: ASSIGNED_BY_ID || '?',
      title: TITLE,
    });
  }

  console.log({ jsonData: jsonData.length });

  if (jsonData.length == 0) {
    return;
  }

  await clearManifoldDealsTable();
  await insertManifoldDeals(jsonData);
}

export async function updateManifoldDealsWithAncidentData() {
  console.log({
    time: new Date(),
    message: 'updateManifoldDealsWithAncidentData',
  });

  const { manifoldDealsIds } = await getSavedManifoldDealsWithNoAncidentData();
  if (manifoldDealsIds.length == 0) {
    return;
  }
  const ids = manifoldDealsIds.map((row) => row.id);
  const { result } = await getDeals({ ids });
  await updateManifoldDealsAncidentData(result);
}

export async function updateManifoldDealsWithContactId() {
  console.log({
    time: new Date(),
    message: 'updateManifoldDealsWithContactId',
  });

  const { manifoldDealsAncidentIds } =
    await getSavedManifoldDealsWithNoContactId();

  if (manifoldDealsAncidentIds.length == 0) {
    return;
  }

  const ids = manifoldDealsAncidentIds.map((row) => row.id);
  const { result } = await getDeals({ ids });
  await updateManifoldDealsContactId(result);
}

export async function updateManifoldDealsWithPhone() {
  console.log({ time: new Date(), message: 'updateManifoldDealsWithPhone' });

  const { manifoldDealsAncidentIds } =
    await getSavedManifoldContactIdsWithNoPhone();

  if (manifoldDealsAncidentIds.length == 0) {
    return;
  }

  const ids = manifoldDealsAncidentIds.map((row) => row.contact_id);
  const { result } = await getContacts({ ids });

  const jsonObj = {};

  for (let [contact_id, contactData] of Object.entries(result)) {
    if (contactData?.PHONE?.length == 0 || !contactData?.PHONE?.length) {
      continue;
    }
    const { PHONE: phones } = contactData;
    const [workPhone] = phones.filter((p) => p.VALUE_TYPE == 'WORK');

    if (!workPhone?.VALUE) {
      continue;
    }
    const { VALUE: phone } = workPhone;
    const cleanedPhone = phone.replace(/[^\d]/g, '');

    if (cleanedPhone.length != 12) {
      continue;
    }

    jsonObj[contact_id] = { phone: `+${cleanedPhone}` };
  }

  await updateManifoldDealsPhone(jsonObj);
}

if (process.env.ENV == 'TEST') {
  await saveNewManifoldDeals();
  await updateManifoldDealsWithAncidentData();
  await updateManifoldDealsWithContactId();
  await updateManifoldDealsWithPhone();
}
