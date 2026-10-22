// Computational Ergonomics & Aerodynamic Clearance Engine
// Simulates 5th to 95th percentile Indian anthropometric standard rider geometry against Ather chassis dimensions.

const ANTHRO_PRESETS = {
  p5: {
    name: "5th Percentile (Female)",
    heightCm: 152,
    inseamCm: 68,
    torsoCm: 48,
    armCm: 54,
    weightKg: 49,
    notes: "Critical test case for standover height & floorboard reach."
  },
  p50: {
    name: "50th Percentile (Median)",
    heightCm: 168,
    inseamCm: 76,
    torsoCm: 53,
    armCm: 60,
    weightKg: 64,
    notes: "Primary commuter baseline for seating posture & arm bend."
  },
  p95: {
    name: "95th Percentile (Male)",
    heightCm: 184,
    inseamCm: 86,
    torsoCm: 60,
    armCm: 67,
    weightKg: 82,
    notes: "Stress test for knee pocket clearance & full handlebar lock sweep."
  }
};

let currentAnthroKey = 'p50';
let currentSeatHeight = 780; // mm (Ather 450X stock is 780mm)

function initErgoSim() {
  updateErgoCalculations();
}

function updateErgoCalculations() {
  const p = ANTHRO_PRESETS[currentAnthroKey];

  // Mathematical model of rider triangle (Seat, Handlebar, Footpegs)
  // Seat: origin (0, 780mm)
  // Handlebar: (420mm forward, 990mm high)
  // Footboard: (280mm forward, 290mm high)
  const seatH = currentSeatHeight;
  const barForward = 420;
  const barH = 990;
  const pegForward = 280;
  const pegH = 290;

  // Leg geometry
  const legLength = p.inseamCm * 10;
  const thigh = legLength * 0.52;
  const shin = legLength * 0.48;

  // Knee position & clearance calculation
  const kneeForward = pegForward + 80 + (p.heightCm - 168) * 0.8;
  const kneeH = pegH + shin * 0.92;
  const apronForward = 490; // mm position of front apron interior surface
  const kneeClearanceMm = Math.max(12, Math.round(apronForward - kneeForward));

  // Handlebar arm reach angle
  const armLength = p.armCm * 10;
  const reachDx = barForward;
  const reachDy = barH - (seatH + p.torsoCm * 8.5);
  const directDist = Math.hypot(reachDx, reachDy);
  const armElbowBendDeg = Math.round(Math.acos(Math.min(0.99, directDist / armLength)) * (180 / Math.PI));

  // Rider torso forward lean angle
  const torsoRakeDeg = Math.round(14 + (currentSeatHeight - 780) * 0.05);

  // Aerodynamic drag estimation Cd * A
  const frontalAreaM2 = 0.48 + (p.heightCm / 100) * 0.18 + (p.weightKg / 100) * 0.08;
  const cd = (0.54 - (torsoRakeDeg * 0.003)).toFixed(2);
  const cda = (frontalAreaM2 * cd).toFixed(3);

  // Update UI Elements
  const kneeEl = document.getElementById('ergo-knee-clearance');
  const elbowEl = document.getElementById('ergo-elbow-bend');
  const rakeEl = document.getElementById('ergo-torso-rake');
  const cdaEl = document.getElementById('ergo-cda-val');
  const statusBadge = document.getElementById('ergo-status-badge');

  if (kneeEl) kneeEl.textContent = `${kneeClearanceMm} mm`;
  if (elbowEl) elbowEl.textContent = `${armElbowBendDeg}°`;
  if (rakeEl) rakeEl.textContent = `${torsoRakeDeg}° (Relaxed Upright)`;
  if (cdaEl) cdaEl.textContent = `${cda} m²`;

  if (statusBadge) {
    if (kneeClearanceMm < 45) {
      statusBadge.textContent = "Pinch Warning: <45mm";
      statusBadge.className = "text-xs font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40";
    } else {
      statusBadge.textContent = "Ergonomic Nominal (ISO 14738)";
      statusBadge.className = "text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
    }
  }

  // Draw 2D SVG Mannequin Kinematics
  drawMannequinSVG(p, seatH, kneeClearanceMm, torsoRakeDeg);
}

