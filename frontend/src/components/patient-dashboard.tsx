"use client";

import React, { useState } from "react";
import { useSentinelStore, VitalSign } from "../store/store";
import { 
  Heart, 
  Activity, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Mic, 
  PlusCircle, 
  QrCode, 
  Smartphone,
  Info,
  Clock,
  X
} from "lucide-react";

export default function PatientDashboard() {
  const { 
    patients, 
    activePatientId, 
    addVitals, 
    submitVoiceJournal, 
    triggerEmergencyAlert, 
    isOffline 
  } = useSentinelStore();

  const patient = patients.find(p => p.id === activePatientId) || patients[0];

  // Forms State
  const [heartRate, setHeartRate] = useState("72");
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [spO2, setSpO2] = useState("98");
  const [temp, setTemp] = useState("36.7");
  const [stress, setStress] = useState("3");
  const [sleep, setSleepHours] = useState("7.5");
  const [steps, setSteps] = useState("8000");

  const [voiceText, setVoiceText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [waterCount, setWaterCount] = useState(3);
  const [moodVal, setMoodVal] = useState(7);
  const [selectedOrgan, setSelectedOrgan] = useState<"heart" | "lungs" | "kidney" | "brain">("heart");

  // Preset voice transcripts for seeder triggers
  const voicePresets = [
    { label: "CHF Decompensation (Crisis)", text: "I'm having real trouble breathing. I had to use three pillows to sleep last night to keep from coughing and choking. My ankles also seem really swollen." },
    { label: "Stable Baseline (Normal)", text: "I did my morning walk today. Feeling pretty good, no chest tightness, and my heart rate was stable at 72 beats per minute." }
  ];

  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVitals(patient.id, {
      heartRate: parseFloat(heartRate),
      systolicBp: parseFloat(systolic),
      diastolicBp: parseFloat(diastolic),
      spO2: parseFloat(spO2),
      temperature: parseFloat(temp),
      sleepHours: parseFloat(sleep),
      moodRating: 8,
      stressLevel: parseFloat(stress),
      steps: parseInt(steps)
    });
  };

  const handleVoiceAnalyze = () => {
    if (!voiceText) return;
    setIsRecording(true);
    setTimeout(() => {
      submitVoiceJournal(patient.id, voiceText);
      setIsRecording(false);
      setVoiceText("");
    }, 1500);
  };

  const handleEmergencySOS = () => {
    if (confirm("WARNING: Instantly initiate CRITICAL EMERGENCY SOS? This dispatches responders and allocates hospital beds.")) {
      triggerEmergencyAlert(patient.id);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-risk-critical border-risk-critical/30 bg-risk-critical/10";
    if (score >= 40) return "text-risk-high border-risk-high/30 bg-risk-high/10";
    if (score >= 18) return "text-risk-medium border-risk-medium/30 bg-risk-medium/10";
    return "text-risk-low border-risk-low/30 bg-risk-low/10";
  };

  const getRiskRingColor = (score: number) => {
    if (score >= 70) return "stroke-rose-600";
    if (score >= 40) return "stroke-orange-500";
    return "stroke-emerald-500";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: Twin HUD & Actions */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Digital Health Twin Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
          
          <div className="absolute top-3 left-3 bg-indigo-950/40 border border-indigo-900/60 py-0.5 px-2 rounded-full text-[10px] font-mono text-indigo-400">
            TWIN_ID: {patient.id.toUpperCase()}
          </div>
          
          <h3 className="text-sm font-bold text-gray-400 mt-4 mb-1">DIGITAL TWIN STATUS</h3>
          <p className="text-xl font-bold text-white mb-6">{patient.fullName}</p>
          
          {/* Circular HUD Graphic */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            
            {/* Pulsing glow background */}
            <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${
              patient.riskScore >= 70 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
            }`} />

            {/* SVG HUD Rings */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Health Score Ring */}
              <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--border)" strokeWidth="6" />
              <circle 
                cx="50" cy="50" r="45" 
                fill="transparent" 
                className={getRiskRingColor(patient.riskScore)}
                strokeWidth="6" 
                strokeDasharray="283" 
                strokeDashoffset={283 - (283 * patient.healthScore) / 100}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
              
              {/* Compliance Ring inner */}
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--border)" strokeWidth="4" />
              <circle 
                cx="50" cy="50" r="38" 
                fill="transparent" 
                stroke="#6366f1"
                strokeWidth="4" 
                strokeDasharray="238" 
                strokeDashoffset={238 - (238 * patient.complianceScore) / 100}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            
            {/* Center score values */}
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold font-mono-telemetry tracking-tighter text-white">
                {patient.healthScore}
              </span>
              <span className="text-[10px] text-gray-500 font-mono tracking-widest">HEALTH INDEX</span>
              <span className={`text-xs mt-1 font-bold px-2 py-0.5 rounded-full ${
                patient.riskScore >= 70 ? "bg-rose-950/80 text-rose-400 border border-rose-900/60" : "bg-emerald-950/80 text-emerald-400 border border-emerald-900/60"
              }`}>
                RISK: {patient.riskScore}%
              </span>
            </div>
          </div>

          {/* Micro HUD Metrics grid */}
          <div className="grid grid-cols-3 gap-3 w-full border-t border-border pt-4 text-xs">
            <div>
              <p className="text-gray-500">Recovery</p>
              <p className="font-bold text-gray-200 mt-0.5 font-mono">{patient.recoveryScore}%</p>
            </div>
            <div className="border-x border-border">
              <p className="text-gray-500">Adherence</p>
              <p className="font-bold text-indigo-400 mt-0.5 font-mono">{patient.complianceScore}%</p>
            </div>
            <div>
              <p className="text-gray-500">Wellness</p>
              <p className="font-bold text-emerald-400 mt-0.5 font-mono">{patient.mentalWellnessScore}%</p>
            </div>
          </div>

          {/* Twin Diagnostics Summary Box */}
          <div className="mt-4 p-3 rounded-lg bg-gray-950/50 border border-border w-full text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 font-mono mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>AI TWIN DIAGNOSTICS</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">{patient.twinSummary}</p>
          </div>

          {/* Passport & SOS Row */}
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            <button 
              onClick={() => setShowPassport(true)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-border text-xs font-semibold transition"
            >
              <QrCode className="w-4 h-4 text-gray-400" />
              <span>Health ID</span>
            </button>
            <button 
              onClick={handleEmergencySOS}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-400 text-xs font-semibold transition shadow-neon-pulse"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>SOS EMERGENCY</span>
            </button>
          </div>
        </div>

        {/* Interactive Anatomic Organ Digital Twin Visualizer */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">ANATOMIC ORGAN TWIN</h3>
            <span className="text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-900/50">Multi-System Visualizer</span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Organ Selectors */}
            <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
              {[
                { id: "heart", label: "HEART", color: "text-rose-400 border-rose-500/40 bg-rose-950/30" },
                { id: "lungs", label: "LUNGS", color: "text-sky-400 border-sky-500/40 bg-sky-950/30" },
                { id: "kidney", label: "KIDNEYS", color: "text-amber-400 border-amber-500/40 bg-amber-950/30" },
                { id: "brain", label: "BRAIN", color: "text-indigo-400 border-indigo-500/40 bg-indigo-950/30" }
              ].map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOrgan(o.id as any)}
                  className={`py-1.5 px-1 rounded-lg border text-center font-bold transition ${
                    selectedOrgan === o.id ? o.color : "bg-gray-950/40 border-border text-gray-400 hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Organ System Detail Card */}
            <div className="p-4 rounded-xl bg-gray-950/50 border border-border flex flex-col gap-2 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="font-bold text-gray-200 uppercase tracking-wider">{selectedOrgan} SYSTEM STATUS</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900/50">STRESS: NORMAL</span>
              </div>

              {selectedOrgan === "heart" && (
                <div className="flex flex-col gap-1.5 text-[11px] text-gray-300">
                  <div className="flex justify-between"><span>CARDIAC WORKLOAD</span><span className="font-bold text-rose-400">72 BPM (NORMAL)</span></div>
                  <div className="flex justify-between"><span>LVEF PROJECTION</span><span className="font-bold text-indigo-400">55%</span></div>
                  <div className="flex justify-between"><span>MYOCARDIAL STRAIN</span><span className="text-emerald-400">LOW</span></div>
                </div>
              )}

              {selectedOrgan === "lungs" && (
                <div className="flex flex-col gap-1.5 text-[11px] text-gray-300">
                  <div className="flex justify-between"><span>OXYGEN SATURATION</span><span className="font-bold text-sky-400">98% SpO2</span></div>
                  <div className="flex justify-between"><span>PULMONARY EFFUSION</span><span className="text-emerald-400">NONE DETECTED</span></div>
                  <div className="flex justify-between"><span>ORTHOPNEA INDEX</span><span className="text-gray-400">GRADE 0</span></div>
                </div>
              )}

              {selectedOrgan === "kidney" && (
                <div className="flex flex-col gap-1.5 text-[11px] text-gray-300">
                  <div className="flex justify-between"><span>ESTIMATED GFR</span><span className="font-bold text-amber-400">88 mL/min</span></div>
                  <div className="flex justify-between"><span>SERUM CREATININE</span><span className="text-gray-300">1.1 mg/dL</span></div>
                  <div className="flex justify-between"><span>K+ ELECTROLYTE</span><span className="text-emerald-400">4.1 mEq/L</span></div>
                </div>
              )}

              {selectedOrgan === "brain" && (
                <div className="flex flex-col gap-1.5 text-[11px] text-gray-300">
                  <div className="flex justify-between"><span>VAGAL TONE HARMONIC</span><span className="font-bold text-indigo-400">ACTIVE</span></div>
                  <div className="flex justify-between"><span>COGNITIVE STRESS INDEX</span><span className="text-emerald-400">3 / 10</span></div>
                  <div className="flex justify-between"><span>SLEEP SYNC METRIC</span><span className="text-gray-300">7.5 Hours</span></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pharmacogenomics (PGx) Gene-Drug Risk Matrix */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">PHARMACOGENOMICS (PGx) PROFILER</h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900/50">DNA Sequenced</span>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="p-3 bg-gray-950/50 border border-border rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-200 text-[11px]">CYP2D6 *4/*4 VARIANT</span>
                <span className="text-[9px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-900/50">Poor Metabolizer</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Reduced enzymatic clearance of Metoprolol. Dose adjustments recommended to prevent bradycardia toxicity.
              </p>
            </div>

            <div className="p-3 bg-gray-950/50 border border-border rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-200 text-[11px]">CYP2C19 *1/*1 VARIANT</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900/50">Normal Metabolizer</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Normal active activation for antiplatelet therapy. Standard dosages effective.
              </p>
            </div>
          </div>
        </div>

        {/* Mental Wellness Tracker */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">MENTAL WELLNESS & HRV</h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900/50">Vagal Tone Active</span>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>DAILY MOOD RATING</span>
                <span className="font-mono font-bold text-emerald-400">{moodVal}/10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={moodVal} 
                onChange={e => setMoodVal(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-950/50 border border-border p-3 rounded-xl font-mono text-xs">
              <div>
                <span className="text-[9px] text-gray-500 block">PROJECTED HRV</span>
                <span className="font-bold text-gray-200 text-sm">
                  {Math.round(40 + moodVal * 4.2 + (10 - parseFloat(stress)) * 2)} <span className="text-[10px] text-gray-500 font-normal">ms</span>
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 block">ANXIETY INDEX</span>
                <span className="font-bold text-indigo-400 text-sm">
                  {Math.max(1, Math.round((10 - moodVal) * 1.2 + parseFloat(stress) * 0.8))} / 10
                </span>
              </div>
            </div>

            <p className="text-[10.5px] text-gray-500 leading-relaxed italic">
              "HRV is dynamically projected from mood and cardiovascular stress. Stable vagal activity supports cardiac recovery."
            </p>
          </div>
        </div>

        {/* Prescription Compliance checklist */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">MEDICATION ADHERENCE</h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900/50">Active Regimen</span>
          </div>

          <div className="flex flex-col gap-3">
            {patient.medications.map(med => (
              <div key={med.id} className="p-3 rounded-xl bg-gray-950/40 border border-border flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white">{med.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{med.dosage} • {med.frequency}</p>
                  <p className="text-[9px] text-gray-600 mt-1 font-mono">RX: {med.doctorName}</p>
                </div>
                
                {/* Take Dose checkbox simulation */}
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded">TAKEN</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MIDDLE COLUMN: Wearable Vitals Log Input */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Vitals Input Form */}
        <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">BIOMETRIC WEARABLE LOG</h3>
            <span className="text-[10px] text-gray-500 font-mono">Ingest Telemetry</span>
          </div>

          <form onSubmit={handleVitalsSubmit} className="flex flex-col gap-4 flex-1 justify-between">
            <div className="grid grid-cols-2 gap-4">
              
              <div>
                <label className="block text-[11px] text-gray-500 font-mono mb-1">HEART RATE (BPM)</label>
                <input 
                  type="number" 
                  value={heartRate} 
                  onChange={e => setHeartRate(e.target.value)}
                  className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 font-mono mb-1">O2 SATURATION (SpO2 %)</label>
                <input 
                  type="number" 
                  value={spO2} 
                  onChange={e => setSpO2(e.target.value)}
                  className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 font-mono mb-1">BLOOD PRESSURE (SYS)</label>
                <input 
                  type="number" 
                  value={systolic} 
                  onChange={e => setSystolic(e.target.value)}
                  className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 font-mono mb-1">BLOOD PRESSURE (DIA)</label>
                <input 
                  type="number" 
                  value={diastolic} 
                  onChange={e => setDiastolic(e.target.value)}
                  className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 font-mono mb-1">STRESS LEVEL (1-10)</label>
                <input 
                  type="number" 
                  value={stress} 
                  onChange={e => setStress(e.target.value)}
                  className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 font-mono mb-1">SLEEP HOURS</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={sleep} 
                  onChange={e => setSleepHours(e.target.value)}
                  className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] text-gray-500 font-mono mb-1">STEPS (DAILY)</label>
                <input 
                  type="number" 
                  value={steps} 
                  onChange={e => setSteps(e.target.value)}
                  className="w-full bg-gray-950 border border-border rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/20 transition mt-4"
            >
              Ingest Biometric Telemetry
            </button>
          </form>
        </div>

        {/* Gamified Goal Board */}
        <div className="glass-panel p-6 rounded-2xl mt-6">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">REHABILITATION GOALS</h3>
            <span className="text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-900/50">Daily Progress</span>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* Steps Progress */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>DAILY WALKING TARGET</span>
                <span className="font-mono text-gray-300">{steps} / 10,000 steps</span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-1.5 border border-border">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (parseInt(steps) / 10000) * 100)}%` }}
                />
              </div>
            </div>

            {/* Water Tracker */}
            <div className="flex justify-between items-center bg-gray-950/40 border border-border p-3 rounded-xl">
              <div>
                <span className="text-[11px] text-gray-400 block">HYDRATION COUNTER</span>
                <span className="text-xs text-indigo-400 font-mono font-bold">{waterCount} / 8 Glasses</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => setWaterCount(prev => Math.max(0, prev - 1))}
                  className="w-7 h-7 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-border flex items-center justify-center font-bold text-xs"
                >
                  -
                </button>
                <button 
                  type="button"
                  onClick={() => setWaterCount(prev => Math.min(12, prev + 1))}
                  className="w-7 h-7 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded border border-border flex items-center justify-center font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Badges Achievements */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-500 font-mono">UNLOCK BADGES</span>
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-2 rounded-lg border text-center text-[10px] ${
                  parseInt(steps) >= 6000 ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400" : "bg-gray-950 border-border text-gray-600"
                }`}>
                  <span className="block text-base mb-0.5">🏅</span>
                  <span>Steps</span>
                </div>
                <div className={`p-2 rounded-lg border text-center text-[10px] ${
                  waterCount >= 6 ? "bg-indigo-950/20 border-indigo-500/40 text-indigo-400" : "bg-gray-950 border-border text-gray-600"
                }`}>
                  <span className="block text-base mb-0.5">💧</span>
                  <span>Hydrate</span>
                </div>
                <div className={`p-2 rounded-lg border text-center text-[10px] ${
                  patient.complianceScore >= 80 ? "bg-sky-950/20 border-sky-500/40 text-sky-400" : "bg-gray-950 border-border text-gray-600"
                }`}>
                  <span className="block text-base mb-0.5">💊</span>
                  <span>Adherence</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Voice Journal & Timeline */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Voice symptom journal */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">VOICE HEALTH JOURNAL</h3>
            <span className="text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-900/50">Voice Analyzer AI</span>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[11px] text-gray-500 font-mono">SPEAK OR CHOOSE SCENARIO TRANSCRIPT</label>
            
            {/* Scenario dropdown selection */}
            <div className="flex flex-wrap gap-2">
              {voicePresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setVoiceText(preset.text)}
                  className="text-[10px] bg-gray-900 border border-border hover:border-gray-500 hover:bg-gray-800 text-gray-300 py-1 px-2.5 rounded-lg transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Ingest transcription box */}
            <textarea
              value={voiceText}
              onChange={e => setVoiceText(e.target.value)}
              placeholder="Record voice journal transcript here..."
              rows={4}
              className="w-full bg-gray-950 border border-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
            />

            {/* Voice Waveform Animation */}
            {isRecording && (
              <div className="flex justify-center items-center gap-1.5 h-12 bg-indigo-950/25 border border-indigo-900/35 rounded-xl animate-pulse">
                <Mic className="w-4 h-4 text-indigo-400 animate-bounce" />
                <div className="flex items-end gap-0.5 h-6">
                  <div className="w-1 bg-indigo-500 h-2 rounded animate-wave-breath" style={{ animationDelay: "0.1s" }} />
                  <div className="w-1 bg-indigo-500 h-5 rounded animate-wave-breath" style={{ animationDelay: "0.3s" }} />
                  <div className="w-1 bg-indigo-500 h-3 rounded animate-wave-breath" style={{ animationDelay: "0.5s" }} />
                  <div className="w-1 bg-indigo-500 h-6 rounded animate-wave-breath" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1 bg-indigo-500 h-4 rounded animate-wave-breath" style={{ animationDelay: "0.4s" }} />
                </div>
                <span className="text-[10px] text-indigo-400 font-mono ml-2">VOICE Telemetry Analysis running...</span>
              </div>
            )}

            {!isRecording && (
              <button
                type="button"
                onClick={handleVoiceAnalyze}
                disabled={!voiceText}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Submit Voice Journal</span>
              </button>
            )}
          </div>
        </div>

        {/* Clinical History Timeline */}
        <div className="glass-panel p-6 rounded-2xl flex-1 max-h-[350px] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">PATIENT HEALTH TIMELINE</h3>
            <span className="text-[10px] text-gray-500 font-mono">{patient.timeline.length} Events</span>
          </div>

          <div className="flex flex-col gap-4">
            {patient.timeline.map(event => (
              <div key={event.id} className="relative pl-6 border-l border-border/80 pb-1">
                {/* Bullet */}
                <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                  event.category === "emergency" 
                    ? "bg-rose-500 shadow-neon-pulse" 
                    : event.category === "ocr" || event.category === "voice_journal"
                    ? "bg-indigo-500"
                    : "bg-emerald-500"
                }`} />

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-gray-200">{event.title}</span>
                  <span className="text-[9px] text-gray-500 font-mono">{new Date(event.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{event.description}</p>
                {event.doctorName && (
                  <span className="text-[8.5px] text-gray-600 font-mono mt-1 block">Staff: {event.doctorName}</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* HEALTH PASSPORT MODAL */}
      {showPassport && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full p-6 rounded-2xl relative shadow-glass-glow animate-scale-in border border-white/10">
            <button 
              onClick={() => setShowPassport(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="bg-gradient-to-tr from-emerald-600 to-indigo-600 p-3 rounded-2xl mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white">SENTINEL HEALTH PASS</h3>
              <p className="text-xs text-indigo-400 font-mono mt-0.5">HIPAA Digital Medical Passport</p>
              
              {/* QR Code Graphic Placeholder */}
              <div className="bg-white p-4 rounded-xl my-6 flex items-center justify-center shadow-lg">
                <svg className="w-32 h-32 text-gray-950" fill="currentColor" viewBox="0 0 24 24">
                  {/* Mock beautiful SVG QR code grid */}
                  <rect x="1" y="1" width="5" height="5" />
                  <rect x="2" y="2" width="3" height="3" fill="white" />
                  <rect x="18" y="1" width="5" height="5" />
                  <rect x="19" y="2" width="3" height="3" fill="white" />
                  <rect x="1" y="18" width="5" height="5" />
                  <rect x="2" y="19" width="3" height="3" fill="white" />
                  <rect x="7" y="3" width="2" height="4" />
                  <rect x="11" y="1" width="3" height="2" />
                  <rect x="8" y="8" width="8" height="8" />
                  <rect x="10" y="10" width="4" height="4" fill="white" />
                  <rect x="1" y="10" width="4" height="2" />
                  <rect x="18" y="10" width="4" height="4" />
                  <rect x="14" y="18" width="3" height="3" />
                  <rect x="10" y="20" width="3" height="2" />
                </svg>
              </div>

              {/* Patient Core Summary info */}
              <div className="w-full bg-gray-950/80 rounded-xl p-3 border border-border text-xs text-left grid grid-cols-2 gap-2 leading-relaxed">
                <div>
                  <span className="text-gray-500 block text-[10px]">FULL NAME</span>
                  <span className="font-bold text-gray-200">{patient.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">DOB</span>
                  <span className="font-bold text-gray-200 font-mono">{patient.dob}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">BLOOD TYPE</span>
                  <span className="font-bold text-emerald-400 font-mono">{patient.bloodType}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">EMERGENCY CONTACT</span>
                  <span className="font-bold text-gray-200">{patient.emergencyContact}</span>
                </div>
                <div className="col-span-2 border-t border-border pt-1.5 mt-1">
                  <span className="text-gray-500 block text-[10px]">CLINICAL ALLERGIES</span>
                  <span className="font-bold text-rose-400">{patient.allergies}</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-600 mt-4 leading-relaxed">
                Encrypted via SHA-256 local digital key. Authorized only for licensed healthcare providers.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
