import { controllerWrapper } from '../../api.utils.mjs';
import * as jobBoardService from './job-board.service.mjs';

export const activateVacancyEndpoint = controllerWrapper({
  handlerCB: async (req, res, next) => {
    const { query } = req;
    const result = await jobBoardService.activateVacancy({ query });
    res.send(result);
  },
  handlingServiceName: 'activateVacancyEndpoint',
});
export const deactivateVacancyEndpoint = controllerWrapper({
  handlerCB: async (req, res, next) => {
    const { query } = req;
    const result = await jobBoardService.deactivateVacancy({ query });
    res.send(result);
  },
  handlingServiceName: 'deactivateVacancyEndpoint',
});
