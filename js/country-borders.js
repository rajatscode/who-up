/**
 * Country border visualization
 * Loads GeoJSON/TopoJSON country boundaries and renders them on the globe
 */
import * as THREE from 'three';

const GLOBE_RADIUS = 5;
const BORDER_COLOR = new THREE.Color(0xccccdd);
const BORDER_WIDTH = 0.8;

/**
 * Convert lat/lon to 3D position on sphere
 */
function latLonToPosition(lat, lon, radius = GLOBE_RADIUS) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  return new THREE.Vector3(
    radius * Math.cos(latRad) * Math.cos(lonRad),
    radius * Math.sin(latRad),
    radius * Math.cos(latRad) * Math.sin(lonRad)
  );
}

/**
 * Load world country boundaries from TopoJSON
 * Uses lightweight world-atlas or Natural Earth data
 */
export async function loadCountryBoundaries(url = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json') {
  try {
    const response = await fetch(url);
    const topology = await response.json();
    return topology;
  } catch (error) {
    console.error('Failed to load country boundaries:', error);
    return null;
  }
}

/**
 * Convert TopoJSON to GeoJSON features
 * Simplified version for country borders
 */
function topologyToFeatures(topology) {
  const features = [];

  // Handle different TopoJSON structures
  // world-atlas has: arcs, countries (array of arc indices), land, ocean
  if (topology.objects && topology.objects.countries) {
    const countries = topology.objects.countries;

    // For each country (array of arc index arrays)
    if (Array.isArray(countries.geometries)) {
      countries.geometries.forEach((geom, idx) => {
        if (geom.arcs) {
          features.push({
            id: idx,
            arcs: geom.arcs,
            type: 'country'
          });
        }
      });
    }
  }

  return { arcs: topology.arcs, features };
}

/**
 * Decode TopoJSON arcs into coordinate paths
 */
function decodeArcs(topology) {
  const arcs = topology.arcs.map(arc => {
    const path = [];
    let x = 0, y = 0;

    for (let i = 0; i < arc.length; i++) {
      x += arc[i][0];
      y += arc[i][1];
      path.push([x, y]);
    }

    // Convert arc coordinates to lat/lon
    const transform = topology.transform;
    return path.map(([dx, dy]) => [
      dy * transform.scale[1] + transform.translate[1],
      dx * transform.scale[0] + transform.translate[0]
    ]);
  });

  return arcs;
}

/**
 * Create Three.js line geometry from country boundaries
 */
export async function createCountryBordersGeometry(topologyUrl) {
  try {
    const topology = await loadCountryBoundaries(topologyUrl);
    if (!topology) return null;

    const { arcs, features } = topologyToFeatures(topology);
    const decodedArcs = decodeArcs(topology);

    const points = [];

    // For each country, trace its borders
    features.forEach(country => {
      if (!Array.isArray(country.arcs[0])) {
        // Single-part country
        traceArcs(country.arcs, decodedArcs, points);
      } else {
        // Multi-part country (e.g., islands)
        country.arcs.forEach(arcIndices => {
          traceArcs(arcIndices, decodedArcs, points);
        });
      }
    });

    // Convert to Three.js BufferGeometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);

    points.forEach((point, idx) => {
      const pos = latLonToPosition(point[0], point[1]);
      positions[idx * 3] = pos.x;
      positions[idx * 3 + 1] = pos.y;
      positions[idx * 3 + 2] = pos.z;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return geometry;
  } catch (error) {
    console.error('Failed to create country borders geometry:', error);
    return null;
  }
}

/**
 * Trace arc paths for a country
 */
function traceArcs(arcIndices, decodedArcs, points) {
  arcIndices.forEach(arcIdx => {
    const reversed = arcIdx < 0;
    const arc = decodedArcs[Math.abs(arcIdx) - 1];

    if (reversed) {
      for (let i = arc.length - 1; i >= 0; i--) {
        points.push(arc[i]);
      }
    } else {
      arc.forEach(point => points.push(point));
    }
  });
}

/**
 * Create Three.js mesh for country borders
 */
export async function createCountryBordersMesh(topologyUrl) {
  const geometry = await createCountryBordersGeometry(topologyUrl);
  if (!geometry) return null;

  const material = new THREE.LineBasicMaterial({
    color: BORDER_COLOR,
    linewidth: BORDER_WIDTH,
    fog: false,
  });

  const lines = new THREE.LineSegments(geometry, material);
  return lines;
}

/**
 * Simpler alternative: Use preset country coordinates for quick rendering
 * This is a fallback for testing without external data
 */
export function createSimpleCountryBorders() {
  // Simple coastline approximations (not full country data, just major coast patterns)
  // Format: [[[lat, lon], [lat, lon], ...], ...] for each polyline

  const coastlines = [
    // North America coast (simplified)
    [[48, -85], [45, -83], [40, -79], [35, -75], [30, -80], [25, -82], [25, -97], [30, -97], [35, -102], [40, -107], [45, -120], [48, -124], [50, -130], [54, -130], [60, -140], [65, -170]],
    // Greenland
    [[83, -40], [70, -20], [60, -40], [60, -50], [65, -73], [80, -70], [83, -40]],
    // Europe
    [[71, 10], [70, 30], [60, 25], [55, 15], [50, 0], [48, -5], [43, 0], [41, 10], [40, 20], [42, 30], [45, 35], [50, 35], [55, 40], [60, 40], [65, 35], [71, 30], [71, 10]],
    // Africa
    [[37, -3], [30, 10], [25, 20], [15, 35], [10, 35], [5, 32], [0, 30], [-5, 25], [-10, 20], [-15, 10], [-20, 15], [-30, 20], [-35, 20], [-37, 25], [-30, 30], [-20, 35], [0, 40], [10, 30], [20, 20], [30, 15], [37, 10], [37, -3]],
    // Southeast Asia
    [[20, 100], [15, 105], [10, 110], [5, 115], [0, 120], [-5, 130], [-10, 135], [-20, 140], [-25, 135], [-20, 125], [-15, 120], [-5, 115], [0, 110], [10, 105], [15, 100], [20, 100]],
    // Australia
    [[-10, 140], [-15, 145], [-25, 150], [-35, 150], [-40, 145], [-44, 140], [-40, 130], [-35, 120], [-25, 115], [-15, 120], [-10, 135], [-10, 140]],
  ];

  const geometry = new THREE.BufferGeometry();
  const positions = [];

  coastlines.forEach(polyline => {
    polyline.forEach(([lat, lon]) => {
      const pos = latLonToPosition(lat, lon);
      positions.push(pos.x, pos.y, pos.z);
    });
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

  const material = new THREE.LineBasicMaterial({
    color: BORDER_COLOR,
    linewidth: BORDER_WIDTH,
  });

  return new THREE.LineSegments(geometry, material);
}
