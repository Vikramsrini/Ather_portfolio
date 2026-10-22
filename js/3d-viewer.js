// 3D EV Scooter CMF Studio using Three.js
// Procedural Industrial Design geometry with real-time BRDF shaders, CMF presets, and topology wireframe inspection.

let scene, camera, renderer, scooterGroup;
let bodyMaterials = [];
let accentMaterials = [];
let frameMaterials = [];
let wireframeActive = false;
let autoRotate = true;
let explodedAmount = 0;

// Sub-groups for exploded view
let frontCowlMesh, seatMesh, batteryMesh, frameMesh, wheelFrontMesh, wheelRearMesh;

const CMF_PRESETS = {
  stealth: {
    name: "Stealth Black & Warp Mint",
    bodyColor: 0x11141A,
    accentColor: 0x00E599,
    frameColor: 0x1E242E,
    roughness: 0.6,
    metalness: 0.25,
    clearcoat: 0.1,
    desc: "Matte obsidian composite panels with signature Ather warp green aerodynamic accents."
  },
  mint: {
    name: "Ather Hyper Mint",
    bodyColor: 0x00E599,
    accentColor: 0x0E1318,
    frameColor: 0x151B22,
    roughness: 0.2,
    metalness: 0.15,
    clearcoat: 0.9,
    desc: "Signature Ather electric mint green with high-gloss automotive clearcoat."
  },
  apex: {
    name: "Apex Lunar Red",
    bodyColor: 0x9BA3AF,
    accentColor: 0xFF2A4D,
    frameColor: 0x1E2024,
    roughness: 0.45,
    metalness: 0.4,
    clearcoat: 0.4,
    desc: "Satin lunar grey with high-contrast Apex racing red aerodynamic aero-ducts."
  },
  white: {
    name: "Frost White & Cyan",
    bodyColor: 0xF0F4F8,
    accentColor: 0x00D8F6,
    frameColor: 0x222831,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.85,
    desc: "High-spec pearl frost white with anodized electric cyan highlight trims."
  }
};

let currentPreset = 'stealth';
let studioLights = [];

function init3DViewer() {
  const container = document.getElementById('scooter-3d-canvas-container');
  if (!container) return;

  const width = container.clientWidth || 600;
  const height = container.clientHeight || 450;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090D12);
  scene.fog = new THREE.FogExp2(0x090D12, 0.05);

  // Camera
  camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(4.5, 2.2, 4.8);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Lights
  setupLighting('studio');

  // Ground Grid & Shadow plane
  const gridHelper = new THREE.GridHelper(10, 20, 0x00E599, 0x1E293B);
  gridHelper.position.y = -0.6;
  gridHelper.material.opacity = 0.25;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  const shadowPlaneGeo = new THREE.PlaneGeometry(10, 10);
  const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.45 });
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.59;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // Build EV Scooter Mesh
  buildScooterModel();

  // Mouse / Touch Orbit Controls
  setupOrbitControls(container);

  // Animation Loop
  animate();

  // Window resize handler
  window.addEventListener('resize', onWindowResize);
}

function setupLighting(preset) {
  // Clear old lights
  studioLights.forEach(light => scene.remove(light));
  studioLights = [];

  if (preset === 'studio') {
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);
    studioLights.push(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7EB8FF, 1.2);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);
    studioLights.push(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00E599, 1.8);
    rimLight.position.set(0, 4, -5);
    scene.add(rimLight);
    studioLights.push(rimLight);

    const ambientLight = new THREE.AmbientLight(0x1a2230, 1.2);
    scene.add(ambientLight);
    studioLights.push(ambientLight);
  } else if (preset === 'noon') {
    // High-noon Bangalore direct sun
    const sunLight = new THREE.DirectionalLight(0xFFF8E7, 3.5);
    sunLight.position.set(1, 8, 2);
    sunLight.castShadow = true;
    scene.add(sunLight);
    studioLights.push(sunLight);

    const skyAmbient = new THREE.AmbientLight(0x87CEEB, 1.5);
    scene.add(skyAmbient);
    studioLights.push(skyAmbient);
  } else if (preset === 'neon') {
    // Cyberpunk night
    const cyanLight = new THREE.DirectionalLight(0x00E5FF, 2.5);
    cyanLight.position.set(4, 3, 3);
    scene.add(cyanLight);
    studioLights.push(cyanLight);

    const purpleLight = new THREE.DirectionalLight(0x9D00FF, 3.0);
    purpleLight.position.set(-4, 3, -3);
    scene.add(purpleLight);
    studioLights.push(purpleLight);

    const ambientLight = new THREE.AmbientLight(0x05070A, 0.6);
    scene.add(ambientLight);
    studioLights.push(ambientLight);
  }
}

