import * as CoreService from './core.service.mjs';

export const handleCore = async (req, res) => {
  const { ip } = req;
  const result = await CoreService.coreFunc({ ip });
  res.send(result);
};