function drawMannequinSVG(p, seatH, kneeClearance, rakeDeg) {
  const svg = document.getElementById('ergo-svg-canvas');
  if (!svg) return;

  // Scale: 1mm = 0.25 SVG pixels. Baseline origin offset: x=140, y=260
  const originX = 130;
  const originY = 240;

  // Hip Point (Seat contact)
  const hipX = originX;
  const hipY = originY - (seatH - 740) * 0.25;

  // Foot point on floorboard
  const footX = originX + 85;
  const footY = originY + 45;

  // Knee Joint (Calculated kinematic apex)
  const kneeX = originX + 75 + (p.heightCm - 150) * 0.35;
  const kneeY = hipY - 10 + (currentSeatHeight - 780) * 0.1;

  // Shoulder Point (Torso lean)
  const torsoPx = (p.torsoCm * 10) * 0.22;
  const rad = (rakeDeg * Math.PI) / 180;
  const shoulderX = hipX + Math.sin(rad) * torsoPx;
  const shoulderY = hipY - Math.cos(rad) * torsoPx;

  // Head / Helmet Center
  const headX = shoulderX + 8;
  const headY = shoulderY - 26;

  // Handlebar Grip Point
  const barX = originX + 115;
  const barY = originY - 60;

  // Elbow Joint (Arm flex)
  const elbowX = (shoulderX + barX) / 2 - 12;
  const elbowY = (shoulderY + barY) / 2 + 15;

  // Apron Clearance Wall
  const apronX = kneeX + (kneeClearance * 0.25);

  svg.innerHTML = `
    <!-- Floor & Ground baseline -->
    <line x1="20" y1="${originY + 65}" x2="380" y2="${originY + 65}" stroke="#334155" stroke-dasharray="4" stroke-width="1.5" />
    
    <!-- Ather 450 Chassis Silhouette & Apron outline -->
    <path d="M 60 ${originY + 45} L 180 ${originY + 45} L 240 ${originY + 40} L 270 ${originY - 80} L 240 ${originY - 80} Z" fill="rgba(15, 23, 42, 0.6)" stroke="#00E599" stroke-width="1.5" stroke-opacity="0.4" />
    <path d="M 70 ${hipY + 8} Q 130 ${hipY + 5} 170 ${hipY + 12}" fill="none" stroke="#64748B" stroke-width="4" stroke-linecap="round" />

    <!-- Apron Boundary -->
    <line x1="${apronX}" y1="${kneeY - 30}" x2="${apronX}" y2="${kneeY + 40}" stroke="#FF385C" stroke-width="2" stroke-dasharray="3" />
    <text x="${apronX + 5}" y="${kneeY}" fill="#FF385C" font-size="9" font-family="monospace">APRON WALL</text>

    <!-- Clearance dimension arrow -->
    <line x1="${kneeX}" y1="${kneeY}" x2="${apronX}" y2="${kneeY}" stroke="#00E599" stroke-width="1.5" />
    <circle cx="${kneeX}" cy="${kneeY}" r="3" fill="#00E599" />
    <circle cx="${apronX}" cy="${kneeY}" r="3" fill="#FF385C" />
    <text x="${(kneeX + apronX) / 2 - 14}" y="${kneeY - 8}" fill="#00E599" font-size="10" font-weight="bold" font-family="monospace">${kneeClearance}mm</text>

    <!-- Rider Kinematic Skeleton -->
    <!-- Thigh (Hip to Knee) -->
    <line x1="${hipX}" y1="${hipY}" x2="${kneeX}" y2="${kneeY}" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" />
    <!-- Shin (Knee to Foot) -->
    <line x1="${kneeX}" y1="${kneeY}" x2="${footX}" y2="${footY}" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" />
    
    <!-- Torso (Hip to Shoulder) -->
    <line x1="${hipX}" y1="${hipY}" x2="${shoulderX}" y2="${shoulderY}" stroke="#38BDF8" stroke-width="4.5" stroke-linecap="round" />
    
    <!-- Upper Arm & Forearm -->
    <line x1="${shoulderX}" y1="${shoulderY}" x2="${elbowX}" y2="${elbowY}" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" />
    <line x1="${elbowX}" y1="${elbowY}" x2="${barX}" y2="${barY}" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" />

    <!-- Joints -->
    <circle cx="${hipX}" cy="${hipY}" r="5" fill="#00E599" />
    <circle cx="${shoulderX}" cy="${shoulderY}" r="5" fill="#00E599" />
    <circle cx="${elbowX}" cy="${elbowY}" r="4" fill="#38BDF8" />
    <circle cx="${kneeX}" cy="${kneeY}" r="4" fill="#38BDF8" />
    <circle cx="${footX}" cy="${footY}" r="4" fill="#00E599" />
    <circle cx="${barX}" cy="${barY}" r="5" fill="#F59E0B" />

    <!-- Helmet / Head with Ather Halo styling -->
    <circle cx="${headX}" cy="${headY}" r="14" fill="#0F172A" stroke="#00E599" stroke-width="2" />
    <path d="M ${headX - 6} ${headY + 2} Q ${headX + 12} ${headY + 2} ${headX + 10} ${headY + 9}" fill="none" stroke="#00D8F6" stroke-width="2.5" />
  `;
}

// Global functions
window.setAnthroPercentile = function(key) {
  if (!ANTHRO_PRESETS[key]) return;
  currentAnthroKey = key;

  document.querySelectorAll('.anthro-btn').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-emerald-400', 'bg-white/10');
  });
  const activeBtn = document.getElementById(`anthro-${key}`);
  if (activeBtn) activeBtn.classList.add('ring-2', 'ring-emerald-400', 'bg-white/10');

  const notesEl = document.getElementById('ergo-preset-notes');
  if (notesEl) notesEl.textContent = ANTHRO_PRESETS[key].notes;

  updateErgoCalculations();
};

window.handleSeatHeightChange = function(val) {
  currentSeatHeight = parseInt(val, 10);
  const display = document.getElementById('seat-height-val');
  if (display) display.textContent = `${val} mm`;
  updateErgoCalculations();
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initErgoSim, 200);
});