function buildScooterModel() {
  scooterGroup = new THREE.Group();
  bodyMaterials = [];
  accentMaterials = [];
  frameMaterials = [];

  const preset = CMF_PRESETS[currentPreset];

  // Base Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: preset.bodyColor,
    roughness: preset.roughness,
    metalness: preset.metalness,
    envMapIntensity: 1.0
  });
  bodyMaterials.push(bodyMat);

  const accentMat = new THREE.MeshStandardMaterial({
    color: preset.accentColor,
    roughness: 0.3,
    metalness: 0.2,
    emissive: preset.accentColor,
    emissiveIntensity: 0.15
  });
  accentMaterials.push(accentMat);

  const frameMat = new THREE.MeshStandardMaterial({
    color: preset.frameColor,
    roughness: 0.7,
    metalness: 0.6
  });
  frameMaterials.push(frameMat);

  const darkRubberMat = new THREE.MeshStandardMaterial({
    color: 0x151719,
    roughness: 0.9,
    metalness: 0.05
  });

  const alloyMat = new THREE.MeshStandardMaterial({
    color: 0x2A323D,
    roughness: 0.3,
    metalness: 0.85
  });

  const glassScreenMat = new THREE.MeshStandardMaterial({
    color: 0x05080C,
    roughness: 0.1,
    metalness: 0.9
  });

  // 1. CHASSIS / SPINE FRAME
  frameMesh = new THREE.Group();
  const mainSpineGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 16);
  const mainSpine = new THREE.Mesh(mainSpineGeo, frameMat);
  mainSpine.rotation.z = Math.PI / 2.3;
  mainSpine.position.set(-0.2, 0.3, 0);
  mainSpine.castShadow = true;
  frameMesh.add(mainSpine);

  // Subframe die-cast aluminum lattice
  const subframeGeo = new THREE.BoxGeometry(0.9, 0.35, 0.32);
  const subframe = new THREE.Mesh(subframeGeo, frameMat);
  subframe.position.set(-0.7, 0.25, 0);
  subframe.castShadow = true;
  frameMesh.add(subframe);
  scooterGroup.add(frameMesh);

  // 2. BATTERY ENCLOSURE & FLOORBOARD
  batteryMesh = new THREE.Group();
  const floorboardGeo = new THREE.BoxGeometry(1.3, 0.15, 0.52);
  const floorboard = new THREE.Mesh(floorboardGeo, frameMat);
  floorboard.position.set(0.1, 0.0, 0);
  floorboard.castShadow = true;
  floorboard.receiveShadow = true;
  batteryMesh.add(floorboard);

  const batteryPackGeo = new THREE.BoxGeometry(0.85, 0.28, 0.44);
  const batteryPack = new THREE.Mesh(batteryPackGeo, accentMat);
  batteryPack.position.set(0.1, -0.05, 0);
  batteryMesh.add(batteryPack);
  scooterGroup.add(batteryMesh);

  // 3. FRONT COWL & AERODYNAMIC APRON
  frontCowlMesh = new THREE.Group();
  // Sculpted front nose
  const noseGeo = new THREE.ConeGeometry(0.36, 1.4, 6);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.rotation.z = -Math.PI / 4.2;
  nose.position.set(0.85, 0.7, 0);
  nose.scale.set(1.0, 1.2, 0.75);
  nose.castShadow = true;
  frontCowlMesh.add(nose);

  // Headlight signature blade (LED strip)
  const headlightGeo = new THREE.BoxGeometry(0.1, 0.04, 0.32);
  const headlight = new THREE.Mesh(headlightGeo, accentMat);
  headlight.position.set(1.15, 0.82, 0);
  frontCowlMesh.add(headlight);

  // Aerodynamic side winglets
  const wingletGeo = new THREE.BoxGeometry(0.45, 0.05, 0.12);
  const leftWing = new THREE.Mesh(wingletGeo, accentMat);
  leftWing.position.set(0.75, 0.55, 0.3);
  leftWing.rotation.y = 0.2;
  frontCowlMesh.add(leftWing);

  const rightWing = new THREE.Mesh(wingletGeo, accentMat);
  rightWing.position.set(0.75, 0.55, -0.3);
  rightWing.rotation.y = -0.2;
  frontCowlMesh.add(rightWing);

  // Steering column & Handlebar
  const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12);
  const stem = new THREE.Mesh(stemGeo, frameMat);
  stem.rotation.z = -Math.PI / 4.4;
  stem.position.set(0.7, 1.05, 0);
  frontCowlMesh.add(stem);

  // Handlebars
  const barGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.85, 16);
  const bar = new THREE.Mesh(barGeo, frameMat);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0.9, 1.45, 0);
  frontCowlMesh.add(bar);

  // Ather 7-inch TFT Cluster Pod
  const clusterPodGeo = new THREE.BoxGeometry(0.18, 0.12, 0.22);
  const clusterPod = new THREE.Mesh(clusterPodGeo, bodyMat);
  clusterPod.position.set(0.85, 1.5, 0);
  clusterPod.rotation.z = -0.3;
  frontCowlMesh.add(clusterPod);

  const screenGeo = new THREE.PlaneGeometry(0.12, 0.18);
  const screen = new THREE.Mesh(screenGeo, glassScreenMat);
  screen.rotation.x = -Math.PI / 2;
  screen.rotation.y = -0.3;
  screen.position.set(0.85, 1.56, 0);
  frontCowlMesh.add(screen);
  scooterGroup.add(frontCowlMesh);

  // 4. SEAT PAN & REAR TAIL COWL
  seatMesh = new THREE.Group();
  const seatGeo = new THREE.BoxGeometry(1.0, 0.14, 0.38);
  const seat = new THREE.Mesh(seatGeo, darkRubberMat);
  seat.position.set(-0.55, 0.65, 0);
  seat.rotation.z = -0.08;
  seat.castShadow = true;
  seatMesh.add(seat);

  // Tail Cowl
  const tailGeo = new THREE.ConeGeometry(0.32, 0.9, 5);
  const tail = new THREE.Mesh(tailGeo, bodyMat);
  tail.rotation.z = Math.PI / 2.4;
  tail.position.set(-1.0, 0.52, 0);
  tail.scale.set(0.8, 1.2, 0.65);
  tail.castShadow = true;
  seatMesh.add(tail);

  // Integrated Halo LED Tail Lamp
  const tailLampGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.28, 16);
  const tailLamp = new THREE.Mesh(tailLampGeo, new THREE.MeshStandardMaterial({
    color: 0xFF2A4D,
    emissive: 0xFF2A4D,
    emissiveIntensity: 0.8
  }));
  tailLamp.rotation.x = Math.PI / 2;
  tailLamp.position.set(-1.42, 0.58, 0);
  seatMesh.add(tailLamp);

  // Sleek minimalist grab-rail
  const grabRailGeo = new THREE.TorusGeometry(0.15, 0.02, 8, 24, Math.PI);
  const grabRail = new THREE.Mesh(grabRailGeo, frameMat);
  grabRail.rotation.y = Math.PI / 2;
  grabRail.rotation.x = -0.2;
  grabRail.position.set(-1.15, 0.72, 0);
  seatMesh.add(grabRail);
  scooterGroup.add(seatMesh);

  // 5. WHEELS & SUSPENSION
  wheelFrontMesh = createWheel(alloyMat, darkRubberMat);
  wheelFrontMesh.position.set(1.3, -0.15, 0);
  scooterGroup.add(wheelFrontMesh);

  // Front Fork
  const forkGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 12);
  const fork = new THREE.Mesh(forkGeo, alloyMat);
  fork.rotation.z = -Math.PI / 4.6;
  fork.position.set(1.15, 0.22, 0.08);
  scooterGroup.add(fork);

  wheelRearMesh = createWheel(alloyMat, darkRubberMat);
  wheelRearMesh.position.set(-1.1, -0.15, 0);
  scooterGroup.add(wheelRearMesh);

  // Monoshock rear suspension
  const shockGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.5, 12);
  const shock = new THREE.Mesh(shockGeo, accentMat);
  shock.rotation.z = Math.PI / 3.5;
  shock.position.set(-0.6, 0.2, 0);
  scooterGroup.add(shock);

  // Position whole scooter group nicely above ground
  scooterGroup.position.y = 0.2;
  scene.add(scooterGroup);
}

