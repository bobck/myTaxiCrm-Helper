import { robotaUaCities } from '../robotaua.constants.mjs';
import { processResumeSearchResult } from '../robotaua.business-entity.mjs';
import { devLog } from '../../../shared/shared.utils.mjs';
import { cityListWithAssignedBy as bitrixCities } from '../../../bitrix/bitrix.constants.mjs';
import { coldSourceRobotaUaByTerm } from '../robotaua.utils.mjs';

export const runDriverColdSourcing = async () => {
  const searchParams = {
    keyWords: 'Водій',
    cityId: 1,
    period: 'ThreeDays', // Fresh candidates
    searchType: 'speciality',
    // hasPhoto: true
  };
  const searchResult = await coldSourceRobotaUaByTerm(searchParams);

  const processedCandidates = searchResult.documents.map((resume) => {
    const robotaCityConfig = robotaUaCities.find((c) => c.id === resume.cityId);

    if (robotaCityConfig) {
      const bitrixCityConfig = bitrixCities.find(
        (bc) => bc.auto_park_id === robotaCityConfig.auto_park_id
      );
    }

    return processResumeSearchResult(resume, bitrixCityId);
  });

  processedCandidates.forEach((candidate) => devLog(candidate));
  devLog('Processed Candidates:', processedCandidates.length);
  return processedCandidates;
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await runDriverColdSourcing();
}
