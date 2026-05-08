/**
 * Main entry point for who-up globe
 */
import { GlobeRenderer } from './globe.js?v=22';
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
const syncTimeEl = document.getElementById('sync-time');

// Live data sync tracking
let lastSyncTime = Date.now();

// Initialize globe
const globe = new GlobeRenderer(canvas);

/**
 * Time-lapse clock system
 * Default: live mode (returns real time)
 * Time-lapse: advances simulated time by deltaMs * speed each frame
 */
let timelapseActive = false;
let timelapsePlaying = false;
let timelapseSpeed = 10;
let simTime = Date.now();       // simulated epoch ms
let lastFrameTime = Date.now(); // real ms of last frame

function getSimTime() {
  if (!timelapseActive) return new Date();
  return new Date(simTime);
}

function advanceSimTime() {
  if (!timelapseActive || !timelapsePlaying) return;
  const realNow = Date.now();
  const deltaMs = Math.min(realNow - lastFrameTime, 100); // cap to avoid huge jumps
  simTime += deltaMs * timelapseSpeed;
  lastFrameTime = realNow;
}

// Time-lapse DOM
const timelapseBar = document.getElementById('timelapse-bar');
const timelapseBtnToggle = document.getElementById('tl-toggle');
const timelapseBtnPlay = document.getElementById('tl-play');
const timelapseBtnLive = document.getElementById('tl-live');
const timelapseTimeEl = document.getElementById('tl-time');
const timelapseSpeedBtns = document.querySelectorAll('.tl-speed-btn');

// Update schedule handles
let slowUpdateHandle = null;
let updateStatsHandle = null;

function startSlowUpdateSchedule() {
  if (slowUpdateHandle) clearInterval(slowUpdateHandle);
  const delay = getNextUpdateTime(10000);
  setTimeout(() => {
    slowUpdate();
    slowUpdateHandle = setInterval(slowUpdate, 10000);
  }, delay);
}

function startFrequentUpdates() {
  if (slowUpdateHandle) clearInterval(slowUpdateHandle);
  if (updateStatsHandle) clearInterval(updateStatsHandle);
  slowUpdateHandle = setInterval(slowUpdate, 1000);   // Every 1s during timelapse
  updateStatsHandle = setInterval(updateStats, 2000);  // Every 2s during timelapse
}

// Toggle time-lapse mode on/off
timelapseBtnToggle.addEventListener('click', () => {
  if (timelapseActive) {
    // Return to live
    goLive();
  } else {
    // Enter time-lapse
    timelapseActive = true;
    timelapsePlaying = false;
    simTime = Date.now();
    lastFrameTime = Date.now();
    timelapseBar.classList.add('visible');
    timelapseBtnToggle.textContent = 'LIVE';
    timelapseBtnToggle.classList.add('tl-return');
    timelapseBtnPlay.textContent = '\u25B6'; // play icon
    displayedCount = estimateAwake(getSimTime()); // snap counter
    // Force immediate update
    slowUpdate();
    updateStats();
    // Switch to frequent updates during timelapse
    startFrequentUpdates();
  }
});

// Play/Pause
timelapseBtnPlay.addEventListener('click', () => {
  timelapsePlaying = !timelapsePlaying;
  lastFrameTime = Date.now();
  timelapseBtnPlay.textContent = timelapsePlaying ? '\u275A\u275A' : '\u25B6';
});

// Live button — snap back to real time
timelapseBtnLive.addEventListener('click', goLive);

function goLive() {
  timelapseActive = false;
  timelapsePlaying = false;
  timelapseBar.classList.remove('visible');
  timelapseBtnToggle.textContent = 'Time-lapse';
  timelapseBtnToggle.classList.remove('tl-return');
  displayedCount = estimateAwake(new Date()) * 0.95; // smooth transition back
  slowUpdate();
  updateStats();
  // Switch back to synchronized updates
  startSlowUpdateSchedule();
  if (updateStatsHandle) clearInterval(updateStatsHandle);
  const statsDelay = getNextUpdateTime(60000);
  setTimeout(() => {
    updateStats();
    updateStatsHandle = setInterval(updateStats, 60000);
  }, statsDelay);
}

