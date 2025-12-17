// src/job-boards/robota.ua/modules/cold_sourcing.mjs
import { robotaUaCities } from '../robotaua.constants.mjs';
import { processResumeSearchResult } from '../robotaua.business-entity.mjs';
import { devLog } from '../../../shared/shared.utils.mjs';
import { cityListWithAssignedBy as bitrixCities } from '../../../bitrix/bitrix.constants.mjs';
import { coldSourceRobotaUaByTerm } from '../robotaua.utils.mjs';

// Example: Retrieve existing IDs from DB (Mock function)
// In production, you would fetch this from your database
const getExistingCandidateIds = async () => {
  // return await db.query('SELECT resume_id FROM ...');
  return [12345, 67890]; // Mock data
};

export const runDriverColdSourcing = async () => {
  // 1. Get IDs to exclude (optional, prevents processing duplicates)
  const existingIds = await getExistingCandidateIds();

  const searchParams = {
    keyWords: 'Водій',
    cityId: 1, // Kyiv
    period: 'ThreeDays', // Fresh candidates
    searchType: 'speciality',
    count: 20, // Explicitly set page size
  };

  const searchResult = await coldSourceRobotaUaByTerm(
    searchParams,
    existingIds
  );

  const processedCandidates = searchResult.documents.map((resume) => {
    let bitrixCityId = null; // Defined in correct scope

    const robotaCityConfig = robotaUaCities.find((c) => c.id === resume.cityId);

    if (robotaCityConfig) {
      const bitrixCityConfig = bitrixCities.find(
        (bc) => bc.auto_park_id === robotaCityConfig.auto_park_id
      );
    }

    return processResumeSearchResult(resume, bitrixCityId);
  });

  processedCandidates.forEach((candidate) => devLog(candidate));
  devLog('Processed Candidates Count:', processedCandidates.length);

  return processedCandidates;
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await runDriverColdSourcing();
}
