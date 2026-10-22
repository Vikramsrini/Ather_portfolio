// AeroMorph 3D Parametric CAD, Multi-Pass ControlNet Conditioning & CMF Studio
// Built with Three.js — Sculpted Ather 450 Apex / 450X Procedural CAD Assembly,
// Real-time PBR, Surface Normal Pass, Z-Depth Pass, Class-A Zebra Continuity Shader, and SubD Topology.

let scene, camera, renderer, scooterGroup;
let bodyMaterials = [];
let translucentPanelMaterials = [];
let accentMaterials = [];
let trellisMaterials = [];
let frameMaterials = [];
let alloyMaterials = [];
let allRenderMeshes = [];

let currentRenderPass = 'pbr'; // 'pbr' | 'normal' | 'depth' | 'zebra' | 'wireframe'
let autoRotate = true;
let explodedAmount = 0;
let targetCameraPos = { x: 4.2, y: 1.85, z: 4.4 };
let targetLookAt = { x: 0.05, y: 0.42, z: 0 };
let currentLookAt = { x: 0.05, y: 0.42, z: 0 };

// Sub-assembly groups for exploded CAD inspection
let frontCowlGroup, cockpitGroup, seatTailGroup, batteryFloorGroup, trellisFrameGroup, wheelFrontGroup, wheelRearGroup, drivetrainGroup;