// Speed buttons
timelapseSpeedBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    timelapseSpeed = parseInt(btn.dataset.speed);
    timelapseSpeedBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

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
  const now = getSimTime();
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
  const now = getSimTime();
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

    // Highlight hovered city marker
    globe.highlightMarker(city.name);
    canvas.style.cursor = 'pointer';
  } else {
    tooltip.classList.add('hidden');
    canvas.style.cursor = 'grab';
  }
});

canvas.addEventListener('mouseleave', () => {
  tooltip.classList.add('hidden');
  canvas.style.cursor = 'grab';
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

      // Minimal visual feedback — just a subtle pulse at click point
      const feedback = document.createElement('div');
      feedback.style.position = 'fixed';
      feedback.style.left = e.clientX + 'px';
      feedback.style.top = e.clientY + 'px';
      feedback.style.width = '30px';
      feedback.style.height = '30px';
      feedback.style.transform = 'translate(-50%, -50%)';
      feedback.style.borderRadius = '50%';
      feedback.style.border = '2px solid rgba(127,219,218,0.6)';
      feedback.style.pointerEvents = 'none';
      feedback.style.zIndex = '25';
      feedback.style.animation = 'pulse-out 0.6s ease-out forwards';
      document.body.appendChild(feedback);
      setTimeout(() => feedback.remove(), 600);

      const country = getCountryAtPoint(lat, lonFromTheta);
      if (country) {
        showRegionalPanel(country.code, getSimTime());
        globe.orbitToLocation(lat, lonFromTheta, 12);
      } else {
        hideRegionalPanel();
      }
    }
  }
});

/**
 * Main animation loop
 */
