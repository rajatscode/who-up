# Who-Up: Rapid Implementation Backup Guide

**Use this if:**
- Dialec is unreliable or slow
- Dialec generates unusable code
- Architecture lead decides manual implementation is faster

## Minimum Viable Implementation (Can ship in 2-3 hours)

### 1. Project Bootstrap (15 min)
```bash
cd /Users/rmehndir/dev/rajat/who-up
npm init -y
npm install three vite
npx vite --version
mkdir -p src public
```

**Files to create:**
- `index.html` (entry point)
- `src/main.js` (Three.js scene setup)
- `src/awake.js` (algorithm module)
- `src/data.js` (population grid, time zone utils)
- `vite.config.js` (minimal build config)

### 2. Three.js Globe (30 min)
```javascript
// src/main.js - Minimal globe
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create Earth sphere with texture
const textureUrl = 'https://earthobservatory.nasa.gov/...blue-marble.jpg'; // or local file
const geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load(textureUrl) });
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// Lighting (day/night effect)
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(1, 1, 1).normalize();
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x444444);
scene.add(ambientLight);

// Camera positioning
camera.position.z = 2.5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  earth.rotation.y += 0.0002;
  renderer.render(scene, camera);
}
animate();
```

### 3. Awake Human Dots (20 min)
```javascript
// src/awake.js
function getAwakeFraction(localHour) {
  // 8am-11pm: 80% awake, 11pm-8am: 20% awake
  return (localHour >= 8 && localHour < 23) ? 0.8 : 0.2;
}

function generateDots(timestamp) {
  const dots = [];
  // Simplified 5° x 5° grid with ~200 major cities
  const cities = [
    { lat: 35.7, lon: 139.7, pop: 37e6 }, // Tokyo
    { lat: 40.7, lon: -74.0, pop: 8e6 },  // NYC
    { lat: 51.5, lon: -0.1, pop: 9e6 },   // London
    // ... more cities
  ];
  
  cities.forEach(city => {
    const utcHour = new Date(timestamp).getUTCHours();
    const localHour = (utcHour + Math.round(city.lon / 15)) % 24;
    const awakeFrac = getAwakeFraction(localHour);
    const awakeCount = Math.round(city.pop * awakeFrac / 1000); // sample 1000 dots per 1M people
    
    for (let i = 0; i < awakeCount; i++) {
      // Add small random offset for visual scatter
      dots.push({
        lat: city.lat + (Math.random() - 0.5) * 2,
        lon: city.lon + (Math.random() - 0.5) * 2,
      });
    }
  });
  
  return dots;
}
```

### 4. UI & Time Slider (25 min)
```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; }
    #count { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); 
             font-size: 48px; color: white; text-shadow: 0 0 10px rgba(0,0,0,0.8); }
    #timeSlider { position: absolute; bottom: 20px; width: 80%; left: 10%; height: 50px; }
    #timeLabel { position: absolute; bottom: 80px; width: 100%; text-align: center; color: white; }
  </style>
</head>
<body>
  <div id="count">-- billion awake</div>
  <div id="timeLabel">Now</div>
  <input id="timeSlider" type="range" min="0" max="24" value="0" step="0.5">
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### 5. Connect It All (15 min)
- Load dots from `generateDots()` into Three.js scene
- Render as small white spheres or glowing points
- Update slider input to change `timestamp` and re-render dots
- Update count display based on dot count

### 6. Interaction (20 min)
- **Drag to rotate**: Track mouse, update camera.rotation
- **Scroll to zoom**: Track wheel, update camera.position.z
- **Time slider**: Listen to input change, call `generateDots(newTime)`

## Timeline Estimate
- **Hour 0 (now)**: Bootstrap + architecture decision
- **Hour 1-2**: Three.js globe + dots
- **Hour 2-2.5**: UI + slider + interaction
- **Hour 2.5-3**: Polish + bug fixes
- **Hour 3-3.5**: QA + final tweaks
- **Hour 3.5-4**: Ship by 8am ET ✅

## Key Shortcuts for Speed
- Use Canvas texture (procedural day/night) instead of loading external image
- Reuse sphere geometry for dots (instances, not individual meshes)
- No complex shaders—simple MeshPhongMaterial + DirectionalLight
- Hardcoded city list instead of dynamic population data
- Simple linear interpolation for time travel (no advanced physics)

## If Dialec Works Well
- Use the above as reference/fallback
- Trust dialec output but iterate fast
- Any errors: refer to this guide for solutions

---

*This is NOT the preferred path. Dialec is faster. But if needed, this gets us to shipping by 8am. 🚀*
