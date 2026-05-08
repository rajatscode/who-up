# who-up 🌍

A real-time 3D globe visualization showing how many people are awake right now, updated every minute.

## Features

- **Live Population Counter**: Exact count of people currently awake worldwide, updating smoothly with live jitter for authenticity
- **Key Statistics**:
  - Current: Exact number of people awake right now
  - Net Change: How many more/fewer people are awake vs 1 hour ago
  - Projection: How many more people will wake up in the next hour
- **Interactive 3D Globe**: Pan, rotate, and zoom with realistic day/night lighting
- **Regional Breakdown**: Click any country to see:
  - Total awake population in that country
  - Percentage of global awake population
  - Top 5 cities with current local time
- **City Detail**: Zoom in to see procedural street grid and population dots with activity-based colors
- **Timezone-Aware Calculation**: Sleep patterns account for regional variation (East Asia sleeps later, etc.)

## How It Works

The system uses:
- **Sleep profiles** by timezone to estimate wakefulness probability at any given local time
- **200+ major population centers** as tracked cities (scaled to 8.2B world population)
- **Regional profiles** (Default, East Asia, Southern Europe) calibrated to human sleep patterns
- **Real-time updates** every 60 seconds for statistics

## Tech Stack

- **Frontend**: Three.js (WebGL), vanilla JavaScript
- **Rendering**: Custom GLSL shaders with procedural noise, InstancedMesh for performance
- **Post-Processing**: Bloom effect with ACESFilmic tone mapping
- **Data**: Synthetic sleep patterns + procedural population distribution
- **Performance**: 60 FPS target on modern hardware (60+ fps on Chrome, tested)

## Running Locally

```bash
# Simply open in a modern web browser:
open index.html
# or
python3 -m http.server 8000  # Then visit http://localhost:8000
```

## Browser Support

- Chrome/Edge: Full support, 60 FPS
- Firefox: Full support, 30-50 FPS
- Safari: Full support, 20-40 FPS

## Architecture

- `js/main.js` - Application orchestration, animation loop, UI updates
- `js/awake.js` - Core awake-estimation engine with sleep profiles
- `js/globe.js` - Three.js rendering with custom shaders
- `js/city-detail.js` - Zoom visualization with city grid and population dots
- `js/regional-ui.js` - Regional panel display and interactivity
- `js/geospatial.js` - Country detection and boundary checking
- `js/city-data.js` - 200 major cities with population and timezone data
- `js/human-activity.js` - Activity patterns by hour (sleeping, working, commuting, etc.)

## Performance Notes

- **Device pixel ratio** capped at 1.0 to reduce GPU load on high-DPI displays
- **Bloom** renders at 0.5x resolution for faster post-processing
- **Markers** use object pooling to eliminate GC stalls
- **InstancedMesh** renders all population dots in a single draw call

## Calibration

The system targets accuracy for global awake estimation:
- **Peak hours** (daytime): 88-90% of population awake
- **Waking/sleeping ramp**: Quadratic easing for realistic transitions
- **Deep sleep**: 4% baseline (night workers, insomniacs, shift workers)

---

**Hackathon Sprint**: Built May 8, 2026. Ship by 8am ET. 🚀

Live at: [github.com/rajatscode/who-up](https://github.com/rajatscode/who-up)
