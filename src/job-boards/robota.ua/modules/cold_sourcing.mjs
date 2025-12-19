import { robotaUaCities } from '../robotaua.constants.mjs';
import { processResumeSearchResult } from '../robotaua.business-entity.mjs';
import { devLog } from '../../../shared/shared.utils.mjs';
import { cityListWithAssignedBy as bitrixCities } from '../../../bitrix/bitrix.constants.mjs';
import { coldSourceRobotaUaByTerm } from '../robotaua.utils.mjs';
import {
  getSourcedCandidateIds,
  saveSourcedCandidate,
} from '../robotaua.queries.mjs';
// Importing from your new module location
import {
  fetchSearchConfiguration,
  ensureSheetForKeyword,
  exportCandidatesToSheet,
} from '../../../sheets/modules/cold-soursing-sheets.mjs';

export const runDriverColdSourcing = async () => {
  try {
    devLog('--- Starting Cold Sourcing from Google Sheets Config ---');

    // 1. Fetch Configuration
    // Returns array of objects: { keyword, limit, cityName }
    const searchConfigs = await fetchSearchConfiguration();

    if (searchConfigs.length === 0) {
      devLog('No keywords configured in the Google Sheet.');
      return;
    }

    // 2. Load history to prevent duplicates across ALL keywords/runs
    const existingIds = await getSourcedCandidateIds();
    devLog(`Loaded ${existingIds.length} existing candidate IDs from history.`);

    // 3. Iterate through each configuration row
    for (const config of searchConfigs) {
      const { keyword, limit, cityName } = config;

      // --- A. Build Search Params ---

      // Resolve City Name to ID
      // let targetCityId = 1; // Default to Kyiv
      const foundCity = robotaUaCities.find(
        (c) => c.name.toLowerCase() === cityName.toLowerCase()
      );

      if (!foundCity) {
        console.warn(`Warning: City "${cityName}" not found in constants.`);
        continue;
      }
      const targetCityId = foundCity.id;

      devLog(
        `\n>>> Processing: "${keyword}" in "${cityName}" (ID: ${targetCityId}) - Limit: ${limit}`
      );

      const searchParams = {
        keyWords: keyword,
        cityId: targetCityId,
        period: 'ThreeDays', // Sourcing fresh candidates
        searchType: 'default', // Allows synonyms
        count: 20,
      };

      // --- B. Launch Sourcing ---
      const searchResult = await coldSourceRobotaUaByTerm(
        searchParams,
        existingIds, // Exclude globally sourced IDs
        limit // Stop after reaching the specific limit for this row
      );

      if (searchResult.documents.length === 0) {
        devLog(`No new candidates found for "${keyword}" in ${cityName}.`);
        continue;
      }

      const candidatesToExport = [];

      // Process Results & Save History
      for (const resume of searchResult.documents) {
        let bitrixCityId = null;

        // Map internal City IDs
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
        candidatesToExport.push(candidateDto);

        // Persist to SQLite immediately
        await saveSourcedCandidate({
          resume_id: resume.resumeId,
          keyword: keyword,
          city_id: resume.cityId,
        });

        // Update local exclusion list for the NEXT iteration in this run
        existingIds.push(resume.resumeId);
      }

      // --- C. Dynamic Sheet Creation & Data Loadout ---
      if (candidatesToExport.length > 0) {
        // Creates sheet: "Keyword - City" (e.g., "Водій - Київ")
        const sheetTitle = await ensureSheetForKeyword(keyword, cityName);

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
  await runDriverColdSourcing();
}
