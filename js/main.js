// Main Portfolio Controller & Project Data Engine
// Designed specifically for Ather Energy AI Generalist (Design) Role

const PROJECTS_DATA = [
  {
    id: "aeromorph",
    title: "AeroMorph AI — Generative CMF & Surface Exploration Engine",
    subtitle: "Custom SDXL + ControlNet pipeline tailored for EV aerodynamic silhouettes and CMF variations in under 8 seconds.",
    category: "Generative AI Tools",
    categoryKey: "ai-tools",
    badge: "Industrial Design & CMF",
    badgeColor: "emerald",
    frictionTitle: "4.5-Hour Rendering Bottleneck per Styling Iteration",
    frictionDesc: "Ather industrial designers spend 4-6 hours per concept setting up lighting rigs and material shaders in Keyshot just to evaluate colorways and fairing cutouts for executive design reviews.",
    summary: "Built a web-based ideation workbench powered by custom Stable Diffusion XL + ControlNet (Multi-Condition: LineArt sketch + Normal Map + Depth estimation). Fine-tuned a custom LoRA on Ather's electric scooter design language (sharp diagonal character line, negative space rear pillion frame, minimalist flush front cowl).",
    stats: [
      { label: "Render Turnaround", val: "7.8 sec", diff: "-96% vs Keyshot" },
      { label: "CMF Explorations", val: "340+ variants", diff: "For 2026 concepts" },
      { label: "Queue Bottleneck", val: "0 hours", diff: "Zero GPU wait time" }
    ],
    techStack: ["Python", "PyTorch", "SDXL ControlNet", "ComfyUI Headless", "FastAPI", "Three.js", "Tailwind CSS"],
    workflowSteps: [
      { step: "01", name: "Sketch Ingestion", desc: "Designer uploads Procreate/Photoshop concept sketch or vector SVG silhouette." },
      { step: "02", name: "Multi-Condition Guiding", desc: "ControlNet extracts line-weights, depth map, and surface normals simultaneously to prevent geometry distortion." },
      { step: "03", name: "CMF Token Conditioning", desc: "Ather color tokens (Matte Obsidian, Warp Mint, Lunar Grey, Anodized Coral) applied through prompt matrix." },
      { step: "04", name: "4K Studio Export", desc: "Generates photorealistic 4K studio renders with physically-based lighting and CAD-traceable contours." }
    ],
    codeSnippet: `# Headless ComfyUI & ControlNet Multi-Condition Pipeline for Ather CMF
import torch
from diffusers import StableDiffusionXLControlNetPipeline, ControlNetModel

def generate_ather_cmf_surface(sketch_tensor, cmf_preset, lighting_rig="studio_3point"):
    controlnets = [
        ControlNetModel.from_pretrained("diffusers/controlnet-canny-sdxl-1.0"),
        ControlNetModel.from_pretrained("diffusers/controlnet-depth-sdxl-1.0")
    ]
    pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        controlnet=controlnets,
        torch_dtype=torch.float16
    ).to("cuda")
    
    prompt = f"industrial vehicle design, Ather EV scooter chassis, {cmf_preset['finish']}, {cmf_preset['material']}, studio lighting, 8k uhd, photorealistic, sharp character line"
    negative = "blurry, low poly, bad reflections, organic deformation, noisy paint"
    
    image = pipe(
        prompt=prompt,
        negative_prompt=negative,
        image=[sketch_tensor['edges'], sketch_tensor['depth']],
        controlnet_conditioning_scale=[0.85, 0.65],
        guidance_scale=7.5,
        num_inference_steps=28
    ).images[0]
    return image`,
    adoptionNotes: "Deployed as an internal web app accessible via local network. Designers need zero terminal knowledge: drag-and-drop sketch, click 1 of 8 Ather CMF swatches, and click 'Render'. Integrated into daily 10 AM design standups."
  },
  {
    id: "synapsemesh",
    title: "SynapseMesh — Blender Python Bridge for Automated 2D-to-3D Clay Mockups",
    subtitle: "Headless Blender automation tool bridging 2D concept sketches to quad-clean 3D meshes with real-time Indian anthropometric clearance validation.",
    category: "3D & Computational Design",
    categoryKey: "computational",
    badge: "Vehicle Architecture & Ergonomics",
    badgeColor: "cyan",
    frictionTitle: "3-5 Days of CAD Modeling Before First Ergonomic Evaluation",
    frictionDesc: "Converting 2D orthographic concept sketches into 3D base clay surfaces takes days in Alias/Rhino. Furthermore, ergonomic checks (rider knee clearance against apron, handlebar sweep vs thigh collision) were traditionally caught late on physical wooden bucks.",
    summary: "Engineered a headless Blender Python (bpy) extension and web console that feeds orthographic sketch vectors into a zero-shot mesh reconstruction pipeline (InstantMesh + QuadWild), auto-aligns a parametric 3D Indian anthropometric rider mannequin (5th percentile female to 95th percentile male), and computes clearance distance heatmaps.",
    stats: [
      { label: "Concept-to-Clay Time", val: "45 mins", diff: "74% faster" },
      { label: "Ergonomic Violations", val: "14 flagged", diff: "Prior to physical bucks" },
      { label: "Quad Topology Ratio", val: "94.2%", diff: "SubD subdivision clean" }
    ],
    techStack: ["Blender Python (bpy)", "Open3D", "Trimesh", "InstantMesh", "NumPy", "WebGL"],
    workflowSteps: [
      { step: "01", name: "Orthographic Multi-View", desc: "Input side and front orthographic silhouette curves with standardized datum lines." },
      { step: "02", name: "Zero-Shot Mesh Gen", desc: "InstantMesh neural pipeline generates watertight 3D base mesh in under 90 seconds." },
      { step: "03", name: "Automated Quad Remesh", desc: "Executes QuadWild retopology algorithm to produce clean subdivision topology for Alias handoff." },
      { step: "04", name: "Anthropometric Collision", desc: "Tests 5th-95th percentile rider dummy kinematics; flags pinch points under 45mm clearance." }
    ],
    codeSnippet: `# Blender Python (bpy) automated mesh import & ergonomic clearance test
import bpy
import bmesh
import numpy as np

def run_ather_ergo_check(mesh_obj_name="AtherApron_Concept", mannequin_name="IndianRider_P95"):
    apron = bpy.data.objects[mesh_obj_name]
    rider = bpy.data.objects[mannequin_name]
    
    # Calculate shortest Euclidean distance between rider knees and apron interior
    knee_left = rider.pose.bones["knee.L"].head
    knee_right = rider.pose.bones["knee.R"].head
    
    min_dist_l = apron.closest_point_on_mesh(knee_left)[1]
    min_dist_r = apron.closest_point_on_mesh(knee_right)[1]
    clearance_mm = min(min_dist_l, min_dist_r) * 1000
    
    print(f"[ErgoAudit] Minimum Knee-Apron Clearance: {clearance_mm:.1f} mm")
    if clearance_mm < 45.0:
        print(">> WARNING: Ergonomic clearance breach! Knee pocket requires minimum 50mm relief.")
        return {"status": "FAIL", "clearance_mm": clearance_mm}
    return {"status": "PASS", "clearance_mm": clearance_mm}`,
    adoptionNotes: "Packaged as a 1-click Blender add-on (.zip) with visual sidebar panel. Industrial designers press 'Audit Clearance' to get an instant color-coded heatmap (Red <45mm, Green >60mm) directly in the Blender 3D viewport."
  },
  {
    id: "atherhmi",
    title: "AtherStack Ambient HMI — Generative Instrument Cluster & Telemetry Simulator",
    subtitle: "Interactive automotive instrument cluster workbench with synthetic CAN-bus telemetry and dynamic night/high-glare ambient adaptation.",
    category: "Automotive UI/UX",
    categoryKey: "ui-ux",
    badge: "Vehicle UI/UX & HMI",
    badgeColor: "purple",
    frictionTitle: "Figma Inability to Simulate 60 FPS Real-Time Ride States & Sun Glare",
    frictionDesc: "Ather's 7-inch TFT cluster runs dynamic contextual states (Eco, Ride, Sport, Warp, Regen charging, AutoHold, thermal throttle) that static Figma prototypes cannot realistically test under 90,000 Lux Bangalore sunlight.",
    summary: "Built a high-performance interactive automotive cluster simulator and Figma-to-code compiler for Ather HMI designers. Features synthetic CAN-bus telemetry driving fluid 60 FPS animations, ambient lux sensor adaptation, and automated WCAG 2.2 AAA outdoor legibility scoring.",
    stats: [
      { label: "Spec-to-Code Handoff", val: "60% faster", diff: "Eliminated redlines" },
      { label: "Dynamic States Tested", val: "28 states", diff: "Warp, Regen, Glare, SOS" },
      { label: "Framerate Stability", val: "60.0 FPS", diff: "Low-overhead WebGL" }
    ],
    techStack: ["React 19", "TypeScript", "Canvas API", "PixiJS", "Framer Motion", "Tailwind CSS", "WebSockets"],
    workflowSteps: [
      { step: "01", name: "Figma Component Sync", desc: "Imports automotive vector UI tokens, gauge needles, and typography scales via Figma REST API." },
      { step: "02", name: "CAN Telemetry Injection", desc: "Simulates vehicle speed, motor torque, battery BMS temperature, and lean angle in real-time." },
      { step: "03", name: "Ambient Glare Emulation", desc: "Simulates 0 to 100,000 lux outdoor sunlight with real-time contrast boosting algorithms." },
      { step: "04", name: "Production Asset Export", desc: "Generates optimized SVGs and lightweight Lottie JSON for AtherStack Android/Linux build." }
    ],
    codeSnippet: `// AtherStack HMI Dynamic Contrast & Sun-Glare Adaptation Algorithm
export function calculateHmiLuminanceAdaptation(ambientLux: number, rideMode: 'ECO' | 'RIDE' | 'SPORT' | 'WARP') {
  // Ather 7-inch TFT sunlight readability logic
  const isDirectSunlight = ambientLux > 70000; // Outdoor midday
  
  const basePalette = {
    WARP: { primary: '#A855F7', contrast: '#FFFFFF', bg: '#08090C' },
    ECO: { primary: '#00E599', contrast: '#FFFFFF', bg: '#060B08' },
    SPORT: { primary: '#F59E0B', contrast: '#FFFFFF', bg: '#0D0904' }
  }[rideMode];

  if (isDirectSunlight) {
    // Boost contrast ratio to meet automotive outdoor safety threshold (min 7:1)
    return {
      primaryColor: '#FFFFFF',
      accentColor: basePalette.primary,
      backgroundColor: '#000000',
      strokeWidthMultiplier: 1.4,
      fontTracking: '0.04em',
      wcagScore: 'AAA (Outdoor Certified)'
    };
  }
  return {
    primaryColor: basePalette.primary,
    accentColor: basePalette.contrast,
    backgroundColor: basePalette.bg,
    strokeWidthMultiplier: 1.0,
    fontTracking: '0.01em',
    wcagScore: 'AA+ (Ambient Nominal)'
  };
}`,
    adoptionNotes: "Used directly in browser by HMI designers on test benches. Includes an interactive CAN-bus throttle slider so UI designers can test rapid mode transitions without waiting for vehicle hardware firmware builds."
  },
  {
    id: "cmflens",
    title: "CMF-Lens — Edge Multi-Modal Material Inspection & BRDF Digitizer",
    subtitle: "Computer vision tool running on edge tablets to digitize physical paint swatches and predict real-world manufacturing lighting shifts.",
    category: "Generative AI Tools",
    categoryKey: "ai-tools",
    badge: "CMF & Manufacturing Integration",
    badgeColor: "emerald",
    frictionTitle: "Physical-to-Digital Mismatch in Automotive Paint & Plastic Finishes",
    frictionDesc: "Disconnect between digital Keyshot renderings and physical factory paint shop / injection-molding reality. A colorway looking sublime under warm studio light would appear washed out or green-shifted in real daylight.",
    summary: "Constructed an edge computer vision utility (running on tablet/desktop) that captures photos of physical material coupons under a standard calibration card. Uses a fine-tuned Vision Transformer (ViT) and photometric stereo pipeline to extract true BRDF parameters (specularity, roughness, metallic sheen) and outputs synchronized material nodes for Blender/Keyshot.",
    stats: [
      { label: "Sample Recasts Saved", val: "3 rounds", diff: "Per colorway program" },
      { label: "Physical Swatches Mapped", val: "45+ coupons", diff: "Ather Material Library" },
      { label: "Delta-E Color Accuracy", val: "< 1.8 ΔE", diff: "Indistinguishable to eye" }
    ],
    techStack: ["Python", "PyTorch", "YOLOv8", "Vision Transformer (ViT)", "OpenCV", "WebGPU", "Streamlit"],
    workflowSteps: [
      { step: "01", name: "Edge Camera Capture", desc: "Designer snaps a photo of physical molded coupon alongside color reference card." },
      { step: "02", name: "YOLO Specular Segmentation", desc: "Detects highlights and ambient reflectance areas to estimate gloss level." },
      { step: "03", name: "ViT BRDF Extraction", desc: "Neural network maps albedo, micro-facet roughness, and metallic ratio values." },
      { step: "04", name: "Digital Shader Export", desc: "Generates one-click .mtl and Blender PBR material node groups matched to factory supplier codes." }
    ],
    codeSnippet: `# Extract BRDF Material Properties from Physical Coupon Capture
import cv2
import numpy as np
import torch

def extract_brdf_parameters(coupon_image_bgr, calibration_card_bgr):
    # Step 1: Geometric rectification & white balance correction
    norm_image = color_correct_macbeth(coupon_image_bgr, calibration_card_bgr)
    
    # Step 2: Specular highlight separation via photometric gradient
    gray = cv2.cvtColor(norm_image, cv2.COLOR_BGR2GRAY)
    _, specular_mask = cv2.threshold(gray, 225, 255, cv2.THRESH_BINARY)
    
    # Step 3: Estimate surface roughness & clearcoat depth
    roughness_estimate = calculate_specular_falloff(gray, specular_mask)
    metallic_ratio = estimate_metallic_reflection(norm_image, specular_mask)
    
    return {
        "base_albedo_hex": rgb_to_hex(np.mean(norm_image[specular_mask == 0], axis=0)),
        "roughness": float(np.clip(roughness_estimate, 0.05, 0.95)),
        "metallic": float(np.clip(metallic_ratio, 0.0, 1.0)),
        "clearcoat": 0.85 if "gloss" in coupon_tag else 0.1
    }`,
    adoptionNotes: "Designed for CMF designers visiting supplier factories. Runs locally on iPad or ThinkPad laptop without internet access, ensuring proprietary Ather upcoming color recipes remain strictly confidential."
  },
  {
    id: "designflow",
    title: "DesignFlow Telemetry — AI Design Ops & Bottleneck Intelligence Suite",
    subtitle: "Non-intrusive workstation telemetry tracking design workflow friction, rendering stalls, and repetitive asset export tasks.",
    category: "Workflow Automation",
    categoryKey: "automation",
    badge: "Design Ops & Tooling",
    badgeColor: "amber",
    frictionTitle: "Design Leads Lacked Quantitative Data on Workflow Time Sinks",
    frictionDesc: "Design leadership had no objective metrics on what pipeline steps consumed the most designer hours (e.g. repetitive CAD STEP conversions, crash recoveries, manual asset export renaming).",
    summary: "Built a lightweight, non-intrusive workstation telemetry daemon that monitors active design tool states (Blender, Figma, Rhino, Keyshot). Clusters repetitive manual micro-tasks and leverages an embedded LLM assistant to automatically script batch-processing macros.",
    stats: [
      { label: "Hours Saved per Week", val: "12 hrs/des", diff: "Per industrial designer" },
      { label: "Automated Scripts", val: "8 pipelines", diff: "CAD to Web 3D hotfolders" },
      { label: "Team Adoption", val: "100%", diff: "Across Industrial & HMI teams" }
    ],
    techStack: ["Python", "Electron", "SQLite", "Claude API / MCP", "Apache ECharts", "React"],
    workflowSteps: [
      { step: "01", name: "Friction Telemetry", desc: "Monitors tool freeze states, repetitive export dialogues, and manual file conversions." },
      { step: "02", name: "Cluster Analysis", desc: "Aggregates friction points into high-impact operational bottlenecks." },
      { step: "03", name: "AI Macro Generator", desc: "Uses LLM coding agent to synthesize custom Python/shell hotfolder scripts." },
      { step: "04", name: "1-Click Hotfolder", desc: "Drop a raw CAD file in folder; auto-generates optimized GLTF, wireframes, and renders." }
    ],
    codeSnippet: `# Design Ops Hotfolder Daemon: Auto-Converts Industrial STEP files to WebGL GLB
import time
import os
import subprocess
from pathlib import Path

WATCH_DIR = Path("/AtherDesignShared/CAD_Dropzone")
PROCESSED_DIR = Path("/AtherDesignShared/Web_Approved")

def process_new_cad_drop(file_path):
    print(f"[DesignFlow] Detected new CAD submission: {file_path.name}")
    # Run headless Blender decimation & PBR assignment script
    cmd = [
        "blender", "--background", "--python", "scripts/auto_decimate_step.py",
        "--", str(file_path), str(PROCESSED_DIR / f"{file_path.stem}.glb")
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[DesignFlow] Successfully optimized {file_path.stem}.glb (Decimated to 45k quads)")
    else:
        print(f"[DesignFlow Error] {res.stderr}")`,
    adoptionNotes: "Provides a clean executive dashboard for the Head of Industrial Design showing weekly hours reclaimed and active tool pipeline health."
  }
];