// Custom GLSL Shaders for Industrial Design Surface Inspection & ControlNet Conditioning
const ZEBRA_SHADER = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      vec3 refl = reflect(-viewDir, normal);
      float stripe = sin(refl.y * 42.0 + refl.x * 14.0);
      float band = smoothstep(-0.08, 0.08, stripe);
      vec3 col = mix(vec3(0.06, 0.09, 0.13), vec3(0.92, 0.98, 0.96), band);
      // Subtle rim highlight in Ather Mint
      float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);
      col += vec3(0.0, 0.9, 0.6) * fresnel * 0.45;
      gl_FragColor = vec4(col, 1.0);
    }
  `
};

const DEPTH_SHADER = {
  vertexShader: `
    varying float vDepth;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      // Map camera distance [2.2 .. 7.8] to normalized [1.0 .. 0.0] for ControlNet Depth
      vDepth = clamp(1.0 - ((-mvPosition.z - 2.2) / 5.2), 0.05, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying float vDepth;
    void main() {
      float d = pow(vDepth, 1.15);
      gl_FragColor = vec4(vec3(d), 1.0);
    }
  `
};

let normalPassMat, depthPassMat, zebraPassMat;

const CMF_PRESETS = {
  apex: {
    name: "450 Apex™ Indium Blue",
    code: "CMF-APX-2026 // TRANSLUCENT",
    bodyColor: 0x1D4ED8,
    accentColor: 0xFF4D2D,
    trellisColor: 0xFF4D2D,
    frameColor: 0x161B24,
    alloyColor: 0x1E293B,
    roughness: 0.24,
    metalness: 0.55,
    panelOpacity: 0.58,
    deltaE: "0.9 ΔE",
    desc: "Satin Indium Blue metallic fairing with Smoked Translucent polycarbonate rear panels exposing the anodized Tang Orange aluminum trellis frame."
  },
  stealth: {
    name: "450X Stealth & Warp Mint",
    code: "CMF-450X-OBS // MATTE",
    bodyColor: 0x12161F,
    accentColor: 0x00E599,
    trellisColor: 0x00E599,
    frameColor: 0x1C222D,
    alloyColor: 0x181D26,
    roughness: 0.62,
    metalness: 0.25,
    panelOpacity: 1.0,
    deltaE: "1.1 ΔE",
    desc: "Matte obsidian composite body panels with signature Ather Warp Mint aerodynamic intake blades and exposed trellis subframe."
  },
  mint: {
    name: "Hyper Mint Clearcoat",
    code: "CMF-450X-MNT // HIGH GLOSS",
    bodyColor: 0x00D68F,
    accentColor: 0x0B0F17,
    trellisColor: 0x1E293B,
    frameColor: 0x11161F,
    alloyColor: 0x11151C,
    roughness: 0.16,
    metalness: 0.18,
    panelOpacity: 1.0,
    deltaE: "1.3 ΔE",
    desc: "High-chroma Ather Electric Mint automotive paint under dual-stage UV clearcoat with contrasting dark graphite structural spine."
  },
  rizta: {
    name: "Rizta™ Pangong Duo-Tone",
    code: "CMF-RZT-PNG // FAMILY",
    bodyColor: 0x0284C7,
    accentColor: 0xF8FAFC,
    trellisColor: 0x38BDF8,
    frameColor: 0x1E293B,
    alloyColor: 0x334155,
    roughness: 0.28,
    metalness: 0.32,
    panelOpacity: 1.0,
    deltaE: "1.0 ΔE",
    desc: "Pangong Lake cyan-blue lower fairing paired with warm chalk-white upper accents engineered for high urban visibility."
  },
  crimson: {
    name: "Lunar Grey & Factory Red",
    code: "CMF-450X-LNR // SATIN",
    bodyColor: 0x94A3B8,
    accentColor: 0xFF2A4D,
    trellisColor: 0xFF2A4D,
    frameColor: 0x1A1E26,
    alloyColor: 0x222731,
    roughness: 0.42,
    metalness: 0.48,
    panelOpacity: 0.92,
    deltaE: "1.2 ΔE",
    desc: "Aerospace satin lunar grey bodywork accented with high-visibility crimson ram-air ducts and rear monoshock coil."
  },
  clay: {
    name: "Industrial Styling Clay",
    code: "CAD-CLAY-G2 // ALIAS BUCK",
    bodyColor: 0xB88B68,
    accentColor: 0x8C6244,
    trellisColor: 0x9E7354,
    frameColor: 0x7A5438,
    alloyColor: 0x6E4B32,
    roughness: 0.78,
    metalness: 0.04,
    panelOpacity: 1.0,
    deltaE: "REF BUCK",
    desc: "Digital industrial design Chavant clay shader used to evaluate pure dihedral crease lines and surface tension without color distraction."
  }
};

let currentPreset = 'apex';
let studioLights = [];
let envTexture = null;

function createProceduralEnvMap() {
  // Creates a studio softbox reflection canvas for realistic automotive highlights
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#0F172A');
  grad.addColorStop(0.45, '#1E293B');
  grad.addColorStop(0.5, '#090D14');
  grad.addColorStop(1, '#05070A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Studio overhead light strips
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(40, 28, 180, 18);
  ctx.fillRect(280, 42, 190, 14);
  ctx.fillStyle = 'rgba(0, 229, 153, 0.55)';
  ctx.fillRect(90, 80, 320, 8);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.fillRect(10, 115, 200, 6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

function createClusterScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#060A0F';
  ctx.fillRect(0, 0, 256, 160);
  ctx.strokeStyle = '#00E599';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 152);
  ctx.fillStyle = '#00E599';
  ctx.font = 'bold 48px monospace';
  ctx.fillText('64', 88, 92);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '14px monospace';
  ctx.fillText('KM/H // WARP+', 70, 122);
  return new THREE.CanvasTexture(canvas);
}

function init3DViewer() {
  const container = document.getElementById('scooter-3d-canvas-container');
  if (!container || typeof THREE === 'undefined') return;

  const width = container.clientWidth || 680;
  const height = container.clientHeight || 480;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070A0F);
  scene.fog = new THREE.FogExp2(0x070A0F, 0.042);

  camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
  camera.position.set(targetCameraPos.x, targetCameraPos.y, targetCameraPos.z);

  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  envTexture = createProceduralEnvMap();
  scene.environment = envTexture;

  normalPassMat = new THREE.MeshNormalMaterial({ flatShading: false });
  depthPassMat = new THREE.ShaderMaterial(DEPTH_SHADER);
  zebraPassMat = new THREE.ShaderMaterial(ZEBRA_SHADER);

  setupLighting('studio');
  buildStudioFloor();
  buildSculptedAtherScooter();
  setupOrbitControls(container);
  animate();

  window.addEventListener('resize', onWindowResize);
}

function buildStudioFloor() {
  // Technical turntable ring + precision CAD grid
  const gridHelper = new THREE.GridHelper(12, 24, 0x00E599, 0x162030);
  gridHelper.position.y = -0.62;
  gridHelper.material.opacity = 0.28;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // Turntable outer measurement ring
  const ringGeo = new THREE.RingGeometry(1.85, 1.88, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00E599, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.61;
  scene.add(ring);

  const innerRingGeo = new THREE.RingGeometry(1.45, 1.465, 64);
  const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = -0.61;
  scene.add(innerRing);

  const shadowPlaneGeo = new THREE.PlaneGeometry(14, 14);
  const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.55 });
  const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -0.615;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);
}

function setupLighting(preset) {
  studioLights.forEach(light => scene.remove(light));
  studioLights = [];

  if (preset === 'studio') {
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.6);
    keyLight.position.set(5, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);
    studioLights.push(keyLight);

    const fillLight = new THREE.DirectionalLight(0x60A5FA, 1.4);
    fillLight.position.set(-5, 3, 4);
    scene.add(fillLight);
    studioLights.push(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00E599, 2.1);
    rimLight.position.set(-2, 5, -5);
    scene.add(rimLight);
    studioLights.push(rimLight);

    const underGlow = new THREE.PointLight(0x00E599, 0.9, 4);
    underGlow.position.set(0, -0.4, 0);
    scene.add(underGlow);
    studioLights.push(underGlow);

    const ambientLight = new THREE.AmbientLight(0x1E293B, 1.35);
    scene.add(ambientLight);
    studioLights.push(ambientLight);
  } else if (preset === 'noon') {
    // 90,000 Lux Bangalore High Noon Solar Rig
    const sunLight = new THREE.DirectionalLight(0xFFFBEB, 4.2);
    sunLight.position.set(1.5, 9, 2.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    studioLights.push(sunLight);

    const skyFill = new THREE.HemisphereLight(0x93C5FD, 0x1E293B, 1.8);
    scene.add(skyFill);
    studioLights.push(skyFill);
  } else if (preset === 'neon') {
    // Indiranagar Night / Warp Tunnel Lighting
    const cyanLight = new THREE.DirectionalLight(0x00D8F6, 3.0);
    cyanLight.position.set(4, 3, 4);
    cyanLight.castShadow = true;
    scene.add(cyanLight);
    studioLights.push(cyanLight);

    const warpLight = new THREE.DirectionalLight(0xA855F7, 3.4);
    warpLight.position.set(-4, 4, -3);
    scene.add(warpLight);
    studioLights.push(warpLight);

    const orangeRim = new THREE.PointLight(0xFF4D2D, 2.0, 5);
    orangeRim.position.set(-0.6, 0.5, 1.2);
    scene.add(orangeRim);
    studioLights.push(orangeRim);

    const ambientLight = new THREE.AmbientLight(0x090D16, 0.8);
    scene.add(ambientLight);
    studioLights.push(ambientLight);
  }
}

function registerMesh(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.originalMaterial = mesh.material;
  allRenderMeshes.push(mesh);
  return mesh;
}

function buildSculptedAtherScooter() {
  scooterGroup = new THREE.Group();
  bodyMaterials = [];
  translucentPanelMaterials = [];
  accentMaterials = [];
  trellisMaterials = [];
  frameMaterials = [];
  alloyMaterials = [];
  allRenderMeshes = [];

  const p = CMF_PRESETS[currentPreset];

  // Primary Painted Fairing Material
  const bodyMat = new THREE.MeshStandardMaterial({
    color: p.bodyColor,
    roughness: p.roughness,
    metalness: p.metalness,
    envMap: envTexture,
    envMapIntensity: 1.35
  });
  bodyMaterials.push(bodyMat);

  // Translucent Smoked Side Panel Material (Signature 450 Apex Feature)
  const transPanelMat = new THREE.MeshStandardMaterial({
    color: p.bodyColor,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: p.panelOpacity,
    envMap: envTexture,
    envMapIntensity: 1.5
  });
  translucentPanelMaterials.push(transPanelMat);

  // Aero Winglet & Accent Material
  const accentMat = new THREE.MeshStandardMaterial({
    color: p.accentColor,
    roughness: 0.25,
    metalness: 0.3,
    emissive: p.accentColor,
    emissiveIntensity: 0.18,
    envMap: envTexture
  });
  accentMaterials.push(accentMat);

  // Exposed Aluminum Trellis Subframe Material
  const trellisMat = new THREE.MeshStandardMaterial({
    color: p.trellisColor,
    roughness: 0.28,
    metalness: 0.72,
    emissive: p.trellisColor,
    emissiveIntensity: 0.08,
    envMap: envTexture
  });
  trellisMaterials.push(trellisMat);

  // Die-Cast Structural Aluminum Chassis Material
  const frameMat = new THREE.MeshStandardMaterial({
    color: p.frameColor,
    roughness: 0.55,
    metalness: 0.65,
    envMap: envTexture
  });
  frameMaterials.push(frameMat);

  // Split-Spoke Alloy Rim Material
  const alloyMat = new THREE.MeshStandardMaterial({
    color: p.alloyColor,
    roughness: 0.25,
    metalness: 0.85,
    envMap: envTexture
  });
  alloyMaterials.push(alloyMat);

  const tyreRubberMat = new THREE.MeshStandardMaterial({
    color: 0x101318,
    roughness: 0.88,
    metalness: 0.05
  });

  const saddleLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x161922,
    roughness: 0.72,
    metalness: 0.08
  });

  const drlGlowMat = new THREE.MeshStandardMaterial({
    color: 0xE0F2FE,
    emissive: 0x38BDF8,
    emissiveIntensity: 2.2,
    roughness: 0.1
  });

  const tailGlowMat = new THREE.MeshStandardMaterial({
    color: 0xFF2A4D,
    emissive: 0xFF1E42,
    emissiveIntensity: 2.0,
    roughness: 0.1
  });

  // =========================================================================
  // 1. STRUCTURAL DIE-CAST BATTERY FLOORBOARD & LOWER CHASSIS
  // =========================================================================
  batteryFloorGroup = new THREE.Group();

  // Sculpted Floorboard Deck using ExtrudeGeometry
  const deckShape = new THREE.Shape();
  deckShape.moveTo(-0.55, -0.06);
  deckShape.lineTo(0.62, -0.06);
  deckShape.lineTo(0.78, 0.14);
  deckShape.lineTo(0.68, 0.18);
  deckShape.lineTo(-0.48, 0.08);
  deckShape.closePath();

  const deckGeo = new THREE.ExtrudeGeometry(deckShape, {
    depth: 0.44,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025
  });
  deckGeo.center();
  const deckMesh = registerMesh(new THREE.Mesh(deckGeo, frameMat));
  deckMesh.position.set(0.12, -0.12, 0);
  batteryFloorGroup.add(deckMesh);

  // 3.7 kWh Structural Lithium-Ion Pack Enclosure (visible in exploded view)
  const packGeo = new THREE.BoxGeometry(0.88, 0.14, 0.36);
  const packMesh = registerMesh(new THREE.Mesh(packGeo, accentMat));
  packMesh.position.set(0.08, -0.18, 0);
  batteryFloorGroup.add(packMesh);

  // Side Aerodynamic Belly Skirts (Left & Right)
  [-0.23, 0.23].forEach(zPos => {
    const skirtGeo = new THREE.BoxGeometry(0.95, 0.09, 0.03);
    const skirt = registerMesh(new THREE.Mesh(skirtGeo, bodyMat));
    skirt.position.set(0.14, -0.1, zPos);
    skirt.rotation.z = 0.08;
    batteryFloorGroup.add(skirt);

    // Accent aero stripe along floorboard
    const stripeGeo = new THREE.BoxGeometry(0.75, 0.02, 0.035);
    const stripe = registerMesh(new THREE.Mesh(stripeGeo, accentMat));
    stripe.position.set(0.16, -0.13, zPos);
    stripe.rotation.z = 0.08;
    batteryFloorGroup.add(stripe);
  });

  scooterGroup.add(batteryFloorGroup);

  // =========================================================================
  // 2. EXPOSED ALUMINUM TRELLIS SUB-FRAME (Signature Ather Architecture)
  // =========================================================================
  trellisFrameGroup = new THREE.Group();

  function addStrut(p1, p2, radius, mat) {
    const curve = new THREE.LineCurve3(new THREE.Vector3(...p1), new THREE.Vector3(...p2));
    const geo = new THREE.TubeGeometry(curve, 8, radius, 12, false);
    const m = registerMesh(new THREE.Mesh(geo, mat));
    trellisFrameGroup.add(m);
  }

  // Left and Right Trellis Truss Triangles
  [-0.17, 0.17].forEach(z => {
    // Main upper rail from floorboard pivot to tail
    addStrut([-0.22, -0.08, z], [-1.08, 0.56, z * 0.85], 0.026, trellisMat);
    // Lower support rail
    addStrut([-0.38, -0.15, z], [-0.98, 0.44, z * 0.85], 0.022, trellisMat);
    // Diagonal Warren truss members
    addStrut([-0.30, -0.12, z], [-0.48, 0.16, z], 0.016, trellisMat);
    addStrut([-0.48, 0.16, z], [-0.62, 0.06, z], 0.016, trellisMat);
    addStrut([-0.62, 0.06, z], [-0.78, 0.36, z * 0.9], 0.016, trellisMat);
    addStrut([-0.78, 0.36, z * 0.9], [-0.92, 0.32, z * 0.85], 0.016, trellisMat);
  });

  // Cross-braces connecting left & right trellis
  addStrut([-0.48, 0.16, -0.17], [-0.48, 0.16, 0.17], 0.02, trellisMat);
  addStrut([-0.78, 0.36, -0.15], [-0.78, 0.36, 0.15], 0.02, trellisMat);

  // Main Headstock Spine Tube
  addStrut([0.58, -0.05, 0], [0.92, 0.88, 0], 0.052, frameMat);

  scooterGroup.add(trellisFrameGroup);

  // =========================================================================
  // 3. FRONT CHISELED AERO APRON, BI-LED HEADLAMP & FENDER
  // =========================================================================
  frontCowlGroup = new THREE.Group();

  // Sculpted 2D Side Silhouette of Ather's sharp forward-raked Front Apron
  const apronShape = new THREE.Shape();
  apronShape.moveTo(0.52, -0.02);
  apronShape.lineTo(0.78, -0.04);
  apronShape.lineTo(1.22, 0.58); // Sharp chiseled nose apex
  apronShape.lineTo(1.06, 1.02); // Upper cowl brow
  apronShape.lineTo(0.84, 0.98); // Inner knee panel top
  apronShape.lineTo(0.64, 0.38); // Knee pocket recess (ergonomic relief!)
  apronShape.closePath();

  const apronGeo = new THREE.ExtrudeGeometry(apronShape, {
    depth: 0.38,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 2,
    bevelSize: 0.045,
    bevelThickness: 0.045
  });
  apronGeo.center();
  const apronMesh = registerMesh(new THREE.Mesh(apronGeo, bodyMat));
  apronMesh.position.set(0.86, 0.48, 0);
  frontCowlGroup.add(apronMesh);

  // Recessed Black Headlight Visor Housing + Bi-LED DRL Blade
  const visorGeo = new THREE.BoxGeometry(0.14, 0.16, 0.38);
  const visorMesh = registerMesh(new THREE.Mesh(visorGeo, frameMat));
  visorMesh.position.set(1.13, 0.62, 0);
  visorMesh.rotation.z = -0.52;
  frontCowlGroup.add(visorMesh);

  const drlGeo = new THREE.BoxGeometry(0.06, 0.038, 0.41);
  const drlMesh = registerMesh(new THREE.Mesh(drlGeo, drlGlowMat));
  drlMesh.position.set(1.17, 0.63, 0);
  drlMesh.rotation.z = -0.52;
  frontCowlGroup.add(drlMesh);

  // Aerodynamic Side Ram-Air Winglets (Left & Right)
  [-0.23, 0.23].forEach(z => {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(0.46, 0.28);
    wingShape.lineTo(0.38, 0.42);
    wingShape.lineTo(-0.06, 0.12);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.022,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.008,
      bevelThickness: 0.008
    });
    const wing = registerMesh(new THREE.Mesh(wingGeo, accentMat));
    wing.position.set(0.68, 0.28, z > 0 ? z : z - 0.022);
    wing.rotation.y = z > 0 ? 0.08 : -0.08;
    frontCowlGroup.add(wing);
  });

  // Sculpted Front Wheel Mudguard / Aero Fender
  const fenderGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.22, 24, 1, true, -Math.PI * 0.35, Math.PI * 0.55);
  const fenderMat = bodyMat.clone();
  fenderMat.side = THREE.DoubleSide;
  bodyMaterials.push(fenderMat);
  const fender = registerMesh(new THREE.Mesh(fenderGeo, fenderMat));
  fender.rotation.x = Math.PI / 2;
  fender.position.set(1.26, -0.18, 0);
  frontCowlGroup.add(fender);

  scooterGroup.add(frontCowlGroup);

  // =========================================================================
  // 4. COCKPIT, HANDLEBARS & ATHERSTACK 7" TFT DISPLAY POD
  // =========================================================================
  cockpitGroup = new THREE.Group();

  // Sculpted Handlebar Cowling / Neck Shroud
  const neckGeo = new THREE.BoxGeometry(0.26, 0.22, 0.32);
  const neckMesh = registerMesh(new THREE.Mesh(neckGeo, bodyMat));
  neckMesh.position.set(0.86, 1.12, 0);
  neckMesh.rotation.z = -0.35;
  cockpitGroup.add(neckMesh);

  // Swept Handlebar Tube
  const barCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.80, 1.18, -0.42),
    new THREE.Vector3(0.86, 1.16, -0.18),
    new THREE.Vector3(0.88, 1.15, 0),
    new THREE.Vector3(0.86, 1.16, 0.18),
    new THREE.Vector3(0.80, 1.18, 0.42)
  ]);
  const barGeo = new THREE.TubeGeometry(barCurve, 20, 0.022, 12, false);
  const barMesh = registerMesh(new THREE.Mesh(barGeo, frameMat));
  cockpitGroup.add(barMesh);

  // MagicTwist™ Throttle & Left Grip + Brake Levers
  [-0.38, 0.38].forEach(z => {
    const gripGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.14, 16);
    const grip = registerMesh(new THREE.Mesh(gripGeo, tyreRubberMat));
    grip.rotation.x = Math.PI / 2;
    grip.position.set(0.81, 1.18, z);
    cockpitGroup.add(grip);

    // Anodized Grip Ring
    const ringG = new THREE.CylinderGeometry(0.031, 0.031, 0.018, 16);
    const ringM = registerMesh(new THREE.Mesh(ringG, accentMat));
    ringM.rotation.x = Math.PI / 2;
    ringM.position.set(0.81, 1.18, z > 0 ? z - 0.07 : z + 0.07);
    cockpitGroup.add(ringM);
  });

  // 7-Inch AtherStack TFT Touchscreen Bezel & Live Illuminated Display
  const tftBezelGeo = new THREE.BoxGeometry(0.18, 0.035, 0.25);
  const tftBezel = registerMesh(new THREE.Mesh(tftBezelGeo, frameMat));
  tftBezel.position.set(0.87, 1.21, 0);
  tftBezel.rotation.z = -0.45;
  cockpitGroup.add(tftBezel);

  const screenTex = createClusterScreenTexture();
  const tftScreenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const tftScreenGeo = new THREE.PlaneGeometry(0.15, 0.22);
  const tftScreen = new THREE.Mesh(tftScreenGeo, tftScreenMat);
  tftScreen.rotation.x = -Math.PI / 2;
  tftScreen.rotation.y = -0.45;
  tftScreen.position.set(0.88, 1.23, 0);
  cockpitGroup.add(tftScreen);

  scooterGroup.add(cockpitGroup);

  // =========================================================================
  // 5. SCULPTED STEPPED SADDLE, TRANSLUCENT TAIL PANELS & HALO GRAB RAIL
  // =========================================================================
  seatTailGroup = new THREE.Group();

  // Translucent Smoked Side Panels (Revealing the Trellis Frame underneath!)
  [-0.195, 0.195].forEach(z => {
    const panelShape = new THREE.Shape();
    panelShape.moveTo(-0.18, 0.08);
    panelShape.lineTo(0.08, 0.38);
    panelShape.lineTo(-0.98, 0.56);
    panelShape.lineTo(-1.22, 0.52);
    panelShape.lineTo(-0.78, 0.24);
    panelShape.closePath();

    const panelGeo = new THREE.ExtrudeGeometry(panelShape, {
      depth: 0.024,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.01,
      bevelThickness: 0.01
    });
    const panel = registerMesh(new THREE.Mesh(panelGeo, transPanelMat));
    panel.position.set(0, 0, z > 0 ? z : z - 0.024);
    seatTailGroup.add(panel);
  });

  // Two-Tier Ergonomic Saddle (Rider + Pillion Stepped Contour)
  const seatShape = new THREE.Shape();
  seatShape.moveTo(0.15, 0.36);
  seatShape.quadraticCurveTo(-0.18, 0.32, -0.38, 0.42);
  seatShape.lineTo(-0.46, 0.52);
  seatShape.lineTo(-1.02, 0.58);
  seatShape.quadraticCurveTo(-1.08, 0.66, -0.96, 0.69);
  seatShape.lineTo(-0.42, 0.64);
  seatShape.lineTo(-0.30, 0.52);
  seatShape.quadraticCurveTo(-0.05, 0.48, 0.16, 0.50);
  seatShape.closePath();

  const seatGeo = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.035,
    bevelThickness: 0.035
  });
  seatGeo.center();
  const seatMesh = registerMesh(new THREE.Mesh(seatGeo, saddleLeatherMat));
  seatMesh.position.set(-0.45, 0.54, 0);
  seatTailGroup.add(seatMesh);

  // Rear LED Tail Lamp Blade
  const tailLampGeo = new THREE.BoxGeometry(0.08, 0.045, 0.32);
  const tailLamp = registerMesh(new THREE.Mesh(tailLampGeo, tailGlowMat));
  tailLamp.position.set(-1.14, 0.52, 0);
  tailLamp.rotation.z = 0.25;
  seatTailGroup.add(tailLamp);

  // Swept Cast Aluminum Pillion Grab Rail / Halo Inductive Dock
  const railCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.82, 0.58, -0.18),
    new THREE.Vector3(-1.18, 0.64, -0.14),
    new THREE.Vector3(-1.26, 0.66, 0),
    new THREE.Vector3(-1.18, 0.64, 0.14),
    new THREE.Vector3(-0.82, 0.58, 0.18)
  ]);
  const railGeo = new THREE.TubeGeometry(railCurve, 24, 0.022, 12, false);
  const railMesh = registerMesh(new THREE.Mesh(railGeo, accentMat));
  seatTailGroup.add(railMesh);

  scooterGroup.add(seatTailGroup);

  // =========================================================================
  // 6. DRIVETRAIN: OFFSET MONOSHOCK, LATTICE SWINGARM & CARBON BELT DRIVE
  // =========================================================================
  drivetrainGroup = new THREE.Group();

  // Helical Coil Spring for Offset Rear Monoshock
  const helixPoints = [];
  const turns = 6.5;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const angle = t * turns * Math.PI * 2;
    const x = -0.35 - t * 0.24;
    const y = 0.02 + t * 0.22 + Math.cos(angle) * 0.042;
    const z = Math.sin(angle) * 0.042;
    helixPoints.push(new THREE.Vector3(x, y, z));
  }
  const springCurve = new THREE.CatmullRomCurve3(helixPoints);
  const springGeo = new THREE.TubeGeometry(springCurve, 64, 0.014, 8, false);
  const springMesh = registerMesh(new THREE.Mesh(springGeo, trellisMat));
  drivetrainGroup.add(springMesh);

  // Cast Aluminum Swingarm & Belt Drive Pulley
  const swingarmGeo = new THREE.BoxGeometry(0.68, 0.11, 0.06);
  const swingarm = registerMesh(new THREE.Mesh(swingarmGeo, frameMat));
  swingarm.position.set(-0.68, -0.16, -0.15);
  swingarm.rotation.z = 0.05;
  drivetrainGroup.add(swingarm);

  const pulleyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.04, 24);
  const pulley = registerMesh(new THREE.Mesh(pulleyGeo, alloyMat));
  pulley.rotation.x = Math.PI / 2;
  pulley.position.set(-0.98, -0.18, 0.13);
  drivetrainGroup.add(pulley);

  scooterGroup.add(drivetrainGroup);

  // =========================================================================
  // 7. WHEELS, DUAL PETAL DISC ROTORS & TELESCOPIC FORKS
  // =========================================================================
  wheelFrontGroup = createDetailedWheel(alloyMat, tyreRubberMat, accentMat);
  wheelFrontGroup.position.set(1.26, -0.18, 0);

  // Dual Telescopic Front Forks connecting to Wheel Axle
  [-0.11, 0.11].forEach(z => {
    const forkGeo = new THREE.CylinderGeometry(0.026, 0.022, 0.72, 16);
    const fork = registerMesh(new THREE.Mesh(forkGeo, frameMat));
    fork.rotation.z = -0.44;
    fork.position.set(-0.14, 0.28, z);
    wheelFrontGroup.add(fork);
  });
  scooterGroup.add(wheelFrontGroup);

  wheelRearGroup = createDetailedWheel(alloyMat, tyreRubberMat, accentMat);
  wheelRearGroup.position.set(-0.98, -0.18, 0);
  scooterGroup.add(wheelRearGroup);

  scooterGroup.position.y = 0.02;
  scooterGroup.rotation.y = -0.45;
  scene.add(scooterGroup);
}

function createDetailedWheel(alloyMat, tyreMat, caliperMat) {
  const wheelGroup = new THREE.Group();

  // Sculpted Low-Profile Tubeless Tyre
  const tyreGeo = new THREE.TorusGeometry(0.32, 0.115, 20, 42);
  const tyre = registerMesh(new THREE.Mesh(tyreGeo, tyreMat));
  wheelGroup.add(tyre);

  // Outer Rim Barrel
  const rimBarrelGeo = new THREE.CylinderGeometry(0.225, 0.225, 0.13, 32, 1, true);
  const rimBarrelMat = alloyMat.clone();
  rimBarrelMat.side = THREE.DoubleSide;
  alloyMaterials.push(rimBarrelMat);
  const rimBarrel = registerMesh(new THREE.Mesh(rimBarrelGeo, rimBarrelMat));
  rimBarrel.rotation.x = Math.PI / 2;
  wheelGroup.add(rimBarrel);

  // Center Hub
  const hubGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.15, 20);
  const hub = registerMesh(new THREE.Mesh(hubGeo, alloyMat));
  hub.rotation.x = Math.PI / 2;
  wheelGroup.add(hub);

  // Rim Accent Tape Strip
  const tapeGeo = new THREE.RingGeometry(0.212, 0.224, 36);
  const tapeMat = caliperMat.clone();
  tapeMat.side = THREE.DoubleSide;
  accentMaterials.push(tapeMat);
  [-0.066, 0.066].forEach(z => {
    const tape = new THREE.Mesh(tapeGeo, tapeMat);
    tape.position.z = z;
    wheelGroup.add(tape);
  });

  // 6 Y-Split Sculptural Alloy Spokes
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const spokeGeo = new THREE.BoxGeometry(0.026, 0.21, 0.045);
    const spoke = registerMesh(new THREE.Mesh(spokeGeo, alloyMat));
    spoke.position.set(Math.cos(angle) * 0.11, Math.sin(angle) * 0.11, 0);
    spoke.rotation.z = angle + Math.PI / 2 + 0.15;
    wheelGroup.add(spoke);
  }

  // Drilled Petal Disc Brake Rotor + Anodized Caliper
  const discGeo = new THREE.RingGeometry(0.08, 0.175, 28);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0xCBD5E1,
    metalness: 0.92,
    roughness: 0.22,
    side: THREE.DoubleSide
  });
  const disc = registerMesh(new THREE.Mesh(discGeo, discMat));
  disc.position.z = 0.082;
  wheelGroup.add(disc);

  const caliperGeo = new THREE.BoxGeometry(0.075, 0.095, 0.055);
  const caliper = registerMesh(new THREE.Mesh(caliperGeo, caliperMat));
  caliper.position.set(-0.13, 0.07, 0.085);
  caliper.rotation.z = 0.4;
  wheelGroup.add(caliper);

  return wheelGroup;
}

// Orbit & Camera Controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function setupOrbitControls(container) {
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    autoRotate = false;
    updateAutoRotateBtnUI();
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDragging || !scooterGroup) return;
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    scooterGroup.rotation.y += deltaX * 0.0085;
    scooterGroup.rotation.x = Math.max(-0.35, Math.min(0.35, scooterGroup.rotation.x + deltaY * 0.005));
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      autoRotate = false;
      updateAutoRotateBtnUI();
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1 || !scooterGroup) return;
    const deltaX = e.touches[0].clientX - previousMousePosition.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.y;
    scooterGroup.rotation.y += deltaX * 0.0085;
    scooterGroup.rotation.x = Math.max(-0.35, Math.min(0.35, scooterGroup.rotation.x + deltaY * 0.005));
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetCameraPos.z = Math.max(2.6, Math.min(7.5, targetCameraPos.z + e.deltaY * 0.004));
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
    scooterGroup.rotation.y += 0.0045;
  }

  // Smooth Camera Interpolation
  if (camera) {
    camera.position.x += (targetCameraPos.x - camera.position.x) * 0.08;
    camera.position.y += (targetCameraPos.y - camera.position.y) * 0.08;
    camera.position.z += (targetCameraPos.z - camera.position.z) * 0.08;
    currentLookAt.x += (targetLookAt.x - currentLookAt.x) * 0.08;
    currentLookAt.y += (targetLookAt.y - currentLookAt.y) * 0.08;
    currentLookAt.z += (targetLookAt.z - currentLookAt.z) * 0.08;
    camera.lookAt(currentLookAt.x, currentLookAt.y, currentLookAt.z);
  }

  // Smooth Exploded CAD Assembly Offsets
  if (frontCowlGroup && cockpitGroup && seatTailGroup && batteryFloorGroup && trellisFrameGroup && wheelFrontGroup && wheelRearGroup) {
    const ex = explodedAmount;
    frontCowlGroup.position.set(ex * 0.55, ex * 0.12, 0);
    cockpitGroup.position.set(ex * 0.35, ex * 0.48, 0);
    seatTailGroup.position.set(-ex * 0.45, ex * 0.42, 0);
    trellisFrameGroup.position.set(-ex * 0.15, ex * 0.12, 0);
    batteryFloorGroup.position.set(0, -ex * 0.36, 0);
    wheelFrontGroup.position.set(1.26 + ex * 0.65, -0.18, 0);
    wheelRearGroup.position.set(-0.98 - ex * 0.65, -0.18, 0);
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// ============================================================================
// UI CONTROLLER API FOR CMF, RENDER PASSES & CAMERA PRESETS
// ============================================================================
window.setCMFPreset = function(presetKey) {
  if (!CMF_PRESETS[presetKey]) return;
  currentPreset = presetKey;
  const p = CMF_PRESETS[presetKey];

  bodyMaterials.forEach(mat => {
    mat.color.setHex(p.bodyColor);
    mat.roughness = p.roughness;
    mat.metalness = p.metalness;
  });

  translucentPanelMaterials.forEach(mat => {
    mat.color.setHex(p.bodyColor);
    mat.opacity = p.panelOpacity;
  });

  accentMaterials.forEach(mat => {
    mat.color.setHex(p.accentColor);
    if (mat.emissive) mat.emissive.setHex(p.accentColor);
  });

  trellisMaterials.forEach(mat => {
    mat.color.setHex(p.trellisColor);
    if (mat.emissive) mat.emissive.setHex(p.trellisColor);
  });

  frameMaterials.forEach(mat => {
    mat.color.setHex(p.frameColor);
  });

  alloyMaterials.forEach(mat => {
    mat.color.setHex(p.alloyColor);
  });

  // Update active button state
  document.querySelectorAll('.cmf-btn').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-emerald-400', 'border-emerald-400/50', 'bg-emerald-500/10');
  });
  const activeBtn = document.getElementById(`cmf-${presetKey}`);
  if (activeBtn) {
    activeBtn.classList.add('ring-2', 'ring-emerald-400', 'border-emerald-400/50', 'bg-emerald-500/10');
  }

  const descEl = document.getElementById('cmf-description');
  if (descEl) descEl.textContent = p.desc;

  const codeEl = document.getElementById('cmf-code-badge');
  if (codeEl) codeEl.textContent = `${p.code} · ${p.deltaE}`;

  const roughnessSlider = document.getElementById('slider-roughness');
  if (roughnessSlider) roughnessSlider.value = Math.round(p.roughness * 100);
  const metalSlider = document.getElementById('slider-metalness');
  if (metalSlider) metalSlider.value = Math.round(p.metalness * 100);

  const roughValEl = document.getElementById('val-roughness');
  if (roughValEl) roughValEl.textContent = p.roughness.toFixed(2);
  const metalValEl = document.getElementById('val-metalness');
  if (metalValEl) metalValEl.textContent = p.metalness.toFixed(2);
};

window.setRenderPass = function(passMode) {
  currentRenderPass = passMode;

  allRenderMeshes.forEach(mesh => {
    const orig = mesh.userData.originalMaterial;
    if (passMode === 'pbr') {
      mesh.material = orig;
      mesh.material.wireframe = false;
    } else if (passMode === 'wireframe') {
      mesh.material = orig;
      mesh.material.wireframe = true;
    } else if (passMode === 'normal') {
      mesh.material = normalPassMat;
    } else if (passMode === 'depth') {
      mesh.material = depthPassMat;
    } else if (passMode === 'zebra') {
      mesh.material = zebraPassMat;
    }
  });

  // Update Pass Switcher UI
  document.querySelectorAll('.render-pass-btn').forEach(btn => {
    btn.classList.remove('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/50');
    btn.classList.add('text-slate-400', 'border-transparent');
  });
  const activeBtn = document.getElementById(`pass-${passMode}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/50');
    activeBtn.classList.remove('text-slate-400', 'border-transparent');
  }

  const hudPassLabel = document.getElementById('hud-render-pass');
  const passNames = {
    pbr: 'PBR COOK-TORRANCE // STUDIO HDRI',
    normal: 'SURFACE NORMAL MAP // CONTROLNET INPUT',
    depth: 'Z-DEPTH BUFFER // GEOMETRY CONDITIONING',
    zebra: 'CLASS-A ZEBRA // G2 SURFACE CONTINUITY',
    wireframe: 'QUAD SUB-D TOPOLOGY // 42.8K QUADS'
  };
  if (hudPassLabel && passNames[passMode]) {
    hudPassLabel.textContent = passNames[passMode];
  }
};

