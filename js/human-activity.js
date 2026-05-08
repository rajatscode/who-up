/**
 * Human Activity Simulation
 * Generates procedural agents representing people based on time, location, and patterns
 */

// Activity patterns by local hour (percentage of population awake/active)
// Based on typical human sleep schedules + work patterns
const ACTIVITY_PATTERNS = {
  // 0 = midnight, 6 = 6am, 12 = noon, 18 = 6pm, 23.99 = 11:59pm
  0: { awake: 0.05, description: 'deep sleep', activity: 'sleeping' },
  1: { awake: 0.03, description: 'deep sleep', activity: 'sleeping' },
  2: { awake: 0.02, description: 'deep sleep, night workers', activity: 'sleeping' },
  3: { awake: 0.03, description: 'deep sleep, hospitals + cleaners', activity: 'working' },
  4: { awake: 0.05, description: 'early risers, night shift ending', activity: 'mixed' },
  5: { awake: 0.15, description: 'waking up, commutes starting', activity: 'waking' },
  6: { awake: 0.35, description: 'morning rush, breakfast', activity: 'waking' },
  7: { awake: 0.65, description: 'commute, school starts', activity: 'commuting' },
  8: { awake: 0.82, description: 'work/school in full swing', activity: 'working' },
  9: { awake: 0.88, description: 'peak work hours', activity: 'working' },
  10: { awake: 0.89, description: 'peak work hours', activity: 'working' },
  11: { awake: 0.88, description: 'late morning, approaching lunch', activity: 'working' },
  12: { awake: 0.87, description: 'lunch time', activity: 'eating' },
  13: { awake: 0.86, description: 'afternoon work', activity: 'working' },
  14: { awake: 0.87, description: 'afternoon work', activity: 'working' },
  15: { awake: 0.88, description: 'late afternoon', activity: 'working' },
  16: { awake: 0.89, description: 'late afternoon work', activity: 'working' },
  17: { awake: 0.90, description: 'commute home starting', activity: 'commuting' },
  18: { awake: 0.89, description: 'evening commute, dinner prep', activity: 'commuting' },
  19: { awake: 0.87, description: 'dinner time', activity: 'eating' },
  20: { awake: 0.85, description: 'evening leisure, family time', activity: 'leisure' },
  21: { awake: 0.80, description: 'evening entertainment, social', activity: 'leisure' },
  22: { awake: 0.55, description: 'winding down, going to bed', activity: 'sleeping' },
  23: { awake: 0.25, description: 'sleeping', activity: 'sleeping' },
};

/**
 * Get activity pattern for a given local hour
 */
export function getActivityPattern(localHour) {
  const hour = Math.floor(localHour);
  return ACTIVITY_PATTERNS[hour] || ACTIVITY_PATTERNS[0];
}

/**
 * Generate procedural agents for a city/region
 * Returns array of agent objects representing people
 */
export function generateAgentsForRegion(regionName, populationCount, lat, lon, localHour) {
  const pattern = getActivityPattern(localHour);
  const awakeCount = Math.round(populationCount * pattern.awake);

  // Create agents representing awake people
  const agents = [];

  // Simple grid-based distribution (would be smarter with actual street networks)
  const agentCount = Math.min(awakeCount, 1000); // Cap at 1000 rendered agents per region for perf
  const density = populationCount / agentCount;

  for (let i = 0; i < agentCount; i++) {
    // Distribute agents in and around the city center
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.5; // Within ~30km of city center

    agents.push({
      id: `${regionName}_${i}`,
      position: {
        lat: lat + radius * Math.cos(angle),
        lon: lon + radius * Math.sin(angle),
      },
      activity: pattern.activity,
      awake: Math.random() < pattern.awake, // Individual variation
      localHour: localHour,
      speed: getActivitySpeed(pattern.activity), // pixels per frame
      direction: Math.random() * Math.PI * 2, // Random direction
      density: density,
    });
  }

  return agents;
}

/**
 * Get movement speed for an activity type
 */
