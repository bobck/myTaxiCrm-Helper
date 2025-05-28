
  app.post('/query', async function (req, res) {
    const { body } = req;
    const { sql } = body;

    if (!sql) {
      return res.status(400).json({
        error: 'POST: query',
        message: 'sql is required',
      });
    }

    try {
      const result = await pool.query(sql);
      const { rows } = result;
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(404).json(err);
    }
  });

  