window.setCameraAngle = function(preset) {
  autoRotate = false;
  updateAutoRotateBtnUI();
  if (!scooterGroup) return;
  scooterGroup.rotation.x = 0;

  if (preset === 'hero') {
    scooterGroup.rotation.y = -0.52;
    targetCameraPos = { x: 4.1, y: 1.75, z: 4.2 };
    targetLookAt = { x: 0.05, y: 0.38, z: 0 };
  } else if (preset === 'side') {
    scooterGroup.rotation.y = 0;
    targetCameraPos = { x: 0.0, y: 0.55, z: 5.2 };
    targetLookAt = { x: 0.05, y: 0.35, z: 0 };
  } else if (preset === 'cockpit') {
    scooterGroup.rotation.y = -1.15;
    targetCameraPos = { x: 1.6, y: 1.65, z: 2.2 };
    targetLookAt = { x: 0.65, y: 0.95, z: 0 };
  } else if (preset === 'trellis') {
    scooterGroup.rotation.y = 0.65;
    targetCameraPos = { x: -2.4, y: 1.15, z: 3.1 };
    targetLookAt = { x: -0.55, y: 0.32, z: 0 };
  }
};

window.toggleWireframeMode = function() {
  setRenderPass(currentRenderPass === 'wireframe' ? 'pbr' : 'wireframe');
};

