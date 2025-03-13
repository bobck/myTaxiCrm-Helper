import { findContactsByPhones, findDealByContact } from '../bitrix.utils.mjs';

import {
  getAllDriversWithRevenueWitnNoConcacts,
  updateContactsInDriversWithRevenue,
  getAllDriversWithRevenueWitnConcactsAndNoDeals,
  updateLeadInDriversWithRevenue,
} from '../bitrix.queries.mjs';

export async function contactsForDriversWithRevenue() {
  const { driversWithRevenue } = await getAllDriversWithRevenueWitnNoConcacts();
  const { result } = await findContactsByPhones({
    drivers: driversWithRevenue,
  });

  const driversWithRevenueAndContacts = driversWithRevenue.map(
    (element, index) => {
      return {
        ...element,
        contacts: result[index]?.CONTACT,
        contacts_count: result[index]?.CONTACT?.length,
      };
    }
  );

  await updateContactsInDriversWithRevenue(driversWithRevenueAndContacts);
}

export async function dealForDriversWithRevenue({ category_id, companyIds }) {
  const { driversWithRevenue } =
    await getAllDriversWithRevenueWitnConcactsAndNoDeals({
      companyIds,
    });
  const { result } = await findDealByContact({
    drivers: driversWithRevenue,
    category_id,
  });

  const concatsWithDeals = [];
  for (let [concact_id, deals] of Object.entries(result)) {
    if (deals.length == 0) {
      continue;
    }
    const [deal] = deals;
    const { ID: deal_id } = deal;

    concatsWithDeals.push({
      concact_id,
      deal_id,
    });
  }

  await updateLeadInDriversWithRevenue(concatsWithDeals);
}

if (process.env.ENV == 'TEST') {
  await contactsForDriversWithRevenue();

  const ownCompanyIds = [
    '4ea03592-9278-4ede-adf8-f7345a856893',
    'b52d5c3c-9a8e-4898-8101-7c65f3ee70a4',
  ];
  await dealForDriversWithRevenue({
    category_id: 3,
    companyIds: ownCompanyIds,
  });

  const b2cCompanyIds = ['3b63b0cc-155b-43c5-a58a-979f6aac0d35'];
  await dealForDriversWithRevenue({
    category_id: 0,
    companyIds: b2cCompanyIds,
  });
}
