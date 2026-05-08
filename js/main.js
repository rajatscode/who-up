/**
 * Main entry point for who-up globe
 */
import { GlobeRenderer } from './globe.js?v=20';
import { estimateAwake, formatCount } from './awake.js';
import { showRegionalPanel, hideRegionalPanel, initRegionalUI } from './regional-ui.js';
import { getCountryAtPoint } from './geospatial.js';
import { getActivityPattern, generateAgentsForRegion } from './human-activity.js';
import { initCityDetail, updateCityDetail, getCurrentCity, isCityDetailVisible } from './city-detail.js';
import { getActivityDescription } from './activity-descriptions.js';

// DOM elements
const canvas = document.getElementById('globe-canvas');
const awakeCountEl = document.getElementById('awake-count');
const awakeLabelEl = document.getElementById('awake-label');
const statDeltaEl = document.getElementById('stat-delta');
const statProjectionEl = document.getElementById('stat-projection');
const tooltip = document.getElementById('tooltip');
const tooltipText = document.getElementById('tooltip-text');
const cityInfoEl = document.getElementById('city-info');
const cityNameEl = document.getElementById('city-name');
const cityTimeEl = document.getElementById('city-time');
const cityAwakeCountEl = document.getElementById('city-awake-count');
const cityAwakeLabelEl = document.getElementById('city-awake-label');
const cityActivityTextEl = document.getElementById('city-activity-text');

// Initialize globe
const globe = new GlobeRenderer(canvas);

/**
 * Live counter state
 */
let displayedCount = 0;
let targetCount = 0;

/**
 * Format a number with commas (no ~ prefix, exact display)
 */
function formatExact(n) {
  return n.toLocaleString();
}

/**
 * Format a delta with +/- prefix
 */
function formatDelta(n) {
  const millions = n / 1e6;
  const sign = millions >= 0 ? '+' : '';
  return `${sign}${millions.toFixed(1)}M`;
}

/**
 * Update the awake count with smooth per-frame animation
 */
function updateCountDisplay() {
  const now = new Date();
  targetCount = estimateAwake(now);

  // Smooth interpolation toward target
  // Faster lerp when far from target (initial load or large jumps)
  const diff = targetCount - displayedCount;
  const pctOff = Math.abs(diff) / (targetCount || 1);
  const lerpSpeed = pctOff > 0.5 ? 0.3 : pctOff > 0.1 ? 0.15 : 0.08;
  displayedCount += diff * lerpSpeed;

  // Add subtle tick jitter for live clock feel (±0.01% noise)
  const jitter = (Math.random() - 0.5) * displayedCount * 0.0002;
  const displayValue = Math.round(displayedCount + jitter);

  awakeCountEl.textContent = formatExact(displayValue);

  // Pulse animation when reaching target (within 0.5%)
  const pctOffTarget = Math.abs(displayValue - targetCount) / targetCount;
  if (pctOffTarget < 0.005) {
    awakeCountEl.classList.add('pulse');
    setTimeout(() => awakeCountEl.classList.remove('pulse'), 600);
  }
}

/**
 * Update the key statistics (delta + projection)
 */
function updateStats() {
  const now = new Date();
  const awakeNow = estimateAwake(now);

  // 1 hour ago
  const oneHourAgo = new Date(now.getTime() - 3600000);
  const awakeThen = estimateAwake(oneHourAgo);
  const delta = awakeNow - awakeThen;

  // 1 hour from now
  const oneHourLater = new Date(now.getTime() + 3600000);
  const awakeLater = estimateAwake(oneHourLater);
  const willWake = awakeLater - awakeNow;

  // Update delta display
  statDeltaEl.textContent = formatDelta(delta);
  statDeltaEl.className = 'stat-value ' + (delta >= 0 ? 'stat-positive' : 'stat-negative');

  // Update projection display
  statProjectionEl.textContent = formatDelta(willWake);
  statProjectionEl.className = 'stat-value ' + (willWake >= 0 ? 'stat-positive' : 'stat-negative');
}

/**
 * Tooltip on hover (throttled for perf)
 */
