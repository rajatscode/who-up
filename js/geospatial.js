/**
 * Geospatial utilities for regional selection
 * - Point-in-polygon queries
 * - Country/region detection
 * - Lightweight country boundary data
 */

// Simplified country boundary data (ISO 3166-1 alpha-2 codes + bounding boxes)
// For MVP, we use bounding boxes + simplified polygons
// Future: Use full TopoJSON/GeoJSON for precise boundaries

const COUNTRY_DATA = {
  // Format: { code, name, region, bbox: [minLon, minLat, maxLon, maxLat], polygon?: [...] }
  // Bounding boxes are approximate and sufficient for MVP click detection

  // Asia-Pacific
  'CN': { name: 'China', region: 'Asia', bbox: [73.5, 18.2, 135.1, 53.6] },
  'IN': { name: 'India', region: 'Asia', bbox: [68.2, 8.4, 97.4, 35.5] },
  'JP': { name: 'Japan', region: 'Asia', bbox: [130.0, 30.4, 145.0, 45.6] },
  'KR': { name: 'South Korea', region: 'Asia', bbox: [124.6, 33.1, 131.9, 43.0] },
  'ID': { name: 'Indonesia', region: 'Asia', bbox: [95.0, -11.0, 141.0, 6.1] },
  'PH': { name: 'Philippines', region: 'Asia', bbox: [117.0, 5.0, 127.0, 19.0] },
  'TH': { name: 'Thailand', region: 'Asia', bbox: [97.3, 5.6, 105.6, 20.5] },
  'VN': { name: 'Vietnam', region: 'Asia', bbox: [102.1, 8.6, 109.5, 23.4] },
  'BD': { name: 'Bangladesh', region: 'Asia', bbox: [88.0, 21.6, 92.7, 26.6] },
  'PK': { name: 'Pakistan', region: 'Asia', bbox: [60.9, 23.6, 77.1, 37.1] },

  // Europe
  'GB': { name: 'United Kingdom', region: 'Europe', bbox: [-8.6, 50.0, 1.8, 58.6] },
  'FR': { name: 'France', region: 'Europe', bbox: [-5.2, 41.4, 8.2, 51.1] },
  'DE': { name: 'Germany', region: 'Europe', bbox: [5.9, 47.3, 15.0, 55.1] },
  'IT': { name: 'Italy', region: 'Europe', bbox: [6.6, 36.6, 18.5, 47.1] },
  'ES': { name: 'Spain', region: 'Europe', bbox: [-9.3, 36.0, 3.3, 43.8] },
  'RU': { name: 'Russia', region: 'Europe/Asia', bbox: [19.6, 41.2, 169.4, 81.9] },
  'TR': { name: 'Turkey', region: 'Europe/Asia', bbox: [26.0, 36.0, 45.0, 42.8] },

  // Africa
  'EG': { name: 'Egypt', region: 'Africa', bbox: [24.7, 22.0, 36.9, 31.6] },
  'NG': { name: 'Nigeria', region: 'Africa', bbox: [2.7, 4.2, 14.7, 13.9] },
  'ZA': { name: 'South Africa', region: 'Africa', bbox: [16.5, -34.8, 32.9, -22.1] },
  'KE': { name: 'Kenya', region: 'Africa', bbox: [33.9, -4.7, 41.9, 5.0] },
  'ET': { name: 'Ethiopia', region: 'Africa', bbox: [32.9, 3.4, 47.8, 14.9] },
  'ZM': { name: 'Zambia', region: 'Africa', bbox: [22.0, -18.1, 33.7, -8.2] },
  'CD': { name: 'Democratic Republic of Congo', region: 'Africa', bbox: [12.0, -13.5, 31.3, 5.3] },

  // Americas
  'US': { name: 'United States', region: 'North America', bbox: [-125.0, 25.0, -66.9, 49.4] },
  'CA': { name: 'Canada', region: 'North America', bbox: [-141.0, 41.7, -52.6, 83.1] },
  'MX': { name: 'Mexico', region: 'North America', bbox: [-117.1, 14.5, -86.7, 32.7] },
  'BR': { name: 'Brazil', region: 'South America', bbox: [-73.9, -33.7, -34.8, 5.3] },
  'AR': { name: 'Argentina', region: 'South America', bbox: [-73.6, -55.5, -53.6, -21.8] },
  'CL': { name: 'Chile', region: 'South America', bbox: [-75.6, -56.2, -66.9, -17.5] },
  'CO': { name: 'Colombia', region: 'South America', bbox: [-76.1, -4.2, -66.9, 12.5] },
  'PE': { name: 'Peru', region: 'South America', bbox: [-81.3, -18.4, -68.6, 0.0] },

  // Middle East
  'SA': { name: 'Saudi Arabia', region: 'Middle East', bbox: [34.4, 16.3, 55.9, 32.2] },
  'AE': { name: 'United Arab Emirates', region: 'Middle East', bbox: [51.6, 22.6, 56.4, 26.1] },
  'IR': { name: 'Iran', region: 'Middle East', bbox: [44.0, 25.0, 63.3, 39.8] },
  'IQ': { name: 'Iraq', region: 'Middle East', bbox: [38.8, 29.1, 48.8, 37.4] },
};

