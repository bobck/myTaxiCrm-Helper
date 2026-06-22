import axios from 'axios';

const AUTH = 'https://auth-api.rabota.ua';
const EMPLOYER = 'https://employer-api.rabota.ua';

const browserUserAgent =
  process.env.ROBOTA_UA_UA ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const cfClearance = process.env.ROBOTA_UA_CF_CLEARANCE;

const login = async () => {
  if (process.env.ROBOTA_UA_BEARER) return process.env.ROBOTA_UA_BEARER;
  const { data } = await axios.post(`${AUTH}/Login`, {
    username: process.env.ROBOTA_UA_EMAIL,
    password: process.env.ROBOTA_UA_PASSWORD,
    remember: true,
  });
  return data;
};

const buildEmployerClient = (token) =>
  axios.create({
    baseURL: EMPLOYER,
    timeout: 20000,
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': browserUserAgent,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(cfClearance ? { Cookie: `cf_clearance=${cfClearance}` } : {}),
    },
  });

const call = async (client, label, fn) => {
  try {
    const { status, data } = await fn();
    const list = data?.vacancies ?? data?.applies ?? data;
    console.log(`[${label}] ${status} | total=${data?.total ?? 'n/a'} | items=${Array.isArray(list) ? list.length : typeof list}`);
    if (Array.isArray(list) && list[0]) {
      const first = list[0];
      console.log('   first:', JSON.stringify({
        id: first.vacancyId ?? first.id,
        name: first.vacancyName ?? first.name,
        state: first.state,
        vacancyId: first.vacancyId,
        addDate: first.addDate,
      }));
    }
  } catch (error) {
    const res = error.response;
    const body = res ? (typeof res.data === 'string' ? res.data.slice(0, 140) : JSON.stringify(res.data).slice(0, 300)) : error.message;
    console.log(`[${label}] ${res?.status ?? error.code} | cf=${res?.headers?.['cf-mitigated'] ?? '-'} | ${body}`);
  }
};

const token = await login();
console.log('token len:', token?.length, '| cf_clearance:', cfClearance ? 'provided' : 'MISSING (employer-api will 403 from CLI)');

const client = buildEmployerClient(token);

await call(client, 'vacancy/list All', () => client.post('/vacancy/list', { page: 0, vacancyStateId: 'All' }));
await call(client, 'vacancy/list Publicated', () => client.post('/vacancy/list', { page: 0, vacancyStateId: 'Publicated' }));
await call(client, 'apply/list all(-1)', () => client.post('/apply/list', { vacancyId: -1, page: 0 }));
