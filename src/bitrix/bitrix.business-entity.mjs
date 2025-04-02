import { DateTime } from 'luxon';
import { specialBrandingCities } from './bitrix.constants.mjs';

const defaultBrandingGoal = 60;

export function computePeriodBounds() {
  const today = DateTime.local().startOf('day');

  const lowerBound = today.minus({ days: today.weekday });

  const upperBound = lowerBound.plus({ days: 7 });

  // Return the dates formatted as ISO strings (YYYY-MM-DD) for PostgreSQL
  return {
    lowerBound,
    upperBound,
  };
}
export function computeBrandingCardInProgressStage({
  total_trips,
  auto_park_id,
}) {
  const trips = Number(total_trips);
  const today = DateTime.local().startOf('day');
  const maxGoalGap = 30 - (today.weekday - 5) * 10;
  if (isNaN(trips)) {
    console.error('Trips must be a number');
  }
  const GOAL = computeBrandingGoal({ auto_park_id });

  const todaysTripsOptimalLowerBound = GOAL - maxGoalGap;
  if (trips >= GOAL) {
    return 'PREPARATION';
  } else if (trips < todaysTripsOptimalLowerBound) {
    return 'CLIENT';
  } else {
    return 'NEW';
  }
}
export function computeBrandingCardFinishedStage({
  total_trips,
  auto_park_id,
}) {
  const trips = Number(total_trips);

  if (isNaN(trips)) {
    console.error('Trips must be a number');
  }
  const GOAL = computeBrandingGoal({ auto_park_id });

  if (trips >= GOAL) {
    return 'SUCCESS';
  } else {
    return 'FAIL';
  }
}

function computeBrandingGoal({ auto_park_id }) {
  const specialCity = specialBrandingCities.find(
    (city) => city.auto_park_id === auto_park_id
  );
  if (specialCity) {
    return specialCity.tripsGoal;
  }
  return defaultBrandingGoal;
}
