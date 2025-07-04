export const assignVacancyTitleToApplies = ({
  applies,
  title,
  bitrix_city_id,
}) => {
  return applies.map((apply) => ({ ...apply, title, bitrix_city_id }));
};
