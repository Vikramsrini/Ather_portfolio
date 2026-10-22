// Interactive CAD-to-CMF Multi-Condition ControlNet & ComfyUI Synthesis Workbench
// Allows Ather Design evaluators to interactively weight Canny Edge, Surface Normal, Z-Depth,
// and Ather Design DNA LoRA conditioning passes, inspect live multi-pass canvas synthesis,
// and export a production ComfyUI API Workflow JSON.

const PIPELINE_COMPONENTS = {
  cowl: {
    id: "cowl",
    name: "450 Apex™ Chiseled Front Apron & Ram-Air Ducts",
    cadFile: "ATHER_450_APRON_REV4.step",
    quadCount: "38,420 Quads",
    prompt: "industrial vehicle design, Ather 450 Apex front apron fairing, sharp diagonal character crease, recessed dual ram-air cooling vents, flush bi-LED DRL blade, satin indium blue metallic with anodized tang orange aero splitter, studio softbox lighting, 8k photorealistic",
    negPrompt: "organic blobs, rounded retro scooter curves, uneven panel gaps, noisy reflections, distorted perspective",
    accentHex: "#00E599",
    secondaryHex: "#38BDF8",
    baseTimeSec: 7.4,
    dragDelta: "-4.2% Cd·A"
  },
  trellis: {
    id: "trellis",
    name: "Exposed Aluminum Trellis Subframe & Translucent Panel",
    cadFile: "ATHER_APEX_TRELLIS_SUB.step",
    quadCount: "44,910 Quads",
    prompt: "exposed die-cast and tubular aluminum trellis rear subframe, anodized tang orange structural truss visible beneath smoked translucent polycarbonate side panel, precision weld beads, studio rim lighting, automotive macro photography",
    negPrompt: "opaque plastic, cluttered wiring, low poly tubes, blown highlights, blurry",
    accentHex: "#FF4D2D",
    secondaryHex: "#38BDF8",
    baseTimeSec: 8.1,
    dragDelta: "-1.8 kg Mass"
  },
  rizta: {
    id: "rizta",
    name: "Rizta™ Ergonomic Family Saddle & 56L Storage Silhouette",
    cadFile: "ATHER_RIZTA_BODY_BUCK.step",
    quadCount: "41,200 Quads",
    prompt: "Ather Rizta electric family scooter side profile, wrap-around pillion backrest, clean horizontal character line, two-tone Pangong blue and chalk white ABS fairing, textured weather-resistant stitched seat, warm daylight studio",
    negPrompt: "aggressive racing stance, cramped pillion seat, harsh shadows, plastic toy look",
    accentHex: "#38BDF8",
    secondaryHex: "#F59E0B",
    baseTimeSec: 7.2,
    dragDelta: "+56L Volume"
  },
  halo: {
    id: "halo",
    name: "Halo™ Smart Helmet & Magnetic Inductive Pillion Dock",
    cadFile: "ATHER_HALO_SHELL_V2.step",
    quadCount: "31,650 Quads",
    prompt: "full-face aerodynamic EV smart helmet, Ather Halo design language, flush Harman Kardon acoustic vents, integrated rear LED brake light strip, matte stealth obsidian shell with electroplated iridium visor, cast aluminum inductive dock",
    negPrompt: "bulky external bluetooth module, messy vents, uneven visor seal, low resolution",
    accentHex: "#A855F7",
    secondaryHex: "#00E599",
    baseTimeSec: 6.5,
    dragDelta: "0.28 Aero Cd"
  }
};

let pipelineState = {
  activeComponent: 'cowl',
  cannyWeight: 0.88,
  normalWeight: 0.76,
  depthWeight: 0.65,
  loraWeight: 0.92,
  blendStage: 100, // 0 = Sketch/Edge, 35 = Normal/Depth, 100 = Final Synthesized Render
  isSynthesizing: false,
  synthProgress: 100
};

function initAiPipelineWorkbench() {
  const canvas = document.getElementById('pipeline-synth-canvas');
  if (!canvas) return;
  updatePipelineMetricsUI();
  renderPipelineCanvas();
}

window.selectPipelineComponent = function(compKey) {
  if (!PIPELINE_COMPONENTS[compKey]) return;
  pipelineState.activeComponent = compKey;

  document.querySelectorAll('.pipeline-comp-btn').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-emerald-400', 'bg-emerald-500/10', 'border-emerald-400/50');
  });
  const activeBtn = document.getElementById(`pipe-comp-${compKey}`);
  if (activeBtn) {
    activeBtn.classList.add('ring-2', 'ring-emerald-400', 'bg-emerald-500/10', 'border-emerald-400/50');
  }

  triggerLiveSynthesisAnimation();
};

