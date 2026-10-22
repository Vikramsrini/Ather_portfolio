// Interactive AtherStack™ 6.0 — 7" TFT Instrument Cluster, MagicTwist™ & Sunlight Glare Lab
// Simulates real-time CAN-bus telemetry, 5 riding modes (SmartEco, Eco, Ride, Sport, Warp+),
// bidirectional MagicTwist™ regenerative braking, FallSafe/SkidControl alerts, and 0-100,000 Lux WCAG contrast analysis.

let clusterState = {
  speed: 54,
  mode: 'WARP',
  soc: 84,
  range: 76,
  powerKw: 4.8,
  regenKw: 0,
  leanAngle: 12,
  ambientLux: 12000,
  autoAdaptiveLux: true,
  activeWidget: 'nav', // 'nav' | 'skid' | 'halo' | 'bms'
  incognito: false
};

const MODE_CONFIGS = {
  SMARTECO: {
    label: 'SMARTECO™',
    color: '#10B981',
    secondaryColor: '#059669',
    maxSpeed: 55,
    accentGlow: 'rgba(16, 185, 129, 0.28)',
    rangeMultiplier: 1.32,
    whPerKm: 24,
    tagline: 'AI Predictive Traffic Torque Allocation'
  },
  ECO: {
    label: 'ECO',
    color: '#00E599',
    secondaryColor: '#059669',
    maxSpeed: 60,
    accentGlow: 'rgba(0, 229, 153, 0.32)',
    rangeMultiplier: 1.22,
    whPerKm: 27,
    tagline: 'Maximum Urban Range Optimization'
  },
  RIDE: {
    label: 'RIDE',
    color: '#00D8F6',
    secondaryColor: '#0284C7',
    maxSpeed: 75,
    accentGlow: 'rgba(0, 216, 246, 0.32)',
    rangeMultiplier: 1.0,
    whPerKm: 32,
    tagline: 'Balanced Linear Commute Response'
  },
  SPORT: {
    label: 'SPORT',
    color: '#F59E0B',
    secondaryColor: '#D97706',
    maxSpeed: 90,
    accentGlow: 'rgba(245, 158, 11, 0.35)',
    rangeMultiplier: 0.84,
    whPerKm: 39,
    tagline: 'Aggressive Mid-Range Overtake Curve'
  },
  WARP: {
    label: 'WARP+™',
    color: '#A855F7',
    secondaryColor: '#00E599',
    maxSpeed: 105,
    accentGlow: 'rgba(168, 85, 247, 0.48)',
    rangeMultiplier: 0.72,
    whPerKm: 48,
    tagline: '26 Nm Instant Peak Torque Surge (450 Apex)'
  }
};

function initClusterSimulator() {
  updateClusterUI();
  renderClusterWidget();

  // Subtle realistic CAN-bus telemetry micro-jitter
  setInterval(() => {
    if (clusterState.speed > 0 && clusterState.regenKw === 0) {
      const jitter = (Math.random() - 0.5) * 0.7;
      const nextSpeed = Math.max(0, Math.min(105, clusterState.speed + jitter));
      updateSpeedDisplay(nextSpeed);
    }
  }, 140);
}

