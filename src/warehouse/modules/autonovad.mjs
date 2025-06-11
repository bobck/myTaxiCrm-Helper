// import { autonovadAuth } from '../warehouse.utils.mjs';

import { autonovadAuthorization } from '../warehouse.utils.mjs';

export const autozapas = async () => {
  console.log('autozapas...');
  const creds = {
    username: process.env.AUTONOVAD_USERNAME,
    password: process.env.AUTONOVAD_PASSWORD,
  };
  //   const resp=await autonovadAuth(creds);
  //   const {data}=resp;
  //   console.log(data);
  const resp = await autonovadAuthorization(creds);
  console.log(resp);
};

if (process.env.ENV === 'TEST' || process.env.ENV === 'DEV') {
  autozapas();
}