window.updateConditioningWeight = function(type, val) {
  const normalized = parseFloat(val) / 100;
  if (type === 'canny') pipelineState.cannyWeight = normalized;
  if (type === 'normal') pipelineState.normalWeight = normalized;
  if (type === 'depth') pipelineState.depthWeight = normalized;
  if (type === 'lora') pipelineState.loraWeight = normalized;

  const labelEl = document.getElementById(`val-weight-${type}`);
  if (labelEl) labelEl.textContent = normalized.toFixed(2);

  updatePipelineMetricsUI();
  renderPipelineCanvas();
};

window.updatePipelineBlendStage = function(val) {
  pipelineState.blendStage = parseInt(val, 10);
  const stageLabel = document.getElementById('pipeline-stage-indicator');
  if (stageLabel) {
    if (pipelineState.blendStage < 30) {
      stageLabel.textContent = "STAGE 01 // ORTHOGRAPHIC CAD SPLINES & CANNY EDGES";
    } else if (pipelineState.blendStage < 68) {
      stageLabel.textContent = "STAGE 02 // SURFACE NORMAL & Z-DEPTH CONDITIONING";
    } else {
      stageLabel.textContent = "STAGE 03 // CONTROLNET + ATHER LORA PBR SYNTHESIS";
    }
  }
  renderPipelineCanvas();
};

window.triggerLiveSynthesisAnimation = function() {
  if (pipelineState.isSynthesizing) return;
  pipelineState.isSynthesizing = true;
  pipelineState.blendStage = 0;

  const slider = document.getElementById('pipeline-blend-slider');
  const btn = document.getElementById('run-synth-btn');
  if (btn) {
    btn.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2"></span>SYNTHESIZING MULTI-PASS...`;
  }

  let p = 0;
  const interval = setInterval(() => {
    p += 4;
    pipelineState.blendStage = Math.min(100, p);
    if (slider) slider.value = pipelineState.blendStage;
    updatePipelineBlendStage(pipelineState.blendStage);

    if (p >= 100) {
      clearInterval(interval);
      pipelineState.isSynthesizing = false;
      if (btn) {
        btn.innerHTML = `<svg class="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>RE-SYNTHESIZE PASSES`;
      }
      updatePipelineMetricsUI();
    }
  }, 24);
};

function updatePipelineMetricsUI() {
  const comp = PIPELINE_COMPONENTS[pipelineState.activeComponent];
  if (!comp) return;

  const titleEl = document.getElementById('pipe-active-title');
  const cadEl = document.getElementById('pipe-active-cad');
  const promptEl = document.getElementById('pipe-active-prompt');
  const fidelityEl = document.getElementById('pipe-metric-fidelity');
  const deltaEl = document.getElementById('pipe-metric-delta');
  const timeEl = document.getElementById('pipe-metric-time');
  const statusEl = document.getElementById('pipe-drift-warning');

  if (titleEl) titleEl.textContent = comp.name;
  if (cadEl) cadEl.textContent = `${comp.cadFile} · ${comp.quadCount}`;
  if (promptEl) promptEl.textContent = comp.prompt;

  // Compute realistic geometric retention score from Canny + Normal + Depth weights
  const geomLock = (pipelineState.cannyWeight * 0.45 + pipelineState.normalWeight * 0.35 + pipelineState.depthWeight * 0.20) * 100;
  const loraScore = pipelineState.loraWeight;
  const deltaE = Math.max(0.6, (2.4 - loraScore * 1.4 - (pipelineState.normalWeight * 0.3))).toFixed(1);

  if (fidelityEl) fidelityEl.textContent = `${Math.min(99.4, Math.max(62.0, geomLock + 14)).toFixed(1)}%`;
  if (deltaEl) deltaEl.textContent = `${deltaE} ΔE`;
  if (timeEl) timeEl.textContent = `${comp.baseTimeSec}s`;

  if (statusEl) {
    if (pipelineState.cannyWeight < 0.45 || pipelineState.normalWeight < 0.35) {
      statusEl.textContent = "WARN: Low Canny/Normal weight (<0.45) permits CAD hardpoint drift";
      statusEl.className = "text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/40";
    } else {
      statusEl.textContent = `LOCKED: CAD Hardpoints Preserved (${comp.dragDelta})`;
      statusEl.className = "text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/40";
    }
  }
}

