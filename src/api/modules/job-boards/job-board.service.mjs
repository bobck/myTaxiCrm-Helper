import { devLog } from '../../../shared/shared.utils.mjs';
import { updateRobotaUaVacancyActivityState } from '../../../job-boards/robota.ua/robotaua.queries.mjs';
import {
  activateRobotaUaVacancy,
  changeRobotaUaVacancyPublicationType,
  deactivateRobotaUaVacancy,
  getRobotaUaPublicationLeftOvers,
  getRobotaUaTicketRest,
  robotaUaCustomGet,
} from '../../../job-boards/robota.ua/robotaua.utils.mjs';
import {
  updateWorkUaVacancyActivityState,
  updateWorkUaVacancyPublicationType,
} from '../../../job-boards/work.ua/workua.queries.mjs';
import {
  activateWorkUaVacancy,
  deactivateWorkUaVacancy,
  getWorkUaAvailablePublications,
} from '../../../job-boards/work.ua/workua.utils.mjs';
import {
  assignManyCommentsToVacancyRequest,
  getRobotaAndWokUaVacanciesById,
} from './job-board.buisness-entity.mjs';
import * as jobBoardRepo from './job-board.repo.mjs';
import { robotaUaPublicationTypes } from '../../../job-boards/robota.ua/robotaua.constants.mjs';
/**
 * 
 * `CREATE TABLE bitrix_vacancies_to_job_board_vacancies (
    vacancy_name TEXT,
    bitrix_vacancy_id INTEGER,
    work_ua_vacancy_id INTEGER,
    robota_ua_vacancy_id INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bitrix_vacancy_id)
    )`
 */

const addVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
  assigned_by_id,
  // work_ua_publication_type,
  // robota_ua_publication_type,
}) => {
  const comments = [];
  const {
    workUaVacancy,
    robotaUaVacancy,
    _comments: _comments1,
    isAnyVacancyFound,
  } = await getRobotaAndWokUaVacanciesById({
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    bitrix_vacancy_id,
  });
  devLog({ workUaVacancy, robotaUaVacancy });

  comments.push(..._comments1);
  if (!isAnyVacancyFound) {
    comments.push('Жодної вакансії не знайдено');
    await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
    return;
  }
  const payload = { assigned_by_id };
  if (workUaVacancy) {
    // console.log({ workUaVacancy, message: 'found' });
    payload.workUaVacancy = workUaVacancy;
    // payload.work_ua_publication_type = work_ua_publication_type;
  }
  if (robotaUaVacancy) {
    // console.log({ robotaUaVacancy, message: 'found' });
    payload.robotaUaVacancy = robotaUaVacancy;
    // payload.robota_ua_publication_type = robota_ua_publication_type;
  }

  const { _comments: _comments2, isAnyVacancyCreated } =
    await jobBoardRepo.addVacancySynchronously({
      bitrix_vacancy_id,
      vacancy_name,
      is_active: false,
      ...payload,
    });
  // console.log({ _comments2, isAnyVacancyCreated });
  comments.push(..._comments2);
  if (!isAnyVacancyCreated) {
    comments.push(`Вакансія НЕ додана до системи.`);
  } else {
    comments.push(`Вакансія додана до системи.`);
  }
  await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
};
const updateVacancy = async ({
  bitrix_vacancy_id,
  vacancy_name,
  work_ua_vacancy_id,
  robota_ua_vacancy_id,
  assigned_by_id,
  // work_ua_publication_type,
  // robota_ua_publication_type,
  bitrixVacancy,
}) => {
  const comments = [];
  const {
    workUaVacancy,
    robotaUaVacancy,
    _comments: _comments1,
    isAnyVacancyFound,
  } = await getRobotaAndWokUaVacanciesById({
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    bitrix_vacancy_id,
  });

  comments.push(..._comments1);
  if (!isAnyVacancyFound) {
    comments.push('Жодної вакансії не знайдено');
    await assignManyCommentsToVacancyRequest({ comments });
    return;
  }
  const payload = { bitrixVacancy, assigned_by_id };
  if (workUaVacancy) {
    if (
      Number(bitrixVacancy.work_ua_vacancy_id) !== Number(workUaVacancy.id)
      // || work_ua_publication_type !== workUaVacancy.publicationType
    ) {
      payload.workUaVacancy = workUaVacancy;
      // payload.work_ua_publication_type = work_ua_publication_type;
    }
  }
  if (robotaUaVacancy) {
    if (
      Number(bitrixVacancy.robota_ua_vacancy_id) !==
      Number(robotaUaVacancy.vacancyId)
      // ||robota_ua_publication_type !== robotaUaVacancy.publishType
    ) {
      payload.robotaUaVacancy = robotaUaVacancy;
      // payload.robota_ua_publication_type = robota_ua_publication_type;
    }
  }
  const { _comments: _comments2, isAnyVacancyUpdated } =
    await jobBoardRepo.updateVacancySynchronously({
      bitrix_vacancy_id,
      vacancy_name,
      is_active: false,
      ...payload,
    });

  console.log({ _comments2, isAnyVacancyUpdated });
  comments.push(..._comments2);
  if (!isAnyVacancyUpdated) {
    comments.push(`Вакансія НЕ оновлена в системі.`);
  } else {
    comments.push(`Вакансія оновлена в системі.`);
  }
  await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
};
export const add_update_vacancy_fork = async ({ query }) => {
  const {
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    assigned_by_id,
    // work_ua_publication_type,
    // robota_ua_publication_type,
  } = query;
  const synchronizedVacancy = await jobBoardRepo.getExistingVacancy({
    bitrix_vacancy_id,
  });
  if (!synchronizedVacancy.bitrixVacancy) {
    devLog('creating...');
    return await addVacancy({
      bitrix_vacancy_id,
      vacancy_name,
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
      assigned_by_id,
      // work_ua_publication_type,
      // robota_ua_publication_type,
    });
  }
  devLog('updating...');
  const { bitrixVacancy, localWorkUaVacancy } = synchronizedVacancy;
  return await updateVacancy({
    bitrix_vacancy_id,
    vacancy_name,
    work_ua_vacancy_id,
    robota_ua_vacancy_id,
    assigned_by_id,
    // work_ua_publication_type,
    // robota_ua_publication_type,
    bitrixVacancy,
    localWorkUaVacancy,
  });
};
export const activateVacancy = async ({ query }) => {
  devLog({ query });
  const { bitrix_vacancy_id } = query;
  const { bitrixVacancy, localWorkUaVacancy, localRobotaUaVacancy } =
    await jobBoardRepo.getExistingVacancy({
      bitrix_vacancy_id,
    });
  if (!bitrixVacancy) {
    return;
  }

  const { work_ua_vacancy_id, robota_ua_vacancy_id } = bitrixVacancy;
  devLog({ work_ua_vacancy_id, robota_ua_vacancy_id });
  const { workUaVacancy, robotaUaVacancy } =
    await getRobotaAndWokUaVacanciesById({
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
      bitrix_vacancy_id,
    });
  devLog({ workUaVacancy, robotaUaVacancy });
  const activityState = {
    is_work_ua_vacancy_activated: false,
    is_robota_ua_vacancy_activated: false,
  };
  if (robota_ua_vacancy_id) {
    const { state } = robotaUaVacancy;
    const is_robota_ua_vacancy_active = state == 'Publicated';
    if (!is_robota_ua_vacancy_active) {
      await activateRobotaUaVacancy({ vacancyId: robota_ua_vacancy_id });
    }

    await updateRobotaUaVacancyActivityState({
      robota_ua_vacancy_id,
      is_active: true,
    });
  }
  if (work_ua_vacancy_id) {
    let is_active = true;

    const { active } = workUaVacancy;
    const is_work_ua_vacancy_active = Boolean(active);
    if (!is_work_ua_vacancy_active) {
      const { availablePublications } = await getWorkUaAvailablePublications();
      const { publicationType: work_ua_publication_type } = localWorkUaVacancy;
      const demandedPublications = availablePublications.find(
        (ap) => ap.id == work_ua_publication_type
      );
      if (!demandedPublications) {
        console.error(`unkonwn publication type ${work_ua_publication_type}`);
        is_active = false;
      } else if (demandedPublications.total > 0) {
        await activateWorkUaVacancy({
          workUaVacancy: localWorkUaVacancy,
        });
        activityState.is_work_ua_vacancy_activated = true;
      } else {
        is_active = false;
        const comments = [
          `Залишки публікацій work.ua: Стандарт:${availablePublications[0].total}, СтандартПлюс:${availablePublications[1].total}, Гаряча:${availablePublications[2].total}, Анонімна:${availablePublications[3].total}`,
          `Не залишилося жодної публікації work.ua вибраного типу(${demandedPublications.id}).`,
          // `Не залишилося жодної публікації work.ua вибраного типу(${demandedPublications.id}). Виберіть інший тип публікації, перенесіть до стадії "Додати/Оновити вакансію у системі", та назад до "Пошук"`
        ];
        await assignManyCommentsToVacancyRequest({
          comments,
          bitrix_vacancy_id,
        });
        return;
      }
    }
    await updateWorkUaVacancyActivityState({
      work_ua_vacancy_id,
      is_active,
    });
    activityState.is_work_ua_vacancy_activated = true;
  }
  console.log({ activityState });
  await jobBoardRepo.changeVacancyActivityState({
    bitrix_vacancy_id,
    activityState,
  });

  const comments = [`Вакансія успішно активована.`];
  await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
};