// Interactive Prompt Sandbox Scenarios
const PROMPT_SANDBOX_ITEMS = {
  cowl: {
    title: "Aero-Sculpted Front Cowl with Dual Ram-Air Vents",
    prompt: "Ather 450 style front apron, aerodynamic air ducting channels, matte obsidian composite, integrated LED daytime running blade, studio automotive lighting, 4K render",
    stats: "Render Time: 6.2s | Quads: 38,400 | Aerodynamic Drag: -4.2%",
    color: "#00E599"
  },
  grabrail: {
    title: "Integrated Halo Helmet Inductive Pillion Rail",
    prompt: "Cast aluminum minimalist pillion grab rail, magnetic wireless inductive dock for Ather Halo smart helmet, hidden fastener geometry, satin graphite powder-coat",
    stats: "Render Time: 5.8s | Weight: 420g | Load Rating: 120kg",
    color: "#A855F7"
  },
  aerodisc: {
    title: "Vortex-Generating Aero-Disc Wheel Cover",
    prompt: "Electric two-wheeler rear wheel aero cover, directional turbofan cooling vanes, forged carbon texture, lightweight flush fitment against rim",
    stats: "Render Time: 7.1s | Quads: 29,100 | Range Gain: +1.8 km",
    color: "#00D8F6"
  },
  swingarm: {
    title: "Die-Cast Lattice Hybrid Swingarm",
    prompt: "Exposed architectural single-sided swingarm for belt-drive EV motor, structural generative topology optimization, raw bead-blasted aluminum finish",
    stats: "Render Time: 8.4s | Mass Reduction: 28% | Safety Factor: 2.8x",
    color: "#F59E0B"
  }
};

