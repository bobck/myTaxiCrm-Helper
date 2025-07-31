import { reportBitrixEntityError } from '../../../job-boards/job-board.utils.mjs';
import { controllerWrapper } from '../../api.utils.mjs';
import * as jobBoardService from './job-board.service.mjs';

export const addOrUpdateVacancyEndpoint = controllerWrapper({
  handlerCB: async (req, res, next) => {
    const { query } = req;
    // if (query.assigned_by_id[query.assigned_by_id.length-1] === '_') {
    //   query.assigned_by_id = query.assigned_by_id.slice(0, -1)
    // }
    console.log({ query, endpoint: 'addOrUpdateVacancyEndpoint' });
    const result = await jobBoardService.add_update_vacancy_fork({ query });
    res.send(result);
  },
  handlingServiceName: 'addOrUpdateVacancyEndpoint',
});

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
