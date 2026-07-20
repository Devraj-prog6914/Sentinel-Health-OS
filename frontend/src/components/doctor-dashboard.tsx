"use client";

import React, { useState } from "react";
import { useSentinelStore, PatientProfile } from "../store/store";
import { 
  Heart, 
  Activity, 
  Search, 
  TrendingUp, 
  Send,
  Sliders,
  CheckCircle,
  FileText,
  AlertCircle,
  Eye,
  Info,
  Clock,
  Settings,
  Maximize2,
  Minimize2,
  X
} from "lucide-react";

export default function DoctorDashboard() {
  const { 
    patients, 
    activePatientId, 
    setRole, 
    runSimulation, 
    processOCRUpload,
    auditLogs 
  } = useSentinelStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>(activePatientId || "pat-1");
  
  // Simulation Form
  const [intervention, setIntervention] = useState("drug_adjustment");
  const [dosageChange, setDosageChange] = useState("increase");
  const [exerciseDays, setExerciseDays] = useState("4");
  
  // OCR Form
  const [ocrText, setOcrText] = useState("");
  const [selectedGraphNode, setSelectedGraphNode] = useState("CHF");
  const ocrPresets = [
    { label: "High Potassium (Elena Sterling Case)", text: "LabCorp Chemistry Panel. Reference ID: 2280-K. Patient: Elena Sterling. Serum Potassium (K+) detected at 5.8 mEq/L. Serum Creatinine at 1.4 mg/dL." },
    { label: "Normal Baseline Panel", text: "Sentinel General Lab. CBC and Electrolytes. Patient: Arthur Pendleton. Sodium: 140 mEq/L. Potassium (K+): 4.1 mEq/L. Hemoglobin: 14.5 g/dL." }
  ];

  // SOAP Scribe & Multi-Agent Board states
  const [soapView, setSoapView] = useState(true);
  const [fhirExported, setFhirExported] = useState(false);
  const [boardStep, setBoardStep] = useState<"review" | "debating" | "approved">("approved");

  // Copilot Chat
  const [chatMessage, setChatMessage] = useState("");
  const [isCopilotExpanded, setIsCopilotExpanded] = useState(false);
  const [chatLog, setChatLog] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Sentinel Clinical Copilot online. Select a patient to review telemetry models, draft clinical notes, or run pharmacological simulations." }
  ]);

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handlePatientSelect = (id: string) => {
    setSelectedPatientId(id);
    // Add audit log
    const { currentUser } = useSentinelStore.getState();
    if (currentUser) {
      useSentinelStore.setState(state => ({
        auditLogs: [{
          id: `aud-view-${Date.now()}`,
          timestamp: new Date().toISOString(),
          username: currentUser.username,
          action: "VIEW_TWIN",
          details: `Accessed ${patients.find(p=>p.id===id)?.fullName}'s Digital Twin from Critical Queue`
        }, ...state.auditLogs]
      }));
    }
  };

  // Run Simulation
  const handleSimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = intervention === "drug_adjustment" 
      ? { dosage_change: dosageChange, expected_compliance: 0.92 }
      : { steps_increase: 3000, days_per_week: parseInt(exerciseDays) };
      
    runSimulation(activePatient.id, intervention, params);
  };

  // Ingest OCR
  const handleOCRSubmit = () => {
    if (!ocrText) return;
    processOCRUpload(activePatient.id, ocrText);
    setOcrText("");
  };

  // Ask Copilot AI
  const handleCopilotSend = (presetMsg?: string) => {
    const msg = presetMsg || chatMessage;
    if (!msg) return;

    const userMessage = { sender: "user" as const, text: msg };
    setChatLog(prev => [...prev, userMessage]);
    setChatMessage("");

    setTimeout(() => {
      let reply = "";
      const query = msg.toLowerCase();

      if (query.includes("clinical note") || query.includes("draft")) {
        reply = `**CLINICAL SUMMARY NOTE - ${activePatient.fullName}**\n*Date: ${new Date().toLocaleDateString()}*\n\n**Subjective:** Patient currently monitored remotely via digital twin telemetry. Wearables ingest active. \n\n**Objective:** Health Score: ${activePatient.healthScore}%, Risk Score: ${activePatient.riskScore}%. Latest Heart Rate: ${activePatient.vitals[activePatient.vitals.length-1].heartRate} bpm. SpO2: ${activePatient.vitals[activePatient.vitals.length-1].spO2}%.\n\n**Assessment:** ${activePatient.twinSummary}\n\n**Plan:** Optimize compliance loops. Continue remote vitals telemetry check. Titrate medications as simulated.`;
      } else if (query.includes("potassium") || query.includes("anomaly")) {
        const hasHighK = activePatient.timeline.some(e => e.description.includes("5.8 mEq/L"));
        if (hasHighK) {
          reply = `**AI CLINICAL DECISION SUPPORT:**\n\nPatient ${activePatient.fullName} exhibits serum Potassium of 5.8 mEq/L (Hyperkalemia) verified via OCR chemistry panel. \n\n**Physiological Risk:** Hyperkalemia alters myocardial resting membrane potential, introducing severe risk of conduction blocks or ventricular fibrillation. \n\n**Action Recommendations:**\n1. Review active meds: Hold Lisinopril/Losartan (induces potassium retention).\n2. Order urgent 12-lead ECG to check for peaked T-waves.\n3. Re-draw electrolyte panel in 4 hours.`;
        } else {
          reply = `Reviewing current labs for ${activePatient.fullName}. Electrolytes are stable. Potassium is normal at 4.1 mEq/L. No acute anomaly alerts.`;
        }
      } else if (query.includes("compliance") || query.includes("adherence")) {
        reply = `**ADHERENCE PROJECTOR AI:**\n\nPatient ${activePatient.fullName} reports medication compliance at **${activePatient.complianceScore}%**. \n\n**Analysis:** Arthur Pendleton shows compliance drop to 55%, correlating with a 30% rise in cardiovascular deterioration risks. Recommendation: Initiate voice-assistant reminder schedule and caregiver notification.`;
      } else {
        reply = `I have analyzed the Digital Twin model for ${activePatient.fullName}. The patient has a risk probability score of ${activePatient.riskScore}% (${activePatient.predictions[0]?.riskLevel || "LOW"} risk). Current physiological metrics: Pulse ${activePatient.vitals[activePatient.vitals.length-1].heartRate} bpm, O2 Saturation ${activePatient.vitals[activePatient.vitals.length-1].spO2}%. Ready for further clinical query.`;
      }

      setChatLog(prev => [...prev, { sender: "ai" as const, text: reply }]);
    }, 1000);
  };

  // Filter patients based on query
  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-stretch">
      
      {/* 1. LEFT SIDEBAR: Critical Queue */}
      <div className="lg:col-span-1 glass-panel p-4 rounded-2xl flex flex-col max-h-[820px]">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-sm tracking-wider text-gray-400">CRITICAL PATIENT QUEUE</span>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient cohort..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
          />
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {filteredPatients.map(p => {
            const latestVital = p.vitals[p.vitals.length - 1];
            const latestPred = p.predictions[0];
            const isSelected = p.id === selectedPatientId;
            
            return (
              <div
                key={p.id}
                onClick={() => handlePatientSelect(p.id)}
                className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? "bg-indigo-950/40 border-indigo-500/60 shadow-glass-glow" 
                    : "bg-gray-950/40 border-border hover:bg-gray-900/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-gray-200">{p.fullName}</h4>
                    <span className="text-[9px] text-gray-500 font-mono">ID: {p.id.toUpperCase()}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    latestPred.riskLevel === "CRITICAL" 
                      ? "bg-rose-950 text-rose-400 border border-rose-900/60" 
                      : latestPred.riskLevel === "HIGH"
                      ? "bg-orange-950 text-orange-400 border border-orange-900/60"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-900/60"
                  }`}>
                    {latestPred.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] text-gray-400 border-t border-border/50 pt-2 font-mono-telemetry">
                  <div>
                    <p className="text-[8.5px] text-gray-600">PULSE</p>
                    <p className="font-bold text-gray-300">{latestVital?.heartRate || 72} bpm</p>
                  </div>
                  <div>
                    <p className="text-[8.5px] text-gray-600">SpO2</p>
                    <p className="font-bold text-gray-300">{latestVital?.spO2 || 98}%</p>
                  </div>
                  <div>
                    <p className="text-[8.5px] text-gray-600">TWIN_SCORE</p>
                    <p className="font-bold text-indigo-400">{p.healthScore}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MIDDLE MAIN AREA: Telemetry & Simulation */}
      <div className="lg:col-span-2 flex flex-col gap-6 max-h-[820px] overflow-y-auto pr-1">
        
        {/* Patient Telemetry Header HUD */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-[-30%] right-[-10%] w-72 h-72 bg-gradient-radial from-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-0.5 rounded-full">ACTIVE MISSION CRITICAL TELEMETRY</span>
              <h2 className="text-xl font-bold text-white mt-1.5">{activePatient.fullName}</h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                AGE: {2026 - parseInt(activePatient.dob.split("-")[0])}y • GENDER: {activePatient.gender} • BLOOD: {activePatient.bloodType} • ALLERGIES: <span className="text-rose-400">{activePatient.allergies}</span>
              </p>
            </div>

            {/* Quick Switch to Patient View button */}
            <button 
              onClick={() => setRole("patient", activePatient.id)}
              className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-gray-900 hover:bg-gray-800 border border-border transition flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Patient App View</span>
            </button>
          </div>

          {/* ECG Simulated Waveform Stream */}
          <div className="mt-5 p-4 rounded-xl bg-black/60 border border-border h-24 relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] text-gray-600 font-mono tracking-widest">
              <span>ECG PATIENT LEAD II</span>
              <span className="text-emerald-500 animate-pulse font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block" /> LIVE TELEMETRY_INGEST
              </span>
            </div>
            
            {/* SVG ECG line drawing */}
            <svg className="w-full h-12 text-emerald-500/80" viewBox="0 0 400 50" preserveAspectRatio="none">
              <path 
                className="ecg-line"
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                d="M 0 25 L 30 25 L 40 10 L 45 40 L 50 25 L 90 25 L 100 25 L 110 5 L 115 45 L 120 25 L 170 25 L 180 25 L 190 10 L 195 40 L 200 25 L 240 25 L 250 25 L 260 5 L 265 45 L 270 25 L 320 25 L 330 25 L 340 10 L 345 40 L 350 25 L 400 25" 
              />
            </svg>

            <div className="flex gap-4 text-[10px] text-gray-500 font-mono">
              <span>AMP: 1.2mV</span>
              <span>FILTER: 0.5-40Hz</span>
              <span>HRV_INDEX: 72ms</span>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 font-mono-telemetry">
            <div className="p-3 bg-gray-950/50 border border-border rounded-xl">
              <span className="text-[10px] text-gray-500 block">HEART RATE</span>
              <p className="text-lg font-bold text-gray-200 mt-1">
                {activePatient.vitals[activePatient.vitals.length-1].heartRate} <span className="text-xs text-gray-500 font-normal">bpm</span>
              </p>
            </div>
            <div className="p-3 bg-gray-950/50 border border-border rounded-xl">
              <span className="text-[10px] text-gray-500 block">BLOOD PRESSURE</span>
              <p className="text-lg font-bold text-gray-200 mt-1">
                {activePatient.vitals[activePatient.vitals.length-1].systolicBp}/{activePatient.vitals[activePatient.vitals.length-1].diastolicBp} <span className="text-xs text-gray-500 font-normal">mmHg</span>
              </p>
            </div>
            <div className="p-3 bg-gray-950/50 border border-border rounded-xl">
              <span className="text-[10px] text-gray-500 block">OXYGEN SAT (SpO2)</span>
              <p className={`text-lg font-bold mt-1 ${
                activePatient.vitals[activePatient.vitals.length-1].spO2 < 93 ? "text-rose-500 glow-text-critical animate-pulse" : "text-gray-200"
              }`}>
                {activePatient.vitals[activePatient.vitals.length-1].spO2}%
              </p>
            </div>
            <div className="p-3 bg-gray-950/50 border border-border rounded-xl">
              <span className="text-[10px] text-gray-500 block">STRESS / SLEEP</span>
              <p className="text-lg font-bold text-gray-200 mt-1">
                {activePatient.vitals[activePatient.vitals.length-1].stressLevel} <span className="text-xs text-gray-500 font-normal">/ {activePatient.vitals[activePatient.vitals.length-1].sleepHours}h</span>
              </p>
            </div>
          </div>
        </div>

        {/* Treatment Simulation Sandbox */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">AI TREATMENT SIMULATOR</h3>
          </div>

          <form onSubmit={handleSimSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-[11px] text-gray-500 font-mono mb-1">INTERVENTION TYPE</label>
                <select
                  value={intervention}
                  onChange={e => setIntervention(e.target.value)}
                  className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="drug_adjustment">Pharmacological Adjustment</option>
                  <option value="exercise_program">Aerobic Cardiac Loading</option>
                </select>
              </div>

              {intervention === "drug_adjustment" ? (
                <div>
                  <label className="block text-[11px] text-gray-500 font-mono mb-1">BETA BLOCKER TITRATION</label>
                  <select
                    value={dosageChange}
                    onChange={e => setDosageChange(e.target.value)}
                    className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="increase">Increase Dosage (Carvedilol 25mg)</option>
                    <option value="add_new">Add ACE Inhibitor (Lisinopril 10mg)</option>
                    <option value="decrease">Hold Dosage (Toxicity concern)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-gray-500 font-mono mb-1">DAYS PER WEEK</label>
                  <select
                    value={exerciseDays}
                    onChange={e => setExerciseDays(e.target.value)}
                    className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="3">3 Days (30 min / 3000 steps)</option>
                    <option value="5">5 Days (45 min / 5000 steps)</option>
                    <option value="7">Daily cardiac rehabilitation</option>
                  </select>
                </div>
              )}

            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/20 transition"
            >
              Run Physiological Projection
            </button>
          </form>

          {/* Simulation Output Dashboard */}
          {activePatient.simulations.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 animate-slide-up">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-indigo-400 font-mono">SIMULATION PROJECTION RESULTS</span>
                <span className="text-[9px] text-gray-500 font-mono">T_DELTA: +30 Days</span>
              </div>
              <div className="grid grid-cols-3 gap-3 my-2">
                <div className="text-center bg-black/40 p-2 rounded-lg border border-border/40">
                  <span className="text-[9px] text-gray-500 font-mono block">PROJECTED HEALTH</span>
                  <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{activePatient.simulations[0].projectedHealthScore}%</p>
                </div>
                <div className="text-center bg-black/40 p-2 rounded-lg border border-border/40">
                  <span className="text-[9px] text-gray-500 font-mono block">EFFICACY RATING</span>
                  <p className="text-lg font-bold text-indigo-400 font-mono mt-0.5">{Math.round(activePatient.simulations[0].efficacyRating * 100)}%</p>
                </div>
                <div className="text-center bg-black/40 p-2 rounded-lg border border-border/40 font-mono-telemetry">
                  <span className="text-[9px] text-gray-500 font-mono block">PROJECTED EF INDEX</span>
                  <p className="text-lg font-bold text-sky-400 mt-0.5">
                    {Math.round(35 + (activePatient.simulations[0].projectedHealthScore * 0.18) + (activePatient.simulations[0].efficacyRating * 5))}%
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-2 italic">
                "{activePatient.simulations[0].notes}"
              </p>
            </div>
          )}
        </div>

        {/* OCR Ingest Panel */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">MEDICAL OCR INGESTION</h3>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[11px] text-gray-500 font-mono">PASTE LAB TRANSCRIPT OR SELECT PRESET</label>
            <div className="flex gap-2 mb-1">
              {ocrPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setOcrText(preset.text)}
                  className="text-[10px] bg-gray-900 border border-border hover:bg-gray-800 text-gray-300 py-1 px-2.5 rounded-lg transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <textarea
              value={ocrText}
              onChange={e => setOcrText(e.target.value)}
              placeholder="Paste raw laboratory analysis transcript here..."
              rows={3}
              className="w-full bg-gray-950 border border-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />

            <button
              onClick={handleOCRSubmit}
              disabled={!ocrText}
              className="w-full py-2 bg-indigo-900/60 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition border border-indigo-700/40"
            >
              Parse Lab Report via OCR AI
            </button>
          </div>
        </div>

      </div>

      {/* 3. RIGHT COLUMN: XAI Predictions & Copilot Chat */}
      <div className="lg:col-span-1 flex flex-col gap-6 max-h-[820px] overflow-y-auto pr-1">
        
        {/* Explainable AI Prediction Panel */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">EXPLAINABLE RISK ENGINE</h3>
            <span className="text-[10px] text-indigo-400 font-mono">PROJECTION_MODEL_XAI</span>
          </div>

          {activePatient.predictions.map(pred => (
            <div key={pred.id} className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">PROJECTED RISK LEVEL</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  pred.riskLevel === "CRITICAL" ? "bg-rose-950 text-rose-400" : pred.riskLevel === "HIGH" ? "bg-orange-950 text-orange-400" : "bg-emerald-950 text-emerald-400"
                }`}>
                  {pred.riskLevel} ({Math.round(pred.probability * 100)}%)
                </span>
              </div>

              {/* Explanations */}
              <div className="p-3 bg-gray-950 rounded-lg border border-border mt-1">
                <p className="text-[10px] text-gray-500 font-mono mb-1">CLINICAL EXPLANATION JUSTIFICATION</p>
                <p className="text-xs text-gray-300 leading-relaxed font-mono-telemetry">{pred.explanation}</p>
              </div>

              {/* Action recommendations */}
              <div className="p-3 bg-indigo-950/20 border border-indigo-900/60 rounded-lg">
                <p className="text-[10px] text-indigo-400 font-mono mb-1">DYNAMIC TREATMENT RECOMMENDATIONS</p>
                <p className="text-xs text-gray-300 leading-relaxed font-mono-telemetry">{pred.suggestions}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Multi-Agent AI Specialist Board Simulator */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">MULTI-AGENT SPECIALIST BOARD</h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900/50">94% Consensus</span>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="p-3 bg-gray-950/60 border border-indigo-900/40 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-indigo-300 text-[11px]">🫀 CARDIOLOGIST AI</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">VOTE: APPROVE</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-mono-telemetry">
                "Recommend 25% Metoprolol titration. Cardiac workload strain diminished; telemetry shows baseline rhythm stability."
              </p>
            </div>

            <div className="p-3 bg-gray-950/60 border border-amber-900/40 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-300 text-[11px]">🫘 NEPHROLOGIST AI</span>
                <span className="text-[9px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded">VOTE: MONITOR</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-mono-telemetry">
                "Monitor serum K+ electrolytes. eGFR clearance stable at 88 mL/min; maintain Lisinopril hold if K+ exceeds 5.2 mEq/L."
              </p>
            </div>

            <div className="p-3 bg-gray-950/60 border border-sky-900/40 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sky-300 text-[11px]">💊 PHARMACIST AI</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">VOTE: APPROVE</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-mono-telemetry">
                "PGx check: CYP2D6 slow metabolizer status verified. Titrate in micro-doses to avoid cumulative accumulation."
              </p>
            </div>
          </div>
        </div>

        {/* AI Clinical Scribe & SOAP Note Synthesizer */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">AI CLINICAL SCRIBE (SOAP & ICD-10)</h3>
            <span className="text-[10px] text-indigo-400 font-mono">FHIR_R4_FORMAT</span>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="p-3 bg-gray-950/80 border border-border rounded-xl flex flex-col gap-2">
              <div className="text-[10px] text-indigo-400 font-bold flex justify-between">
                <span>SOAP NOTE SYNTHESIS ({activePatient.fullName})</span>
                <span>ICD-10: I50.9</span>
              </div>
              <div className="text-[10.5px] text-gray-300 leading-relaxed font-mono-telemetry flex flex-col gap-1.5">
                <p><strong className="text-emerald-400">S (Subjective):</strong> Patient reports mild exertional dyspnea. Denies nocturnal orthopnea.</p>
                <p><strong className="text-indigo-400">O (Objective):</strong> HR 72 bpm, BP 120/80 mmHg, SpO2 98%, eGFR 88 mL/min.</p>
                <p><strong className="text-amber-400">A (Assessment):</strong> Compensated CHF (I50.9) with stable PGx metabolism.</p>
                <p><strong className="text-sky-400">P (Plan):</strong> Continue Metoprolol 25mg, telemetry monitoring daily.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFhirExported(true);
                setTimeout(() => setFhirExported(false), 2500);
              }}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{fhirExported ? "FHIR R4 Bundle Exported!" : "Export FHIR R4 Clinical Bundle"}</span>
            </button>
          </div>
        </div>

        {/* AI Clinical Copilot Chat */}
        <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col min-h-[380px] overflow-hidden relative border border-indigo-500/30">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold font-mono tracking-wider text-indigo-400">DOCTOR COPILOT AI</h3>
              <span className="text-[10px] text-gray-500 font-mono">ACTIVE SESS: CHEN_MD</span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsCopilotExpanded(true)}
              className="flex items-center gap-1 text-[10px] bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 px-2 py-1 rounded-lg font-mono transition shadow-sm"
              title="Expand Copilot to Full Screen"
            >
              <Maximize2 className="w-3 h-3" />
              <span>EXPAND VIEW</span>
            </button>
          </div>

          {/* Quick Command presets */}
          <div className="flex flex-col gap-1.5 mb-3">
            <span className="text-[9px] text-gray-500 font-mono">COPILOT QUICK ACTIONS</span>
            <div className="flex flex-wrap gap-1.5">
              <button 
                onClick={() => handleCopilotSend("Draft clinical summary note")}
                className="text-[9.5px] bg-gray-900 border border-border hover:bg-gray-800 hover:border-gray-500 py-1 px-2 rounded-lg text-gray-300 transition"
              >
                Draft Notes
              </button>
              <button 
                onClick={() => handleCopilotSend("Explain Potassium anomaly")}
                className="text-[9.5px] bg-gray-900 border border-border hover:bg-gray-800 hover:border-gray-500 py-1 px-2 rounded-lg text-gray-300 transition"
              >
                Explain Labs
              </button>
              <button 
                onClick={() => handleCopilotSend("Analyze adherence drops")}
                className="text-[9.5px] bg-gray-900 border border-border hover:bg-gray-800 hover:border-gray-500 py-1 px-2 rounded-lg text-gray-300 transition"
              >
                Analyze Adherence
              </button>
            </div>
          </div>

          {/* Chat Logs */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 my-2 text-xs border border-border/50 rounded-xl p-3 bg-black/20 min-h-[160px]">
            {chatLog.map((chat, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 rounded-xl leading-relaxed ${
                  chat.sender === "ai" 
                    ? "bg-indigo-950/40 text-indigo-200 border border-indigo-900/40 text-[11px]" 
                    : "bg-gray-900 text-gray-200 text-right self-end max-w-[85%]"
                }`}
                style={{ whiteSpace: "pre-line" }}
              >
                {chat.text}
              </div>
            ))}
          </div>

          {/* Chat Inputs */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Ask Copilot a question..."
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCopilotSend()}
              className="flex-1 bg-gray-950 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
            />
            <button
              onClick={() => handleCopilotSend()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* --- EXPANDED FULL-SCREEN COPILOT AI MODAL --- */}
      {isCopilotExpanded && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 p-4 md:p-8 flex items-center justify-center animate-scale-in">
          <div className="glass-panel w-full max-w-4xl h-full max-h-[85vh] rounded-3xl border border-indigo-500/50 p-6 flex flex-col justify-between shadow-2xl relative">
            
            {/* Expanded Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-950 border border-indigo-500/40 rounded-xl text-indigo-400">
                  <Activity className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    SENTINEL CLINICAL COPILOT AI
                    <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900/50">EXPANDED INTERACTION MODE</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Review telemetry models, draft clinical notes, query PGx drug matrices & run simulations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCopilotExpanded(false)}
                className="p-2 bg-gray-900 hover:bg-gray-800 border border-border text-gray-300 rounded-xl transition flex items-center gap-1 text-xs font-mono"
              >
                <Minimize2 className="w-4 h-4" />
                <span>EXIT FULLSCREEN</span>
              </button>
            </div>

            {/* Expanded Quick Actions */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-400 font-mono">QUICK ACTIONS:</span>
              <button 
                onClick={() => handleCopilotSend("Draft clinical summary note")}
                className="text-xs bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900 text-indigo-300 py-1.5 px-3 rounded-xl transition font-mono"
              >
                📝 Draft SOAP Summary Note
              </button>
              <button 
                onClick={() => handleCopilotSend("Explain Potassium anomaly")}
                className="text-xs bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900 text-indigo-300 py-1.5 px-3 rounded-xl transition font-mono"
              >
                🧪 Explain Lab Anomaly
              </button>
              <button 
                onClick={() => handleCopilotSend("Analyze adherence drops")}
                className="text-xs bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900 text-indigo-300 py-1.5 px-3 rounded-xl transition font-mono"
              >
                💊 Analyze Medication Adherence
              </button>
            </div>

            {/* Expanded Chat Log Window */}
            <div className="flex-1 bg-black/40 border border-border/80 rounded-2xl p-5 overflow-y-auto space-y-4 text-sm font-mono-telemetry mb-4">
              {chatLog.map((chat, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl leading-relaxed ${
                    chat.sender === "ai"
                      ? "bg-indigo-950/50 text-indigo-100 border border-indigo-800/50 text-sm max-w-[90%]"
                      : "bg-indigo-600 text-white font-semibold self-end text-right ml-auto max-w-[80%]"
                  }`}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {chat.text}
                </div>
              ))}
            </div>

            {/* Expanded Input Controls */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ask Copilot any clinical question or request a note draft..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCopilotSend()}
                className="flex-1 bg-gray-950 border border-indigo-500/40 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-400 font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleCopilotSend()}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition flex items-center gap-2 text-sm shadow-lg shadow-indigo-950/50"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
