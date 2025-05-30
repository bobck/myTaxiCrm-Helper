import * as BoltService from './bolt.service.mjs';
import { api_status_codes } from '../../api.constants.mjs';

const { OK } = api_status_codes;
export const handleFirstLetter = async (req, res) => {
  try {
    const { query } = req;
    console.log({ message: 'POST: verify', query });
    await BoltService.sentFirstLetterService({ query });
    res.status(OK).json({ message: 'First letter sent' });
  } catch (error) {
    console.error('Error in sentFirstDriverLetterToBolt', { error });
    const { code, messgae } = error;
    res.status(code).json({ messgae, status: 'error' });
  }
};
export const handleSecondLetter = (req, res) => {
  res.status(OK).json({ message: 'Second letter sent' });
};

export const handleLetterApprovement = async (req, res) => {
  const { params, query } = req;
  await BoltService.letterApprovementService({ params,query });
  res.status(OK).json({ message: 'letter Approved' });
};

export const handleBanApprovement = async (req, res) => {
  res.status(OK).json({ message: 'ban Approved' });
};