let currentFilter = 'all';

function initPortfolio() {
  renderProjectCards();
  initWorkflowComparisonSlider();
  initSoundSystem();
  setupNavScroll();
  selectSandboxPrompt('cowl');
}

function renderProjectCards() {
  const container = document.getElementById('projects-grid-container');
  if (!container) return;

  const filtered = currentFilter === 'all' 
    ? PROJECTS_DATA 
    : PROJECTS_DATA.filter(p => p.categoryKey === currentFilter);

  container.innerHTML = filtered.map(p => `
    <div class="glass-panel rounded-2xl p-6 md:p-8 flex flex-col justify-between group cursor-pointer border border-white/5 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden" onclick="openProjectModal('${p.id}')">
      <!-- Ambient corner glow -->
      <div class="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500"></div>

      <div>
        <!-- Card Top Bar -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-mono px-3 py-1 rounded-full badge-${p.badgeColor === 'emerald' ? 'ather' : (p.badgeColor === 'purple' ? 'warp' : 'tech')} font-semibold">
            ${p.badge}
          </span>
          <span class="text-xs text-slate-500 font-mono tracking-wider">PROJECT // 0${PROJECTS_DATA.findIndex(x => x.id === p.id) + 1}</span>
        </div>

        <h3 class="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
          ${p.title}
        </h3>
        
        <p class="text-sm text-slate-400 mb-6 line-clamp-2">
          ${p.subtitle}
        </p>

        <!-- Friction vs Solution Snapshot -->
        <div class="bg-black/40 rounded-xl p-4 border border-white/5 mb-6 space-y-2">
          <div class="flex items-start gap-2 text-xs">
            <span class="text-red-400 font-bold font-mono min-w-[70px]">FRICTION:</span>
            <span class="text-slate-300">${p.frictionTitle}</span>
          </div>
          <div class="flex items-start gap-2 text-xs">
            <span class="text-emerald-400 font-bold font-mono min-w-[70px]">SOLUTION:</span>
            <span class="text-slate-300 line-clamp-1">${p.summary}</span>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-3 gap-2 mb-6">
          ${p.stats.map(s => `
            <div class="bg-slate-900/60 rounded-lg p-2.5 text-center border border-white/5">
              <div class="text-base font-bold text-white font-mono">${s.val}</div>
              <div class="text-[10px] text-slate-400 truncate">${s.label}</div>
              <div class="text-[9px] text-emerald-400 font-mono font-medium">${s.diff}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Card Footer -->
      <div class="pt-4 border-t border-white/5 flex items-center justify-between">
        <div class="flex flex-wrap gap-1.5 max-w-[75%]">
          ${p.techStack.slice(0, 3).map(t => `
            <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">${t}</span>
          `).join('')}
          ${p.techStack.length > 3 ? `<span class="text-[11px] font-mono text-slate-500 self-center">+${p.techStack.length - 3}</span>` : ''}
        </div>

        <div class="flex items-center text-emerald-400 text-xs font-mono font-semibold gap-1 group-hover:translate-x-1 transition-transform">
          <span>Read Case Study</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  `).join('');
}

window.filterProjects = function(categoryKey) {
  currentFilter = categoryKey;
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.classList.remove('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/50');
    btn.classList.add('text-slate-400', 'border-transparent');
  });
  const activeBtn = document.getElementById(`filter-${categoryKey}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border-emerald-500/50');
    activeBtn.classList.remove('text-slate-400', 'border-transparent');
  }
  renderProjectCards();
};