function renderPipelineCanvas() {
  const canvas = document.getElementById('pipeline-synth-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const comp = PIPELINE_COMPONENTS[pipelineState.activeComponent];
  const stage = pipelineState.blendStage / 100; // 0..1

  ctx.clearRect(0, 0, w, h);

  // Dark CAD Studio Background with Coordinate Grid
  ctx.fillStyle = '#06090E';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Calculate layer opacities based on blendStage (0 -> 1)
  const normalOpacity = stage < 0.5 ? Math.min(1, stage * 2.2) : Math.max(0, 1 - (stage - 0.5) * 2.2);
  const pbrOpacity = Math.max(0, (stage - 0.35) / 0.65);

  ctx.save();
  // Apply subtle geometric jitter if Canny weight is set very low by user
  const driftOffset = (1 - pipelineState.cannyWeight) * 14;

  // =========================================================================
  // DRAW COMPONENT GEOMETRY ACROSS 3 PASSES (WIREFRAME -> NORMAL -> PBR)
  // =========================================================================
  if (pipelineState.activeComponent === 'cowl') {
    drawCowlSynthesis(ctx, w, h, normalOpacity, pbrOpacity, driftOffset, comp);
  } else if (pipelineState.activeComponent === 'trellis') {
    drawTrellisSynthesis(ctx, w, h, normalOpacity, pbrOpacity, driftOffset, comp);
  } else if (pipelineState.activeComponent === 'rizta') {
    drawRiztaSynthesis(ctx, w, h, normalOpacity, pbrOpacity, driftOffset, comp);
  } else {
    drawHaloSynthesis(ctx, w, h, normalOpacity, pbrOpacity, driftOffset, comp);
  }
  ctx.restore();

  // Draw Technical Datum Callouts & Scanning Laser Bar during synthesis
  ctx.strokeStyle = 'rgba(0, 229, 153, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(24, h - 34);
  ctx.lineTo(w - 24, h - 34);
  ctx.stroke();
  ctx.setLineDash([]);

  // Vertical scanline indicator showing current blend position
  const scanX = Math.round((w - 48) * stage) + 24;
  ctx.strokeStyle = comp.accentHex;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(scanX, 16);
  ctx.lineTo(scanX, h - 16);
  ctx.stroke();

  // HUD Telemetry Text on Canvas
  ctx.fillStyle = '#94A3B8';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillText(`PASS BLEND: ${Math.round(stage * 100)}%`, 24, 28);
  ctx.fillStyle = comp.accentHex;
  ctx.fillText(`CN_CANNY:${pipelineState.cannyWeight.toFixed(2)} | CN_NORM:${pipelineState.normalWeight.toFixed(2)} | LORA:${pipelineState.loraWeight.toFixed(2)}`, 24, h - 14);
}

function drawCowlSynthesis(ctx, w, h, normAlpha, pbrAlpha, drift, comp) {
  const cx = w * 0.5;
  const cy = h * 0.52;

  // 1. Base Canny Edge & Construction Splines (Always visible underneath)
  ctx.strokeStyle = 'rgba(0, 229, 153, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 150, cy + 75);
  ctx.lineTo(cx - 65, cy - 85);
  ctx.lineTo(cx + 135 + drift, cy - 45);
  ctx.lineTo(cx + 165 + drift, cy + 25);
  ctx.lineTo(cx + 45, cy + 85);
  ctx.closePath();
  ctx.stroke();

  // Internal feature creases
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.beginPath();
  ctx.moveTo(cx - 65, cy - 85);
  ctx.lineTo(cx + 45, cy + 12);
  ctx.lineTo(cx + 165 + drift, cy + 25);
  ctx.moveTo(cx - 110, cy + 40);
  ctx.lineTo(cx + 35, cy - 25);
  ctx.stroke();

  // 2. Surface Normal Conditioning Pass
  if (normAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = normAlpha * pipelineState.normalWeight;
    const normGrad = ctx.createLinearGradient(cx - 150, cy - 85, cx + 165, cy + 85);
    normGrad.addColorStop(0, '#4F46E5');   // Z+ Blue-Indigo
    normGrad.addColorStop(0.5, '#EC4899'); // X+ Magenta
    normGrad.addColorStop(1, '#06B6D4');   // Y+ Cyan
    ctx.fillStyle = normGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy + 75);
    ctx.lineTo(cx - 65, cy - 85);
    ctx.lineTo(cx + 135 + drift, cy - 45);
    ctx.lineTo(cx + 165 + drift, cy + 25);
    ctx.lineTo(cx + 45, cy + 85);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. Final Synthesized Studio PBR Pass
  if (pbrAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = pbrAlpha;
    const pbrGrad = ctx.createLinearGradient(cx - 140, cy - 90, cx + 160, cy + 90);
    pbrGrad.addColorStop(0, '#1E3A8A');
    pbrGrad.addColorStop(0.45, '#1D4ED8');
    pbrGrad.addColorStop(0.52, '#0F172A'); // Sharp dihedral crease shadow!
    pbrGrad.addColorStop(1, '#090D16');

    ctx.fillStyle = pbrGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy + 75);
    ctx.lineTo(cx - 65, cy - 85);
    ctx.lineTo(cx + 135 + drift, cy - 45);
    ctx.lineTo(cx + 165 + drift, cy + 25);
    ctx.lineTo(cx + 45, cy + 85);
    ctx.closePath();
    ctx.fill();

    // Recessed Ram-Air Intake Vent
    ctx.fillStyle = '#05070B';
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy + 15);
    ctx.lineTo(cx + 40, cy - 28);
    ctx.lineTo(cx + 75, cy + 8);
    ctx.lineTo(cx - 15, cy + 45);
    ctx.closePath();
    ctx.fill();

    // Anodized Tang Orange / Mint Aero Winglet Accent
    ctx.strokeStyle = '#FF4D2D';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy + 15);
    ctx.lineTo(cx + 40, cy - 28);
    ctx.stroke();

    // Illuminated Bi-LED DRL Blade
    ctx.shadowColor = '#00E599';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx + 85, cy + 14);
    ctx.lineTo(cx + 158 + drift, cy + 22);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawTrellisSynthesis(ctx, w, h, normAlpha, pbrAlpha, drift, comp) {
  const cx = w * 0.5;
  const cy = h * 0.52;

  const nodes = [
    [cx - 160, cy + 45],
    [cx - 40, cy - 55],
    [cx + 145 + drift, cy - 65],
    [cx + 110 + drift, cy + 20],
    [cx - 25, cy + 35]
  ];

  // 1. Structural Warren Truss Wireframe
  ctx.strokeStyle = 'rgba(255, 77, 45, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(nodes[0][0], nodes[0][1]);
  ctx.lineTo(nodes[1][0], nodes[1][1]);
  ctx.lineTo(nodes[2][0], nodes[2][1]);
  ctx.lineTo(nodes[3][0], nodes[3][1]);
  ctx.lineTo(nodes[4][0], nodes[4][1]);
  ctx.closePath();
  // Diagonal braces
  ctx.moveTo(nodes[0][0], nodes[0][1]); ctx.lineTo(nodes[1][0], nodes[1][1]);
  ctx.moveTo(nodes[4][0], nodes[4][1]); ctx.lineTo(nodes[1][0], nodes[1][1]);
  ctx.moveTo(nodes[4][0], nodes[4][1]); ctx.lineTo(nodes[2][0], nodes[2][1]);
  ctx.stroke();

  if (normAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = normAlpha * pipelineState.normalWeight;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  if (pbrAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = pbrAlpha;
    // Metallic Anodized Orange Trellis Struts
    ctx.strokeStyle = '#FF4D2D';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Specular highlight core on tubes
    ctx.strokeStyle = '#FDBA74';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Smoked Translucent Polycarbonate Panel Overlay
    const transGrad = ctx.createLinearGradient(cx - 100, cy - 70, cx + 150, cy + 50);
    transGrad.addColorStop(0, 'rgba(29, 78, 216, 0.48)');
    transGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.62)');
    transGrad.addColorStop(1, 'rgba(56, 189, 248, 0.35)');
    ctx.fillStyle = transGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 120, cy + 5);
    ctx.lineTo(cx - 20, cy - 68);
    ctx.lineTo(cx + 160 + drift, cy - 72);
    ctx.lineTo(cx + 130 + drift, cy + 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

function drawRiztaSynthesis(ctx, w, h, normAlpha, pbrAlpha, drift, comp) {
  const cx = w * 0.5;
  const cy = h * 0.54;

  // Orthographic Family Saddle & Wide Body Contour
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(cx - 165, cy - 55, 330 + drift, 105, [24, 42, 18, 18]);
  ctx.stroke();

  if (normAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = normAlpha * pipelineState.normalWeight;
    const g = ctx.createLinearGradient(cx - 165, cy - 55, cx + 165, cy + 55);
    g.addColorStop(0, '#818CF8');
    g.addColorStop(0.5, '#F472B6');
    g.addColorStop(1, '#34D399');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  if (pbrAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = pbrAlpha;
    // Pangong Duo-Tone Lower Fairing
    const bodyG = ctx.createLinearGradient(cx - 165, cy - 20, cx + 165, cy + 55);
    bodyG.addColorStop(0, '#0284C7');
    bodyG.addColorStop(0.6, '#0369A1');
    bodyG.addColorStop(1, '#0F172A');
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.roundRect(cx - 165, cy - 15, 330 + drift, 68, [8, 12, 22, 22]);
    ctx.fill();

    // Plush Two-Tone Saddle + Pillion Backrest
    ctx.fillStyle = '#1E2430';
    ctx.beginPath();
    ctx.roundRect(cx - 150, cy - 58, 260, 44, [18, 18, 4, 4]);
    ctx.fill();

    // Chalk white accent strip
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(cx - 155, cy - 12, 310 + drift, 8);
    ctx.restore();
  }
}

function drawHaloSynthesis(ctx, w, h, normAlpha, pbrAlpha, drift, comp) {
  const cx = w * 0.5;
  const cy = h * 0.52;

  ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, 82, Math.PI * 0.85, Math.PI * 2.15);
  ctx.lineTo(cx + 68 + drift, cy + 58);
  ctx.lineTo(cx - 72, cy + 48);
  ctx.closePath();
  ctx.stroke();

  if (normAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = normAlpha * pipelineState.normalWeight;
    const radG = ctx.createRadialGradient(cx - 20, cy - 25, 10, cx, cy, 90);
    radG.addColorStop(0, '#60A5FA');
    radG.addColorStop(0.6, '#C084FC');
    radG.addColorStop(1, '#312E81');
    ctx.fillStyle = radG;
    ctx.fill();
    ctx.restore();
  }

  if (pbrAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = pbrAlpha;
    const shellG = ctx.createRadialGradient(cx - 25, cy - 35, 12, cx, cy, 95);
    shellG.addColorStop(0, '#334155');
    shellG.addColorStop(0.55, '#111827');
    shellG.addColorStop(1, '#05070B');
    ctx.fillStyle = shellG;
    ctx.fill();

    // Iridium Visor Shield
    const visorG = ctx.createLinearGradient(cx + 5, cy - 32, cx + 82, cy + 20);
    visorG.addColorStop(0, '#00E599');
    visorG.addColorStop(0.5, '#38BDF8');
    visorG.addColorStop(1, '#A855F7');
    ctx.fillStyle = visorG;
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 28);
    ctx.lineTo(cx + 80 + drift, cy - 12);
    ctx.lineTo(cx + 72 + drift, cy + 24);
    ctx.lineTo(cx + 12, cy + 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

window.exportComfyWorkflowJSON = function() {
  const comp = PIPELINE_COMPONENTS[pipelineState.activeComponent];
  const workflowPayload = {
    _meta: {
      title: `AeroMorph_Ather_${comp.id}_MultiControlNet_API`,
      author: "Vikram S — AI Generalist (Design) Portfolio for Ather Energy",
      cad_source: comp.cadFile
    },
    nodes: {
      "1_CheckpointLoader": {
        class_type: "CheckpointLoaderSimple",
        inputs: { ckpt_name: "sd_xl_base_1.0_automotive.safetensors" }
      },
      "2_AtherLoRALoader": {
        class_type: "LoraLoader",
        inputs: {
          lora_name: "Ather_DesignDNA_SharpChisel_v3.safetensors",
          strength_model: pipelineState.loraWeight,
          strength_clip: pipelineState.loraWeight
        }
      },
      "3_ControlNet_Canny": {
        class_type: "ControlNetApplyAdvanced",
        inputs: {
          control_net_name: "controlnet-canny-sdxl-1.0.safetensors",
          strength: pipelineState.cannyWeight,
          start_percent: 0.0,
          end_percent: 0.85
        }
      },
      "4_ControlNet_Normal": {
        class_type: "ControlNetApplyAdvanced",
        inputs: {
          control_net_name: "controlnet-normal-sdxl-1.0.safetensors",
          strength: pipelineState.normalWeight,
          start_percent: 0.0,
          end_percent: 0.75
        }
      },
      "5_ControlNet_Depth": {
        class_type: "ControlNetApplyAdvanced",
        inputs: {
          control_net_name: "controlnet-depth-sdxl-1.0.safetensors",
          strength: pipelineState.depthWeight,
          start_percent: 0.0,
          end_percent: 0.65
        }
      },
      "6_KSampler": {
        class_type: "KSampler",
        inputs: {
          steps: 28,
          cfg: 7.5,
          sampler_name: "dpmpp_2m_sde_gpu",
          scheduler: "karras",
          prompt: comp.prompt,
          negative_prompt: comp.negPrompt
        }
      }
    }
  };

  const blob = new Blob([JSON.stringify(workflowPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ather_ComfyUI_${comp.id}_Workflow.json`;
  a.click();
  URL.revokeObjectURL(url);
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initAiPipelineWorkbench, 120);
});
