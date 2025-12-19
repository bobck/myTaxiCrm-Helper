import { robotaUaCities } from '../robotaua.constants.mjs';
import { processResumeSearchResult } from '../robotaua.business-entity.mjs';
import { devLog } from '../../../shared/shared.utils.mjs';
import { cityListWithAssignedBy as bitrixCities } from '../../../bitrix/bitrix.constants.mjs';
import { coldSourceRobotaUaByTerm } from '../robotaua.utils.mjs';
import {
  getSourcedCandidateIds,
  saveSourcedCandidate,
} from '../robotaua.queries.mjs';
import { fetchSearchConfiguration } from '../../../sheets/sheets.utils.mjs';

export const runDriverColdSourcing = async () => {
  try {
    const resp = await fetchSearchConfiguration();
    devLog(resp)

    return;
    // 1. Load history to prevent duplicates
    const existingIds = await getSourcedCandidateIds();
    devLog(`Loaded ${existingIds.length} existing candidate IDs.`);

    // Configuration
    const CANDIDATE_LIMIT = 20;
    const searchParams = {
      keyWords: 'Водій',
      cityId: 1, // Kyiv
      period: 'ThreeDays',
      searchType: 'speciality',
      count: 20,
    };

    // 2. Fetch new candidates (pagination + filtration handled inside)
    const searchResult = await coldSourceRobotaUaByTerm(
      searchParams,
      existingIds,
      CANDIDATE_LIMIT
    );

    const processedCandidates = [];

    // 3. Process and Save
    for (const resume of searchResult.documents) {
      let bitrixCityId = null;

      // Map City IDs for CRM
      const robotaCityConfig = robotaUaCities.find(
        (c) => c.id === resume.cityId
      );

      if (robotaCityConfig) {
        const bitrixCityConfig = bitrixCities.find(
          (bc) => bc.auto_park_id === robotaCityConfig.auto_park_id
        );
        if (bitrixCityConfig) {
          bitrixCityId = bitrixCityConfig.brandingId;
        }
      }

      // Create Business Entity
      const candidateDto = processResumeSearchResult(resume, bitrixCityId);
      processedCandidates.push(candidateDto);

      // Persist to DB immediately with City ID
      await saveSourcedCandidate({
        resume_id: resume.resumeId,
        keyword: searchParams.keyWords,
        city_id: resume.cityId, // Saving the city ID from the resume
      });
    }

    // Output results
    processedCandidates.forEach((candidate) => devLog(candidate));
    devLog('Total New Candidates Processed:', processedCandidates.length);

    return processedCandidates;
  } catch (error) {
    console.error('Error running Driver Cold Sourcing:', error);
  }
};

// Execute if running in DEV/TEST mode
if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await runDriverColdSourcing();
  // devLog(robotaUaCities.map((city) => city.name));
}
