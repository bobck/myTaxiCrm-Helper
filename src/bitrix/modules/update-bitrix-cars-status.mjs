import {
  getCardIdsFromSpecialEntity,
  getAllSpecialEntityRows,
  updateCarStatusAndBrnad,
} from '../bitrix.utils.mjs';
import { getBrandStickers } from '../../bq/bq-utils.mjs';
import { getActualCarStatuses } from '../../web.api/web.api.utlites.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
const transliterateCyrillicToLatinChar = (char) => {
  const map = {
    А: 'A',
    В: 'B',
    Е: 'E',
    І: 'I',
    К: 'K',
    М: 'M',
    Н: 'H',
    О: 'O',
    Р: 'P',
    С: 'C',
    Т: 'T',
    Х: 'X',
  };
  return map[char] || char;
};

const transliterateCyrillicToLatinString = (plateNumber) => {
  return plateNumber.split('').map(transliterateCyrillicToLatinChar).join('');
};
const transliterationMapper = ({ licensePlateParam, arr }) => {
  return arr.map((item) => {
    const plate = item[licensePlateParam];
    const transliteratedPlate = transliterateCyrillicToLatinString(plate);
    const handledItem = { ...item, licensePlate: transliteratedPlate };
    delete handledItem[licensePlateParam];
    return handledItem;
  });
};

export async function updateBitrixCarsStatus() {
  const bitrixResponse = await getCardIdsFromSpecialEntity({
    entityTypeId: 138,
  });
  console.log({ bitrixResponse: bitrixResponse.length });
  const handledBitrixCards = transliterationMapper({
    arr: bitrixResponse,
    licensePlateParam: 'ufCrm4_1654801473656',
  }).sort((a, b) => {
    if (a.licensePlate < b.licensePlate) {
      return -1;
    }
    if (a.licensePlate > b.licensePlate) {
      return 1;
    }
    return 0;
  });
  const { rows: actualCarStatuses } = await getActualCarStatuses();
  const handledCarStatuses = transliterationMapper({
    arr: actualCarStatuses,
    licensePlateParam: 'license_plate',
  });
  //   console.log({ handledBitrixCards });
  console.log({ handledCarStatuses });

}
if (process.env.ENV == 'TEST') {
  await openSShTunnel;
  await updateBitrixCarsStatus();
}
