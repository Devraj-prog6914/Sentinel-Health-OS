# Sentinel Health: Venture-Scale AI Healthcare Operating System

Sentinel Health transforms healthcare from **reactive** to **predictive** by combining Digital Health Twins, Explainable AI (XAI), real-time vital telemetry streams, and connected clinician workflows.

This repository contains the complete codebase for the Sentinel Health ecosystem.

---

## 🚀 System Architecture

Sentinel Health is structured as a high-performance monorepo:

### 1. Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion
* **Role Dashboards**: Fully integrated, seamless dashboards for **Patients**, **Doctors (Mission Control)**, **Hospital Administrators (Operations Command)**, and **Government Administrators (Population Intelligence)**.
* **Aesthetics**: Sleek space-grade glassmorphic interface, dark theme layouts, animated SVG vital ECG streams, and responsive layouts.
* **State & AI Simulation**: Powered by **Zustand** with built-in client-side fallback engines for vital risk analysis, treatment simulations, OCR chemistry parsing, and voice diagnostics, allowing the entire application to run stand-alone out of the box.

### 2. Backend: FastAPI (Python), PostgreSQL + pgvector, Redis, SQLAlchemy
* **AI Risk Calculation**: Analyzes heart rate, blood pressure, oxygen levels, sleep deprivation, and medication compliance using physiological thresholds.
* **Medical OCR**: Instantly parses unstructured lab transcripts (e.g. from LabCorp), extracts serum biomarkers, and flags systemic anomalies (e.g., Hyperkalemia).
* **Voice Symptom Intelligence**: Evaluates voice transcripts to flag acute symptoms (e.g. Orthopnea, Dyspnea, Angina) and vocal stress indices.
* **Database Models**: Robust tables with UUID primary keys, soft delete triggers, optimistic lock versioning, index schemas, and audit logging.

---

## 🛠️ Setup & Running Locally

### Option A: Standard Local Execution (Recommended for Fast Review)

#### 1. Launch Next.js Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
> **Note:** The frontend has a fully embedded client-side port of all AI Engines, simulations, and seeds (102 patients, 30 doctors, 50 beds). You can switch between dashboards, enter vitals, upload OCR panels, and run treatment projections instantly client-side without spinning up local databases!

#### 2. Launch FastAPI Backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
The server will run on [http://localhost:8000](http://localhost:8000) and automatically seed a local SQLite database (`sentinel_health.db`) with 105 patient records, 30 doctor profiles, and hospital bed maps. Open `/docs` to review the REST API specifications.

---

### Option B: Production Container Execution (Docker Compose)

Spin up the complete system (PostgreSQL + pgvector, Redis, Celery, FastAPI, and Next.js):
```bash
docker-compose up --build
```

---

## 🏥 Clinical Demo Scenarios

Sentinel Health comes pre-configured with detailed clinical stories to show off its AI and tracking capabilities:

1. **Scenario 1: Congestive Heart Failure Decompensation**
   * *Profile:* Arthur Pendleton (Patient 0, 78y, Cardio-ICU Bed 1).
   * *Status:* Compliance drop (55%) on Metoprolol beta-blockers leads to tachycardia (HR 112) and arterial hypoxia (SpO2 91%).
   * *Action:* Log into **Patient App** -> Trigger "SOS Emergency" OR log into **Doctor Mission Control** -> Select Arthur -> Open "AI Treatment Simulator" -> Adjust beta-blockers dosage -> Review projected outcomes.

2. **Scenario 2: Medical OCR Lab Extraction**
   * *Profile:* Elena Sterling (Patient 1).
   * *Status:* Routine vitals are normal, but kidney panels are missing.
   * *Action:* Log into **Doctor Mission Control** -> Select Elena Sterling -> Paste the "High Potassium" preset transcript in the OCR panel -> Run OCR Ingestion -> The AI parses Potassium at 5.8 mEq/L (Hyperkalemia) and Creatinine at 1.4 mg/dL, spikes risk probability to 62%, and issues a Critical Alert.

3. **Scenario 3: Voice Symptom Ingestion**
   * *Profile:* Carol Vance (Patient 2).
   * *Status:* Patient records a voice journal describing breathing issues while sleeping.
   * *Action:* Log into **Patient App** -> In the Voice Journal panel, choose the "CHF Decompensation (Crisis)" preset -> Click Submit Voice Journal -> The AI parses Orthopnea and Dyspnea, updates the twin risk status to 74% (High), and flags cardiorespiratory congestion on the Doctor's panel.
