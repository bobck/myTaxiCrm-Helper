import { authorizeAPIClient } from '../endpoints-utils.mjs';

export const approveFirstDriverLetterToBoltHandler = async (req, res) => {
  const { api_key } = req.query;

  res.status(200).json({ message: '1 Approved' });
};
