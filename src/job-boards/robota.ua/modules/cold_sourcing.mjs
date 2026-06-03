import { robotaUaCities } from '../robotaua.constants.mjs';
import { processResumeSearchResult } from '../robotaua.business-entity.mjs';
import { devLog } from '../../../shared/shared.utils.mjs';
import { coldSourceRobotaUaByTerm } from '../robotaua.utils.mjs';
import {
  getSourcedCandidateIds,
  saveSourcedCandidate,
} from '../robotaua.queries.mjs';
import {
  fetchColdSourcingConfig,
  ensureColdSourcingSheet,
  exportCandidatesToSheet,
} from '../../../sheets/sheets.utils.mjs';

export const runRobotaUaColdSourcing = async () => {
  try {
    devLog('--- Starting Cold Sourcing (Google Sheets Config) ---');

    const searchConfigs = await fetchColdSourcingConfig();
    console.log({
      module: 'robotaUaColdSourcing',
      keywordsCount: searchConfigs.length,
      date: new Date(),
    });
    if (searchConfigs.length === 0) {
      devLog('No valid keywords configured in the Google Sheet.');
      return;
    }

    const existingIds = await getSourcedCandidateIds();
    devLog(`Loaded ${existingIds.length} existing candidate IDs.`);

    for (const config of searchConfigs) {
      const { keyword, limit, cityName } = config;

      const foundCity = robotaUaCities.find(
        (c) => c.name.toLowerCase() === cityName.toLowerCase()
      );

      if (!foundCity) {
        console.error(`Warning: City "${cityName}" not found`);
        continue;
      }
      const targetCityId = foundCity.id;

      devLog(
        `\n>>> Processing: "${keyword}" in "${cityName}" (ID: ${targetCityId}) | Limit: ${limit}`
      );

      const searchParams = {
        keyWords: keyword,
        cityId: targetCityId,
      };

      const searchResult = await coldSourceRobotaUaByTerm(
        searchParams,
        existingIds,
        limit
      );

      if (searchResult.documents.length === 0) {
        devLog(`No new candidates found.`);
        continue;
      }

      const candidatesToExport = [];

      for (const resume of searchResult.documents) {
        const candidateDto = processResumeSearchResult(resume);
        candidatesToExport.push(candidateDto);

        await saveSourcedCandidate({
          resume_id: resume.resumeId,
          keyword: keyword,
          city_id: resume.cityId,
        });

        existingIds.push(resume.resumeId);
      }

      if (candidatesToExport.length > 0) {
        const sheetTitle = await ensureColdSourcingSheet(keyword, cityName);

        if (sheetTitle) {
          await exportCandidatesToSheet(sheetTitle, candidatesToExport);
        }
      }
    }

    devLog('\n--- Cold Sourcing Cycle Completed ---');
  } catch (error) {
    console.error('Error running Cold Sourcing:', error);
  }
};

if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  await runRobotaUaColdSourcing();
}
