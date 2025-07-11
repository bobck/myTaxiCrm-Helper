import * as BoltService from './bolt.service.mjs';
import { api_status_codes } from '../../api.constants.mjs';
import { controllerWrapper } from '../../api.utils.mjs';

const { OK } = api_status_codes;

export const handleFirstLetter = controllerWrapper({
  handlerCB: async (req, res) => {
    const { query } = req;

    console.log({ message: 'POST: FIRST LETTER', query });
    await BoltService.sentFirstLetterService({ query });
    return res.status(OK).json({ message: 'First letter sent' });
  },
  handlingServiceName: 'sentFirstLetterService',
});
export const handleSecondLetter = (req, res) => {
  res.status(OK).json({ message: 'Second letter sent' });
};

export const handleLetterApprovement = controllerWrapper({
  handlerCB: async (req, res) => {
    const { params, query } = req;
    console.log({ message: `POST: APPROVE LETTER ${params.letter_id}`, query });
    await BoltService.letterApprovementService({ params, query });
    res.status(OK).json({ message: 'letter Approved' });
  },
  handlingServiceName: 'letterApprovementService',
});
