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
  } = resumeResponse;

  const cvURL = with_file
    ? `https://www.work.ua/sent-resume-file/${id}/view/pdf/`
    : `https://www.work.ua/employer/my/applicants/${candidate_id}/?jobId=${job_id}`;

  return {
    sourceOfApplyment: 'work.ua',
    id,
    fullName: fio,
    dateOfBirth: birth_date,
    email,
    phone,
    cvURL,
    date,
    title,
  };
};
