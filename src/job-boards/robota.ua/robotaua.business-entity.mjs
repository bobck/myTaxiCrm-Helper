export function cleanHtml(str) {
    if (!str) return '';
    // Заменяем <br> и <li> на разделитель, чтобы сохранить структуру списка, затем удаляем все остальные теги.
    return str
        .replace(/<br\s*\/?>/gi, ' | ')
        .replace(/<\/li>/gi, ' | ')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .replace(/(\s*\|\s*)+/g, ' | ') // Убираем лишние разделители
        .trim()
        .replace(/(^\|\s*)|(\s*\|$)/g, ''); // Убираем разделители в начале и конце
}

export function sanitizePhoneNumber(phoneStr) {
    if (!phoneStr) return null;
    const digits = phoneStr.replace(/\D/g, '');
    return digits.length > 0 ? digits : null;
}

/**
 * Вспомогательная функция для форматирования одного блока образования.
 * @param {object} edu - Объект с данными об образовании.
 * @returns {string} - Отформатированная строка.
 */
function formatEducationEntry(edu) {
    const title = edu.title || 'Учебное заведение не указано';
    const location = edu.location ? `, ${edu.location}` : '';
    const speciality = edu.speciality ? `\nСпециальность: ${edu.speciality}` : '';
    const year = edu.yearOfGraduation ? `\nГод выпуска: ${edu.yearOfGraduation}` : '';
    return `${title}${location}${speciality}${year}`;
}

export function processApiResponse(response) {
    const { experiences, educations, additionalsEducations, contacts, ...example } = response;

    // --- Обработка опыта работы ---
    let workExperienceString = experiences?.length > 0
        ? experiences.map(exp => {
            const startDate = !exp.startWork || exp.startWork.startsWith('0001') ? '' : new Date(exp.startWork).toLocaleDateString();
            const endDate = !exp.endWork || exp.endWork.startsWith('0001') ? '' : new Date(exp.endWork).toLocaleDateString();
            const period = (startDate && endDate) ? `Период: ${startDate} - ${endDate}` : '';
            return `Позиция: ${exp.position || 'не указана'}\nКомпания: ${exp.company || 'не указана'}\n${period}\nОбязанности:\n${cleanHtml(exp.description)}\n---`;
        }).join('\n\n')
        : null;

    if (!workExperienceString && example.coveringLetterName) {
        workExperienceString = `Сопроводительное письмо:\n${example.coveringLetterName}`;
    }
    // Улучшение: используем флаг isHaveNoExperience
    if (!workExperienceString && example.isHaveNoExperience) {
        workExperienceString = 'Кандидат указал, что не имеет опыта работы.';
    }

    // --- Улучшение: объединяем основное и дополнительное образование ---
    const allEducations = [...(educations || []), ...(additionalsEducations || [])];
    const educationString = allEducations.length > 0
        ? allEducations.map(formatEducationEntry).join('\n\n---\n\n')
        : null;
    
    // --- Обработка контактов ---
    const socialNetworksString = contacts?.socials?.map(s => `${s.type}: ${s.value}`).join(', ') || null;
    const primaryEmail = contacts?.emails?.[0]?.value ?? example.eMail ?? null;
    const primaryPhone = sanitizePhoneNumber(contacts?.phones?.[0]?.value) ?? sanitizePhoneNumber(example.phone) ?? null;

    const birthDate = (!example.birthDate || example.birthDate.startsWith('0001')) 
        ? null 
        : new Date(example.birthDate).toISOString().split('T')[0];

    // --- Улучшение: детализируем источник ---
    const sourceOfApplyment = `rabota.ua (${example.resumeType || 'N/A'}${example.isFromCVDB ? ', из базы резюме' : ''})`;

    const processedData = {
        fullName: example.name || null,
        avatar: example.photo && !example.photo.includes('non-photo.png') ? example.photo : null,
        cvURL: null,
        cvFile: example.filePath || null,
        status: example.tagId || 'New',
        email: primaryEmail,
        phone: primaryPhone,
        socialNetwork: socialNetworksString,
        dateOfBirth: birthDate,
        applyingForPosition: example.speciality?.trim() || null,
        city: educations?.[0]?.location || null,
        sex: example.gender === 'Unknown' || example.gender === 'Other' ? null : example.gender,
        skills: cleanHtml(example.skillsSummary) || null,
        workExperience: workExperienceString,
        experience: workExperienceString,
        currentPosition: experiences?.[0]?.position ?? null,
        currentJob: experiences?.[0]?.company ?? null,
        salaryExpectaions: example.salary > 0 ? `${example.salary} ${example.currencyId}` : null,
        positionExpectaions: example.speciality?.trim() || null,
        sourceOfApplyment: sourceOfApplyment,
        uni: educations?.[0]?.title ?? null,
        education: educationString,
        faculty: educations?.[0]?.speciality ?? null,
        educationDetails: educationString,
        educationYears: educations?.[0]?.yearOfGraduation?.toString() ?? null,
        responsibleRecruiter: null, hrCity: null, isVolunteerToMove: null, country: null,
        degreeLevel: null, languageLevel: null, languageName: null, categoryOfWork: null,
        kindOfJob: null, isFullTime: null, 'level????': null, kindOfCurrentJob: null,
    };
    
    return processedData;
}