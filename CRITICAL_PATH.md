# Who-Up: Critical Path — FULL VISION (8am ET)

## THE VISION (User's Words)

"I want to zoom into Beijing and see people waking up and walking around. I want to see late night street sweepers in NYC. I want this to feel real."

**Scope**: FULL. No compromises. Real satellite Earth + street-level activity detail + procedural humans.

**Timeline**: 2-3 hours to execute. ~5 hours remaining until 8am ET.

---

## Immediate Action (START NOW)

### 1. Fix Count Bug (5 min) — BLOCKING ALL ELSE
**Owner**: Implementer  
**File**: `js/awake.js:68`  
**Change**:
```js
// DELETE THIS:
const SCALE_FACTOR = WORLD_POPULATION / TRACKED_POPULATION * 0.6;

// BECOMES THIS:
const SCALE_FACTOR = WORLD_POPULATION / TRACKED_POPULATION;
```

**Why**: The `* 0.6` multiplier reduces global awake count by 35%. Shows ~4.0B instead of ~5.5B. This is the emotional hook—"5 billion humans awake RIGHT NOW" needs to be accurate.

**Blocker**: QA won't sign off until this is fixed.

---

## Phase 1: Real Earth (20 min)

### 2. Load NASA Blue Marble + Black Marble Textures
**Owner**: Implementer  
**File**: `js/globe.js`

**Daytime texture** (Blue Marble):
- Source: Solar System Scope or NASA
- URL: `https://www.solarsystemscope.com/textures/` (look for 2K Earth)
- Integration: In globe.js constructor:
```js
const textureLoader = new THREE.TextureLoader();
this.earthTexture = textureLoader.load('earth-day.jpg');
```