function updateSyncDisplay() {
  const secondsAgo = Math.floor((Date.now() - lastSyncTime) / 1000);
  if (secondsAgo === 0) {
    syncTimeEl.textContent = 'Synced now';
  } else if (secondsAgo === 1) {
    syncTimeEl.textContent = 'Synced 1 second ago';
  } else if (secondsAgo < 60) {
    syncTimeEl.textContent = `Synced ${secondsAgo} seconds ago`;
  } else {
    const minutesAgo = Math.floor(secondsAgo / 60);
    syncTimeEl.textContent = `Synced ${minutesAgo}m ago`;
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Advance simulated clock if time-lapse is playing
  advanceSimTime();

  const now = getSimTime();
  globe.updateSunDirection(now);
  globe.render();

  // Update city detail (zoom-in visualization)
  updateCityDetail(globe.camera, globe.scene, now);

  // Smooth count animation every frame
  updateCountDisplay();

  // Update sync time display occasionally
  if (Math.random() < 0.01) updateSyncDisplay();

  // Update time-lapse display and markers at higher frequency during time-lapse
  if (timelapseActive && timelapsePlaying) {
    globe.updateMarkers(now);
    // Update time display
    const h = now.getUTCHours().toString().padStart(2, '0');
    const m = now.getUTCMinutes().toString().padStart(2, '0');
    const mon = now.toLocaleString('en', { month: 'short' });
    const day = now.getUTCDate();
    timelapseTimeEl.textContent = `${mon} ${day}, ${h}:${m} UTC`;
    // In time-lapse, snap counter faster
    displayedCount += (targetCount - displayedCount) * 0.4;
  }
}

/**
 * Update city info card (when zoomed in)
 */
function updateCityInfo() {
  const now = getSimTime();
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
 * Generate contextual insight message based on time of day
 */
function generateInsight() {
  const now = getSimTime();
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
  const globalAwake = estimateAwake(now);

  // Calculate actual local times in key regions
  const americasHour = (utcHour - 5 + 24) % 24;   // EST (UTC-5)
  const europeHour = (utcHour + 1) % 24;          // CET (UTC+1)
  const middleEastHour = (utcHour + 3) % 24;      // EAT (UTC+3)
  const asiaHour = (utcHour + 8) % 24;            // CST (UTC+8)
  const oceaniaHour = (utcHour + 10) % 24;        // AEST (UTC+10)

  const messages = [];

  // Real-time regional descriptions based on actual local time

  // Americas activity
  if (americasHour >= 0 && americasHour < 4) {
    messages.push('Americas in deep night — only essential overnight work');
  } else if (americasHour >= 4 && americasHour < 7) {
    messages.push('Americas pre-dawn — early risers and night shift ending');
  } else if (americasHour >= 7 && americasHour < 10) {
    messages.push('Americas morning surge — 200M+ commuting and waking');
  } else if (americasHour >= 10 && americasHour < 15) {
    messages.push('Americas midday peak — all three zones active');
  } else if (americasHour >= 15 && americasHour < 19) {
    messages.push('Americas afternoon momentum — West Coast ramping up');
  } else if (americasHour >= 19 && americasHour < 23) {
    messages.push('Americas evening peak — highest density of the day');
  } else {
    messages.push('Americas winding down — 150M+ still active before bed');
  }

  // Europe activity
  if (europeHour >= 0 && europeHour < 5) {
    messages.push('Europe deep sleep — only night workers active');
  } else if (europeHour >= 5 && europeHour < 7) {
    messages.push('Europe pre-dawn — farmers and early commuters');
  } else if (europeHour >= 7 && europeHour < 10) {
    messages.push('Europe morning rush — 150M+ commuting');
  } else if (europeHour >= 10 && europeHour < 12) {
    messages.push('Europe mid-morning — full productivity');
  } else if (europeHour >= 12 && europeHour < 14) {
    messages.push('Europe lunch break — brief activity dip');
  } else if (europeHour >= 14 && europeHour < 18) {
    messages.push('Europe afternoon work — post-lunch productivity');
  } else if (europeHour >= 18 && europeHour < 22) {
    messages.push('Europe evening — heading home from work');
  } else {
    messages.push('Europe settling down — 50M+ still awake');
  }

  // Asia activity
  if (asiaHour >= 0 && asiaHour < 5) {
    messages.push('Asia night sleep — minimal activity');
  } else if (asiaHour >= 5 && asiaHour < 7) {
    messages.push('Asia dawn — first commuters leaving home');
  } else if (asiaHour >= 7 && asiaHour < 10) {
    messages.push('Asia morning surge — 1B+ getting to work');
  } else if (asiaHour >= 10 && asiaHour < 13) {
    messages.push('Asia late morning — intense work phase');
  } else if (asiaHour >= 13 && asiaHour < 15) {
    messages.push('Asia post-lunch — brief energy dip');
  } else if (asiaHour >= 15 && asiaHour < 18) {
    messages.push('Asia afternoon grind — 1.5B+ at peak');
  } else if (asiaHour >= 18 && asiaHour < 22) {
    messages.push('Asia evening shift — heading home');
  } else {
    messages.push('Asia late night — 500M+ still awake');
  }

  // Global trend
  const now1h = new Date(now.getTime() - 3600000);
  const awake1h = estimateAwake(now1h);
  const delta = globalAwake - awake1h;

  if (Math.abs(delta) > 200e6) {
    if (delta > 0) {
      messages.push(`Surge: +${(delta / 1e6).toFixed(0)}M waking in the last hour`);
    } else {
      messages.push(`Decline: ${(delta / 1e6).toFixed(0)}M falling asleep in the last hour`);
    }
  } else {
    messages.push(`Steady: ~${Math.round(globalAwake / 1e9 * 10) / 10}B awake globally`);
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Periodic update for markers + stats
 */
function slowUpdate() {
  const now = getSimTime();
  globe.updateMarkers(now);
  updateCityInfo();

  // Update insight message
  const insightEl = document.getElementById('insight-message');
  insightEl.textContent = generateInsight();
  insightEl.classList.remove('hidden');

  // Update sync timestamp
  lastSyncTime = Date.now();
  updateSyncDisplay();
}

// Initialize
console.log('who-up: initializing...');

initRegionalUI();
initCityDetail(globe.scene);

// Wire regional close button to camera orbit animation
document.getElementById('regional-close-btn').addEventListener('click', () => {
  globe.orbitToGlobal();
});

// Sync updates to UTC seconds for cross-tab consistency
function getNextUpdateTime(interval) {
  const now = Date.now();
  const nextSyncTime = Math.ceil(now / interval) * interval;
  return nextSyncTime - now;
}

// Initial count — start at 85% for fast dramatic ramp-up
targetCount = estimateAwake(getSimTime());
displayedCount = targetCount * 0.85;

// Start
slowUpdate();
updateStats();
startSlowUpdateSchedule();
const statsDelay = getNextUpdateTime(60000);
setTimeout(() => {
  updateStats();
  updateStatsHandle = setInterval(updateStats, 60000);
}, statsDelay);

animate();

// Ensure canvas is fully visible
setTimeout(() => {
  canvas.style.opacity = '1';
}, 500);

console.log('who-up: globe is live!');