function getActivitySpeed(activity) {
  const speeds = {
    sleeping: 0,
    working: 0.5,
    commuting: 2.0,
    eating: 0.2,
    leisure: 0.3,
    waking: 1.0,
    mixed: 0.8,
  };
  return speeds[activity] || 0.5;
}

/**
 * Generate global activity summary for a given UTC time
 */
export function getGlobalActivitySummary(date) {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;

  // Sample major cities and their local times
  const majorCities = [
    { name: 'Tokyo', utcOffset: 9, population: 37.4e6 },
    { name: 'Shanghai', utcOffset: 8, population: 28.5e6 },
    { name: 'Delhi', utcOffset: 5.5, population: 32.9e6 },
    { name: 'São Paulo', utcOffset: -3, population: 22.4e6 },
    { name: 'Mexico City', utcOffset: -6, population: 21.8e6 },
    { name: 'New York', utcOffset: -5, population: 18.8e6 },
    { name: 'Cairo', utcOffset: 2, population: 21.8e6 },
  ];

  const summary = {
    timestamp: date.toISOString(),
    utcHour: utcHour,
    globalAwake: 0,
    byActivity: {
      sleeping: 0,
      working: 0,
      commuting: 0,
      eating: 0,
      leisure: 0,
      waking: 0,
      mixed: 0,
    },
    cities: [],
  };

  let totalPopulation = 0;

  majorCities.forEach(city => {
    const localHour = (utcHour + city.utcOffset) % 24;
    const pattern = getActivityPattern(localHour);
    const awakeCount = city.population * pattern.awake;

    summary.globalAwake += awakeCount;
    summary.byActivity[pattern.activity] = (summary.byActivity[pattern.activity] || 0) + awakeCount;

    summary.cities.push({
      name: city.name,
      population: city.population,
      awake: Math.round(awakeCount),
      awakePercent: Math.round(pattern.awake * 100),
      localHour: localHour,
      activity: pattern.activity,
      description: pattern.description,
    });

    totalPopulation += city.population;
  });

  // Scale up from sampled cities to global estimate
  summary.globalAwake = Math.round(summary.globalAwake * (8.1e9 / totalPopulation));

  return summary;
}

/**
 * Get rich narrative description of what's happening globally right now
 */
export function getNarrativeDescription(summary) {
  const lines = [];
  const topActivities = Object.entries(summary.byActivity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Major cities description
  const peakCities = summary.cities.filter(c => c.awakePercent > 75);
  const sleepingCities = summary.cities.filter(c => c.awakePercent < 25);

  if (peakCities.length > 0) {
    const names = peakCities.map(c => c.name).join(', ');
    lines.push(`🌅 Waking up or at peak activity: ${names}`);
  }

  if (sleepingCities.length > 0) {
    const names = sleepingCities.map(c => c.name).join(', ');
    lines.push(`😴 Sleeping: ${names}`);
  }

  // Activity patterns
  const workingCount = summary.byActivity.working + summary.byActivity.commuting;
  const sleepingCount = summary.byActivity.sleeping;

  if (workingCount > sleepingCount) {
    lines.push(`💼 More people working/commuting than sleeping right now`);
  } else {
    lines.push(`😴 Most people sleeping globally right now`);
  }

  return lines.join('\n');
}

/**
 * Interpolate agent movement (simple: move in direction with noise)
 */
export function updateAgentPosition(agent, deltaTime = 0.016) {
  if (!agent.awake || agent.activity === 'sleeping') {
    return; // Sleeping people don't move
  }

  // Random walk with momentum (realistic-ish)
  const turnAmount = (Math.random() - 0.5) * 0.1;
  agent.direction += turnAmount;

  const distance = agent.speed * deltaTime;
  agent.position.lat += Math.cos(agent.direction) * distance * 0.001;
  agent.position.lon += Math.sin(agent.direction) * distance * 0.001;

  // Occasionally change direction
  if (Math.random() < 0.02) {
    agent.direction = Math.random() * Math.PI * 2;
  }
}
