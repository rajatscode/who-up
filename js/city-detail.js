/**
 * City-detail rendering system
 * Shows procedural city grid + thousands of procedural humans (as dots) when zoomed in
 * Uses InstancedMesh for 60 FPS performance with 1000+ dots as single draw call
 */

import * as THREE from 'three';
import { getActivityPattern, generateAgentsForRegion } from './human-activity.js';
import { POPULATION_CENTERS } from './city-data.js';

const ZOOM_THRESHOLD = 12; // Camera distance to trigger city detail
const CITY_GRID_SIZE = 100; // 100x100 grid cells representing ~10km x 10km
const MAX_DOTS_PER_CITY = 5000;

let cityDetailGroup = null;
let cityGridMesh = null;
let instancedDots = null;
let instancedMatrix = new THREE.Matrix4();
let isDetailVisible = false;
let currentCity = null;
let agents = [];

/**
 * Initialize city detail system
 */
export function initCityDetail(scene) {
  // Create container group
  cityDetailGroup = new THREE.Group();
  cityDetailGroup.visible = false; // Hidden until zoom threshold
  scene.add(cityDetailGroup);

  // Create city grid (streets + buildings appearance)
  createCityGrid();
}

/**
 * Create procedural city grid (buildings, streets, density visualization)
 */