export const deactivateVacancy = async ({ query }) => {
  console.log({ query });
  const { bitrix_vacancy_id } = query;
  const { bitrixVacancy } = await jobBoardRepo.getExistingVacancy({
    bitrix_vacancy_id,
  });
  console.log({ bitrixVacancy });
  if (!bitrixVacancy) {
    return;
  }
  const { work_ua_vacancy_id, robota_ua_vacancy_id } = bitrixVacancy;
  const { workUaVacancy, robotaUaVacancy } =
    await getRobotaAndWokUaVacanciesById({
      work_ua_vacancy_id,
      robota_ua_vacancy_id,
      bitrix_vacancy_id,
    });
  if (robota_ua_vacancy_id) {
    const { state } = robotaUaVacancy;
    const is_robota_ua_vacancy_active = state == 'Publicated';
    if (is_robota_ua_vacancy_active) {
      await deactivateRobotaUaVacancy({ vacancyId: robota_ua_vacancy_id });
    }
  }
  if (work_ua_vacancy_id) {
    const { active } = workUaVacancy;
    const is_work_ua_vacancy_active = Boolean(active);
    if (is_work_ua_vacancy_active) {
      await deactivateWorkUaVacancy({ vacancyId: work_ua_vacancy_id });
    }
  }
  await jobBoardRepo.markVacancyAsDeletedSynchronously({ bitrix_vacancy_id });
  const comments = [`Вакансія успішно деактивована.`];
  await assignManyCommentsToVacancyRequest({ comments, bitrix_vacancy_id });
};

