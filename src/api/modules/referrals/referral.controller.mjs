import * as ReferralService from './referral.service.mjs';

export const addHandler = async (req, res) => {
  try {
    const { query } = req;
    await ReferralService.add({ query });
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    const { message } = e;
    return res.status(400).json({ status: 'error', message });
  }
};
export const validationHandler = async (req, res) => {
  try {
    const { query } = req;
    await ReferralService.validate({ query });
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    const { message } = e;
    return res.status(400).json({ status: 'error', message });
  }
};
export const approveHandler = async (req, res) => {
  try {
    const { query } = req;
    await ReferralService.approve({ query });
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    const { message } = e;
    return res.status(400).json({ status: 'error', message });
  }
};