function createWheel(alloyMat, tyreMat) {
  const wheelGroup = new THREE.Group();

  // Tyre
  const tyreGeo = new THREE.TorusGeometry(0.42, 0.12, 16, 32);
  const tyre = new THREE.Mesh(tyreGeo, tyreMat);
  tyre.castShadow = true;
  wheelGroup.add(tyre);

  // Rim / Alloy Hub
  const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.16, 24);
  const rim = new THREE.Mesh(rimGeo, alloyMat);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  wheelGroup.add(rim);

  // Disc brake rotor
  const discGeo = new THREE.RingGeometry(0.12, 0.26, 24);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x8892B0, metalness: 0.9, roughness: 0.2, side: THREE.DoubleSide });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.z = 0.09;
  wheelGroup.add(disc);

  // 3-Spoke sculptural alloy pattern
  for (let i = 0; i < 3; i++) {
    const spokeGeo = new THREE.BoxGeometry(0.05, 0.32, 0.06);
    const spoke = new THREE.Mesh(spokeGeo, alloyMat);
    spoke.rotation.z = (i * Math.PI * 2) / 3;
    wheelGroup.add(spoke);
  }

  return wheelGroup;
}

// Orbit Controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function setupOrbitControls(container) {
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    autoRotate = false;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    if (scooterGroup) {
      scooterGroup.rotation.y += deltaX * 0.008;
      scooterGroup.rotation.x = Math.max(-0.4, Math.min(0.4, scooterGroup.rotation.x + deltaY * 0.005));
    }

    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  // Touch Support for mobile & tablet
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  });

  container.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMousePosition.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.y;

    if (scooterGroup) {
      scooterGroup.rotation.y += deltaX * 0.008;
      scooterGroup.rotation.x = Math.max(-0.4, Math.min(0.4, scooterGroup.rotation.x + deltaY * 0.005));
    }
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // Zoom with wheel
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    camera.position.z = Math.max(3.0, Math.min(9.0, camera.position.z + e.deltaY * 0.005));
  }, { passive: false });
}