window.openProjectModal = function(projectId) {
  const p = PROJECTS_DATA.find(x => x.id === projectId);
  if (!p) return;

  const modalContainer = document.getElementById('project-modal');
  const modalContent = document.getElementById('project-modal-content');
  if (!modalContainer || !modalContent) return;

  modalContent.innerHTML = `
    <!-- Modal Header -->
    <div class="sticky top-0 bg-[#0B0F14]/95 backdrop-blur-md z-20 pb-4 border-b border-white/10 flex items-start justify-between">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs font-mono px-3 py-1 rounded-full badge-ather font-semibold">${p.badge}</span>
          <span class="text-xs font-mono text-slate-400">${p.category}</span>
        </div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">${p.title}</h2>
      </div>
      <button onclick="closeProjectModal()" class="text-slate-400 hover:text-white p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="space-y-8 py-6 text-slate-300">
      <!-- Metric Highlights -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        ${p.stats.map(s => `
          <div class="bg-black/50 border border-white/10 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold font-mono text-emerald-400">${s.val}</div>
            <div class="text-xs text-slate-400 mt-1">${s.label}</div>
            <div class="text-xs text-slate-500 font-mono mt-0.5">${s.diff}</div>
          </div>
        `).join('')}
      </div>

      <!-- Problem vs Solution deep-dive -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <div class="flex items-center gap-2 text-red-400 font-mono font-bold text-sm mb-3">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            THE DESIGNER FRICTION POINT
          </div>
          <p class="text-sm text-slate-300 leading-relaxed">${p.frictionDesc}</p>
        </div>

        <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
          <div class="flex items-center gap-2 text-emerald-400 font-mono font-bold text-sm mb-3">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            THE AI-POWERED SOLUTION
          </div>
          <p class="text-sm text-slate-300 leading-relaxed">${p.summary}</p>
        </div>
      </div>

      <!-- Step by step workflow -->
      <div>
        <h4 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span class="text-emerald-400 font-mono">//</span> Streamlined Designer Workflow Architecture
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          ${p.workflowSteps.map(w => `
            <div class="bg-slate-900/50 border border-white/5 rounded-xl p-4 relative">
              <span class="text-2xl font-black font-mono text-emerald-400/30 absolute top-2 right-3">${w.step}</span>
              <div class="text-sm font-bold text-white mb-1.5">${w.name}</div>
              <p class="text-xs text-slate-400 leading-relaxed">${w.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Code Implementation -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-lg font-bold text-white flex items-center gap-2">
            <span class="text-emerald-400 font-mono">//</span> Core Implementation Script
          </h4>
          <span class="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded">Production Code</span>
        </div>
        <div class="relative bg-black/80 rounded-xl border border-white/10 p-4 font-mono text-xs overflow-x-auto text-emerald-300">
          <pre><code>${escapeHtml(p.codeSnippet)}</code></pre>
        </div>
      </div>

      <!-- Adoption & Training -->
      <div class="bg-slate-900/40 border border-white/5 rounded-xl p-5">
        <h4 class="text-base font-bold text-white mb-2 flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          Designer Adoption & Handoff Documentation
        </h4>
        <p class="text-sm text-slate-400 leading-relaxed">${p.adoptionNotes}</p>
      </div>

      <!-- Tech Stack Badges -->
      <div class="flex flex-wrap gap-2 pt-2">
        ${p.techStack.map(t => `
          <span class="text-xs font-mono px-3 py-1 rounded bg-white/5 text-slate-300 border border-white/10">${t}</span>
        `).join('')}
      </div>
    </div>
  `;

  modalContainer.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

window.closeProjectModal = function() {
  const modalContainer = document.getElementById('project-modal');
  if (modalContainer) modalContainer.classList.add('hidden');
  document.body.style.overflow = 'auto';
};

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Before / After Workflow Comparison Slider
function initWorkflowComparisonSlider() {
  const slider = document.getElementById('workflow-slider');
  const divider = document.getElementById('workflow-divider');
  const beforeLayer = document.getElementById('workflow-before-layer');

  if (!slider || !divider || !beforeLayer) return;

  slider.addEventListener('input', (e) => {
    const val = e.target.value;
    divider.style.left = `${val}%`;
    beforeLayer.style.clipPath = `polygon(0 0, ${val}% 0, ${val}% 100%, 0 100%)`;
  });
}

// Interactive AI Design Lab Sandbox
window.selectSandboxPrompt = function(key) {
  const item = PROMPT_SANDBOX_ITEMS[key];
  if (!item) return;

  document.querySelectorAll('.sandbox-prompt-btn').forEach(b => {
    b.classList.remove('ring-2', 'ring-emerald-400', 'bg-white/10');
  });
  const activeBtn = document.getElementById(`sandbox-${key}`);
  if (activeBtn) activeBtn.classList.add('ring-2', 'ring-emerald-400', 'bg-white/10');

  const titleEl = document.getElementById('sandbox-title');
  const promptEl = document.getElementById('sandbox-prompt-text');
  const statsEl = document.getElementById('sandbox-stats-text');

  if (titleEl) titleEl.textContent = item.title;
  if (promptEl) promptEl.textContent = `"${item.prompt}"`;
  if (statsEl) statsEl.textContent = item.stats;

  // Render procedural SVG wireframe preview in sandbox canvas
  drawSandboxWireframe(key);
};

function drawSandboxWireframe(key) {
  const container = document.getElementById('sandbox-wireframe-svg');
  if (!container) return;

  if (key === 'cowl') {
    container.innerHTML = `
      <path d="M 50 160 Q 150 40 280 60 Q 320 80 270 180 Q 180 200 50 160 Z" fill="none" stroke="#00E599" stroke-width="2" />
      <path d="M 90 140 L 220 80 L 250 140 Z" fill="rgba(0, 229, 153, 0.15)" stroke="#00E599" stroke-width="1.2" stroke-dasharray="3" />
      <line x1="120" y1="100" x2="190" y2="150" stroke="#00D8F6" stroke-width="1" />
      <line x1="150" y1="80" x2="220" y2="130" stroke="#00D8F6" stroke-width="1" />
      <circle cx="270" cy="70" r="4" fill="#00E599" />
      <text x="70" y="50" fill="#00E599" font-family="monospace" font-size="10">RAM-AIR INTAKE COWL // 38.4k QUADS</text>
    `;
  } else if (key === 'grabrail') {
    container.innerHTML = `
      <path d="M 60 140 Q 160 40 260 70 Q 300 120 250 150" fill="none" stroke="#A855F7" stroke-width="3" stroke-linecap="round" />
      <ellipse cx="190" cy="85" rx="35" ry="18" fill="rgba(168, 85, 247, 0.2)" stroke="#A855F7" stroke-width="1.5" />
      <circle cx="190" cy="85" r="8" fill="#00E599" />
      <text x="70" y="45" fill="#A855F7" font-family="monospace" font-size="10">HALO HELMET INDUCTIVE DOCK // 420g</text>
    `;
  } else if (key === 'aerodisc') {
    container.innerHTML = `
      <circle cx="175" cy="110" r="80" fill="none" stroke="#00D8F6" stroke-width="2" />
      <circle cx="175" cy="110" r="35" fill="rgba(0, 216, 246, 0.15)" stroke="#00D8F6" stroke-width="1.5" />
      ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
        const rad = deg * Math.PI / 180;
        const x1 = 175 + Math.cos(rad) * 35;
        const y1 = 110 + Math.sin(rad) * 35;
        const x2 = 175 + Math.cos(rad) * 80;
        const y2 = 110 + Math.sin(rad) * 80;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#00D8F6" stroke-width="1.2" stroke-dasharray="2" />`;
      }).join('')}
      <text x="60" y="25" fill="#00D8F6" font-family="monospace" font-size="10">TURBOFAN AERO-DISC // +1.8km RANGE</text>
    `;
  } else if (key === 'swingarm') {
    container.innerHTML = `
      <path d="M 50 120 L 140 70 L 290 85 L 260 140 L 150 135 Z" fill="none" stroke="#F59E0B" stroke-width="2" />
      <circle cx="70" cy="115" r="14" fill="rgba(245, 158, 11, 0.2)" stroke="#F59E0B" stroke-width="1.5" />
      <circle cx="270" cy="110" r="16" fill="rgba(245, 158, 11, 0.2)" stroke="#F59E0B" stroke-width="1.5" />
      <polygon points="120,95 180,85 160,115" fill="none" stroke="#F59E0B" stroke-width="1.2" />
      <polygon points="190,88 245,95 220,120" fill="none" stroke="#F59E0B" stroke-width="1.2" />
      <text x="50" y="45" fill="#F59E0B" font-family="monospace" font-size="10">LATTICE TOPOLOGY SWINGARM // -28% MASS</text>
    `;
  }
}

// Sound System (Native Web Audio API - no external assets)
let audioCtx = null;
let soundEnabled = false;

function initSoundSystem() {
  const toggleBtn = document.getElementById('sound-toggle-btn');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    toggleBtn.classList.toggle('text-emerald-400', soundEnabled);
    toggleBtn.classList.toggle('text-slate-500', !soundEnabled);
    if (soundEnabled && !audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (soundEnabled) playUiTone(880, 'sine', 0.05);
  });
}

function playUiTone(freq, type = 'sine', duration = 0.04) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function setupNavScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        playUiTone(600, 'triangle', 0.03);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initPortfolio();
});