function createCityGrid() {
  const gridGeometry = new THREE.PlaneGeometry(10, 10, CITY_GRID_SIZE, CITY_GRID_SIZE);

  // Custom material for grid visualization
  const gridMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;

      void main() {
        // Street grid pattern
        vec2 grid = abs(fract(vUv * ${CITY_GRID_SIZE}.0) - 0.5) * 2.0;
        float gridLine = step(0.02, min(grid.x, grid.y));

        // Building density pattern (darker = more buildings)
        float density = sin(vUv.x * 20.0) * cos(vUv.y * 20.0) * 0.5 + 0.5;

        // Dark base with street grid
        vec3 color = mix(vec3(0.05 + density * 0.08), vec3(0.15), gridLine);

        gl_FragColor = vec4(color, 0.3);
      }
    `,
  });

  cityGridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
  cityGridMesh.rotation.x = Math.PI / 2; // Face up
  cityGridMesh.position.z = -0.01; // Slight offset below dots
  cityDetailGroup.add(cityGridMesh);

  // Create instanced mesh for population dots with breathing animation
  const dotGeometry = new THREE.SphereGeometry(0.05, 8, 8);

  // Add instanceId attribute to geometry for per-dot phase offset
  const instanceIds = new Float32Array(MAX_DOTS_PER_CITY);
  for (let i = 0; i < MAX_DOTS_PER_CITY; i++) {
    instanceIds[i] = i;
  }
  dotGeometry.setAttribute('instanceId', new THREE.BufferAttribute(instanceIds, 1));

  const dotMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(0xffb347) },
      uEmissiveColor: { value: new THREE.Color(0xff6b35) },
    },
    vertexShader: `
      uniform float uTime;
      attribute float instanceId;
      varying float vBreath;

      void main() {
        // Breathing pulse: sin oscillation with per-dot phase offset
        vBreath = sin(uTime * 2.0 + instanceId * 0.7) * 0.08 + 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uEmissiveColor;
      varying float vBreath;

      void main() {
        vec3 color = uBaseColor;
        vec3 emissive = uEmissiveColor * vBreath;
        gl_FragColor = vec4(color + emissive * 0.3, vBreath);
      }
    `,
  });

  instancedDots = new THREE.InstancedMesh(dotGeometry, dotMaterial, MAX_DOTS_PER_CITY);
  instancedDots.position.z = 0;
  cityDetailGroup.add(instancedDots);
}

/**
 * Update city detail based on camera position
 * Detects when user zooms into a city level
 */
export function updateCityDetail(camera, scene, date) {
  const cameraDistance = camera.position.length();
  const shouldShowDetail = cameraDistance < ZOOM_THRESHOLD;

  if (shouldShowDetail && !isDetailVisible) {
    showCityDetail(camera, date);
  } else if (!shouldShowDetail && isDetailVisible) {
    hideCityDetail();
  } else if (isDetailVisible) {
    updateCityDots(date);
  }
}

/**
 * Show city detail (fade in city grid + populate dots)
 */
function showCityDetail(camera, date) {
  isDetailVisible = true;

  // Find nearest city to camera
  const cameraLat = Math.asin(camera.position.y / camera.position.length()) * (180 / Math.PI);
  const cameraLon = Math.atan2(camera.position.z, camera.position.x) * (180 / Math.PI);

  let nearestCity = null;
  let minDistance = Infinity;

  for (const city of POPULATION_CENTERS) {
    const dist = Math.sqrt(
      Math.pow(city.lat - cameraLat, 2) + Math.pow(city.lon - cameraLon, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = city;
    }
  }

  if (!nearestCity) return;

  currentCity = nearestCity;
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const localHour = (utcHour + nearestCity.utcOffset) % 24;

  agents = generateAgentsForRegion(
    nearestCity.name,
    nearestCity.pop * 1e6,
    nearestCity.lat,
    nearestCity.lon,
    localHour
  );

  populateDots(nearestCity, date);
  cityDetailGroup.visible = true;

  // Fade in animation
  cityDetailGroup.traverse((child) => {
    if (child.material && child.material.transparent) {
      child.material.opacity = 0;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 300;
        if (elapsed < 1) {
          child.material.opacity = elapsed;
          requestAnimationFrame(animate);
        } else {
          child.material.opacity = 1;
        }
      };
      animate();
    }
  });
}

/**
 * Hide city detail (fade out)
 */
function hideCityDetail() {
  isDetailVisible = false;
  currentCity = null;
  agents = [];

  // Fade out animation
  cityDetailGroup.traverse((child) => {
    if (child.material && child.material.transparent) {
      const startTime = Date.now();
      const startOpacity = child.material.opacity;
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 300;
        if (elapsed < 1) {
          child.material.opacity = startOpacity * (1 - elapsed);
          requestAnimationFrame(animate);
        } else {
          child.material.opacity = 0;
          cityDetailGroup.visible = false;
        }
      };
      animate();
    }
  });
}

/**
 * Populate instanced mesh with dots representing people
 */
function populateDots(city, date) {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const localHour = (utcHour + city.utcOffset) % 24;
  const pattern = getActivityPattern(localHour);

  const awakeCount = Math.min(
    Math.round((city.pop * 1e6 * pattern.awake) / 1000), // Scale down for dots
    MAX_DOTS_PER_CITY
  );

  for (let i = 0; i < awakeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 5; // Within ~5km radius

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = Math.random() * 0.1; // Slight height variation

    instancedMatrix.setPosition(x, y, z);
    instancedDots.setMatrixAt(i, instancedMatrix);

    // Color based on activity
    let color;
    switch (pattern.activity) {
      case 'sleeping':
        color = new THREE.Color(0x1a1a3e);
        break;
      case 'waking':
        color = new THREE.Color(0xffb347);
        break;
      case 'commuting':
        color = new THREE.Color(0xffa500);
        break;
      case 'working':
        color = new THREE.Color(0x7fdbda);
        break;
      case 'eating':
        color = new THREE.Color(0xff6b35);
        break;
      case 'leisure':
        color = new THREE.Color(0xffb347);
        break;
      default:
        color = new THREE.Color(0xccccdd);
    }
    instancedDots.setColorAt(i, color);
  }

  instancedDots.instanceMatrix.needsUpdate = true;
  if (instancedDots.instanceColor) {
    instancedDots.instanceColor.needsUpdate = true;
  }
}

/**
 * Update dots based on current time (activity changes)
 */
function updateCityDots(date) {
  if (!currentCity) return;

  // Drive breathing animation
  instancedDots.material.uniforms.uTime.value = performance.now() / 1000;

  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const localHour = (utcHour + currentCity.utcOffset) % 24;
  const pattern = getActivityPattern(localHour);

  const awakeCount = Math.min(
    Math.round((currentCity.pop * 1e6 * pattern.awake) / 1000),
    MAX_DOTS_PER_CITY
  );

  // Update active dots count
  instancedDots.count = awakeCount;
  instancedDots.instanceMatrix.needsUpdate = true;

  // Update colors based on new activity pattern
  for (let i = 0; i < awakeCount; i++) {
    let color;
    switch (pattern.activity) {
      case 'sleeping':
        color = new THREE.Color(0x1a1a3e);
        break;
      case 'waking':
        color = new THREE.Color(0xffb347);
        break;
      case 'commuting':
        color = new THREE.Color(0xffa500);
        break;
      case 'working':
        color = new THREE.Color(0x7fdbda);
        break;
      case 'eating':
        color = new THREE.Color(0xff6b35);
        break;
      case 'leisure':
        color = new THREE.Color(0xffb347);
        break;
      default:
        color = new THREE.Color(0xccccdd);
    }
    instancedDots.setColorAt(i, color);
  }

  if (instancedDots.instanceColor) {
    instancedDots.instanceColor.needsUpdate = true;
  }
}

/**
 * Get currently displayed city (for info card)
 */
export function getCurrentCity() {
  return currentCity;
}

/**
 * Check if city detail is currently visible
 */
export function isCityDetailVisible() {
  return isDetailVisible;
}
