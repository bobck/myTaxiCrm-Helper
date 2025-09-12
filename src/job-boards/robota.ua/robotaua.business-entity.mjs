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
  const {
    id,
    title,
    vacancyId,
    experiences,
    educations,
    contacts,
    bitrix_city_id,
    bitrix_vacancy_id,
    assigned_by_id,
    ...rest
  } = response;

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

  let cvURL;
  if (response.resumeType === 'AttachedFile') {
    cvURL = `https://robota.ua/my/vacancies/${vacancyId}/applies?id=${id}-attach`;
  } else {
    cvURL = `https://robota.ua/my/vacancies/${vacancyId}/applies?id=${id}-prof`;
  }
  const processedData = {
    id,
    title: `TEST!!! ${title}`,
    fullName: rest.name,
    cvURL,
    cvFile: rest.filePath,
    status: rest.tagId || 'New',
    email: primaryEmail,
    phone: primaryPhone,
    socialNetwork: socialNetworksString,
    dateOfBirth: birthDate,
    applyingForPosition: rest.bitrix_vacancy_id,
    city: bitrix_city_id,
    sex: rest.gender,
    skills: cleanHtml(rest.skillsSummary),
    workExperience: workExperienceString,
    experience: workExperienceString,
    currentPosition: experiences?.[0]?.position,
    currentJob: experiences?.[0]?.company,
    salaryExpectaions:
      rest.salary > 0 ? `${rest.salary} ${rest.currencyId}` : null,
    positionExpectaions: rest.speciality,
    sourceOfApplyment: 3448,
    uni: educations?.[0]?.title,
    education: educationString,
    faculty: educations?.[0]?.speciality,
    educationDetails: educationString,
    educationYears: educations?.[0]?.yearOfGraduation?.toString(),
    hrCity: bitrix_city_id,
    assigned_by_id,
    bitrix_vacancy_id,
  };

  return processedData;
}
