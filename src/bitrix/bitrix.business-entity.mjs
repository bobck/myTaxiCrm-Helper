import { DateTime } from 'luxon';
import { cityListWithAssignedBy as cityList } from './bitrix.constants.mjs';
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
const lowBrandingGoal=60;
const highBrandingGoal=90;
export function computeBrandingCardInProgressStage({ total_trips, isHighLoadedCity }) {
  const trips = Number(total_trips);
  const today = DateTime.local().startOf('day');
  const maxGoalGap = 30 - (today.weekday - 5) * 10;
  if (isNaN(trips)) {
    console.error('Trips must be a number');
  }
  let GOAL = lowBrandingGoal;

  if (isHighLoadedCity) {
    GOAL = highBrandingGoal;
  }
  const todaysTripsOptimalLowerBound = GOAL - maxGoalGap;
  if (trips >= GOAL) {
    return 'PREPARATION';
  } else if (trips < todaysTripsOptimalLowerBound) {
    return 'CLIENT';
  } else {
    return 'NEW';
  }
}
export function computeBrandingCardFinishedStage({ total_trips, isHighLoadedCity }) {
  const trips = Number(total_trips);

  if (isNaN(trips)) {
    console.error('Trips must be a number');
  }
  let GOAL = lowBrandingGoal;

  if (isHighLoadedCity) {
    GOAL = highBrandingGoal;
  }
  if (trips >= GOAL) {
    return 'SUCCESS';
  } else {
    return 'FAIL';
  }
}

export function getCityBrandingId(auto_park_id) {
  const matchingCity = cityList.find((obj) => obj.auto_park_id === auto_park_id);
  const { brandingId: cityBrandingId } = matchingCity;
  return { cityBrandingId };
}
export function isHighLoadedCityCheck(auto_park_id) {
  const matchingCity = cityList.find((obj) => obj.auto_park_id === auto_park_id);
  const { brandingId: cityBrandingId } = matchingCity;
  return cityBrandingId === '3780' || cityBrandingId === '3756';
}
