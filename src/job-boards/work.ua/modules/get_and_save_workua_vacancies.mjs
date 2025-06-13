import {
  checkJobs,
  getResponsesByVacancyId,
  getVacancies,
  getVacancyIds,
} from '../workua.utils.mjs';
/**resume example
 * 
 * 
 * {
      id: '261838679',
      candidate_id: '1427',
      date: '2023-10-20T01:08:34+03:00',
      fio: 'Пав мир',
      birth_date: '1993-02-28',
      email: 'volk949@gmail.com',
      phone: '+3858375',
      type: 'resume',
      with_file: 0,
      text: 'Резюме від 20 жовтня 2023\n' +
        '\n' +
        'Водій\n' +
        ' Вік: 32 роки\n' +
        'Готовий працювати: Київ\n' +
        '\n' +
        'Контактна інформація\n' +
        'Адреса: Київ\n' +
        'Телефон: +3875\n' +
        'Ел. пошта: volk949@gmail.com\n' +
        '\n' +
        'Досвід роботи\n' +
        'Водій-міжнародник з 02.2019 по 05.2022 (3 роки 3 місяці)\n' +
        'Delivery-Auto (Транспорт, логістика)\n' +
        '\n' +
        'Знання і навички\n' +
        'Водійські права кат. B, Знання будови автомобіля, Уважність, Стресостійкість, Ініціативність, Водійські права кат. C, Водійські права кат. CE, Водійські права кат. D, Міжнародні перевезення\n' +
        '\n',
      job_id: 3599730
    }
 */
/**easy example
 * {
      id: '265251487',
      candidate_id: '14997',
      date: '2023-11-25T11:06:31+02:00',
      fio: 'Фр ий',
      birth_date: '2002-06-01',
      email: 'fko.com',
      phone: '+36471',
      type: 'easy',
      with_file: 0,
      cover: 'Шукаю компанію, яка візьме мене за умови двох повних робочих днів( з ранку і до ночі) на тиждень  та 5 вихідних',
      job_id: 3599730
    } */
/**file example
 * {
      id: '262272576',
      candidate_id: '14681',
      date: '2023-10-25T03:29:49+03:00',
      fio: 'Ткао Вс Вч',
      birth_date: '2002-05-22',
      email: 'vlako02@gmail.com',
      phone: '+38001',
      type: 'file',
      with_file: 1,
      text: 'В КО\n' +
        '\n' +
        'ОСОБИСТІ ДАНІ                      Охайний,ввічливий,працьовитий,вмію спілкуватися з людьми. На даний момент\n' +
        "Ім'я                               навчаюся в університеті на ветеринарного лікаря. В Києві проживаю вже більше 8\n" +
        'ко                 років.\n' +
        'Адреса                             Проживаю на лівому березі.\n' +
        'Харківське шосе 11233350/2221             Вільно володію украінською,англійською та москальскою мовою.\n' +
        'Київ                               Можу працювати по вівторкам,п’ятницям,суботам на неділям.\n' +
        'Номер телефону                     Або в інші дні за домовленостю(В понеділок очні пари в університеті з 13:00 до\n' +
        '+3801\n' +
        '18:00,в середу пари з 9:00 до 18:00,в четвер пари з 13:00 до 18:00)\n' +
        'Email\n' +
        'Власної автівки не маю. Працював в сфері доставки їжі швидкого приготування в\n' +
        'vlahenko02@gmail.com\n' +
        'місті Очакові 1 рік.можу працювати по вихідним\n' +
        'Дата народження\n' +
        '22-05-2002\n' +
        'Стать\n' +
        'Чоловіча\n' +
        'Сімейний стан\n' +
        'Не одружений\n' +
        'Посвідчення водія\n' +
        'Є\n' +
        '\f',
      job_id: 3599730
    },
 */
export const getAndSaveWorkUaVacanciesManually = async () => {
  console.log({
    module: 'getAndSaveWorkUaVacanciesManually',
    date: new Date(),
  });
  const { vacancyIds } = await getVacancyIds();
  console.log({ vacancyIds: vacancyIds.length });

  const promises = [];
  for (const [index, vacancyId] of vacancyIds.entries()) {
    if (index > 1) {
      break;
    }
    console.log({ vacancyId });
    // const a=await getResponsesByVacancyId({ vacancyId });
    // console.log(a)
    promises.push(getResponsesByVacancyId({ vacancyId }));
  }
  const responses = await Promise.all(promises);
  console.log(responses[0]);
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await getAndSaveWorkUaVacanciesManually();
}
