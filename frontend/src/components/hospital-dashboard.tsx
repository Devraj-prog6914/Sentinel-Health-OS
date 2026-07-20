"use client";

import React, { useState } from "react";
import { useSentinelStore, Bed } from "../store/store";
import { 
  Shield, 
  Activity, 
  Users, 
  Layers, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Truck,
  Plus,
  Minus,
  Sparkles,
  X,
  Check,
  RotateCcw,
  UserPlus,
  ArrowRight
} from "lucide-react";

export default function HospitalDashboard() {
  const { 
    beds, 
    patients, 
    updateBedStatus, 
    addEmergencyBed, 
    sanitizeAllCleaningBeds 
  } = useSentinelStore();

  // Local Interactive States
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [bedFilter, setBedFilter] = useState<"all" | "available" | "occupied" | "cleaning">("all");
  const [selectedAmbulance, setSelectedAmbulance] = useState<{
    id: string;
    eta: number;
    vitals: string;
    condition: string;
    route: string;
  } | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  // Resource Counters State
  const [ventilatorsInUse, setVentilatorsInUse] = useState(14);
  const [nursesOnShift, setNursesOnShift] = useState(42);
  const [ambulancesDeployed, setAmbulancesDeployed] = useState(3);

  // Compute live occupancy metrics
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === "occupied").length;
  const cleaningBeds = beds.filter(b => b.status === "cleaning").length;
  const availableBeds = totalBeds - occupiedBeds - cleaningBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Department groupings
  const departments = ["ICU", "Cardiology", "Pulmonology", "Neurology", "General Ward", "Emergency Care"] as const;

  const getStatusColor = (status: "occupied" | "available" | "cleaning") => {
    switch (status) {
      case "occupied": return "bg-rose-500/25 border-rose-500/50 text-rose-300 hover:border-rose-400";
      case "cleaning": return "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:border-amber-400";
      case "available": return "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:border-emerald-400";
    }
  };

  const showFeedback = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(""), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 relative">
      
      {/* LEFT COLUMN: Macro Metrics & AI Operational Controls */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Occupancy HUD Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-3 left-3 bg-sky-950/40 border border-sky-900/60 py-0.5 px-2 rounded-full text-[10px] font-mono text-sky-400">
            METRIC: CAPACITY_CORE
          </div>
          
          <h3 className="text-xs font-bold text-gray-500 mt-6 tracking-widest text-center">OVERALL OCCUPANCY RATE</h3>
          
          <div className="flex flex-col items-center justify-center my-6 relative">
            <span className="text-6xl font-extrabold font-mono-telemetry tracking-tighter text-white">
              {occupancyRate}%
            </span>
            <span className="text-xs text-gray-400 font-mono mt-1">CAPACITY IN USE</span>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{occupiedBeds} / {totalBeds} BEDS OCCUPIED</p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center text-xs">
            <button 
              onClick={() => setBedFilter("available")}
              className={`p-2 rounded-lg border transition ${
                bedFilter === "available" ? "bg-emerald-950 border-emerald-400" : "bg-emerald-950/20 border-emerald-900/50"
              }`}
            >
              <p className="text-gray-500 text-[10px]">AVAILABLE</p>
              <p className="font-bold text-emerald-400 mt-0.5 font-mono">{availableBeds}</p>
            </button>
            <button 
              onClick={() => setBedFilter("occupied")}
              className={`p-2 rounded-lg border transition ${
                bedFilter === "occupied" ? "bg-rose-950 border-rose-400" : "bg-rose-950/20 border-rose-900/50"
              }`}
            >
              <p className="text-gray-500 text-[10px]">OCCUPIED</p>
              <p className="font-bold text-rose-400 mt-0.5 font-mono">{occupiedBeds}</p>
            </button>
            <button 
              onClick={() => setBedFilter("cleaning")}
              className={`p-2 rounded-lg border transition ${
                bedFilter === "cleaning" ? "bg-amber-950 border-amber-400" : "bg-amber-950/20 border-amber-900/50"
              }`}
            >
              <p className="text-gray-500 text-[10px]">CLEANING</p>
              <p className="font-bold text-amber-400 mt-0.5 font-mono">{cleaningBeds}</p>
            </button>
          </div>
        </div>

        {/* Quick Operational Commands */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">QUICK CAPACITY ACTIONS</h3>
            <span className="text-[10px] text-emerald-400 font-mono">LIVE_COMMANDS</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                addEmergencyBed("ICU");
                showFeedback("Added 1 Emergency ICU Bed into Matrix!");
              }}
              className="py-2.5 px-3 bg-sky-950/60 hover:bg-sky-900 border border-sky-800/60 text-sky-300 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add ICU Bed</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sanitizeAllCleaningBeds();
                showFeedback("All Cleaning Beds Sanitized & Made Available!");
              }}
              className="py-2.5 px-3 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sanitize All Beds</span>
            </button>
          </div>

          {actionSuccessMsg && (
            <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/50 text-emerald-400 text-[11px] rounded-xl font-mono text-center animate-scale-in">
              {actionSuccessMsg}
            </div>
          )}
        </div>

        {/* AI Operational Insights & Interactive Resource Controls */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <Shield className="w-5 h-5 text-sky-500" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">AI CAPACITY ADVISOR</h3>
          </div>

          <div className="flex flex-col gap-4">
            {occupancyRate >= 78 ? (
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-400 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 animate-pulse mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold uppercase tracking-wider">ICU OVERCROWD WARNING ACTIVE</p>
                  <p className="text-gray-400 mt-1 leading-relaxed">
                    Bed occupancy at {occupancyRate}% exceeds safe buffer margins. AI projects a 42% chance of emergency ward overflow in the next 12 hours.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <div className="text-xs">
                  <p className="font-bold uppercase tracking-wider">CAPACITY STATUS: OPTIMAL</p>
                  <p className="text-gray-400 mt-1 leading-relaxed">
                    Overall bed buffer maintained at {100 - occupancyRate}%. Staff ratios align with telemetry demands.
                  </p>
                </div>
              </div>
            )}

            {/* Interactive Staff & Resource Logistics */}
            <div className="bg-gray-950/50 p-4 rounded-xl border border-border flex flex-col gap-3 text-xs font-mono">
              <span className="text-[10px] text-indigo-400 font-bold">RESOURCE LOGISTICS CONTROLS</span>
              
              {/* Ventilators */}
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-gray-400">VENTILATORS IN USE</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setVentilatorsInUse(v => Math.max(0, v - 1))}
                    className="p-1 bg-gray-900 border border-border rounded hover:bg-gray-800 text-gray-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-gray-200 w-12 text-center">{ventilatorsInUse} / 20</span>
                  <button 
                    onClick={() => setVentilatorsInUse(v => Math.min(20, v + 1))}
                    className="p-1 bg-gray-900 border border-border rounded hover:bg-gray-800 text-gray-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Nurses */}
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-gray-400">NURSES ON SHIFT</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setNursesOnShift(n => Math.max(0, n - 1))}
                    className="p-1 bg-gray-900 border border-border rounded hover:bg-gray-800 text-gray-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-gray-200 w-12 text-center">{nursesOnShift} / 50</span>
                  <button 
                    onClick={() => setNursesOnShift(n => Math.min(50, n + 1))}
                    className="p-1 bg-gray-900 border border-border rounded hover:bg-gray-800 text-gray-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Ambulances */}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">AMBULANCES DEPLOYED</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setAmbulancesDeployed(a => Math.max(0, a - 1))}
                    className="p-1 bg-gray-900 border border-border rounded hover:bg-gray-800 text-gray-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-gray-200 w-12 text-center">{ambulancesDeployed} / 8</span>
                  <button 
                    onClick={() => setAmbulancesDeployed(a => Math.min(8, a + 1))}
                    className="p-1 bg-gray-900 border border-border rounded hover:bg-gray-800 text-gray-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Predictive Length of Stay (LOS) & Readmission Risk Engine */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">PREDICTIVE LOS & READMISSION ENGINE</h3>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="p-3 bg-gray-950/50 border border-border rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-200 font-bold">AVG LENGTH OF STAY (LOS)</span>
                <span className="text-indigo-400 font-bold">3.4 Days</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-mono-telemetry">
                AI projects 8 bed turnover discharges in the next 24 hours based on vital stability and lab clearances.
              </p>
            </div>

            <div className="p-3 bg-gray-950/50 border border-border rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-200 font-bold">30-DAY READMISSION RISK</span>
                <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded">4.2% (LOW)</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-mono-telemetry">
                Digital twin remote telemetry reduces post-discharge readmission likelihood by 68%.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Live Ambulance Routing */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <Truck className="w-5 h-5 text-sky-500 animate-pulse" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">AMBULANCE IN-TRANSIT METRIC</h3>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { id: "AMB-12", eta: 8, vitals: "HR 124, SpO2 90%", condition: "Cardiac Arrest", route: "South Hwy -> Sentinel ER" },
              { id: "AMB-04", eta: 14, vitals: "HR 88, SpO2 93%", condition: "Respiratory Distress", route: "Metro Ave -> Sentinel General" }
            ].map(amb => (
              <div 
                key={amb.id} 
                onClick={() => setSelectedAmbulance(amb)}
                className="p-3 bg-gray-950/40 border border-border hover:border-sky-500/50 rounded-xl flex flex-col gap-1.5 text-xs cursor-pointer transition group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-200 group-hover:text-sky-400 transition">{amb.id} • {amb.condition}</span>
                  <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-950/50 border border-rose-900/40 px-2 py-0.5 rounded">
                    ETA: {amb.eta} MIN
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>Vitals: <strong className="text-gray-300">{amb.vitals}</strong></span>
                  <span>{amb.route}</span>
                </div>
                <div className="w-full bg-gray-950 rounded-full h-1 mt-1">
                  <div 
                    className="bg-rose-500 h-1 rounded-full animate-pulse" 
                    style={{ width: `${Math.max(10, 100 - (amb.eta * 6))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT MAIN AREA: Interactive Bed allocation map */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col max-h-[880px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-border pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-500" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">INTERACTIVE BED ALLOCATION MAP</h3>
          </div>

          {/* Interactive Bed Filter Switcher */}
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="text-gray-500 mr-1">FILTER:</span>
            {[
              { id: "all", label: `ALL (${totalBeds})` },
              { id: "available", label: `AVAILABLE (${availableBeds})` },
              { id: "occupied", label: `OCCUPIED (${occupiedBeds})` },
              { id: "cleaning", label: `CLEANING (${cleaningBeds})` }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setBedFilter(f.id as any)}
                className={`py-1 px-2.5 rounded-lg border font-bold transition ${
                  bedFilter === f.id
                    ? "bg-sky-600 text-white border-sky-400"
                    : "bg-gray-950/60 border-border text-gray-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Layout Matrix grouped by Department */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6">
          {departments.map(dept => {
            const allDeptBeds = beds.filter(b => b.department === dept);
            const filteredDeptBeds = allDeptBeds.filter(b => bedFilter === "all" || b.status === bedFilter);
            const occupiedCount = allDeptBeds.filter(b => b.status === "occupied").length;
            
            if (filteredDeptBeds.length === 0 && bedFilter !== "all") return null;

            return (
              <div key={dept} className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-border/40 pb-1">
                  <span className="text-xs font-bold text-gray-300 font-mono tracking-wide">{dept.toUpperCase()}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {occupiedCount} / {allDeptBeds.length} Occupied
                  </span>
                </div>

                {/* Grid layout of department beds */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredDeptBeds.map(bed => (
                    <div 
                      key={bed.id} 
                      onClick={() => setSelectedBed(bed)}
                      className={`p-2.5 rounded-xl border text-center transition duration-200 relative cursor-pointer shadow-sm group ${getStatusColor(bed.status)}`}
                      title="Click to manage bed status or assign patient"
                    >
                      <span className="text-[9.5px] font-mono block text-gray-400 group-hover:text-white transition">{bed.roomNumber}</span>
                      <span className="text-[10.5px] font-bold block mt-0.5">{bed.bedNumber}</span>
                      <span className="text-[8px] font-mono uppercase tracking-wider block mt-1.5 px-1 bg-black/20 rounded font-bold">
                        {bed.status}
                      </span>
                      {bed.patientName && (
                        <div className="mt-1 border-t border-white/5 pt-1">
                          <span className="text-[8.5px] text-white block truncate leading-tight font-semibold" title={bed.patientName}>
                            {bed.patientName.split(" ")[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- POP-UP MODAL: INTERACTIVE BED DETAIL & MANAGEMENT --- */}
      {selectedBed && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-scale-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-sky-500/40 shadow-2xl relative flex flex-col items-center">
            
            {/* Header */}
            <div className="flex items-center justify-between w-full border-b border-border/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <h3 className="font-extrabold text-base text-white">
                  BED CONTROL & LOGISTICS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBed(null)}
                className="p-1 rounded-lg bg-gray-900 border border-border text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bed Metadata Card */}
            <div className="w-full bg-gray-950/80 border border-border rounded-2xl p-4 flex flex-col gap-2 font-mono text-xs mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">DEPARTMENT:</span>
                <span className="font-bold text-sky-300">{selectedBed.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">ROOM & BED:</span>
                <span className="font-bold text-white">{selectedBed.roomNumber} • {selectedBed.bedNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">CURRENT STATUS:</span>
                <span className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                  selectedBed.status === "occupied" ? "bg-rose-950 text-rose-400 border border-rose-900" :
                  selectedBed.status === "cleaning" ? "bg-amber-950 text-amber-400 border border-amber-900" :
                  "bg-emerald-950 text-emerald-400 border border-emerald-900"
                }`}>
                  {selectedBed.status}
                </span>
              </div>
              {selectedBed.patientName && (
                <div className="flex justify-between items-center border-t border-border/50 pt-2 mt-1">
                  <span className="text-gray-400">ASSIGNED PATIENT:</span>
                  <span className="font-bold text-emerald-300">{selectedBed.patientName}</span>
                </div>
              )}
            </div>

            {/* Change Bed Status Controls */}
            <div className="w-full flex flex-col gap-2 mb-4">
              <label className="text-[10px] text-gray-400 font-mono">CHANGE BED STATUS:</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    updateBedStatus(selectedBed.id, "available");
                    setSelectedBed(null);
                    showFeedback(`Bed ${selectedBed.bedNumber} set to AVAILABLE!`);
                  }}
                  className="py-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold transition"
                >
                  Available
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateBedStatus(selectedBed.id, "occupied");
                    setSelectedBed(null);
                    showFeedback(`Bed ${selectedBed.bedNumber} marked OCCUPIED!`);
                  }}
                  className="py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl font-bold transition"
                >
                  Occupied
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateBedStatus(selectedBed.id, "cleaning");
                    setSelectedBed(null);
                    showFeedback(`Bed ${selectedBed.bedNumber} set to CLEANING!`);
                  }}
                  className="py-2 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded-xl font-bold transition"
                >
                  Cleaning
                </button>
              </div>
            </div>

            {/* Assign Patient Dropdown */}
            <div className="w-full flex flex-col gap-2 mb-5">
              <label className="text-[10px] text-gray-400 font-mono">ASSIGN PATIENT TO THIS BED:</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    updateBedStatus(selectedBed.id, "occupied", e.target.value);
                    setSelectedBed(null);
                    showFeedback(`Assigned ${e.target.value} to ${selectedBed.bedNumber}!`);
                  }
                }}
                className="w-full bg-gray-950 border border-border rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              >
                <option value="">-- Select Patient to Assign --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.fullName}>{p.fullName} (ID: {p.id})</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBed(null)}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 border border-border text-gray-300 rounded-xl text-xs font-bold font-mono transition"
            >
              Close Window
            </button>

          </div>
        </div>
      )}

      {/* --- POP-UP MODAL: AMBULANCE TELEMETRY MODAL --- */}
      {selectedAmbulance && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-scale-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-rose-500/40 shadow-2xl relative flex flex-col items-center">
            
            <div className="flex items-center justify-between w-full border-b border-border/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-rose-400 animate-pulse" />
                <h3 className="font-extrabold text-base text-white">
                  AMBULANCE IN-TRANSIT TELEMETRY
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAmbulance(null)}
                className="p-1 rounded-lg bg-gray-900 border border-border text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full bg-gray-950/80 border border-border rounded-2xl p-4 flex flex-col gap-2 font-mono text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-gray-400">AMBULANCE ID:</span>
                <span className="font-bold text-rose-400">{selectedAmbulance.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CONDITION:</span>
                <span className="font-bold text-white">{selectedAmbulance.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ESTIMATED ETA:</span>
                <span className="font-bold text-rose-300">{selectedAmbulance.eta} MINUTES</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TELEMETRY VITALS:</span>
                <span className="font-bold text-emerald-400">{selectedAmbulance.vitals}</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2 mt-1">
                <span className="text-gray-400">GPS ROUTE VECTOR:</span>
                <span className="text-sky-300">{selectedAmbulance.route}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                addEmergencyBed("Emergency Care");
                setSelectedAmbulance(null);
                showFeedback(`Emergency ER Bay Reserved for ${selectedAmbulance.id}!`);
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Acknowledge Arrival & Prepare ER Bay</span>
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
