import { remonlineTokenToEnv } from "../../remonline/remonline.api.mjs";

export const loadRemonlineTransactionsToBQ = async () => {
  console.log({
    module: 'loadRemonlineTransactionsToBQ',
    date: new Date(),
  });
};

if (process.env.ENV === 'DEV') {
  await remonlineTokenToEnv(true);
  await loadRemonlineTransactionsToBQ();
  // await resetUOMTable();
}