let lastTooltipTime = 0;
canvas.addEventListener('mousemove', (e) => {
  const now = performance.now();
  if (now - lastTooltipTime < 33) return; // ~30fps throttle
  lastTooltipTime = now;

  const city = globe.getMarkerAtScreen(e.clientX, e.clientY);
  if (city) {
    tooltip.classList.remove('hidden');
    tooltip.style.left = (e.clientX + 16) + 'px';
    tooltip.style.top = (e.clientY - 8) + 'px';

    const awakeM = (city.awake / 1e6).toFixed(1);
    const localH = Math.floor(city.localHour);
    const localM = Math.round((city.localHour % 1) * 60).toString().padStart(2, '0');
    tooltipText.textContent = `${city.name}: ~${awakeM}M awake (${localH}:${localM} local)`;
  } else {
    tooltip.classList.add('hidden');
  }
});

canvas.addEventListener('mouseleave', () => {
  tooltip.classList.add('hidden');
});

/**
 * Click on globe to show regional panel
 */
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const ndcX = (x / rect.width) * 2 - 1;
  const ndcY = -(y / rect.height) * 2 + 1;

  const raycaster = globe.getRaycaster();
  if (raycaster) {
    raycaster.setFromCamera({ x: ndcX, y: ndcY }, globe.camera);
    const intersects = raycaster.intersectObject(globe.earthMesh);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const GLOBE_RADIUS = 5;

      const lat = Math.asin(point.y / GLOBE_RADIUS) * (180 / Math.PI);
      const thetaRad = Math.atan2(point.z, -point.x);
      let lonFromTheta = (thetaRad * (180 / Math.PI)) - 180;
      while (lonFromTheta < -180) lonFromTheta += 360;
      while (lonFromTheta > 180) lonFromTheta -= 360;

      const country = getCountryAtPoint(lat, lonFromTheta);
      if (country) {
        showRegionalPanel(country.code, new Date());
      } else {
        hideRegionalPanel();
      }
    }
  }
});

/**
 * Main animation loop
 */
function animate() {
  requestAnimationFrame(animate);

  const now = new Date();
  globe.updateSunDirection(now);
  globe.render();

  // Update city detail (zoom-in visualization)
  updateCityDetail(globe.camera, globe.scene, now);

  // Smooth count animation every frame
  updateCountDisplay();
}

/**
 * Update city info card (when zoomed in)
 */
function updateCityInfo() {
  const now = new Date();
  const city = getCurrentCity();

  if (!city || !isCityDetailVisible()) {
    cityInfoEl.classList.remove('visible');
    return;
  }

  cityInfoEl.classList.add('visible');

  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  let localHour = (utcHour + city.utcOffset) % 24;
  if (localHour < 0) localHour += 24;
  const localHours = Math.floor(localHour);
  const localMins = Math.round((localHour % 1) * 60).toString().padStart(2, '0');

  const pattern = getActivityPattern(localHour);
  const cityAwake = Math.round(city.pop * 1e6 * pattern.awake);

  const description = getActivityDescription(city.name, localHour);

  cityNameEl.textContent = city.name;
  cityTimeEl.textContent = `${localHours}:${localMins}`;
  cityAwakeCountEl.textContent = formatCount(cityAwake);
  cityAwakeLabelEl.textContent = 'people awake';
  cityActivityTextEl.textContent = description || 'Local activity pattern...';
}

/**
 * Periodic update for markers + stats
 */
function slowUpdate() {
  const now = new Date();
  globe.updateMarkers(now);
  updateCityInfo();
}

// Initialize
console.log('who-up: initializing...');

initRegionalUI();
initCityDetail(globe.scene);

// Initial count — start at 85% for fast dramatic ramp-up
targetCount = estimateAwake(new Date());
displayedCount = targetCount * 0.85;

// Start
slowUpdate();
updateStats();
setInterval(slowUpdate, 10000);  // Markers every 10s
setInterval(updateStats, 60000); // Stats every 60s
animate();

// Fade-in reveal after first frame renders
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    canvas.style.opacity = '1';
  });
});

console.log('who-up: globe is live!');
