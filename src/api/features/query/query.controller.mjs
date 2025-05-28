import * as QueryService from './query.service.mjs';

export const queryHandler = async (req, res) => {
    console.log('queryHandler requested')
  const { body } = req;
  const { sql } = body;
  if (!sql) {
      return res.status(400).json({
          error: 'POST: query',
          message: 'sql is required',
        });
    }

  try {
    const { rows } = await QueryService.executeQuery({sql});
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(404).json(err);
  }
};