function onWindowResize() {
  const container = document.getElementById('scooter-3d-canvas-container');
  if (!container || !renderer || !camera) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  if (autoRotate && scooterGroup) {
    scooterGroup.rotation.y += 0.005;
  }

  // Exploded view animation offset
  if (frontCowlMesh && seatMesh && batteryMesh) {
    frontCowlMesh.position.x = 0.85 + (explodedAmount * 0.6);
    frontCowlMesh.position.y = 0.7 + (explodedAmount * 0.2);
    seatMesh.position.x = -0.55 - (explodedAmount * 0.5);
    seatMesh.position.y = 0.65 + (explodedAmount * 0.3);
    batteryMesh.position.y = -(explodedAmount * 0.4);
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Global functions for UI controls
window.setCMFPreset = function(presetKey) {
  if (!CMF_PRESETS[presetKey]) return;
  currentPreset = presetKey;
  const p = CMF_PRESETS[presetKey];

  bodyMaterials.forEach(mat => {
    mat.color.setHex(p.bodyColor);
    mat.roughness = p.roughness;
    mat.metalness = p.metalness;
  });

  accentMaterials.forEach(mat => {
    mat.color.setHex(p.accentColor);
    mat.emissive.setHex(p.accentColor);
  });

  frameMaterials.forEach(mat => {
    mat.color.setHex(p.frameColor);
  });

  // Update UI indicators
  document.querySelectorAll('.cmf-btn').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-emerald-400', 'border-emerald-400');
  });
  const activeBtn = document.getElementById(`cmf-${presetKey}`);
  if (activeBtn) activeBtn.classList.add('ring-2', 'ring-emerald-400');

  const descEl = document.getElementById('cmf-description');
  if (descEl) descEl.textContent = p.desc;

  const roughnessSlider = document.getElementById('slider-roughness');
  if (roughnessSlider) roughnessSlider.value = p.roughness * 100;
  const metalSlider = document.getElementById('slider-metalness');
  if (metalSlider) metalSlider.value = p.metalness * 100;
};

window.toggleWireframeMode = function() {
  wireframeActive = !wireframeActive;
  const allMats = [...bodyMaterials, ...accentMaterials, ...frameMaterials];
  allMats.forEach(m => {
    m.wireframe = wireframeActive;
  });
  const btn = document.getElementById('wireframe-toggle-btn');
  if (btn) {
    btn.textContent = wireframeActive ? "Shader View" : "Topology Wireframe";
    btn.classList.toggle('bg-emerald-500/20', wireframeActive);
    btn.classList.toggle('text-emerald-400', wireframeActive);
  }
};

window.setLightingRig = function(mode) {
  setupLighting(mode);
  document.querySelectorAll('.light-rig-btn').forEach(b => b.classList.remove('text-emerald-400', 'border-emerald-500/50'));
  const active = document.getElementById(`light-${mode}`);
  if (active) active.classList.add('text-emerald-400', 'border-emerald-500/50');
};

window.updateMaterialRoughness = function(val) {
  const r = val / 100;
  bodyMaterials.forEach(m => m.roughness = r);
};

window.updateMaterialMetalness = function(val) {
  const m = val / 100;
  bodyMaterials.forEach(m => m.metalness = m);
};

window.updateExplodedView = function(val) {
  explodedAmount = val / 100;
};

window.toggleAutoRotation = function() {
  autoRotate = !autoRotate;
  const btn = document.getElementById('autorotate-btn');
  if (btn) btn.classList.toggle('text-emerald-400', autoRotate);
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Give container a beat to calculate clientWidth
  setTimeout(init3DViewer, 100);
});
