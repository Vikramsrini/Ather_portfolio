# ⚡ AI Generalist (Design) — Interactive Engineering Workbench & Portfolio
### Candidate: Vikram S | Target: Ather Energy Limited (Industrial Design Dept, Bangalore)

> *"This role is not about designing vehicles — it's about designing for the designers. You will identify the friction points and build simple, AI-powered tools that make their process frictionless."*

An industrial-grade, zero-friction web workbench demonstrating how **Multi-Condition Diffusion (ControlNet + LoRA), Model Context Protocol (MCP) Agents, On-Device Local RAG (Ollama + ChromaDB MMR), Headless Blender Python (`bpy`), and Hybrid ViT/CNN Computer Vision** eliminate mechanical bottlenecks across Ather Energy's **Industrial Design, CMF, Vehicle Ergonomics, and AtherStack™ HMI** pipelines.

---

## 🛠️ 4 Live Interactive Workbenches Built Into This Portfolio

### 1. AeroMorph 3D Parametric CAD, Render Pass & CMF Studio (`js/3d-viewer.js`)
* **Sculpted Ather 450 Apex™ / 450X 3D Assembly**: Built using extruded 2D spline fairings, exposed tubular aluminum Warren-truss trellis subframe, smoked translucent polycarbonate side panels, helical monoshock coil, and 6-spoke split alloy wheels with drilled petal disc rotors.
* **5 Real-Time Viewport Render Passes**:
  * **PBR Studio Shader**: Cook-Torrance BRDF with procedural studio softbox reflections.
  * **Class-A Zebra Continuity Shader**: Custom GLSL fragment shader projecting reflection stripes to evaluate G2/G3 surface curvature continuity.
  * **Surface Normal Map Pass**: Direct conditioning pass for ControlNet Normal.
  * **Z-Depth Buffer Pass**: Custom GLSL depth ramp for ControlNet Depth conditioning.
  * **Quad SubD Wireframe**: Topology inspection mode.
* **1-Click Pass Snapshot (`.PNG`) & Exploded CAD Assembly Callouts**.

### 2. Multi-Condition ControlNet & ComfyUI Synthesis Workbench (`js/ai-pipeline-sim.js`)
* Interactive conditioning synthesizer for **450 Apex Front Apron**, **Exposed Aluminum Trellis Frame**, **Rizta™ Family Saddle**, and **Halo™ Smart Helmet**.
* Real-time weight sliders for **Canny LineArt**, **Surface Normal**, **Z-Depth**, and **`Ather_DesignDNA_v3.safetensors` LoRA** showing live CAD hardpoint lock percentage and CIEDE2000 Delta-E color drift.
* **1-Click Export**: Downloads a production-ready **ComfyUI API Workflow Graph (`.JSON`)**.

### 3. AtherStack™ 6.0 — 7" TFT HMI, MagicTwist™ & 90k Lux Sunlight Glare Lab (`js/cluster-sim.js`)
* Simulates **SmartEco™, Eco, Ride, Sport, and Warp+™** modes with bidirectional **MagicTwist™ regenerative braking** and contextual cards (**Google Maps Vector Nav**, **SkidControl™ wet traction intervention**, **Halo™ Helmet ChitChat intercom**, **BMS Thermal telemetry**).
* **Continuous 0–100,000 Lux Photometry Engine**: Calculates effective contrast ratio under 90,000 Lux Bangalore midday sunlight and demonstrates automatic switching to **ISO 15008 AAA High-Contrast Daylight Polarity (`14.8:1`)**.

### 4. Law-of-Cosines 2-Bone Inverse Kinematics (IK) & CFD Wind-Tunnel Solver (`js/ergo-sim.js`)
* **True 2-Link Planar Inverse Kinematics**: Solves exact anatomical knee and elbow joint coordinates with constant femur/tibia and humerus/forearm lengths across **5th, 50th, and 95th percentile Indian riders (IS 13942)**.
* **Platform Switcher**: Compare knee-to-apron clearance and posture between **Ather 450X/Apex** and **Ather Rizta™**.
* **Live CFD Streamline Overlay**: Visualizes laminar flow, Frontal Area ($A$), Drag Coefficient ($C_d$), and per-charge range impact.

---

## 👤 Candidate Credentials & Verified Engineering Track Record
* **Candidate:** Vikram S
* **Education:** B.Tech – Computer Science and Engineering, SRM Institute of Science and Technology, Chennai (`Aug 2023 – Jul 2027`) · **CGPA: 9.53 / 10** (7th semester, available for full 8th-semester internship)
* **Work Experience:**
  * **SDE Intern @ BNY** (`Jun 2026 – Aug 2026`, On-site, Chennai) — Built an LLM-powered agent in Java & Spring Boot integrating **Splunk, GitLab, and Jira as MCP servers**, eliminating a manual exception-triage workflow staffed by **2 engineers** on a platform serving **100+ developers**. Authored the technical design doc with **Claude Code** and migrated E2E tests from Selenium to **Playwright**.
  * **AI/ML Research Intern @ King Faisal University, Saudi Arabia** (`Jul 2025 – Jun 2026`, Remote) — Achieved **94.4% accuracy** and **AUROC > 0.99** on 9-class classification (**TrashNeXt**) by stacking **Swin-Base + EfficientNetV2-S** under an **XGBoost** meta-learner across **50+ Optuna TPE trials** with **SHAP and LIME** interpretability; co-authored a **peer-reviewed journal publication**.
* **Shipped GenAI & Production Projects:**
  * **SprintBoard – RL Environment for LLM Agents (OpenEnv Hackathon 2026)**: Raised mean grader score on 15 tasks from **0.39 to 0.99** by fine-tuning **Qwen2.5-1.5B-Instruct with LoRA** via SFT warm-start + **TRL GRPO**; shipped Dockerised Hugging Face Space & LoRA adapter.
  * **Local RAG Pipeline – On-Device Document Q&A**: 100% on-device RAG with **Llama 3.2 via Ollama** over 6 document formats (`tiktoken` 512/64 chunker, SHA-256 deduplication, **ChromaDB MMR re-ranking**).
  * **OutBox – Distributed Email Job Scheduler**: Scheduled **1,000 emails in ≈0.5 s** with zero duplicates using **BullMQ**, Postgres (Drizzle ORM), atomic **Redis Lua rate limiter** (verified across 50 concurrent reservations), Elasticsearch, and React 19.
  * **NEXUS – SRM Academia Portal**: Served **10K+ visitors** with a React + Vite PWA and 5+ Supabase/Express backend services.
  * **Airline Route Optimization – Weather-Aware Routing**: Weighted **NetworkX** graph routing with **PySpark**, Flask REST API, and Leaflet + ECharts.
* **Awards & Achievements:**
  * **1st Place – IEEE E-JIGYASA Project Expo 2025** (`Apr 2025`)
  * **IIT Madras – Walmart Center for Tech Excellence Workshop** (`Apr 2025`, Real-time LSTM sensor failure-prediction pipeline)
* **Contact:** [vikramsrinivas150@gmail.com](mailto:vikramsrinivas150@gmail.com) | +91 8870262694 | [GitHub](https://github.com/Vikramsrini) | [LinkedIn](https://www.linkedin.com/in/vikram-srinivas-60a75b204/)
