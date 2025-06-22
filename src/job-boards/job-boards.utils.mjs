export const assignVacancyTitleToApplies = ({ applies, title }) => {
  return applies.map((apply) => ({ ...apply, title }));
};
