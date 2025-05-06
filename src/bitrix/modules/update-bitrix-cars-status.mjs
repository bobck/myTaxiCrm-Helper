import {
  getCardIdsFromSpecialEntity,
  getAllSpecialEntityRows,
  updateCarStatusAndBrnad,
} from '../bitrix.utils.mjs';

function transliterateUkrainianPlateChar(char) {
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
  return map[char] || char; // Return mapped char or original if not in map (e.g., numbers)
}

function transliterateUkrainianPlate(plateNumber) {
  return plateNumber.split('').map(transliterateUkrainianPlateChar).join('');
}

export async function updateBitrixCarsStatus() {
  const bitrixResponse = await getCardIdsFromSpecialEntity({
    entityTypeId: 138,
  });
  console.log({ bitrixResponse: bitrixResponse.length });
  const transliteratedCards = bitrixResponse.map(
    ({ id, ufCrm4_1654801473656: license_plate }) => ({
      id,
      license_plate: transliterateUkrainianPlate(license_plate),
    })
  );
  
}
if (process.env.ENV == 'TEST') {
  await updateBitrixCarsStatus();
}
