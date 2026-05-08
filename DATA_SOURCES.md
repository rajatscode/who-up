# Data Sources for Who-Up Globe

## Population Data

### Option 1: Simplified Grid (Fastest MVP)
- Create a 5°×5° or 10°×10° grid
- Estimate population density from known cities + country data
- Hardcode grid values (JSON file)
- **Pros**: No external API, very fast, sufficient for MVP
- **Data format**: `[{lat, lon, population}, ...]`

### Option 2: Natural Earth Raster Data
- Download 10m or 50m resolution raster
- Parse grid population from GeoTIFF
- **Pros**: Realistic distribution
- **Cons**: Larger files, slower parsing

### Option 3: World Bank / UN Data
- World population density by country
- Distribute population center by capital city
- **Pros**: Official, accurate
- **Cons**: Country-level only, less precise

## Recommended Approach (MVP)
**Hardcoded simplified grid** (5°×5° with ~200 major cities + density estimates)
- File: `src/data/population-grid.json`
- Format: Array of {lat, lon, pop_density}
- Updated hourly estimate locally (no server needed)

## Awake Estimation Algorithm

**Formula:**
```
awake_fraction = (local_hour >= 8 && local_hour < 23) ? 0.80 : 0.20
awake_humans = cell_population × awake_fraction
```

**Geographic Distribution:**
- Place human dots proportional to population in each grid cell
- Stratified random sampling: avoid clumping

**Time Travel:**
- Simply shift local time backward/forward
- Recalculate awake% for new time
- Animate dot appearance/disappearance

## Implementation Checklist
- [ ] Create population-grid.json (5°×5° grid with densities)
- [ ] Implement time-zone lookup (longitude → UTC offset)
- [ ] Implement awake-fraction calculator
- [ ] Implement stratified sampling for dot placement
- [ ] Test with a few known times (midnight UTC, noon UTC, etc.)

---

*Finalizing with researcher...*
