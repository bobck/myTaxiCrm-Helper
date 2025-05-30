import * as BoltService from './bolt.service.mjs';

export const handleFirstLetter = async (req, res) => {
  try {
    const { query } = req;
    console.log({ message: 'POST: verify', query });
    await BoltService.sentFirstDriverLetterToBolt({ query });
  } catch (error) {
    console.error('Error in sentFirstDriverLetterToBolt', { error });
    const { code, messgae } = error;
    res.status(code).json({ messgae, status: 'error' });
  }
};
export const handleSecondLetter = (req, res) => {
  res.status(200).json({ message: 'Second letter sent' });
};
