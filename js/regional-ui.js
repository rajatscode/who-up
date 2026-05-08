/**
 * Regional UI management
 * Handles displaying and updating regional data panel
 */
import { getCountry, getCountriesByRegion } from './geospatial.js';
import { estimateAwake, getAwakeData, formatCount, getWakenessAtPoint } from './awake.js';

let selectedCountry = null;

/**
 * Show regional panel with country data
 */
export function showRegionalPanel(countryCode, date) {
  const country = getCountry(countryCode);
  if (!country) return;

  selectedCountry = country;

  // Get DOM elements
  const panel = document.getElementById('regional-panel');
  const countryName = document.getElementById('regional-country-name');
  const awakeCount = document.getElementById('regional-awake-count');
  const awakeLabel = document.getElementById('regional-awake-label');
  const percentage = document.getElementById('regional-percentage');
  const region = document.getElementById('regional-region');
  const citiesList = document.getElementById('regional-cities-list');
  const citiesContainer = document.getElementById('regional-cities');

  // Get cities in this country by ISO code match
  const awakeData = getAwakeData(date);
  const regionCities = awakeData.filter(city => city.country === countryCode);

  // Calculate awake population: sum tracked cities + estimate untracked
  let regionalAwake = regionCities.reduce((sum, city) => sum + city.awake, 0);
  const trackedPopulation = regionCities.reduce((sum, city) => sum + city.population, 0);

  if (country.population) {
    // Always estimate untracked population and add to total
    const wakenessProb = getWakenessAtPoint(0, country.utcOffset * 15, date);
    const totalCountryPop = country.population * 1e6; // convert millions to actual
    const untrackedPopulation = Math.max(0, totalCountryPop - trackedPopulation);
    const untrackedAwake = Math.round(untrackedPopulation * wakenessProb);
    regionalAwake += untrackedAwake;
  }

  const globalAwake = estimateAwake(date);
  const pctOfGlobal = globalAwake > 0 ? ((regionalAwake / globalAwake) * 100).toFixed(1) : 0;

  // Update panel content
  countryName.textContent = country.name;
  awakeCount.textContent = formatCount(regionalAwake);
  const cityText = regionCities.length > 0
    ? `people awake (${regionCities.length} tracked cities + estimate)`
    : `people awake (estimated from timezone)`;
  awakeLabel.textContent = cityText;
  percentage.textContent = `${pctOfGlobal}% of global awake population`;
  region.textContent = `Region: ${country.region}`;

  if (regionCities.length > 0) {
    citiesList.innerHTML = regionCities
      .sort((a, b) => b.population - a.population)
      .slice(0, 5) // Show top 5 cities
      .map(city => {
        const localHour = Math.floor(city.localHour);
        const localMin = Math.round((city.localHour % 1) * 60).toString().padStart(2, '0');
        const cityAwake = formatCount(city.awake);
        return `<div class="regional-city">${city.name}: ${cityAwake} awake (${localHour}:${localMin})</div>`;
      })
      .join('');
    citiesContainer.classList.remove('hidden');
  } else {
    citiesContainer.classList.add('hidden');
  }

  // Show panel
  panel.classList.remove('hidden');
}

/**
 * Hide regional panel
 */
export function hideRegionalPanel() {
  const panel = document.getElementById('regional-panel');
  panel.classList.add('hidden');
  selectedCountry = null;
}

/**
 * Get currently selected country
 */
export function getSelectedCountry() {
  return selectedCountry;
}

/**
 * Initialize regional UI event handlers
 */
export function initRegionalUI() {
  const closeBtn = document.getElementById('regional-close-btn');
  const panel = document.getElementById('regional-panel');

  closeBtn.addEventListener('click', () => {
    hideRegionalPanel();
  });

  // Close panel on outside click (optional)
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('hidden')) return;
    if (!panel.contains(e.target)) {
      // Only close if click wasn't on the globe area (canvas)
      const canvas = document.getElementById('globe-canvas');
      if (e.target !== canvas && !canvas.contains(e.target)) {
        hideRegionalPanel();
      }
    }
  });
}
