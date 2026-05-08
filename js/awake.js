/**
 * Awake-human estimation engine.
 * Uses timezone-based population data and sleep pattern heuristics
 * to estimate how many people are awake at any given UTC time.
 */

import { POPULATION_CENTERS } from './city-data.js';

// Total world population (UN 2024)
const WORLD_POPULATION = 8.2e9;

// Sum of tracked city populations
const TRACKED_POPULATION = POPULATION_CENTERS.reduce((sum, c) => sum + c.pop, 0) * 1e6;

// Scale factor: tracked cities scale up to world population
const SCALE_FACTOR = WORLD_POPULATION / TRACKED_POPULATION;

/**
 * Region-specific sleep profiles.
 * East Asia sleeps later, Southern Europe sleeps later.
 */
const SLEEP_PROFILES = {
  default:        { sleepStart: 23.0, sleepEnd: 1.5, wakeStart: 5.5, wakeEnd: 7.5, peakAwake: 0.75, deepSleep: 0.03 },
  eastAsia:       { sleepStart: 0.5,  sleepEnd: 2.5, wakeStart: 6.5, wakeEnd: 8.5, peakAwake: 0.78, deepSleep: 0.03 },
  southernEurope: { sleepStart: 0.0,  sleepEnd: 2.0, wakeStart: 6.0, wakeEnd: 8.0, peakAwake: 0.75, deepSleep: 0.03 },
};

function getSleepProfile(utcOffset) {
  if (utcOffset === 8 || utcOffset === 9) return SLEEP_PROFILES.eastAsia;
  if (utcOffset === 1) return SLEEP_PROFILES.southernEurope;
  return SLEEP_PROFILES.default;
}

/**
 * Returns wakefulness probability (0-1) given local hour and sleep profile.
 * Uses smooth sigmoid-like transitions for realistic curves.
 */
function wakeProbability(localHour, profile = SLEEP_PROFILES.default) {
  const { sleepStart, sleepEnd, wakeStart, wakeEnd, peakAwake, deepSleep } = profile;

  // Normalize hour to handle wrapping around midnight
  const h = localHour;

  // Core awake hours (handle midnight wrap when sleepStart < wakeEnd)
  if (sleepStart < wakeEnd) {
    if (h >= wakeEnd || h <= sleepStart) return peakAwake;
  } else {
    if (h >= wakeEnd && h <= sleepStart) return peakAwake;
  }

  // Waking up ramp
  if (h >= wakeStart && h < wakeEnd) {
    const t = (h - wakeStart) / (wakeEnd - wakeStart);
    return deepSleep + (peakAwake - deepSleep) * t * t; // quadratic ease-in
  }

  // Going to sleep ramp (handles midnight wrap)
  const sleepRampLen = ((sleepEnd - sleepStart + 24) % 24);
  const hoursIntoSleep = ((h - sleepStart + 24) % 24);
  if (hoursIntoSleep < sleepRampLen) {
    const t = hoursIntoSleep / sleepRampLen;
    return peakAwake - (peakAwake - deepSleep) * t * t; // quadratic ramp down
  }

  // Deep sleep
  const deepSleepEnd = wakeStart;
  const hoursIntoDark = ((h - sleepEnd + 24) % 24);
  const darkLen = ((deepSleepEnd - sleepEnd + 24) % 24);
  if (darkLen > 0 && hoursIntoDark < darkLen) {
    // Slight sinusoidal variation during deep sleep
    const t = hoursIntoDark / darkLen;
    return deepSleep + 0.02 * Math.sin(t * Math.PI);
  }

  return deepSleep;
}

/**
 * Get local hour for a given UTC hour and UTC offset
 */
function getLocalHour(utcHour, utcOffset) {
  let local = (utcHour + utcOffset) % 24;
  if (local < 0) local += 24;
  return local;
}

/**
 * Estimate total awake humans at a given Date
 */
export function estimateAwake(date) {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;

  let totalAwake = 0;
  for (const city of POPULATION_CENTERS) {
    const localHour = getLocalHour(utcHour, city.utcOffset);
    const profile = getSleepProfile(city.utcOffset);
    const prob = wakeProbability(localHour, profile);
    totalAwake += city.pop * 1e6 * prob;
  }

  // Scale up to world population
  return Math.round(totalAwake * SCALE_FACTOR);
}

/**
 * Get awake data for each population center (for rendering on globe)
 */
export function getAwakeData(date) {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;

  return POPULATION_CENTERS.map(city => {
    const localHour = getLocalHour(utcHour, city.utcOffset);
    const profile = getSleepProfile(city.utcOffset);
    const prob = wakeProbability(localHour, profile);
    return {
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      population: city.pop * 1e6,
      awake: Math.round(city.pop * 1e6 * prob),
      wakeProbability: prob,
      localHour: localHour,
    };
  });
}

/**
 * Get wakefulness value (0-1) for any lat/lon at given date.
 * Interpolates based on longitude → UTC offset approximation.
 */
export function getWakenessAtPoint(lat, lon, date) {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
  // Approximate UTC offset from longitude
  const utcOffset = lon / 15;
  const localHour = getLocalHour(utcHour, utcOffset);
  return wakeProbability(localHour);
}

/**
 * Format a number with commas and ~ prefix
 */
export function formatCount(n) {
  const billions = n / 1e9;
  if (billions >= 1) {
    return `~${billions.toFixed(1)} billion`;
  }
  const millions = n / 1e6;
  return `~${millions.toFixed(0)} million`;
}
