export const approveSecondDriverLetterToBoltHandler = async (req, res) => {
  res.status(200).json({ message: process.env.MYTAXICRM_HELPER_API_KEY });
};
