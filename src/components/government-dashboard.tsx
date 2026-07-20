"use client";

import React, { useState } from "react";
import { useSentinelStore } from "../store/store";
import { 
  Users, 
  TrendingUp, 
  Map, 
  Activity, 
  AlertTriangle,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Minimize2,
  X,
  Check,
  Package,
  Send,
  ShieldAlert,
  Sparkles
} from "lucide-react";

export default function GovernmentDashboard() {
  const { outbreaks, regions, patients } = useSentinelStore();
  
  // Local states for interactive dispatches and modals
  const [r0Val, setR0Val] = useState(1.8);
  const [dispatchStatus, setDispatchStatus] = useState("");
  const [stockLevel, setStockLevel] = useState(68);

  // Modal States
  const [selectedOutbreak, setSelectedOutbreak] = useState<{
    name: string;
    cases: number;
    trend: string;
    color: string;
  } | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<{
    district: string;
    population: number;
    influenzaRate: number;
    emergencyWaitMinutes: number;
    pharmacyStockPercent: number;
  } | null>(null);

  const [selectedDrone, setSelectedDrone] = useState<boolean>(false);
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(false);

  // Dynamic state overrides for district stocks & cases
  const [districtStockMap, setDistrictStockMap] = useState<Record<string, number>>({});
  const [districtWaitMap, setDistrictWaitMap] = useState<Record<string, number>>({});
  const [outbreakCasesMap, setOutbreakCasesMap] = useState<Record<string, number>>({});

  // Calculate live critical cases from store patients
  const criticalCount = patients.filter(p => p.predictions[0]?.riskLevel === "CRITICAL").length;
  const highCount = patients.filter(p => p.predictions[0]?.riskLevel === "HIGH").length;
  const totalMonitoredCritical = criticalCount + highCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 relative">
      
      {/* LEFT COLUMN: Macro Metrics & AI Policy Controls */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* National Stats Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-3 left-3 bg-amber-950/40 border border-amber-900/60 py-0.5 px-2 rounded-full text-[10px] font-mono text-amber-400">
            INTEL: NATIONAL_STATUS
          </div>
          
          <h3 className="text-xs font-bold text-gray-500 mt-6 tracking-widest text-center font-mono">NATIONAL HEALTH METRICS</h3>
          
          <div className="flex flex-col items-center justify-center my-6 relative">
            <span className="text-6xl font-extrabold font-mono-telemetry tracking-tighter text-white">
              83.4
            </span>
            <span className="text-xs text-gray-400 font-mono mt-1">HEALTH SCORE REGULARITY</span>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5">STANDARDIZED TARGET: 85.0</p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs font-mono">
            <div className="p-3 bg-rose-950/20 border border-rose-900/50 rounded-xl text-center">
              <p className="text-gray-500 text-[10px]">CRITICAL COHORTS</p>
              <p className="font-bold text-rose-400 mt-0.5 text-base">{totalMonitoredCritical}</p>
            </div>
            <div className="p-3 bg-indigo-950/20 border border-indigo-900/50 rounded-xl text-center">
              <p className="text-gray-500 text-[10px]">WEARABLE INGESTS</p>
              <p className="font-bold text-indigo-400 mt-0.5 text-base">{patients.length}</p>
            </div>
          </div>
        </div>

        {/* AI Population Insights & Quick Actions */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <Activity className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">AI POLICY ADVISOR</h3>
          </div>

          <div className="flex flex-col gap-4">
            
            {/* South Bay Stockpile Warning */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 text-amber-400 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold uppercase tracking-wider font-mono">PHARMACY SUPPLY DEFICIT</p>
                <p className="text-gray-400 mt-1">
                  Influenza rates in South Bay show a 24% week-on-week spike. Correlates with local drop in Tamiflu pharmacy stockpiles (now at {stockLevel}%).
                </p>
                <div className="mt-3 bg-black/40 p-2 rounded text-[10px] border border-amber-950/50 font-mono">
                  <strong>RECOMMENDED ACTION:</strong> Dispatch emergency antiviral inventory (2,500 doses) to South Bay local clinics.
                </div>
              </div>
            </div>

            {/* General Epidemic Advisory */}
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-400 flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 text-indigo-400 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold uppercase tracking-wider font-mono">CLINICAL PREDICTION ENGINE</p>
                <p className="text-gray-400 mt-1">
                  Hospitalization metrics for patients with cardiovascular conditions projected to stabilize by +15% based on elevated metoprolol compliance averages.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Outbreak Hotspot Regional Simulator */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">PANDEMIC HOTSPOT SIMULATOR</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>REPRODUCTION NUMBER (R0)</span>
                <span className="font-mono font-bold text-amber-400">R0 = {r0Val}</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="5.0" 
                step="0.1"
                value={r0Val} 
                onChange={e => setR0Val(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="p-3 bg-black/40 border border-border rounded-xl text-xs font-mono leading-relaxed">
              <span className="text-[9px] text-amber-500 font-bold block mb-1">AI OPERATIONAL OVERFLOW FORECAST</span>
              {r0Val < 2.0 ? (
                <p className="text-emerald-400">Outbreak transmission under baseline target. Hospital ward margins remain safe.</p>
              ) : r0Val < 3.5 ? (
                <p className="text-amber-400">WARNING: High risk of general ward overflows in South Bay and North District within 12 days.</p>
              ) : (
                <p className="text-rose-400 animate-pulse">CRITICAL: Epidemic surge. ICU capacity overflows projected in all districts within 6 days. Tamiflu deficit projected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Stockpile Dispatch Console */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">STOCKPILE DISPATCH CONSOLE</h3>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="grid grid-cols-2 gap-2 bg-gray-950/50 p-3 rounded-xl border border-border">
              <div>
                <span className="text-[9px] text-gray-500 font-mono block">TARGET SECTOR</span>
                <span className="font-bold text-gray-200">South Bay Depots</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 font-mono block">ANTIVIRAL CLASS</span>
                <span className="font-bold text-gray-200">Tamiflu (75mg)</span>
              </div>
            </div>

            {dispatchStatus ? (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 text-[10px] leading-relaxed font-mono animate-slide-up">
                {dispatchStatus}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDispatchStatus("Antiviral dispatch successfully routed to South Bay depots. Transit ETA: 4 hours.");
                  setStockLevel(98);
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-950/20"
              >
                Dispatch 2,500 Antiviral Doses
              </button>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT MAIN AREA: Interactive Regional tables and outbreaks */}
      <div className="lg:col-span-2 flex flex-col gap-6 max-h-[880px] overflow-y-auto pr-1">
        
        {/* Interactive Outbreaks Panel */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">INTERACTIVE EPIDEMIOLOGY OUTBREAKS</h3>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">CLICK ANY OUTBREAK FOR PROTOCOL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(outbreaks).map(out => {
              const liveCases = outbreakCasesMap[out.name] || out.cases;
              return (
                <div 
                  key={out.name} 
                  onClick={() => setSelectedOutbreak({ ...out, cases: liveCases })}
                  className="p-4 rounded-xl bg-gray-950/40 border border-border hover:border-amber-500/50 flex items-center justify-between gap-4 cursor-pointer transition group"
                  title="Click to view outbreak containment protocol"
                >
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono">INFECTIOUS DISEASE</span>
                    <p className="text-sm font-bold text-gray-200 group-hover:text-amber-400 transition mt-0.5">{out.name}</p>
                    <p className="text-xs font-mono mt-1 font-bold" style={{ color: out.color }}>
                      {liveCases} Cases
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {out.trend === "rising" ? (
                      <div className="flex items-center gap-1 text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded-lg border border-rose-900/60 font-mono text-[10px] font-bold">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>RISING</span>
                      </div>
                    ) : out.trend === "declining" ? (
                      <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-900/60 font-mono text-[10px] font-bold">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>DECLINING</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400 bg-gray-900 px-2 py-0.5 rounded-lg border border-border font-mono text-[10px]">
                        <span>STABLE</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Regional demographic matrix table */}
        <div className="glass-panel p-6 rounded-2xl flex-1 relative">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-amber-500" />
              <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">REGIONAL HEALTH INTELLIGENCE</h3>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 font-mono">CLICK ROW TO MANAGE DISTRICT</span>
              <button
                type="button"
                onClick={() => setIsTableExpanded(true)}
                className="flex items-center gap-1 text-[10px] bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded-lg font-mono transition"
              >
                <Maximize2 className="w-3 h-3" />
                <span>EXPAND TABLE</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono leading-relaxed border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-gray-500">
                  <th className="pb-3 font-semibold">DISTRICT</th>
                  <th className="pb-3 font-semibold">POPULATION</th>
                  <th className="pb-3 font-semibold">INFLUENZA %</th>
                  <th className="pb-3 font-semibold">ER WAIT (MIN)</th>
                  <th className="pb-3 font-semibold">PHARMACY STOCK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {regions.map(reg => {
                  const currentStock = reg.district === "South Bay" 
                    ? stockLevel 
                    : (districtStockMap[reg.district] !== undefined ? districtStockMap[reg.district] : reg.pharmacyStockPercent);
                  
                  const currentWait = districtWaitMap[reg.district] !== undefined 
                    ? districtWaitMap[reg.district] 
                    : reg.emergencyWaitMinutes;

                  return (
                    <tr 
                      key={reg.district} 
                      onClick={() => setSelectedDistrict({ ...reg, pharmacyStockPercent: currentStock, emergencyWaitMinutes: currentWait })}
                      className="hover:bg-amber-950/20 cursor-pointer transition duration-150 group"
                      title="Click to open district logistics controller"
                    >
                      <td className="py-3 font-bold text-gray-200 group-hover:text-amber-400 transition">{reg.district}</td>
                      <td className="py-3 text-gray-400">{reg.population.toLocaleString()}</td>
                      <td className="py-3 text-gray-300">{reg.influenzaRate}%</td>
                      <td className="py-3 text-gray-300">{currentWait}m</td>
                      <td className="py-3 font-bold">
                        <span className={currentStock < 70 ? "text-rose-400" : "text-emerald-400"}>
                          {currentStock}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Autonomous Cold-Chain Vaccine & Drone Supply Dispatch */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
            <h3 className="text-xs font-bold font-mono tracking-wider text-gray-400">AUTONOMOUS COLD-CHAIN & DRONE VECTOR</h3>
            <span className="text-[10px] text-sky-400 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-900/50">IoT Vector Active</span>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            <div 
              onClick={() => setSelectedDrone(true)}
              className="p-3 bg-gray-950/50 border border-border hover:border-sky-500/50 rounded-xl flex flex-col gap-1.5 cursor-pointer transition group"
            >
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-gray-200 group-hover:text-sky-300 transition">CENTRAL FREEZER HUB #04</span>
                <span className="text-emerald-400 font-bold">-72.4°C (ULTRACOLD OK)</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-mono-telemetry">
                2,400 doses of mRNA vaccine stored under IoT automated thermal telemetry.
              </p>
            </div>

            <div 
              onClick={() => setSelectedDrone(true)}
              className="p-3 bg-gray-950/50 border border-border hover:border-sky-500/50 rounded-xl flex flex-col gap-1.5 cursor-pointer transition group"
            >
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-gray-200 group-hover:text-sky-300 transition">DRONE FLIGHT VECTOR #88</span>
                <span className="text-sky-400 font-bold">IN-TRANSIT (ETA 12m)</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-mono-telemetry">
                Route: Central Depot -&gt; Rural East Clinic. Altitude: 400ft. Payload: 150 Antiviral Doses.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* --- POP-UP MODAL: OUTBREAK PROTOCOL CONTROL --- */}
      {selectedOutbreak && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-scale-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-amber-500/40 shadow-2xl relative flex flex-col items-center">
            
            <div className="flex items-center justify-between w-full border-b border-border/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base text-white">
                  OUTBREAK CONTAINMENT PROTOCOL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOutbreak(null)}
                className="p-1 rounded-lg bg-gray-900 border border-border text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full bg-gray-950/80 border border-border rounded-2xl p-4 flex flex-col gap-2 font-mono text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-gray-400">INFECTIOUS PATHOGEN:</span>
                <span className="font-bold text-amber-300">{selectedOutbreak.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ACTIVE CONFIRMED CASES:</span>
                <span className="font-bold text-white text-sm">{selectedOutbreak.cases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TRANSMISSION TRAJECTORY:</span>
                <span className="font-bold uppercase text-rose-400">{selectedOutbreak.trend}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setOutbreakCasesMap(prev => ({
                    ...prev,
                    [selectedOutbreak.name]: Math.max(0, (prev[selectedOutbreak.name] || selectedOutbreak.cases) - 50)
                  }));
                  setSelectedOutbreak(null);
                  setDispatchStatus(`Issued Containment Protocol & Dispatched 500 Vaccine Doses for ${selectedOutbreak.name}!`);
                }}
                className="py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Issue Regional Containment & Dispatch Vaccines</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- POP-UP MODAL: DISTRICT LOGISTICS CONTROLLER --- */}
      {selectedDistrict && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-scale-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-sky-500/40 shadow-2xl relative flex flex-col items-center">
            
            <div className="flex items-center justify-between w-full border-b border-border/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-sky-400" />
                <h3 className="font-extrabold text-base text-white">
                  DISTRICT HEALTH CONTROLLER
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDistrict(null)}
                className="p-1 rounded-lg bg-gray-900 border border-border text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full bg-gray-950/80 border border-border rounded-2xl p-4 flex flex-col gap-2 font-mono text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-gray-400">DISTRICT NAME:</span>
                <span className="font-bold text-sky-300">{selectedDistrict.district}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TOTAL POPULATION:</span>
                <span className="font-bold text-white">{selectedDistrict.population.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">INFLUENZA RATE:</span>
                <span className="font-bold text-amber-300">{selectedDistrict.influenzaRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ER WAIT TIME:</span>
                <span className="font-bold text-rose-300">{selectedDistrict.emergencyWaitMinutes} Minutes</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2 mt-1">
                <span className="text-gray-400">PHARMACY STOCK:</span>
                <span className="font-bold text-emerald-400">{selectedDistrict.pharmacyStockPercent}%</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setDistrictStockMap(prev => ({ ...prev, [selectedDistrict.district]: 100 }));
                  if (selectedDistrict.district === "South Bay") setStockLevel(100);
                  setSelectedDistrict(null);
                  setDispatchStatus(`Restocked Pharmacy Inventory to 100% in ${selectedDistrict.district}!`);
                }}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Package className="w-4 h-4" />
                <span>Restock Pharmacy Inventory to 100%</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDistrictWaitMap(prev => ({ ...prev, [selectedDistrict.district]: Math.max(5, selectedDistrict.emergencyWaitMinutes - 15) }));
                  setSelectedDistrict(null);
                  setDispatchStatus(`Redirected ER Ambulance Traffic for ${selectedDistrict.district}. Wait times reduced!`);
                }}
                className="py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Redirect ER Ambulance Traffic (-15m Wait)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- POP-UP MODAL: DRONE & COLD-CHAIN OVERRIDE --- */}
      {selectedDrone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-scale-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-sky-500/40 shadow-2xl relative flex flex-col items-center">
            
            <div className="flex items-center justify-between w-full border-b border-border/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h3 className="font-extrabold text-base text-white">
                  AUTONOMOUS DRONE VECTOR COMMAND
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDrone(false)}
                className="p-1 rounded-lg bg-gray-900 border border-border text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full bg-gray-950/80 border border-border rounded-2xl p-4 flex flex-col gap-2 font-mono text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-gray-400">FREEZER HUB #04:</span>
                <span className="font-bold text-emerald-400">-72.4°C (ULTRACOLD OK)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">DRONE FLIGHT VECTOR:</span>
                <span className="font-bold text-sky-300">VECTOR #88 IN-TRANSIT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">PAYLOAD CAPACITY:</span>
                <span className="font-bold text-white">150 Antiviral Doses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">FLIGHT ALTITUDE:</span>
                <span className="font-bold text-gray-300">400 ft</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedDrone(false);
                setDispatchStatus("Drone Vector #88 flight path overridden! Emergency antiviral payload redirected to Rural East Clinic.");
              }}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs shadow-lg font-mono"
            >
              <Send className="w-4 h-4" />
              <span>Override Flight Vector & Reroute Payload</span>
            </button>

          </div>
        </div>
      )}

      {/* --- EXPANDED FULLSCREEN REGIONAL TABLE MODAL --- */}
      {isTableExpanded && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 p-4 md:p-8 flex items-center justify-center animate-scale-in">
          <div className="glass-panel w-full max-w-4xl h-full max-h-[85vh] rounded-3xl border border-amber-500/50 p-6 flex flex-col justify-between shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-950 border border-amber-500/40 rounded-xl text-amber-400">
                  <Map className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    REGIONAL HEALTH INTELLIGENCE MATRIX
                    <span className="text-xs font-mono font-normal text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-900/50">FULLSCREEN VIEW</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    District registration, population counts, influenza positivity rates & pharmacy stockpile levels.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTableExpanded(false)}
                className="p-2 bg-gray-900 hover:bg-gray-800 border border-border text-gray-300 rounded-xl transition flex items-center gap-1 text-xs font-mono"
              >
                <Minimize2 className="w-4 h-4" />
                <span>EXIT FULLSCREEN</span>
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-border/80 rounded-2xl p-4 bg-black/40">
              <table className="w-full text-left text-sm font-mono leading-relaxed border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-gray-400">
                    <th className="pb-3 font-semibold">DISTRICT</th>
                    <th className="pb-3 font-semibold">POPULATION</th>
                    <th className="pb-3 font-semibold">INFLUENZA %</th>
                    <th className="pb-3 font-semibold">ER WAIT (MIN)</th>
                    <th className="pb-3 font-semibold">PHARMACY STOCK</th>
                    <th className="pb-3 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {regions.map(reg => {
                    const currentStock = reg.district === "South Bay" 
                      ? stockLevel 
                      : (districtStockMap[reg.district] !== undefined ? districtStockMap[reg.district] : reg.pharmacyStockPercent);
                    
                    const currentWait = districtWaitMap[reg.district] !== undefined 
                      ? districtWaitMap[reg.district] 
                      : reg.emergencyWaitMinutes;

                    return (
                      <tr key={reg.district} className="hover:bg-amber-950/20 transition">
                        <td className="py-3.5 font-bold text-white">{reg.district}</td>
                        <td className="py-3.5 text-gray-300">{reg.population.toLocaleString()}</td>
                        <td className="py-3.5 text-amber-300">{reg.influenzaRate}%</td>
                        <td className="py-3.5 text-rose-300">{currentWait}m</td>
                        <td className="py-3.5 font-bold">
                          <span className={currentStock < 70 ? "text-rose-400" : "text-emerald-400"}>
                            {currentStock}%
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDistrict({ ...reg, pharmacyStockPercent: currentStock, emergencyWaitMinutes: currentWait });
                              setIsTableExpanded(false);
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-border/80 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTableExpanded(false)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 border border-border text-gray-300 rounded-xl text-xs font-bold font-mono transition"
              >
                Close Fullscreen Matrix
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