window.setLightingRig = function(mode) {
  setupLighting(mode);
  document.querySelectorAll('.light-rig-btn').forEach(b => {
    b.classList.remove('text-emerald-400', 'border-emerald-500/50', 'bg-emerald-500/10');
  });
  const active = document.getElementById(`light-${mode}`);
  if (active) active.classList.add('text-emerald-400', 'border-emerald-500/50', 'bg-emerald-500/10');
};

window.updateMaterialRoughness = function(val) {
  const r = val / 100;
  bodyMaterials.forEach(m => m.roughness = r);
  const el = document.getElementById('val-roughness');
  if (el) el.textContent = r.toFixed(2);
};

window.updateMaterialMetalness = function(val) {
  const m = val / 100;
  bodyMaterials.forEach(mat => mat.metalness = m);
  const el = document.getElementById('val-metalness');
  if (el) el.textContent = m.toFixed(2);
};

window.updateExplodedView = function(val) {
  explodedAmount = val / 100;
  const el = document.getElementById('val-exploded');
  if (el) el.textContent = `${val}%`;
  const calloutOverlay = document.getElementById('cad-exploded-callouts');
  if (calloutOverlay) {
    calloutOverlay.style.opacity = val > 25 ? '1' : '0';
  }
};

function updateAutoRotateBtnUI() {
  const btn = document.getElementById('autorotate-btn');
  if (btn) {
    btn.classList.toggle('text-emerald-400', autoRotate);
    btn.classList.toggle('border-emerald-500/40', autoRotate);
  }
}

window.toggleAutoRotation = function() {
  autoRotate = !autoRotate;
  updateAutoRotateBtnUI();
};

window.captureViewportSnapshot = function() {
  if (!renderer) return;
  const dataUrl = renderer.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `Ather_CAD_${currentPreset}_${currentRenderPass}_Pass.png`;
  link.href = dataUrl;
  link.click();
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(init3DViewer, 80);
});
