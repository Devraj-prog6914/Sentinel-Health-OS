"use client";

import React, { useState, useEffect } from "react";
import { useSentinelStore } from "../store/store";
import LayoutShell from "../components/layout-shell";
import PatientDashboard from "../components/patient-dashboard";
import DoctorDashboard from "../components/doctor-dashboard";
import HospitalDashboard from "../components/hospital-dashboard";
import GovernmentDashboard from "../components/government-dashboard";
import { 
  Heart, 
  Activity, 
  Shield, 
  Users, 
  ArrowRight,
  Cpu,
  Database,
  Lock,
  Monitor,
  Volume2,
  FileCheck,
  Fingerprint,
  Key,
  ShieldCheck,
  FileText,
  Sun,
  Moon,
  UserPlus,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Globe
} from "lucide-react";

// --- WEB AUDIO HEARTBEAT SYNTHESIZER ---
const playHeartbeatSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playPulse = (time: number, isLoud: boolean) => {
      // First beat (Lub)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(60, time);
      osc1.frequency.exponentialRampToValueAtTime(10, time + 0.15);
      
      gain1.gain.setValueAtTime(isLoud ? 0.8 : 0.4, time);
      gain1.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(time);
      osc1.stop(time + 0.15);
      
      // Second beat (Dub)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(55, time + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(10, time + 0.32);
      
      gain2.gain.setValueAtTime(isLoud ? 0.65 : 0.3, time + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, time + 0.32);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(time + 0.18);
      osc2.stop(time + 0.32);
    };

    // Play double beat cycle
    playPulse(ctx.currentTime, true);
    playPulse(ctx.currentTime + 0.8, false);
  } catch (e) {
    console.warn("Audio Context failed to play heartbeat: ", e);
  }
};