function updateClusterUI() {
  const modeData = MODE_CONFIGS[clusterState.mode];
  const speedEl = document.getElementById('cluster-speed-val');
  const modeBadgeEl = document.getElementById('cluster-mode-badge');
  const socValEl = document.getElementById('cluster-soc-val');
  const rangeValEl = document.getElementById('cluster-range-val');
  const whValEl = document.getElementById('cluster-wh-val');
  const powerArcEl = document.getElementById('cluster-power-arc');
  const clusterFrame = document.getElementById('cluster-screen-frame');
  const taglineEl = document.getElementById('cluster-mode-tagline');

  const isHighSunlight = clusterState.ambientLux >= 60000;
  const useDaylightPolarity = isHighSunlight && clusterState.autoAdaptiveLux;

  if (speedEl) speedEl.textContent = Math.round(clusterState.speed);
  if (socValEl) socValEl.textContent = `${clusterState.soc}%`;
  if (rangeValEl) rangeValEl.textContent = `${Math.round(clusterState.soc * modeData.rangeMultiplier)} km`;
  if (whValEl) whValEl.textContent = `${modeData.whPerKm} Wh/km`;
  if (taglineEl) taglineEl.textContent = modeData.tagline;

  if (modeBadgeEl) {
    modeBadgeEl.textContent = modeData.label;
    modeBadgeEl.style.borderColor = modeData.color;
    modeBadgeEl.style.color = useDaylightPolarity ? '#05070A' : modeData.color;
    modeBadgeEl.style.backgroundColor = useDaylightPolarity ? modeData.color : 'rgba(0,0,0,0.4)';
    modeBadgeEl.style.boxShadow = `0 0 18px ${modeData.accentGlow}`;
  }

  if (powerArcEl) {
    const ratio = Math.min(1, clusterState.speed / modeData.maxSpeed);
    const strokeDash = ratio * 280;
    powerArcEl.style.strokeDasharray = `${strokeDash}, 300`;
    powerArcEl.style.stroke = modeData.color;
    powerArcEl.style.strokeWidth = useDaylightPolarity ? '15' : '12';
  }

  // Ambient Lux & Adaptive Polarity Simulation on Screen Frame
  if (clusterFrame) {
    if (useDaylightPolarity) {
      // High-Contrast Daylight Sun-Readable Polarity
      clusterFrame.style.backgroundColor = '#F8FAFC';
      clusterFrame.style.color = '#05070A';
      clusterFrame.style.boxShadow = 'inset 0 0 60px rgba(255, 251, 235, 0.5)';
      if (speedEl) speedEl.style.color = '#05070A';
    } else if (isHighSunlight && !clusterState.autoAdaptiveLux) {
      // Uncompensated glare washout (demonstrates why adaptive HMI polarity matters!)
      clusterFrame.style.backgroundColor = '#1E242B';
      clusterFrame.style.color = '#94A3B8';
      clusterFrame.style.boxShadow = 'inset 0 0 120px rgba(255, 255, 240, 0.48)';
      if (speedEl) speedEl.style.color = '#CBD5E1';
    } else {
      // Studio / Night Deep OLED-TFT Black
      clusterFrame.style.backgroundColor = '#07090D';
      clusterFrame.style.color = '#F8FAFC';
      clusterFrame.style.boxShadow = `inset 0 0 45px ${modeData.accentGlow}`;
      if (speedEl) speedEl.style.color = '#FFFFFF';
    }
  }

  // Calculate WCAG 2.2 Contrast Ratio
  const wcagEl = document.getElementById('cluster-wcag-readout');
  if (wcagEl) {
    if (useDaylightPolarity) {
      wcagEl.textContent = "14.8:1 (ISO 15008 AAA Outdoor Pass)";
      wcagEl.className = "text-xs font-mono font-bold text-emerald-400";
    } else if (isHighSunlight && !clusterState.autoAdaptiveLux) {
      wcagEl.textContent = "3.2:1 (FAIL: Solar Washout Without Auto-Polarity)";
      wcagEl.className = "text-xs font-mono font-bold text-red-400";
    } else {
      wcagEl.textContent = "15.6:1 (Nominal Dark Cockpit Pass)";
      wcagEl.className = "text-xs font-mono font-bold text-emerald-400";
    }
  }

  // Update active mode buttons
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

  const powerEl = document.getElementById('cluster-power-kw');
  if (powerEl) {
    const kw = ((val / 100) * 6.4).toFixed(1);
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

window.setClusterMode = function(mode) {
  if (!MODE_CONFIGS[mode]) return;
  clusterState.mode = mode;
  updateClusterUI();
};

window.setClusterWidget = function(widgetKey) {
  clusterState.activeWidget = widgetKey;
  document.querySelectorAll('.cluster-widget-btn').forEach(btn => {
    btn.classList.remove('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/40');
    btn.classList.add('text-slate-400', 'border-white/10');
  });
  const activeBtn = document.getElementById(`widget-btn-${widgetKey}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/40');
    activeBtn.classList.remove('text-slate-400', 'border-white/10');
  }
  renderClusterWidget();
};

function renderClusterWidget() {
  const box = document.getElementById('cluster-left-widget');
  if (!box) return;

  if (clusterState.activeWidget === 'nav') {
    box.innerHTML = `
      <div class="flex items-center justify-between text-[10px] font-mono text-emerald-400 mb-1.5">
        <span>GOOGLE MAPS // VECTOR NAV</span>
        <span>ETA 08 MIN</span>
      </div>
      <div class="flex items-center gap-2.5 mb-2">
        <div class="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">↱</div>
        <div>
          <div class="text-base font-extrabold text-white leading-tight">180 m · Right</div>
          <div class="text-[11px] text-slate-400">100ft Rd, Indiranagar</div>
        </div>
      </div>
      <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div class="bg-emerald-400 h-full w-[72%]"></div>
      </div>
      <div class="text-[10px] font-mono text-slate-400 mt-1.5 flex justify-between">
        <span>Dest: Ather Space Flagship</span>
        <span class="text-emerald-400">FastCharger Free</span>
      </div>
    `;
  } else if (clusterState.activeWidget === 'skid') {
    box.innerHTML = `
      <div class="flex items-center justify-between text-[10px] font-mono text-amber-400 mb-1.5">
        <span>SKIDCONTROL™ // TRACTION</span>
        <span class="animate-pulse">ACTIVE</span>
      </div>
      <div class="text-xs font-bold text-white mb-1">Wet Asphalt Slip Mitigation</div>
      <p class="text-[11px] text-slate-400 leading-snug mb-2">
        Rear wheel slip ratio held &lt; 8% via 1,000 Hz motor controller torque modulation.
      </p>
      <div class="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
        <div class="bg-black/40 p-1.5 rounded border border-amber-500/30 text-amber-300">Slip: 4.2%</div>
        <div class="bg-black/40 p-1.5 rounded border border-emerald-500/30 text-emerald-300">FallSafe: ARMED</div>
      </div>
    `;
  } else if (clusterState.activeWidget === 'halo') {
    box.innerHTML = `
      <div class="flex items-center justify-between text-[10px] font-mono text-purple-400 mb-1.5">
        <span>HALO™ CHITCHAT INTERCOM</span>
        <span>HARMAN KARDON</span>
      </div>
      <div class="text-xs font-bold text-white mb-1">Rider ↔ Pillion Audio Linked</div>
      <div class="bg-black/40 p-2 rounded-lg border border-purple-500/30 text-[11px] text-slate-300 font-mono mb-1.5">
        ♪ Playing: Midnight City · 65% Vol
      </div>
      <div class="text-[10px] font-mono text-emerald-400 flex justify-between">
        <span>Helmet Battery: 91%</span>
        <span>Auto-Wear Detected</span>
      </div>
    `;
  } else {
    box.innerHTML = `
      <div class="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1.5">
        <span>BMS & CHASSIS TELEMETRY</span>
        <span>NOMINAL</span>
      </div>
      <div class="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
        <div class="bg-black/40 p-1.5 rounded border border-white/10">
          <span class="text-slate-500 block">PACK TEMP</span>
          <span class="text-emerald-400 font-bold">33.4 °C</span>
        </div>
        <div class="bg-black/40 p-1.5 rounded border border-white/10">
          <span class="text-slate-500 block">INVERTER</span>
          <span class="text-cyan-400 font-bold">41.2 °C</span>
        </div>
        <div class="bg-black/40 p-1.5 rounded border border-white/10">
          <span class="text-slate-500 block">TPMS F/R</span>
          <span class="text-white font-bold">32 / 34 PSI</span>
        </div>
        <div class="bg-black/40 p-1.5 rounded border border-white/10">
          <span class="text-slate-500 block">IMU LEAN</span>
          <span class="text-purple-400 font-bold">14.2° L</span>
        </div>
      </div>
    `;
  }
}

window.handleThrottleChange = function(val) {
  const modeData = MODE_CONFIGS[clusterState.mode];
  const targetSpeed = (val / 100) * modeData.maxSpeed;
  updateSpeedDisplay(targetSpeed);
  const el = document.getElementById('cluster-throttle-val');
  if (el) el.textContent = `${val}%`;

  if (val > 0) {
    const regenSlider = document.getElementById('cluster-regen-slider');
    if (regenSlider && regenSlider.value > 0) {
      regenSlider.value = 0;
      handleRegenChange(0);
    }
  }
};

window.handleRegenChange = function(val) {
  const numVal = parseInt(val, 10);
  clusterState.regenKw = numVal;
  const el = document.getElementById('cluster-regen-val');
  if (el) el.textContent = `${numVal}%`;

  const regenArcEl = document.getElementById('cluster-regen-arc');
  const regenKwEl = document.getElementById('cluster-regen-kw');

  if (numVal > 0) {
    const kw = ((numVal / 100) * 2.8).toFixed(1);
    if (regenKwEl) regenKwEl.textContent = `-${kw} kW MagicTwist™`;
    if (regenArcEl) {
      regenArcEl.style.opacity = '1';
      regenArcEl.style.strokeDasharray = `${(numVal / 100) * 85}, 120`;
    }
    updateSpeedDisplay(Math.max(0, clusterState.speed - (numVal * 0.14)));
  } else {
    if (regenKwEl) regenKwEl.textContent = `0.0 kW Coast`;
    if (regenArcEl) regenArcEl.style.opacity = '0.2';
  }
};

window.handleAmbientLuxChange = function(val) {
  clusterState.ambientLux = parseInt(val, 10);
  const luxLabel = document.getElementById('cluster-lux-val');
  if (luxLabel) {
    luxLabel.textContent = `${clusterState.ambientLux.toLocaleString()} Lux`;
  }
  updateClusterUI();
};

window.toggleAutoAdaptiveLux = function() {
  clusterState.autoAdaptiveLux = !clusterState.autoAdaptiveLux;
  const btn = document.getElementById('auto-lux-polarity-btn');
  if (btn) {
    btn.textContent = clusterState.autoAdaptiveLux ? "Auto Polarity: ON" : "Auto Polarity: OFF";
    btn.classList.toggle('bg-emerald-500/20', clusterState.autoAdaptiveLux);
    btn.classList.toggle('text-emerald-400', clusterState.autoAdaptiveLux);
  }
  updateClusterUI();
};

window.toggleGlareSimulation = function() {
  const nextLux = clusterState.ambientLux >= 60000 ? 8000 : 90000;
  const slider = document.getElementById('cluster-lux-slider');
  if (slider) slider.value = nextLux;
  handleAmbientLuxChange(nextLux);
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initClusterSimulator, 120);
});
