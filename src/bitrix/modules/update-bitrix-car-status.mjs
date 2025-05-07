import {
  getCardIdsFromSpecialEntity,
  updateCarStatusAndBrand,
  chunkArray,
} from '../bitrix.utils.mjs';
import { getBrandStickers } from '../../bq/bq-utils.mjs';
import { getActualCarStatuses } from '../../web.api/web.api.utlites.mjs';
import { openSShTunnel } from '../../../ssh.mjs';
const CHUNK_SIZE = 5; // chunk size only 5 because of bitrix data hurt risks
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

const mapBitrixProps = ({ item }) => {
  //- Один водій  7002 BUSY_WITH_PRIVATE_TRADER
  //- Єкіпаж  7004 BUSY_WITH_CREW
  //- Оренда  7006 RENTAL
  //- СТО  7008 ON_SERVICE_STATION
  //- ДТП  7010 ROAD_ACCIDENT
  //- Штрафмайданчик      7012 AUTO_POUND
  //- Без водія  7014 null
  //- Інше  7016 OTHER

  // brand sticker
  //- Присутнє  4042 not null
  //- Немає  4044 null
  //- Не відомо  6976 ?
  const copyItem = { ...item };
  const { carStatus, brandSticker } = item;
  switch (carStatus) {
    case 'BUSY_WITH_PRIVATE_TRADER':
      copyItem.carStatus = 7002;
      break;
    case 'BUSY_WITH_CREW':
      copyItem.carStatus = 7004;
      break;
    case 'RENTAL':
      copyItem.carStatus = 7006;
      break;
    case 'ON_SERVICE_STATION':
      copyItem.carStatus = 7008;
      break;
    case 'ROAD_ACCIDENT':
      copyItem.carStatus = 7010;
      break;
    case 'AUTO_POUND':
      copyItem.carStatus = 7012;
      break;
    case 'OTHER':
      copyItem.carStatus = 7016;
      break;
    default:
      copyItem.carStatus = 7014;
  }
  switch (brandSticker) {
    case null:
      copyItem.brandSticker = 4044;
      break;
    case '?':
      copyItem.brandSticker = 6976;
      break;
    default:
      copyItem.brandSticker = 4042;
  }
  return copyItem;
};
const joinData = ({ bitrixCards, carStatuses, brandStickers }) => {
  const joinedData = bitrixCards.map((bitrixCard) => {
    const carStatus = carStatuses.find(
      (carStatus) => carStatus.licensePlate === bitrixCard.licensePlate
    );
    const brandSticker = brandStickers.find(
      (brandSticker) => brandSticker.licensePlate === bitrixCard.licensePlate
    );
    const item = { ...bitrixCard };
    if (carStatus) {
      item.carStatus = carStatus.event_type;
    } else if (carStatus === undefined) {
      item.carStatus = null;
    }
    if (brandSticker) {
      item.brandSticker = brandSticker.brand;
    }
    if (brandSticker === undefined) {
      item.brandSticker = null;
    }

    return mapBitrixProps({ item });
  });
  return joinedData;
};

export async function updateBitrixCarStatus() {
  const bitrixResponse = await getCardIdsFromSpecialEntity({
    entityTypeId: 138,
  });
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
  const brandStickers = await getBrandStickers();
  const handledBrandStickers = transliterationMapper({
    arr: brandStickers,
    licensePlateParam: 'number',
  });
  const joinedData = joinData({
    bitrixCards: handledBitrixCards,
    carStatuses: handledCarStatuses,
    brandStickers: handledBrandStickers,
  });
  const chunkedData = chunkArray(joinedData, CHUNK_SIZE);
  //   console.log({ chunkedData: chunkedData.length });
  for (const chunk of chunkedData) {
    const result = await updateCarStatusAndBrand({ items: chunk });
    console.log({ result });
  }
}
if (process.env.ENV == 'TEST') {
  await openSShTunnel;
  await updateBitrixCarStatus();
  //   await updateCarStatusAndBrand({
  //     items: [
  //       {
  //         id: 9092,
  //         licensePlate: 'AA6716EM',
  //         carStatus: 7002,
  //         brandSticker: 4042,
  //       },
  //     ],
  //   });
}
