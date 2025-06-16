export function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizePhoneNumber(phoneStr) {
  if (!phoneStr) return null;
  const digits = phoneStr.replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

export function processApiResponse(response) {
  const {id,vacancyId, experiences, educations, contacts, ...rest } = response;

  let workExperienceString =
    experiences?.length > 0
      ? experiences
          .map((exp) => {
            const startDate =
              !exp.startWork || exp.startWork.startsWith('0001')
                ? ''
                : new Date(exp.startWork).toLocaleDateString();
            const endDate =
              !exp.endWork || exp.endWork.startsWith('0001')
                ? ''
                : new Date(exp.endWork).toLocaleDateString();
            const period =
              startDate && endDate ? `Период: ${startDate} - ${endDate}` : '';
            return `Позиция: ${exp.position || 'не указана'}\nКомпания: ${exp.company || 'не указана'}\n${period}\nОбязанности:\n${cleanHtml(exp.description)}\n---`;
          })
          .join('\n\n')
      : null;

  if (!workExperienceString && rest.coveringLetterName) {
    workExperienceString = `Сопроводительное письмо:\n${rest.coveringLetterName}`;
  }

  const educationString =
    educations?.length > 0
      ? educations
          .map((edu) => {
            return `${edu.title || 'Учебное заведение не указано'}${edu.location ? `, ${edu.location}` : ''}\nСпециальность: ${edu.speciality || 'не указана'}\nГод выпуска: ${edu.yearOfGraduation || 'не указан'}`;
          })
          .join('\n\n')
      : null;

  const socialNetworksString =
    contacts?.socials?.map((s) => `${s.type}: ${s.value}`).join(', ') || null;
  const primaryEmail = contacts?.emails?.[0]?.value ?? rest.eMail ?? null;
  const primaryPhone =
    sanitizePhoneNumber(contacts?.phones?.[0]?.value) ??
    sanitizePhoneNumber(rest.phone) ??
    null;

  const birthDate =
    !rest.birthDate || rest.birthDate.startsWith('0001')
      ? null
      : new Date(rest.birthDate).toISOString().split('T')[0];

  const processedData = {
    fullName: rest.name || null,
    avatar:
      rest.photo && !rest.photo.includes('non-photo.png') ? rest.photo : null,
    cvURL: `https://robota.ua/my/vacancies/${vacancyId}/applies?id=${id}-prof`,
    cvFile: rest.filePath || null,
    status: rest.tagId || 'New',
    email: primaryEmail,
    phone: primaryPhone,
    socialNetwork: socialNetworksString,
    dateOfBirth: birthDate,
    applyingForPosition: rest.speciality || null,
    city: educations?.[0]?.location || null,
    sex:
      rest.gender === 'Unknown' || rest.gender === 'Other' ? null : rest.gender,
    skills: cleanHtml(rest.skillsSummary) || null,
    workExperience: workExperienceString,
    experience: workExperienceString,
    currentPosition: experiences?.[0]?.position ?? null,
    currentJob: experiences?.[0]?.company ?? null,
    salaryExpectaions:
      rest.salary > 0 ? `${rest.salary} ${rest.currencyId}` : null,
    positionExpectaions: rest.speciality || null,
    sourceOfApplyment: `rabota.ua (${rest.resumeType})`,
    uni: educations?.[0]?.title ?? null,
    education: educationString,
    faculty: educations?.[0]?.speciality ?? null,
    educationDetails: educationString,
    educationYears: educations?.[0]?.yearOfGraduation?.toString() ?? null,
    responsibleRecruiter: null,
    hrCity: null,
    isVolunteerToMove: null,
    country: null,
    degreeLevel: null,
    languageLevel: null,
    languageName: null,
    categoryOfWork: null,
    kindOfJob: null,
    isFullTime: null,
    'level????': null,
    kindOfCurrentJob: null,
  };

  return processedData;
}
