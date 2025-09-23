export const processResponse = async (resumeResponse) => {
  const {
    id,
    candidate_id,
    date,
    fio,
    birth_date,
    email,
    phone,
    with_file,
    job_id,
    title,
    cover,
    text,
    city,
    assigned_by_id,
    bitrix_vacancy_id,
  } = resumeResponse;
  const cvText = cover ? cover + '\n\n' + text : text;

  const cvURL = with_file
    ? `https://www.work.ua/sent-resume-file/${id}/view/pdf/`
    : `https://www.work.ua/employer/my/applicants/${candidate_id}/?jobId=${job_id}`;

  return {
    sourceOfApplyment: 3446, // work ua response
    id,
    fullName: fio,
    dateOfBirth: birth_date,
    email,
    phone,
    cvURL,
    date,
    title:`test ${title}`,
    cvText,
    country: city,
    assigned_by_id,
    bitrix_vacancy_id,
  };
};
export const checkIfWorkUaVacancyStaysActive = async ({
  work_ua_vacancy_id,
  allVacancies,
}) => {
  return {
    is_active: allVacancies.some((vacancy) => {
      return (
        Number(vacancy.id) === Number(work_ua_vacancy_id) && vacancy.active
      );
    }),
  };
};
