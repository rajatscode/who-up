/**
 * Globe renderer using Three.js
 * Creates an interactive 3D Earth with day/night glow visualization.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getAwakeData, getWakenessAtPoint } from './awake.js';
import { loadCountryBoundaries } from './country-borders.js';

const GLOBE_RADIUS = 5;
const COLORS = {
  background: 0x0a0a1a,
  continent: 0x2a3a5c,
  awakeCore: 0xffb347,
  awakeIntense: 0xff6b35,
  transition: 0xe8475f,
  asleep: 0x1a1a3e,
  atmosphere: 0x7fdbda,
  text: 0xf0e6d3,
};

// Create a circular glow texture programmatically
function createGlowTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Pre-bake population density hotspots to a texture (computed once, sampled in shader)
function createPopulationDensityTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Render all 22 Gaussian hotspots to the canvas
  // Hotspots: [lon, lat, sizeX, sizeY, intensity]
  const hotspots = [
    [116, 35, 18, 12, 0.9],   // China (Beijing-Shanghai region)
    [139, 36, 8, 6, 0.7],     // Japan (Tokyo-Osaka)
    [127, 37, 6, 5, 0.5],     // Korea (Seoul-Busan)
    [113, 23, 10, 8, 0.7],    // Southern China (Guangzhou region)
    [78, 22, 12, 10, 0.85],   // India (Mumbai-Bangalore region)
    [73, 19, 5, 4, 0.6],      // India (Maharashtra)
    [77, 28, 6, 5, 0.7],      // India (Delhi region)
    [107, 3, 15, 10, 0.6],    // Indonesia (Jakarta)
    [101, -14, 8, 8, 0.4],    // Indonesia (Sumatra)
    [-29, -41, 6, 5, 0.4],    // South Africa (Johannesburg)
    [-31, -30, 6, 5, 0.35],   // South Africa (Cape Town)
    [-10, -48, 18, 8, 0.5],   // Europe (London-Paris)
    [0, -52, 6, 5, 0.4],      // Europe (Scandinavia)
    [-37, -56, 8, 6, 0.35],   // Russia (Moscow)
    [-3, -7, 8, 8, 0.5],      // Africa (Nigeria)
    [-36, 1, 12, 12, 0.3],    // Africa (East Africa)
    [74, -41, 10, 8, 0.5],    // Australia (Sydney region)
    [87, -35, 15, 10, 0.3],   // Australia (Melbourne-Brisbane)
    [118, -34, 8, 6, 0.35],   // Australia (Perth-Adelaide)
    [47, 23, 10, 10, 0.5],    // Middle East (Dubai-Gulf)
    [99, -19, 8, 6, 0.4],     // Southeast Asia (Thailand)
    [58, 34, 6, 5, 0.3],      // Central Asia (Pakistan-Afghanistan)
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lat = (y / height - 0.5) * 180;
      const lon = (x / width - 0.5) * 360;
      let d = 0;

      for (const [hlon, hlat, sizeX, sizeY, intensity] of hotspots) {
        const dx = (lon - hlon) / sizeX;
        const dy = (lat - hlat) / sizeY;
        const dist2 = dx * dx + dy * dy;
        d += Math.exp(-dist2) * intensity;
      }

      d = Math.min(d, 1.0);
      const idx = (y * width + x) * 4;
      data[idx] = Math.round(d * 255);     // R channel stores density
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class GlobeRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.autoRotate = true;
    this.autoRotateTimeout = null;
    this.markers = [];

    this._initRenderer();
    this._initCamera();
    this._initPostProcessing();
    this._initControls();
    this.glowTexture = createGlowTexture();
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._initLights();
    this._initGlobe();
    this._initAtmosphere();
    this._initStars();
    this._initMarkerSystem();

    window.addEventListener('resize', () => this._onResize());
    this._onResize();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    // Cap at 1.5x for Retina — avoids centering issues at 1x, avoids perf cost at 2-3x
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(COLORS.background);
    this.renderer.toneMapping = THREE.NoToneMapping;
  }

  _initPostProcessing() {
    // Disabled: v19 shader effects (atmosphere, fresnel, glow) provide visual pop without post-processing
    // UnrealBloomPass is too expensive on mobile/laptop GPUs. Direct rendering only.
    this._useDirectRender = true;
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 22);
    this.camera.lookAt(0, 0, 0);
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 30;
    this.controls.enablePan = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.4; // ~1 rev per 90s

    // Ensure camera and target are at origin
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Pause auto-rotate on interaction, resume after 10s
    this.controls.addEventListener('start', () => {
      this.controls.autoRotate = false;
      clearTimeout(this.autoRotateTimeout);
      this.autoRotateTimeout = setTimeout(() => {
        this.controls.autoRotate = true;
      }, 10000);
    });
  }

  _initLights() {
    // Subtle ambient
    const ambient = new THREE.AmbientLight(0x222244, 0.3);
    this.scene.add(ambient);
  }

  _initGlobe() {
    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 32);

    // Load real satellite textures
    const textureLoader = new THREE.TextureLoader();
    const earthDayTex = textureLoader.load('textures/earth-day.jpg');
    const earthNightTex = textureLoader.load('textures/earth-night.jpg');
    earthDayTex.colorSpace = THREE.SRGBColorSpace;
    earthNightTex.colorSpace = THREE.SRGBColorSpace;

    const popDensityTex = createPopulationDensityTexture();

    this.globeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
        uAwakeColor: { value: new THREE.Color(COLORS.awakeCore) },
        uAwakeIntense: { value: new THREE.Color(COLORS.awakeIntense) },
        uTransitionColor: { value: new THREE.Color(COLORS.transition) },
        uEarthDay: { value: earthDayTex },
        uEarthNight: { value: earthNightTex },
        uPopDensity: { value: popDensityTex },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vViewPos;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPos = mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uSunDirection;
        uniform vec3 uAwakeColor;
        uniform vec3 uAwakeIntense;
        uniform vec3 uTransitionColor;
        uniform float uTime;
        uniform sampler2D uEarthDay;
        uniform sampler2D uEarthNight;
        uniform sampler2D uPopDensity;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vViewPos;

        void main() {
          vec3 worldNorm = normalize(vPosition);
          float sunDot = dot(worldNorm, uSunDirection);
          float daylight = smoothstep(-0.15, 0.25, sunDot);

          // Sample real satellite textures
          vec3 dayTex = texture2D(uEarthDay, vUv).rgb;
          vec3 nightTex = texture2D(uEarthNight, vUv).rgb;
          float popDensity = texture2D(uPopDensity, vUv).r;

          // === DAY SIDE ===
          // Real satellite image + diffuse lighting
          float diffuse = max(sunDot, 0.0) * 0.5 + 0.5;
          vec3 daySurf = dayTex * diffuse;
          // Ocean specular glint
          vec3 viewDir = normalize(-vViewPos);
          vec3 halfDir = normalize(uSunDirection + viewDir);
          float spec = pow(max(dot(vNormal, halfDir), 0.0), 60.0);
          float isOcean = 1.0 - step(0.15, dot(dayTex, vec3(0.299, 0.587, 0.114)));
          daySurf += vec3(0.3, 0.25, 0.2) * spec * isOcean * 0.35;
          // Subtle awake glow on populated areas
          daySurf = mix(daySurf, mix(uAwakeColor, uAwakeIntense, popDensity), popDensity * 0.3);

          // === NIGHT SIDE ===
          // NASA night lights + warm amber city glow
          vec3 nightSurf = nightTex * 2.0;
          // Boost city light areas with warm amber
          float nightBrightness = dot(nightTex, vec3(0.299, 0.587, 0.114));
          nightSurf = mix(nightSurf, uAwakeColor * 1.2, nightBrightness * 0.5);
          // Add population density glow where night texture is dim
          nightSurf += uAwakeColor * popDensity * 0.12;

          // === TERMINATOR ===
          float termBand = smoothstep(-0.15, 0.05, sunDot) * smoothstep(0.25, 0.05, sunDot);
          // Warm golden sunrise (day) to cool violet dusk (night) with latitude variation
          vec3 dawnDusk = mix(vec3(1.0, 0.6, 0.2), vec3(0.4, 0.2, 0.6),
                              0.5 + 0.5 * sin(vUv.y * 6.28));

          // === COMPOSITE ===
          vec3 color = mix(nightSurf, daySurf, daylight);
          color = mix(color, dawnDusk, termBand * 0.45);

          // Surface fresnel (subtle atmosphere edge)
          float sf = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.5);
          color += vec3(0.08, 0.14, 0.28) * sf * 0.18;

          color = max(color, vec3(0.004, 0.004, 0.012));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    this.globe = new THREE.Mesh(geometry, this.globeMaterial);
    this.scene.add(this.globe);
  }

  _initAtmosphere() {
    // Inner atmosphere - subtle Fresnel glow
    const atmosGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.012, 64, 32);
    const atmosMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(COLORS.atmosphere) },
        uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uSunDirection;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vWorldPos;

        void main() {
          float fresnel = 1.0 - dot(vNormal, vViewDir);
          // Day side gets brighter atmosphere
          float sunFacing = dot(normalize(vWorldPos), uSunDirection) * 0.5 + 0.5;
          float intensity = pow(fresnel, 3.0) * (0.4 + sunFacing * 0.5);
          // Warmer color on sun-facing side
          vec3 col = mix(uColor, vec3(0.5, 0.7, 0.9), sunFacing * 0.3);
          gl_FragColor = vec4(col, intensity);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });

    this.atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
    this.scene.add(this.atmosphere);

    // Outer glow halo — subtle, bloom will enhance it
    const haloGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.06, 64, 32);
    const haloMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x336699) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float f = 1.0 - dot(vNormal, vViewDir);
          float intensity = pow(f, 4.5) * 0.35;
          gl_FragColor = vec4(uColor, intensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.halo = new THREE.Mesh(haloGeometry, haloMaterial);
    this.scene.add(this.halo);
  }

  _initStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 60 + Math.random() * 140;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Varied star colors - mostly white, some warm, some cool
      const temp = Math.random();
      if (temp < 0.7) {
        colors[i * 3] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 2] = 0.95 + Math.random() * 0.05;
      } else if (temp < 0.85) {
        colors[i * 3] = 0.95 + Math.random() * 0.05;
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.1;
        colors[i * 3 + 2] = 0.6 + Math.random() * 0.2;
      } else {
        colors[i * 3] = 0.7 + Math.random() * 0.15;
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.1;
        colors[i * 3 + 2] = 0.95 + Math.random() * 0.05;
      }
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.7,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      vertexColors: true,
    });

    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }

  _initMarkerSystem() {
    // Object pool for markers — pre-create sprites once, reuse each update
    this.markerGroup = new THREE.Group();
    this.scene.add(this.markerGroup);

    // Pre-allocate pool of dot + glow sprite pairs (200 cities max)
    const POOL_SIZE = 80;
    this._markerPool = [];
    this._reusableColor = new THREE.Color();
    this._transitionColor = new THREE.Color(COLORS.transition);
    this._awakeColor = new THREE.Color(COLORS.awakeCore);

    for (let i = 0; i < POOL_SIZE; i++) {
      const dotMat = new THREE.SpriteMaterial({
        map: this.glowTexture,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
      });
      const dot = new THREE.Sprite(dotMat);
      dot.visible = false;
      this.markerGroup.add(dot);

      const glowMat = new THREE.SpriteMaterial({
        map: this.glowTexture,
        color: COLORS.awakeCore,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
      });
      const glow = new THREE.Sprite(glowMat);
      glow.visible = false;
      this.markerGroup.add(glow);

      this._markerPool.push({ dot, glow });
    }
    this._activeMarkerCount = 0;
  }

  /**
   * Update sun direction based on current viewing time
   * The sun vector points from Earth's center toward the sun's position
   */
  updateSunDirection(date) {
    const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60;
    // Sun subsolar point is at longitude where it's noon (12:00 UTC)
    // Positive longitude = east, so we need (utcHour - 12) * 15 to get the subsolar longitude
    const sunLon = ((utcHour - 12) * 15) * Math.PI / 180;
    // Approximate sun declination based on day of year
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const sunLat = 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81)) * Math.PI / 180;

    this.globeMaterial.uniforms.uSunDirection.value.set(
      Math.cos(sunLat) * Math.cos(sunLon),
      Math.sin(sunLat),
      Math.cos(sunLat) * Math.sin(sunLon)
    );
    if (this.atmosphere?.material?.uniforms?.uSunDirection) {
      this.atmosphere.material.uniforms.uSunDirection.value.copy(
        this.globeMaterial.uniforms.uSunDirection.value
      );
    }
  }

  /**
   * Update population markers on the globe
   */
  updateMarkers(date) {
    const data = getAwakeData(date);
    const transitionColor = this._transitionColor;
    const awakeColor = this._awakeColor;

    let idx = 0;
    for (const city of data) {
      if (city.wakeProbability < 0.15 || city.population < 3e6 || idx >= this._markerPool.length) {
        continue;
      }

      const phi = (90 - city.lat) * Math.PI / 180;
      const theta = (city.lon + 180) * Math.PI / 180;

      const x = -(GLOBE_RADIUS + 0.05) * Math.sin(phi) * Math.cos(theta);
      const y = (GLOBE_RADIUS + 0.05) * Math.cos(phi);
      const z = (GLOBE_RADIUS + 0.05) * Math.sin(phi) * Math.sin(theta);

      const size = Math.sqrt(city.population / 1e6) * 0.035 * city.wakeProbability;
      this._reusableColor.copy(transitionColor).lerp(awakeColor, city.wakeProbability);

      // Time-of-day brightness: peaks at noon (12:00), dims at midnight (0:00)
      const hourAngle = (city.localHour - 12) * Math.PI / 12;
      const dayNightBrightness = 0.4 + 0.6 * (0.5 + 0.5 * Math.cos(hourAngle));

      const { dot, glow } = this._markerPool[idx];

      // Update dot sprite
      dot.position.set(x, y, z);
      dot.scale.setScalar(size * 2);
      dot.material.color.copy(this._reusableColor);
      dot.material.opacity = (0.4 + city.wakeProbability * 0.25) * dayNightBrightness;
      dot.userData = city;
      dot.visible = true;

      // Update glow sprite
      glow.position.set(x, y, z);
      glow.scale.setScalar(size * 4);
      glow.material.opacity = city.wakeProbability * 0.12 * dayNightBrightness;
      glow.visible = true;

      idx++;
    }

    // Hide unused pool entries
    for (let i = idx; i < this._activeMarkerCount; i++) {
      this._markerPool[i].dot.visible = false;
      this._markerPool[i].glow.visible = false;
    }
    this._activeMarkerCount = idx;
  }

  /**
   * Raycast for tooltip
   */
  getMarkerAtScreen(x, y) {
    this._mouse.set(
      (x / window.innerWidth) * 2 - 1,
      -(y / window.innerHeight) * 2 + 1
    );

    this._raycaster.setFromCamera(this._mouse, this.camera);
    const intersects = this._raycaster.intersectObjects(this.markerGroup.children);
    for (const hit of intersects) {
      if (hit.object.userData?.name) {
        return hit.object.userData;
      }
    }
    return null;
  }

  /**
   * Get raycaster for external raycasting (e.g., country selection)
   */
  getRaycaster() {
    return this._raycaster;
  }

  /**
   * Get earth mesh for intersection tests
   */
  get earthMesh() {
    return this.globe;
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, true);
  }

  /**
   * Main render loop tick
   */
  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
