import { robotaUaCities } from '../robotaua.constants.mjs';
import { processResumeSearchResult } from '../robotaua.business-entity.mjs';
import { devLog } from '../../../shared/shared.utils.mjs';
import { cityListWithAssignedBy as bitrixCities } from '../../../bitrix/bitrix.constants.mjs';
import { coldSourceRobotaUaByTerm } from '../robotaua.utils.mjs';
import {
  getSourcedCandidateIds,
  saveSourcedCandidate,
} from '../robotaua.queries.mjs';
import {
  fetchColdSourcingConfig,
  ensureColdSourcingSheet,
  exportCandidatesToSheet,
  debugAuth,
} from '../../../sheets/sheets.utils.mjs';

export const runDriverColdSourcing = async () => {
  try {
    devLog('--- Starting Cold Sourcing (Google Sheets Config) ---');

    // 1. Fetch Configuration
    const searchConfigs = await fetchColdSourcingConfig();

    if (searchConfigs.length === 0) {
      devLog('No valid keywords configured in the Google Sheet.');
      return;
    }

    // 2. Load History (to prevent duplicates)
    const existingIds = await getSourcedCandidateIds();
    devLog(`Loaded ${existingIds.length} existing candidate IDs.`);

    // 3. Process each Config Row
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

      // 4. Fetch Candidates
      const searchResult = await coldSourceRobotaUaByTerm(
        searchParams,
        existingIds, // Exclude global history
        limit // Stop after limit
      );

      if (searchResult.documents.length === 0) {
        devLog(`No new candidates found.`);
        continue;
      }

      const candidatesToExport = [];

      // 5. Process & Save to DB
      for (const resume of searchResult.documents) {
        let bitrixCityId = null;

        // Map Bitrix City Logic
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

        const candidateDto = processResumeSearchResult(resume, bitrixCityId);
        candidatesToExport.push(candidateDto);

        // Save to SQLite
        await saveSourcedCandidate({
          resume_id: resume.resumeId,
          keyword: keyword,
          city_id: resume.cityId,
        });

        // Add to local exclusion for subsequent iterations in this run
        existingIds.push(resume.resumeId);
      }

      // 6. Export to Sheets
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

// Auto-run in DEV/TEST
if (process.env.ENV === 'DEV' || process.env.ENV === 'TEST') {
  // debugAuth()
  await runDriverColdSourcing();
}