export const dev = async ({ query }) => {
  const resps = [];
  const ticketTypes = [
    'All',
    'Business',
    'Optimum',
    'Professional',
    'Anonym',
    'Hot',
  ];
  for (const ticketType of ticketTypes) {
    try {
      resps.push(await getRobotaUaTicketRest({ ticketType }));
    } catch (e) {
      console.log({ ticketType }, 'failed');
    }
  }
  return resps;
  // devLog(query);
  // for (let i = 1; i < 2; i++) {
  //   try{
  //     const a = await robotaUaCustomGet({ url: `/api/service/list/${i}` });
  //     // devLog({ i }, a);
  //     resps.push(a)
  //     for (const service of a) {
  //       devLog(service)
  //     }
  //   }
  //   catch(e){
  //     // devLog(e.status)
  //   }
  // }
  // // devLog(await getWorkUaAvailablePublications());
  // return resps;
  const devRobotaUavacancy = {
    vacancyId: 10646940,
    notebookId: 7973901,
    vacancyName: 'Рекрутер, менеджер з продажу послуг',
    currencyId: 1,
    currencySign: 'грн.',
    code: '',
    salary: 0,
    scheduleId: 1,
    experienceId: 0,
    educationId: 0,
    description:
      '<html><head></head><body><p style="font-style: normal; font-weight: 400">Стань частиною команди, яка допомагає людям знаходити роботу та стабільний дохід у сервісах <strong style="font-weight: 700">Bolt</strong> і <strong style="font-weight: 700">Uklon</strong>!</p><p style="font-style: normal; font-weight: 400">Ми — сучасна мережа автопарків, яка працює в більшості міст України, і зараз шукаємо <strong style="font-weight: 700">енергійного та відповідального рекрутера</strong>, який допоможе нам зростати ще швидше</p><p style="font-style: normal; font-weight: 400"><strong style="font-weight: 700">Що очікуємо від тебе:</strong></p><ul style="font-style: normal; font-weight: 400"><li>Досвід роботи <strong style="font-weight: 700">на аналогічній посаді</strong> або в <strong style="font-weight: 700">сфері продажів</strong></li><li>Водійське посвідчення (буде перевагою)</li><li>Бажання працювати на результат, вміння планувати свій час</li><li>Комунікабельність, відкритість до нового</li><li>Впевнене користування <strong style="font-weight: 700">Microsoft Office (Word, Excel, PowerPoint)</strong> та <strong style="font-weight: 700">Google Docs</strong></li></ul><p style="font-style: normal; font-weight: 400"><strong style="font-weight: 700">Що ти будеш </strong><strong style="font-weight: 700">виконувати:</strong></p><ul style="font-style: normal; font-weight: 400"><li>Активно шукати кандидатів</li><li>Проводити співбесіди, оцінювати кандидатів</li><li>Користуватись різними каналами пошуку: соцмережі, job-сайти, месенджери</li><li>Оформлювати нових водіїв (договори, реєстрація, CRM, Telegram-чати)</li></ul><p style="font-style: normal; font-weight: 400"><strong style="font-weight: 700">Ми пропонуємо:</strong></p><ul style="font-style: normal; font-weight: 400"><li>Роботу в компанії, яка постійно зростає</li><li>Комфортні умови праці та дружню атмосферу в команді</li><li>Можливість <strong style="font-weight: 700">кар\'єрного та фінансового зростання</strong></li><li><strong style="font-weight: 700">Офіційне працевлаштування</strong></li><li>Г<strong style="font-weight: 700">рафік роботи</strong>: Пн-Пт, з 9:00 до 18:00</li></ul><p style="font-style: normal; font-weight: 400"><strong style="font-weight: 700">Зацікавила позиція?</strong></p><p style="font-style: normal; font-weight: 400"><strong style="font-weight: 700">З радістю поспілкуємося — надсилайте резюме та телефонуйте!</strong></p><p style="font-style: normal; font-weight: 400"><strong style="font-weight: 700">Анна:</strong> <span data-vacancyphone>+380633954598</span> <strong style="font-weight: 700">tg — @abbasova22</strong></p></body></html>',
    activeToDate: '2025-07-12T01:33:57.503',
    contactPerson: 'Анна - рекрутер',
    contactPhone: '+380735834587',
    contactEmail: 'anitaabbasova13@gmail.com',
    contactFax: '',
    contactURL: 'https://boltua.com/car',
    state: 'Closed',
    vacancyDate: '2025-07-07T18:26:41.537',
    companyName: 'Boltua ',
    branchId: 30,
    vacancyBranchId: 0,
    isPaid: false,
    logo: '7973901_20250622224002.png',
    isDesign: false,
    designId: 0,
    formApplyClicks: 0,
    formApplySents: 0,
    isFormApplyCustomUrl: false,
    formApplyCustomUrl: '',
    regionalPackageId: '18',
    finishDate: '2025-07-12T01:33:57.503',
    endingType: 'CloseAndNotify',
    isFree: true,
    profLevelId: 3,
    isAnonymous: false,
    isControlQuestionExist: false,
    hasDesign: false,
    isAlreadySent: false,
    sendResumeType: 'EmailAndCvArchive',
    isAgency: false,
    banComment: '',
    multiUserId: 2385874,
    pzNames: 'Recruiter',
    blockingReasonIds: '',
    blockingDate: '0001-01-01T00:00:00',
    isHideInProfile: false,
    isAskAttachExperience: false,
    isAskAttachExperience_IsShow: false,
    rating: 0,
    isHot: false,
    hotStartDate: '0001-01-01T00:00:00',
    hotEndDate: '0001-01-01T00:00:00',
    neverModeratedByRubric: false,
    endPublicationDate: '2025-07-12T01:33:57.503',
    vacancyLanguage: 3,
    vacancyAddress: '',
    isSpecialNeedsPeople_Enable: false,
    customBlockingReason100_Text: '',
    isEnableResponseWithNoResume: false,
    cityId: 17,
    metroName: '',
    metroId: 0,
    metroBranchId: 0,
    salaryDescr: '',
    isShowMap: true,
    latitude: 49.5897423,
    longitude: 34.5507948,
    salaryFrom: null,
    salaryTo: null,
    languages: [],
    designTypeId: 3,
    rubricList: [
      {
        rubricId: 31,
        parentRubricId: 3,
        rubricName:
          'HR спеціалісти - Бізнес-тренери => Фахівець з підбору персоналу / Рекрутер',
        rubric2Name: 'Фахівець з підбору персоналу / Рекрутер',
        isMain: true,
      },
    ],
    publishType: 'Business',
    isEnableImage: true,
    multiUserName: 'Роксолана Мудра',
    resumeToVacancyCount: 2,
    unreadResumeToVacancyCount: 0,
    searchTags: [],
    isModeratedRubric: true,
    superCandidateSentLastDate: '0001-01-01T00:00:00',
    updateDate: '2025-07-07T18:26:39.897',
    addDate: '2025-07-07T18:26:39.78',
  };

  const { robota_ua_vacancy_id, robota_ua_publication_type } = query;

  //  const { robotaUaVacancy } = await getRobotaAndWokUaVacanciesById({
  //   robota_ua_vacancy_id,
  // });
  // devLog({ robotaUaVacancy });
  // return
  // const publishTypeId = robotaUaPublicationTypes.find(
  //   (type) => type.name == robota_ua_publication_type
  // )?.id;
  const resp = await changeRobotaUaVacancyPublicationType({
    robotaUaVacancy: devRobotaUavacancy,
    robota_ua_publication_type,
  });
  devLog({ resp });
  const { robotaUaVacancy } = await getRobotaAndWokUaVacanciesById({
    robota_ua_vacancy_id,
  });
  devLog({ robotaUaVacancy });
};