export default function Home() {
  const { currentRole, setRole, registerUser, theme, toggleTheme } = useSentinelStore();
  
  // UI Flow States: "intro" | "onboarding" | "launcher" | "login"
  const [flowState, setFlowState] = useState<"intro" | "onboarding" | "launcher" | "login">("intro");
  const [bootText, setBootText] = useState("ESTABLISHING CLINICAL CRYPTO LINK...");
  const [onboardSlide, setOnboardSlide] = useState(0);
  const [targetLoginRole, setTargetLoginRole] = useState<"patient" | "doctor" | "hospital_admin" | "government_admin" | null>(null);

  // Auth Modes: "login" | "register"
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Login inputs
  const [loginId, setLoginId] = useState("");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Registration inputs
  const [regFullName, setRegFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regGender, setRegGender] = useState("Male");
  const [regBloodType, setRegBloodType] = useState("A+");
  const [regSpecialty, setRegSpecialty] = useState("Cardiology");
  const [regHospital, setRegHospital] = useState("Sentinel General Hospital");
  const [regDepartment, setRegDepartment] = useState("Cardiology ICU");

  // Credentials Generated Pop-up Modal state
  const [generatedCreds, setGeneratedCreds] = useState<{
    systemId: string;
    passcode: string;
    fullName: string;
    role: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  // Google SSO Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Intro Boot sequence timer
  useEffect(() => {
    if (flowState !== "intro") return;
    
    // Play sound on boot load
    playHeartbeatSound();

    const sequence = [
      { delay: 1000, text: "MOUNTING DIGITAL PHYSIOLOGICAL KERNELS..." },
      { delay: 2000, text: "CONNECTING WEARABLE DATABASES (pgvector)..." },
      { delay: 3000, text: "ENABLING EXPLAINABLE AI REASONING ARRAYS..." },
      { delay: 4000, text: "SYSTEM OPERATIONAL. CLINICAL KERNEL ACTIVE." }
    ];

    sequence.forEach((step, idx) => {
      setTimeout(() => {
        setBootText(step.text);
        playHeartbeatSound();
        if (idx === sequence.length - 1) {
          setTimeout(() => {
            setFlowState("onboarding");
          }, 1200);
        }
      }, step.delay);
    });
  }, [flowState]);

  // Onboarding slides data
  const onboardingSlides = [
    {
      title: "Digital Health Twins",
      desc: "Sentinel Health maintains a continuously updating physiological clone of each patient. Combining telemetry parameters (pulse, pressure, sleep, oxygen) to forecast risk anomalies.",
      icon: <Heart className="w-10 h-10 text-emerald-400" />,
      graphic: (
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-30" />
          <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-emerald-500/40 animate-spin" />
          <Heart className="w-12 h-12 text-emerald-400 animate-pulse" />
        </div>
      )
    },
    {
      title: "Explainable Risk calculations",
      desc: "No black-box predictions. Every clinical warning generated by our AI is backed by clear explainability logs detailing vital sign anomalies and medication compliance data.",
      icon: <Cpu className="w-10 h-10 text-indigo-400" />,
      graphic: (
        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 w-44 font-mono text-[10px] text-indigo-300">
          <div className="flex justify-between border-b border-indigo-900 pb-1 font-bold">
            <span>METRIC</span><span>RISK_VAL</span>
          </div>
          <div className="flex justify-between mt-1"><span>SpO2 91%</span><span className="text-rose-400">+25%</span></div>
          <div className="flex justify-between"><span>HR 118bpm</span><span className="text-orange-400">+15%</span></div>
        </div>
      )
    },
    {
      title: "Command Center Operations",
      desc: "Sleek command centers map bed availability, ICU queues, and emergency ambulances in real-time, providing administrators with proactive capacity warning logs.",
      icon: <Shield className="w-10 h-10 text-sky-400" />,
      graphic: (
        <div className="grid grid-cols-3 gap-1.5 w-32">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`h-6 rounded border ${i % 3 === 0 ? "bg-rose-500/20 border-rose-500/40" : "bg-emerald-500/20 border-emerald-500/40"}`} />
          ))}
        </div>
      )
    },
    {
      title: "Offline Resiliency",
      desc: "Emergency rooms and patients cannot depend on internet links. Sentinel Health logs local vital updates and telemetry edits offline, synchronizing when links restore.",
      icon: <Monitor className="w-10 h-10 text-amber-400" />,
      graphic: (
        <div className="flex items-center gap-2 border border-amber-500/30 bg-amber-950/20 rounded-xl px-4 py-2 text-xs font-mono text-amber-400 animate-pulse">
          <Database className="w-4 h-4" />
          <span>LOCAL_QUEUE: 3 SYNC</span>
        </div>
      )
    }
  ];

  const handleLaunchLogin = (role: "patient" | "doctor" | "hospital_admin" | "government_admin") => {
    setTargetLoginRole(role);
    setFlowState("login");
    setLoginId("");
    setLoginPasscode("");
    setLoginError("");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !loginPasscode) {
      setLoginError("Credentials are required.");
      return;
    }

    // Role authentication validator mockup
    if (targetLoginRole === "patient") {
      if (loginId.toLowerCase() === "pat-1" || loginId.toLowerCase() === "arthur") {
        setRole("patient", "pat-1");
      } else {
        setLoginError("Invalid Patient ID. Try 'pat-1' or 'arthur'");
      }
    } else if (targetLoginRole === "doctor") {
      if (loginId.toLowerCase() === "npi-99" || loginId.toLowerCase() === "chen") {
        setRole("doctor");
      } else {
        setLoginError("Invalid Doctor License. Try 'npi-99' or 'chen'");
      }
    } else if (targetLoginRole === "hospital_admin") {
      if (loginId === "admin") {
        setRole("hospital_admin");
      } else {
        setLoginError("Invalid Admin Key. Try 'admin'");
      }
    } else if (targetLoginRole === "government_admin") {
      if (loginId === "gov") {
        setRole("government_admin");
      } else {
        setLoginError("Invalid Clearance Code. Try 'gov'");
      }
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!regFullName.trim() || !regEmail.trim()) {
      setLoginError("Please enter your full name and email address.");
      return;
    }
    if (!targetLoginRole) return;

    const creds = registerUser(targetLoginRole, {
      fullName: regFullName,
      username: regUsername || regEmail.split('@')[0],
      email: regEmail,
      dob: regDob,
      gender: regGender,
      bloodType: regBloodType,
      specialty: regSpecialty,
      hospital: regHospital,
      department: regDepartment
    });

    setGeneratedCreds({
      systemId: creds.systemId,
      passcode: creds.passcode,
      fullName: regFullName,
      role: targetLoginRole
    });
  };

  const handleGoogleAuthSelect = (name: string, email: string) => {
    setShowGoogleModal(false);
    const role = targetLoginRole || "patient";
    const creds = registerUser(role, {
      fullName: name,
      username: email.split("@")[0],
      email: email,
      dob: "2006-03-06",
      gender: "Male",
      bloodType: "A+"
    });

    setGeneratedCreds({
      systemId: creds.systemId,
      passcode: creds.passcode,
      fullName: name,
      role: role
    });
  };

  const handleBiometricScan = () => {
    setIsBiometricScanning(true);
    setLoginError("");
    setTimeout(() => {
      setIsBiometricScanning(false);
      if (targetLoginRole === "patient") {
        setRole("patient", "pat-1");
      } else if (targetLoginRole === "doctor") {
        setRole("doctor");
      } else if (targetLoginRole === "hospital_admin") {
        setRole("hospital_admin");
      } else if (targetLoginRole === "government_admin") {
        setRole("government_admin");
      }
    }, 1500);
  };

  // --- ROUTING RENDER --
  if (currentRole === "patient") {
    return (
      <LayoutShell 
        title="Patient Twin Application" 
        subtitle="Secure, anxiety-reducing digital wellness companion. Monitor vitals, track meds, voice symptoms, and access your digital medical passport."
      >
        <PatientDashboard />
      </LayoutShell>
    );
  }

  if (currentRole === "doctor") {
    return (
      <LayoutShell 
        title="Doctor Mission Control" 
        subtitle="Predictive patient monitoring dashboard. Ranked critical queues, treatment simulators, and clinical AI copilot."
      >
        <DoctorDashboard />
      </LayoutShell>
    );
  }

  if (currentRole === "hospital_admin") {
    return (
      <LayoutShell 
        title="Hospital command center" 
        subtitle="Real-time operational capacity planner. Bed tracking matrices, ward occupancy rates, and AI overcrowding warnings."
      >
        <HospitalDashboard />
      </LayoutShell>
    );
  }

  if (currentRole === "government_admin") {
    return (
      <LayoutShell 
        title="Government population intelligence" 
        subtitle="Epidemiological tracking dashboard. Regional disease outbreaks, medication stockpile trends, and advisory insights."
      >
        <GovernmentDashboard />
      </LayoutShell>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
      
      {/* Background Graphic Blooms */}
      <div className="absolute top-[-25%] left-[5%] w-[800px] h-[800px] bg-indigo-950/10 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-15%] right-[2%] w-[600px] h-[600px] bg-emerald-950/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="py-6 px-8 flex justify-between items-center max-w-[1400px] w-full mx-auto border-b border-border z-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-emerald-600 to-indigo-600 p-2 rounded-xl">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-500 via-indigo-500 to-sky-500 bg-clip-text text-transparent">SENTINEL</span>
              <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-900/60 px-2 py-0.5 rounded-full font-mono font-bold">HEALTH OS</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 hover:text-indigo-400 transition text-amber-400 dark:text-indigo-400 font-mono bg-gray-900/40 border border-white/10 px-2.5 py-1 rounded-lg"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            <span className="hidden md:inline">{theme === "dark" ? "LIGHT MODE" : "DARK MODE"}</span>
          </button>
          <button onClick={playHeartbeatSound} className="flex items-center gap-1.5 hover:text-indigo-400 transition">
            <Volume2 className="w-4 h-4" />
            <span className="hidden md:inline">TEST AUDIO SYNC</span>
          </button>
          <span>SECURE PROTOCOL // TLS 1.3</span>
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
        </div>
      </header>

      {/* --- FLOW STATE 1: CINEMATIC BOOT INTRO --- */}
      {flowState === "intro" && (
        <main className="flex-1 flex flex-col justify-center items-center p-6 z-10">
          <div className="text-center flex flex-col items-center max-w-lg">
            <div className="relative w-28 h-28 flex items-center justify-center mb-8">
              <div className="absolute inset-0 rounded-full border border-indigo-500/25 animate-ping opacity-60" />
              <div className="absolute w-20 h-20 rounded-full border-2 border-indigo-500/30 animate-pulse" />
              <Heart className="w-10 h-10 text-indigo-400 animate-pulse" />
            </div>

            <h2 className="text-sm font-mono tracking-widest text-indigo-400 animate-pulse font-bold">
              SENTINEL HEALTH OS
            </h2>
            
            <p className="text-[11px] font-mono text-gray-500 mt-6 leading-relaxed max-w-sm h-8">
              {bootText}
            </p>

            <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent mt-4" />
          </div>
        </main>
      )}

      {/* --- FLOW STATE 2: ONBOARDING --- */}
      {flowState === "onboarding" && (
        <main className="flex-1 flex flex-col justify-center items-center p-6 z-10 max-w-[900px] w-full mx-auto animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full glass-panel p-8 rounded-3xl items-center border border-white/5 shadow-glass-glow">
            
            {/* Slide Graphic */}
            <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-border/80 min-h-[220px]">
              {onboardingSlides[onboardSlide].graphic}
            </div>

            {/* Slide Details */}
            <div className="flex flex-col justify-between h-full py-2">
              <div>
                <div className="mb-4 inline-block p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-2xl">
                  {onboardingSlides[onboardSlide].icon}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {onboardingSlides[onboardSlide].title}
                </h2>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  {onboardingSlides[onboardSlide].desc}
                </p>
              </div>

              {/* Progress and controls */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                {/* Dots indicator */}
                <div className="flex gap-2">
                  {onboardingSlides.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        onboardSlide === idx ? "w-6 bg-indigo-500" : "w-1.5 bg-gray-700"
                      }`}
                    />
                  ))}
                </div>

                {onboardSlide < onboardingSlides.length - 1 ? (
                  <button
                    onClick={() => {
                      playHeartbeatSound();
                      setOnboardSlide(prev => prev + 1);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <span>NEXT SLIDE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      playHeartbeatSound();
                      setFlowState("launcher");
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/40"
                  >
                    <span>ENTER SYSTEM</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>
        </main>
      )}

      {/* --- FLOW STATE 3: LAUNCHER PANEL --- */}
      {flowState === "launcher" && (
        <main className="flex-1 flex flex-col justify-center items-center py-12 px-6 max-w-[1400px] w-full mx-auto z-10 animate-scale-in">
          <div className="text-center max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/60 rounded-full px-3 py-1 text-xs text-indigo-400 font-mono mb-6">
              <Cpu className="w-3.5 h-3.5" />
              <span>VENTURE-SCALE CLINICAL PREDICTION SUITE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent leading-tight py-2">
              Predictive Healthcare Operating System
            </h1>
            
            <p className="text-gray-400 mt-6 text-sm leading-relaxed max-w-xl mx-auto">
              Sentinel Health shifts clinical workflows from <strong>reactive</strong> to <strong>predictive</strong> using continuous Digital twins and explainable AI models.
            </p>
          </div>

          {/* Launcher Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-[1200px]">
            
            {/* 1. Patient */}
            <div 
              onClick={() => handleLaunchLogin("patient")}
              className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-950/5 transition-all duration-300 group flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="bg-emerald-950/40 border border-emerald-900/60 p-3 rounded-xl inline-block text-emerald-400 group-hover:scale-110 transition duration-300">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-200 mt-4 group-hover:text-emerald-400 transition">Patient Application</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Ingest wearable telemetry, submit voice symptom logs, track medication checklists, and access your digital medical passport.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-emerald-500 mt-6 pt-4 border-t border-white/5">
                <span>SECURE SIGN IN</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* 2. Doctor */}
            <div 
              onClick={() => handleLaunchLogin("doctor")}
              className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-950/5 transition-all duration-300 group flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="bg-indigo-950/40 border border-indigo-900/60 p-3 rounded-xl inline-block text-indigo-400 group-hover:scale-110 transition duration-300">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-200 mt-4 group-hover:text-indigo-400 transition">Doctor Mission Control</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Review automated critical patient queues, run treatment dosage projections, parse reports via OCR, and query the copilot.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-indigo-500 mt-6 pt-4 border-t border-white/5">
                <span>SECURE SIGN IN</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* 3. Hospital Admin */}
            <div 
              onClick={() => handleLaunchLogin("hospital_admin")}
              className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-sky-500/50 hover:bg-sky-950/5 transition-all duration-300 group flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="bg-sky-950/40 border border-sky-900/60 p-3 rounded-xl inline-block text-sky-400 group-hover:scale-110 transition duration-300">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-200 mt-4 group-hover:text-sky-400 transition">Hospital Command</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Track room allocation grids across departments, review ventilator/nurse logistics, and check bed overcrowding indices.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-sky-500 mt-6 pt-4 border-t border-white/5">
                <span>SECURE SIGN IN</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* 4. Government */}
            <div 
              onClick={() => handleLaunchLogin("government_admin")}
              className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-amber-500/50 hover:bg-amber-950/5 transition-all duration-300 group flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="bg-amber-950/40 border border-amber-900/60 p-3 rounded-xl inline-block text-amber-400 group-hover:scale-110 transition duration-300">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-200 mt-4 group-hover:text-amber-400 transition">Government Intel</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Trace demographic epidemiology maps, review disease trend alerts (rising/stable), and assess pharmaceutical stock reserves.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-amber-500 mt-6 pt-4 border-t border-white/5">
                <span>SECURE SIGN IN</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>

          </div>
        </main>
      )}

      {/* --- FLOW STATE 4: DEDICATED LOGIN / REGISTER GATEWAY --- */}
      {flowState === "login" && targetLoginRole && (
        <main className="flex-1 flex flex-col justify-center items-center p-6 z-10 animate-scale-in">
          <div className="glass-panel max-w-md w-full p-8 rounded-3xl relative border border-white/10 shadow-glass-glow flex flex-col items-center">
            
            {/* Header info */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="p-3.5 bg-gray-950/80 border border-border/80 rounded-2xl mb-3">
                {targetLoginRole === "patient" && <Heart className="w-6 h-6 text-emerald-400" />}
                {targetLoginRole === "doctor" && <Activity className="w-6 h-6 text-indigo-400" />}
                {targetLoginRole === "hospital_admin" && <Shield className="w-6 h-6 text-sky-400" />}
                {targetLoginRole === "government_admin" && <Users className="w-6 h-6 text-amber-400" />}
              </div>
              
              <h3 className="font-extrabold text-lg text-white">
                {targetLoginRole === "patient" && "PATIENT IDENTITY PORTAL"}
                {targetLoginRole === "doctor" && "CLINICAL LICENSING KEY"}
                {targetLoginRole === "hospital_admin" && "INFRASTRUCTURE ACCESS GATEWAY"}
                {targetLoginRole === "government_admin" && "EPIDEMIOLOGY CLEARANCE SECURE"}
              </h3>
              
              <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">
                {targetLoginRole === "patient" && "HIPAA PRIVACY COMPLIANT"}
                {targetLoginRole === "doctor" && "DEVICES PROVISIONED SYSTEM"}
                {targetLoginRole === "hospital_admin" && "INFRASTRUCTURE AUTHORITY"}
                {targetLoginRole === "government_admin" && "GOVERNMENT INTEL LEVEL 4"}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex w-full bg-gray-950/80 p-1 rounded-xl border border-border/80 mb-5 font-mono text-xs">
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setLoginError(""); }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  authMode === "login"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("register"); setLoginError(""); }}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  authMode === "register"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <UserPlus className="w-3 h-3" />
                <span>Register Account</span>
              </button>
            </div>

            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-4">
                
                {/* Login Id */}
                <div>
                  <label className="block text-[10px] text-gray-500 font-mono mb-1">
                    {targetLoginRole === "patient" && "PATIENT MEDICAL ID (MIN)"}
                    {targetLoginRole === "doctor" && "CLINIC LICENSE KEY (DEA)"}
                    {targetLoginRole === "hospital_admin" && "INFRASTRUCTURE AUTHORITY KEY"}
                    {targetLoginRole === "government_admin" && "CLEARANCE AUTH CODE"}
                  </label>
                  <input
                    type="text"
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    placeholder={
                      targetLoginRole === "patient" ? "e.g., 'pat-1' or 'arthur'" : 
                      targetLoginRole === "doctor" ? "e.g., 'npi-99' or 'chen'" :
                      targetLoginRole === "hospital_admin" ? "e.g., 'admin'" : "e.g., 'gov'"
                    }
                    className="w-full bg-gray-950 border border-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                {/* Passcode */}
                <div>
                  <label className="block text-[10px] text-gray-500 font-mono mb-1">ACCESS PASSCODE</label>
                  <input
                    type="password"
                    value={loginPasscode}
                    onChange={e => setLoginPasscode(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-950 border border-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                {loginError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/50 text-rose-400 text-[10px] leading-relaxed font-mono">
                    {loginError}
                  </div>
                )}

                {/* Submit credentials */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verify Access Credentials</span>
                </button>

                {/* Google Sign In Option */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-gray-600 font-mono">OR SIGN IN WITH</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-sm border border-gray-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Biometrics Bypass option */}
                <button
                  type="button"
                  onClick={handleBiometricScan}
                  disabled={isBiometricScanning}
                  className="w-full py-2 bg-gray-950 hover:bg-gray-900 border border-border/80 text-gray-300 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-2 group mt-1"
                >
                  <Fingerprint className={`w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition ${isBiometricScanning ? "animate-pulse" : ""}`} />
                  <span>{isBiometricScanning ? "Scanning Fingerprint..." : "Simulate Biometric ID Scan"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlowState("launcher")}
                  className="w-full text-center text-[10px] text-gray-500 hover:text-white font-mono mt-2"
                >
                  CANCEL & BACK
                </button>

              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="w-full flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] text-gray-500 font-mono mb-1">FULL NAME</label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-gray-950 border border-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-mono mb-1">USERNAME</label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="e.g. elena_r"
                      className="w-full bg-gray-950 border border-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-mono mb-1">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="elena@sentinel.org"
                      className="w-full bg-gray-950 border border-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>
                </div>

                {targetLoginRole === "patient" && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-mono mb-1">DOB</label>
                        <input
                          type="date"
                          value={regDob}
                          onChange={e => setRegDob(e.target.value)}
                          className="w-full bg-gray-950 border border-border rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-mono mb-1">GENDER</label>
                        <select
                          value={regGender}
                          onChange={e => setRegGender(e.target.value)}
                          className="w-full bg-gray-950 border border-border rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-Binary">Non-Binary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-mono mb-1">BLOOD TYPE</label>
                        <select
                          value={regBloodType}
                          onChange={e => setRegBloodType(e.target.value)}
                          className="w-full bg-gray-950 border border-border rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {targetLoginRole === "doctor" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-mono mb-1">SPECIALTY</label>
                      <input
                        type="text"
                        value={regSpecialty}
                        onChange={e => setRegSpecialty(e.target.value)}
                        placeholder="e.g. Cardiology"
                        className="w-full bg-gray-950 border border-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-mono mb-1">DEPARTMENT</label>
                      <input
                        type="text"
                        value={regDepartment}
                        onChange={e => setRegDepartment(e.target.value)}
                        placeholder="Cardiology ICU"
                        className="w-full bg-gray-950 border border-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {(targetLoginRole === "hospital_admin" || targetLoginRole === "government_admin") && (
                  <div>
                    <label className="block text-[10px] text-gray-500 font-mono mb-1">FACILITY / AGENCY NAME</label>
                    <input
                      type="text"
                      value={regHospital}
                      onChange={e => setRegHospital(e.target.value)}
                      placeholder="Sentinel Main Command Center"
                      className="w-full bg-gray-950 border border-border rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {loginError && (
                  <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/50 text-rose-400 text-[10px] leading-relaxed font-mono">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mt-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account & Generate System Credentials</span>
                </button>

                {/* Google Sign In Option */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-gray-600 font-mono">OR REGISTER WITH</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-sm border border-gray-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFlowState("launcher")}
                  className="w-full text-center text-[10px] text-gray-500 hover:text-white font-mono mt-1"
                >
                  CANCEL & BACK
                </button>
              </form>
            )}

          </div>
        </main>
      )}

      {/* --- POP-UP MODAL: SYSTEM GENERATED CREDENTIALS --- */}
      {generatedCreds && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-scale-in">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-emerald-500/50 shadow-2xl relative flex flex-col items-center">
            
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl mb-3 text-emerald-400">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-xl font-extrabold text-white text-center">
              SYSTEM CREDENTIALS GENERATED
            </h3>
            
            <p className="text-xs text-gray-400 text-center mt-1 font-mono">
              Account created for <strong className="text-emerald-400">{generatedCreds.fullName}</strong>. Save these credentials to sign in anytime!
            </p>

            <div className="w-full flex flex-col gap-3 my-5 bg-gray-950/80 p-4 rounded-2xl border border-border/80">
              
              {/* System ID Box */}
              <div>
                <label className="block text-[10px] text-gray-500 font-mono mb-1">OFFICIAL SYSTEM ASSIGNED ID</label>
                <div className="flex items-center justify-between bg-black/60 border border-emerald-500/30 rounded-xl p-2.5">
                  <span className="font-mono font-bold text-sm text-emerald-300 tracking-wider">
                    {generatedCreds.systemId}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCreds.systemId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[10px] bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 px-2 py-1 rounded-lg font-mono transition"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId ? "COPIED" : "COPY ID"}</span>
                  </button>
                </div>
              </div>

              {/* Passcode Box */}
              <div>
                <label className="block text-[10px] text-gray-500 font-mono mb-1">GENERATED ACCESS PASSCODE</label>
                <div className="flex items-center justify-between bg-black/60 border border-indigo-500/30 rounded-xl p-2.5">
                  <span className="font-mono font-bold text-sm text-indigo-300 tracking-wider">
                    {generatedCreds.passcode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCreds.passcode);
                      setCopiedPasscode(true);
                      setTimeout(() => setCopiedPasscode(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[10px] bg-indigo-950 hover:bg-indigo-900 text-indigo-400 border border-indigo-800/60 px-2 py-1 rounded-lg font-mono transition"
                  >
                    {copiedPasscode ? <Check className="w-3 h-3 text-indigo-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPasscode ? "COPIED" : "COPY PASSCODE"}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  const role = generatedCreds.role as any;
                  setGeneratedCreds(null);
                  setRole(role);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <span>Proceed Directly to Suite Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginId(generatedCreds.systemId);
                  setLoginPasscode(generatedCreds.passcode);
                  setAuthMode("login");
                  setGeneratedCreds(null);
                }}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 border border-border text-gray-300 rounded-xl text-xs font-semibold transition"
              >
                Auto-Fill Credentials in Sign In Form
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- GOOGLE SINGLE SIGN-ON MODAL --- */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-scale-in">
          <div className="glass-panel max-w-sm w-full p-6 rounded-3xl border border-white/10 shadow-2xl relative flex flex-col items-center">
            
            {/* Google Logo */}
            <div className="p-3 bg-white rounded-2xl mb-3 shadow-md">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>

            <h3 className="font-extrabold text-base text-white text-center">
              Sign in with Google
            </h3>
            <p className="text-[11px] text-gray-400 text-center mt-0.5">
              Choose an account to continue to <strong>Sentinel Health OS</strong>
            </p>

            {/* Account List Card */}
            <div className="w-full flex flex-col gap-2 my-5">
              <button
                type="button"
                onClick={() => handleGoogleAuthSelect("Devraj Shinde", "shindedevaraj0@gmail.com")}
                className="flex items-center gap-3 p-3 rounded-2xl bg-gray-950/80 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition group text-left w-full"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  D
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition">Devraj Shinde</p>
                  <p className="text-[10px] text-gray-400 font-mono">shindedevaraj0@gmail.com</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="text-xs text-gray-500 hover:text-white font-mono"
            >
              Cancel
            </button>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 px-8 max-w-[1400px] w-full mx-auto border-t border-white/5 text-center text-xs text-gray-600 font-mono flex flex-col md:flex-row justify-between items-center gap-2 z-10">
        <p>Sentinel Health OS is provisioned under FDA Software-as-a-Medical-Device (SaMD) Class II guidelines.</p>
        <p>V_1.0.4-RELEASE</p>
      </footer>

    </div>
  );
}