**Nighttime texture** (Black Marble):
- Shows real city lights at night
- Source: NASA (https://svs.gsfc.nasa.gov/cgi-bin/details.cgi?aid=30876)
- Integration: Load as second texture, blend based on sun position

**Shader update**: Replace `continentNoise(vUv)` with:
```glsl
vec3 dayColor = texture(uEarthTexture, vUv).rgb;
vec3 nightColor = texture(uBlackMarble, vUv).rgb;
vec3 earthColor = mix(nightColor, dayColor, daylight);
```

**Keep**: Day/night lighting overlay, color blending, atmosphere glow.

**Result**: Real Earth instead of procedural noise. Instant visual impact.

---

## Phase 2: Street-Level City Detail on Zoom (60 min)

### 3. Zoom Detection + City Layer Fade-In
**Owner**: Implementer  
**File**: `js/globe.js` + new file `js/city-detail.js`

**Threshold detection**:
```js
if (this.camera.position.length() < 12) {
  // User zoomed into city level
  fadeInCityDetail();
} else {
  fadeOutCityDetail();
}
```

**City detail layer**:
- When zoomed in: Show ultra-dense population visualization
- Procedural city grid (dark background + light grid lines showing streets)
- Thousands of tiny dots representing people

### 4. Procedural City Rendering
**Owner**: Implementer  
**File**: `js/city-detail.js`

**City grid generation**:
- Simple 2D overlay showing building density + street patterns
- Use procedural Perlin noise or grid-based building placement
- Resolution: ~100x100 grid representing ~10km x 10km area
- Building brightness = population density

**Population dots** (the "people"):
- Use `InstancedMesh` for performance (1000+ dots rendered as one draw call)
- Dot count = city population × awake ratio (from `human-activity.js`)
- Dot position = random distribution within city grid
- Dot color = activity type:
  - Gold (awake, active)
  - Dim blue (working, sedentary)
  - Dark (sleeping)
  - Amber (commuting)
- Dot animation: gentle bobbing + random walk (from `human-activity.js`)

**Activity-based behavior**:
```js
const pattern = getActivityPattern(localHour);
const agentCount = cityPopulation * pattern.awake;
// Only render agents that are awake
// Animate based on activity type (speed, direction)
```

### 5. City Info Overlay
**Owner**: Implementer  
**File**: `js/main.js` UI update

When zoomed into city, display floating card:
```
┌─────────────────────────────┐
│  Tokyo · 6:32 AM            │
│  ~18.4M people awake        │
│                             │
│  Morning rush — First       │
│  trains since 4:30am.       │
│  Joggers in parks. Breakfast│
│  crowds at convenience      │
│  stores and ramen shops.    │
└─────────────────────────────┘
```

**Text source**: Activity descriptions from Researcher (see Phase 3)

**Update frequency**: Real-time as time slider moves (see Phase 4)

---

## Phase 3: Activity Descriptions (30 min)

### 6. City Activity Narratives
**Owner**: Researcher  
**Deliverable**: `js/activity-descriptions.js`

For 10-15 major cities, provide 4 time-window descriptions each (24h ÷ 4 = 6h windows):

```js
const ACTIVITY_DESCRIPTIONS = {
  'Tokyo': {
    '0-6': 'Late night — Konbini clerks, night shift nurses. Streets quiet.',
    '6-12': 'Morning rush — First trains at 4:30am. Joggers. Breakfast crowds.',
    '12-18': 'Daytime — Office workers, students, shoppers. Lunch rush at noon.',
    '18-24': 'Evening — Dinner rush, entertainment. Quieter after 10pm.'
  },
  'New York': {
    '0-6': 'Night shift — Street sweepers, bakers, hospital staff. ~8% awake.',
    '6-12': 'Morning rush — Early risers, commuters. Subway packed 7-9am.',
    '12-18': 'Daytime — Office workers, retail. Lunch rush. School pickup 3pm.',
    '18-24': 'Evening — Dinner, bars, entertainment. Quieter after 11pm.'
  },
  // ... 8-13 more cities
};
```

**Guidelines**:
- Specific, evocative details ("Konbini" not "convenience store")
- Cultural flavor ("Metro packed" in NYC, "Tea time" in London)
- Show real activities (street sweepers at 3am, rush hour patterns)
- 1-2 sentences per window

**Cities** (prioritize):
Tokyo, Beijing, Shanghai, Delhi, Mumbai, London, Paris, New York, São Paulo, Lagos (+ others if time)

---

## Phase 4: Temporal Dynamics (20 min)

### 7. Activity Updates with Time Slider
**Owner**: Implementer  
**File**: `js/main.js`

**Real-time updates**:
```js
timeSlider.addEventListener('input', (e) => {
  const newTime = getTimeFromSlider(e.target.value);
  
  // Update globe agents
  updateAgents(newTime);
  
  // Update city detail layer
  updateCityDots(newTime);
  updateCityActivityDescription(newTime);
  
  // Update city info card
  updateActivityText(selectedCity, newTime);
});
```

**What changes**:
- City dots appear/disappear/move based on `getActivityPattern(localHour)`
- Activity description text changes (from ACTIVITY_DESCRIPTIONS)
- City count updates in real-time
- Color of dots shifts (awake→dim→sleeping)

**User experience**:
- Scrub time slider backward/forward
- Watch Tokyo's 18M awake count drop to 2M as you drag into their night
- See activity description change: "rush hour" → "office work" → "dinner" → "sleeping"
- Procedurally, watch the dots fade and move slower

---

## Phase 5: Polish + Ship (40 min)

### 8. Smooth Zoom Animation
**Owner**: Designer + Implementer  
**File**: `js/globe.js`

**Camera easing**:
```js
if (zoomLevelChanged) {
  // Smooth 600ms animation from globe view to city view
  animateCamera(currentPosition, targetPosition, 600, easingFunction);
}
```

**UI transitions**:
- City detail fades in smoothly (0.3s)
- City info card slides in with spring animation
- Activity dots fade in as they appear
- No jarring snaps

### 9. Performance Optimization
**Owner**: Implementer

**Render city dots with InstancedMesh**:
```js
const geometry = new THREE.SphereGeometry(0.1, 8, 8);
const material = new THREE.MeshStandardMaterial({ color: 0xffb347 });
const instancedMesh = new THREE.InstancedMesh(geometry, material, dotCount);
// Set position for each instance via instanceMatrix
```

**Why**: 1000+ dots rendered as single draw call (no FPS drop).

### 10. QA Testing + Bug Fixes
**Owner**: QA Tester

- Count bug is fixed ✅
- City zoom responds smoothly ✅
- Dots render without lag ✅
- Activity text matches time correctly ✅
- No console errors ✅

### 11. Deployment
**Owner**: Implementer + Team

- Build for production (`npm run build`)
- Test live version
- Deploy to host
- Demo script ready

---

## Timeline Summary

| Time | Task | Owner | Est. |
|------|------|-------|------|
| NOW | Fix count bug | Impl | 5 min |
| +5 | Load real textures | Impl | 20 min |
| +25 | City zoom layer | Impl | 60 min |
| +85 | Activity descriptions | Res | 30 min |
| +115 | Temporal updates | Impl | 20 min |
| +135 | Polish + ship | All | 40 min |
| +175 | **LIVE** | 🚀 | **8:00 AM ET** |

**Buffer**: ~25 minutes for blockers/fixes.

---

## Success Criteria

✅ Real satellite Earth (not procedural noise)  
✅ Zoom into cities → see procedural people as dots  
✅ City detail layer shows activity patterns  
✅ Activity descriptions make it feel REAL  
✅ Time slider updates activity in real-time  
✅ No crashes, 60 FPS performance  
✅ Ship by 8am ET  
✅ User feels: "Wow, I can see billions of real humans doing stuff"  

---

## Modules Ready to Use

- ✅ `js/human-activity.js` — Activity patterns, agent generation, global summary
- ✅ `js/geospatial.js` — Country detection, regional queries
- ✅ `js/regional-ui.js` — Regional panel (not needed for MVP, optional later)
- ✅ `js/country-borders.js` — Country boundaries (not needed for MVP, optional later)
- ✅ `js/city-data.js` — 200 cities (ready from Researcher)

---

## Build It. Ship It. 🚀

**Implementer**: You have all the pieces. Execute the vision. Escalate blockers immediately.

**Team**: Remove obstacles, validate, ship.

**User**: This is what you asked for. We're building it.

---

*Status: FULL ACCELERATION. Vision locked. Executing now. 8am ET deadline. Gods on cocaine mode.*
