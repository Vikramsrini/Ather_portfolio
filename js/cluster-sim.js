// Interactive AtherStack 7-inch TFT Automotive Instrument Cluster Simulator
// Simulates real-time CAN-bus vehicle telemetry, dynamic riding modes, ambient lux sensor adaptation, and HMI design system.

let clusterState = {
  speed: 42,
  mode: 'WARP',
  soc: 82, // State of Charge %
  range: 78, // km
  powerKw: 3.4,
  regenKw: 0,
  odometer: 4820,
  tpmsFront: 32,
  tpmsRear: 34,
  highGlare: false,
  turnDirection: 'RIGHT',
  turnDistance: '180m',
  turnRoad: '100ft Road, Indiranagar'
};

const MODE_CONFIGS = {
  ECO: {
    color: '#00E599',
    secondaryColor: '#059669',
    maxSpeed: 50,
    accentGlow: 'rgba(0, 229, 153, 0.3)',
    rangeMultiplier: 1.25,
    tagline: 'High Efficiency Cruising'
  },
  RIDE: {
    color: '#00D8F6',
    secondaryColor: '#0284C7',
    maxSpeed: 70,
    accentGlow: 'rgba(0, 216, 246, 0.3)',
    rangeMultiplier: 1.0,
    tagline: 'Balanced City Commute'
  },
  SPORT: {
    color: '#F59E0B',
    secondaryColor: '#D97706',
    maxSpeed: 90,
    accentGlow: 'rgba(245, 158, 11, 0.3)',
    rangeMultiplier: 0.8,
    tagline: 'Dynamic Throttle Response'
  },
  WARP: {
    color: '#A855F7',
    secondaryColor: '#00E599',
    maxSpeed: 105,
    accentGlow: 'rgba(168, 85, 247, 0.45)',
    rangeMultiplier: 0.65,
    tagline: 'Instant Torque Surge (Ather 450X)'
  }
};

function initClusterSimulator() {
  updateClusterUI();

  // Smooth telemetry jitter to simulate real running CAN-bus
  setInterval(() => {
    if (clusterState.speed > 0) {
      // Small realistic speed and power flutter
      const jitter = (Math.random() - 0.5) * 0.8;
      const targetSpeed = Math.max(0, Math.min(105, clusterState.speed + jitter));
      updateSpeedDisplay(targetSpeed);
    }
  }, 120);
}

function updateClusterUI() {
  const modeData = MODE_CONFIGS[clusterState.mode];
  const speedEl = document.getElementById('cluster-speed-val');
  const modeBadgeEl = document.getElementById('cluster-mode-badge');
  const socValEl = document.getElementById('cluster-soc-val');
  const rangeValEl = document.getElementById('cluster-range-val');
  const powerArcEl = document.getElementById('cluster-power-arc');
  const clusterFrame = document.getElementById('cluster-screen-frame');

  if (speedEl) speedEl.textContent = Math.round(clusterState.speed);
  if (socValEl) socValEl.textContent = `${clusterState.soc}%`;
  if (rangeValEl) rangeValEl.textContent = `${Math.round(clusterState.soc * modeData.rangeMultiplier)} km`;

  if (modeBadgeEl) {
    modeBadgeEl.textContent = clusterState.mode;
    modeBadgeEl.style.borderColor = modeData.color;
    modeBadgeEl.style.color = modeData.color;
    modeBadgeEl.style.boxShadow = `0 0 15px ${modeData.accentGlow}`;
  }

  // Update SVG Power Arc
  if (powerArcEl) {
    const maxVal = modeData.maxSpeed;
    const ratio = Math.min(1, clusterState.speed / maxVal);
    const strokeDash = ratio * 280;
    powerArcEl.style.strokeDasharray = `${strokeDash}, 300`;
    powerArcEl.style.stroke = modeData.color;
  }

  // High Glare Simulation
  if (clusterFrame) {
    if (clusterState.highGlare) {
      clusterFrame.classList.add('brightness-125', 'contrast-150');
      clusterFrame.style.boxShadow = 'inset 0 0 80px rgba(255, 255, 240, 0.25), 0 0 30px rgba(255, 255, 255, 0.2)';
    } else {
      clusterFrame.classList.remove('brightness-125', 'contrast-150');
      clusterFrame.style.boxShadow = 'none';
    }
  }

  // Active button styles
  document.querySelectorAll('.cluster-mode-btn').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-emerald-400', 'bg-white/10');
  });
  const activeBtn = document.getElementById(`mode-${clusterState.mode.toLowerCase()}`);
  if (activeBtn) activeBtn.classList.add('ring-2', 'ring-emerald-400', 'bg-white/10');
}

function updateSpeedDisplay(val) {
  clusterState.speed = val;
  const speedEl = document.getElementById('cluster-speed-val');
  if (speedEl) speedEl.textContent = Math.round(val);

  // Dynamic power readout (kW)
  const powerEl = document.getElementById('cluster-power-kw');
  if (powerEl) {
    const kw = ((val / 100) * 6.2).toFixed(1);
    powerEl.textContent = `${kw} kW`;
  }

  const modeData = MODE_CONFIGS[clusterState.mode];
  const powerArcEl = document.getElementById('cluster-power-arc');
  if (powerArcEl) {
    const ratio = Math.min(1, val / modeData.maxSpeed);
    const strokeDash = ratio * 280;
    powerArcEl.style.strokeDasharray = `${strokeDash}, 300`;
  }
}

// Global functions exposed to UI
window.setClusterMode = function(mode) {
  if (!MODE_CONFIGS[mode]) return;
  clusterState.mode = mode;
  updateClusterUI();
};

window.handleThrottleChange = function(val) {
  const modeData = MODE_CONFIGS[clusterState.mode];
  const targetSpeed = (val / 100) * modeData.maxSpeed;
  updateSpeedDisplay(targetSpeed);
  document.getElementById('cluster-throttle-val').textContent = `${val}%`;

  // Clear regen if throttle is engaged
  if (val > 0) {
    const regenSlider = document.getElementById('cluster-regen-slider');
    if (regenSlider && regenSlider.value > 0) {
      regenSlider.value = 0;
      handleRegenChange(0);
    }
  }
};

window.handleRegenChange = function(val) {
  document.getElementById('cluster-regen-val').textContent = `${val}%`;
  const regenArcEl = document.getElementById('cluster-regen-arc');
  const regenKwEl = document.getElementById('cluster-regen-kw');

  if (val > 0) {
    const kw = ((val / 100) * 2.8).toFixed(1);
    if (regenKwEl) regenKwEl.textContent = `-${kw} kW (Charging)`;
    if (regenArcEl) {
      regenArcEl.style.opacity = '1';
      regenArcEl.style.strokeDasharray = `${(val / 100) * 80}, 100`;
    }
    // Cut throttle when regen active
    updateSpeedDisplay(Math.max(0, clusterState.speed - (val * 0.15)));
  } else {
    if (regenKwEl) regenKwEl.textContent = `0.0 kW`;
    if (regenArcEl) regenArcEl.style.opacity = '0.2';
  }
};

window.toggleGlareSimulation = function() {
  clusterState.highGlare = !clusterState.highGlare;
  const btn = document.getElementById('glare-toggle-btn');
  if (btn) {
    btn.textContent = clusterState.highGlare ? "Glare Simulator: Active (90k Lux)" : "Glare Simulator: Studio";
    btn.classList.toggle('bg-amber-500/20', clusterState.highGlare);
    btn.classList.toggle('text-amber-400', clusterState.highGlare);
  }
  updateClusterUI();
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initClusterSimulator, 150);
});