// Pre-sort countries by bbox area (smallest first) so specific countries
// match before large ones like Russia whose bbox overlaps many neighbors
const SORTED_COUNTRIES = Object.entries(COUNTRY_DATA)
  .map(([code, data]) => {
    const [minLon, minLat, maxLon, maxLat] = data.bbox;
    const area = (maxLon - minLon) * (maxLat - minLat);
    return { code, data, area };
  })
  .sort((a, b) => a.area - b.area);

/**
 * Point-in-polygon test using bounding box (fast, sufficient for MVP)
 * Returns country code if point is within a country's bounding box.
 * Checks smaller countries first to avoid large-bbox overlaps (e.g. Russia).
 */
export function getCountryAtPoint(lat, lon) {
  for (const { code, data } of SORTED_COUNTRIES) {
    const [minLon, minLat, maxLon, maxLat] = data.bbox;
    if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
      return { code, ...data };
    }
  }
  return null;
}

/**
 * Get all countries in a region
 */
export function getCountriesByRegion(region) {
  return Object.entries(COUNTRY_DATA)
    .filter(([_, data]) => data.region === region)
    .map(([code, data]) => ({ code, ...data }));
}

/**
 * Get country metadata by code or name
 */
export function getCountry(codeOrName) {
  if (COUNTRY_DATA[codeOrName]) {
    return { code: codeOrName, ...COUNTRY_DATA[codeOrName] };
  }
  for (const [code, data] of Object.entries(COUNTRY_DATA)) {
    if (data.name === codeOrName) {
      return { code, ...data };
    }
  }
  return null;
}

/**
 * Check if a lat/lon is within a polygon (used for lasso selection)
 * Uses ray casting algorithm for precise point-in-polygon
 */
export function pointInPolygon(point, polygon) {
  const [lat, lon] = point;
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat1, lon1] = polygon[i];
    const [lat2, lon2] = polygon[j];

    const xi = lon1, xj = lon2;
    const yi = lat1, yj = lat2;

    const intersect = ((xi > lon) !== (xj > lon)) && (lat < (yj - yi) * (lon - xi) / (xj - xi) + yi);
    if (intersect) isInside = !isInside;
  }

  return isInside;
}

/**
 * Build a lasso polygon from mouse positions (simplification via Visvalingam-Whyatt or similar)
 * For MVP, just use raw points with optional simplification
 */
export function simplifyPolygon(points, tolerance = 0.01) {
  if (points.length < 3) return points;

  // Ultra-simple: reduce consecutive points that are too close
  const simplified = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const last = simplified[simplified.length - 1];
    const dist = Math.sqrt(Math.pow(points[i][0] - last[0], 2) + Math.pow(points[i][1] - last[1], 2));
    if (dist > tolerance) {
      simplified.push(points[i]);
    }
  }

  // Always include last point
  if (simplified[simplified.length - 1] !== points[points.length - 1]) {
    simplified.push(points[points.length - 1]);
  }

  return simplified;
}
