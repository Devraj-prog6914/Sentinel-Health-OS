import { create } from "zustand";

// --- Types ---
export interface UserSession {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: "patient" | "doctor" | "hospital_admin" | "government_admin";
}

export interface PatientProfile {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  bloodType: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  healthScore: number;
  recoveryScore: number;
  riskScore: number;
  complianceScore: number;
  mentalWellnessScore: number;
  twinSummary: string;
  vitals: VitalSign[];
  medications: Medication[];
  medicationLogs: MedicationLog[];
  timeline: TimelineEvent[];
  predictions: Prediction[];
  insights: AIInsight[];
  simulations: SimulationRun[];
}

export interface VitalSign {
  id: string;
  timestamp: string;
  heartRate: number;
  systolicBp: number;
  diastolicBp: number;
  spO2: number;
  temperature: number;
  sleepHours: number;
  moodRating: number;
  stressLevel: number;
  steps: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  doctorName: string;
  active: boolean;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  timestamp: string;
  taken: boolean;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  category: "vital" | "medication" | "lab" | "doctor_note" | "ocr" | "voice_journal" | "emergency";
  title: string;
  description: string;
  details?: any;
  doctorName?: string;
}

export interface Prediction {
  id: string;
  timestamp: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  predictionType: string;
  probability: number;
  explanation: string;
  suggestions: string;
}

export interface AIInsight {
  id: string;
  timestamp: string;
  category: string;
  text: string;
  details?: any;
  resolved: boolean;
}

export interface SimulationRun {
  id: string;
  timestamp: string;
  interventionType: string;
  targetParams: any;
  projectedHealthScore: number;
  efficacyRating: number;
  durationDays: number;
  notes: string;
}

export interface HospitalBed {
  id: string;
  department: "ICU" | "Cardiology" | "Pulmonology" | "Neurology" | "General Ward" | "Emergency Care";
  roomNumber: string;
  bedNumber: string;
  status: "occupied" | "available" | "cleaning";
  patientName?: string;
}

export interface EpidemicData {
  name: string;
  cases: number;
  trend: "rising" | "stable" | "declining";
  color: string;
}

export interface RegionMetric {
  district: string;
  population: number;
  influenzaRate: number;
  emergencyWaitMinutes: number;
  pharmacyStockPercent: number;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
}

export interface OfflineAction {
  id: string;
  timestamp: string;
  type: string;
  payload: any;
}

interface SentinelState {
  // Session & Auth
  currentRole: "guest" | "patient" | "doctor" | "hospital_admin" | "government_admin";
  currentUser: UserSession | null;
  activePatientId: string | null;
  
  // Data
  patients: PatientProfile[];
  doctors: { id: string; fullName: string; specialty: string; department: string }[];
  beds: HospitalBed[];
  outbreaks: Record<string, EpidemicData>;
  regions: RegionMetric[];
  auditLogs: AuditRecord[];
  offlineQueue: OfflineAction[];
  isOffline: boolean;
  notifications: { id: string; timestamp: string; type: "critical" | "warning" | "ai"; title: string; text: string; patientId?: string }[];
  
  theme: "dark" | "light";
  
  // Simulation Sandbox
  activeSimParams: { intervention: string; value: number } | null;
  
  // Actions
  setRole: (role: "guest" | "patient" | "doctor" | "hospital_admin" | "government_admin", patientId?: string) => void;
  registerUser: (
    role: "patient" | "doctor" | "hospital_admin" | "government_admin",
    userData: {
      fullName: string;
      username: string;
      email: string;
      dob?: string;
      gender?: string;
      bloodType?: string;
      allergies?: string;
      emergencyContact?: string;
      emergencyPhone?: string;
      specialty?: string;
      hospital?: string;
      department?: string;
    }
  ) => { systemId: string; passcode: string };
  toggleTheme: () => void;
  addVitals: (patientId: string, vital: Omit<VitalSign, "id" | "timestamp">) => void;
  runSimulation: (patientId: string, intervention: string, targetParams: any) => void;
  processOCRUpload: (patientId: string, docText: string) => void;
  submitVoiceJournal: (patientId: string, transcript: string) => void;
  toggleOfflineMode: () => void;
  syncOfflineQueue: () => void;
  dismissNotification: (id: string) => void;
  triggerEmergencyAlert: (patientId: string) => void;
  updateBedStatus: (bedId: string, newStatus: "occupied" | "available" | "cleaning", patientName?: string) => void;
  addEmergencyBed: (department: string) => void;
  sanitizeAllCleaningBeds: () => void;
}

// --- JS PORT OF PREDICTIVE RISK ENGINE ---
const runRiskAnalysis = (vitals: VitalSign[], compliance: number, age: number = 72) => {
  if (vitals.length === 0) return { riskLevel: "LOW" as const, probability: 0.05, explanation: "Stable reference parameters.", suggestions: "Maintain daily wearable tracking." };
  
  const latest = vitals[vitals.length - 1];
  let score = 0;
  let explanations: string[] = [];
  let suggestions: string[] = [];
  
  if (latest.spO2 < 90) {
    score += 0.45;
    explanations.push(`Severe hypoxia (SpO2: ${latest.spO2}%).`);
    suggestions.push("Emergency supplemental O2 required immediately.");
  } else if (latest.spO2 < 94) {
    score += 0.25;
    explanations.push(`Borderline hypoxia (SpO2: ${latest.spO2}%).`);
    suggestions.push("Conduct cardiopulmonary assessment.");
  }
  
  if (latest.systolicBp >= 170 || latest.diastolicBp >= 110) {
    score += 0.35;
    explanations.push(`Hypertensive urgency detected (${latest.systolicBp}/${latest.diastolicBp} mmHg).`);
    suggestions.push("Administer rapid antihypertensive and hold salt intake.");
  } else if (latest.systolicBp >= 140) {
    score += 0.12;
    explanations.push("Stage 2 hypertension strain.");
    suggestions.push("Adjust angiotensin blocker dosages.");
  }
  
  if (latest.heartRate > 110) {
    score += 0.25;
    explanations.push(`Tachycardia (HR: ${latest.heartRate} bpm).`);
    suggestions.push("Perform electrocardiogram (ECG) validation.");
  } else if (latest.heartRate < 50) {
    score += 0.20;
    explanations.push(`Bradycardia (HR: ${latest.heartRate} bpm).`);
    suggestions.push("Hold Metoprolol dose and test response.");
  }
  
  if (compliance < 65) {
    score += 0.30;
    explanations.push(`High non-adherence rate (${compliance}% compliance).`);
    suggestions.push("Initiate caregiver voice alert.");
  }
  
  const probability = Math.min(0.99, Math.max(0.02, score * (1.0 + (age - 50) * 0.01)));
  let riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
  
  if (probability >= 0.70) riskLevel = "CRITICAL";
  else if (probability >= 0.42) riskLevel = "HIGH";
  else if (probability >= 0.18) riskLevel = "MEDIUM";
  
  if (explanations.length === 0) {
    explanations.push("Standard physiological baselines maintained.");
    suggestions.push("Routine monitoring active.");
  }
  
  return {
    riskLevel,
    probability,
    explanation: explanations.join(" AND "),
    suggestions: suggestions.join(" | ")
  };
};

// --- MOCK SEED INITIALIZER ---
const generateSeedData = () => {
  const doctors = [
    { id: "doc-1", fullName: "Dr. Robert Chen", specialty: "Cardiologist", department: "Cardio-ICU" },
    { id: "doc-2", fullName: "Dr. Sarah Gomez", specialty: "Pulmonologist", department: "Respiratory Ward" },
    { id: "doc-3", fullName: "Dr. Marcus Patel", specialty: "Emergency Physician", department: "Emergency Care" },
    { id: "doc-4", fullName: "Dr. Elena Miller", specialty: "Internalist", department: "General Ward" }
  ];

  const patientNames = [
    { first: "Arthur", last: "Pendleton", dob: "1948-03-12", gender: "Male", blood: "O+" }, // Case 1: Heart failure
    { first: "Elena", last: "Sterling", dob: "1965-11-20", gender: "Female", blood: "A+" },  // Case 2: OCR Potassium
    { first: "Carol", last: "Vance", dob: "1956-07-04", gender: "Female", blood: "B+" },      // Case 3: Voice journal
    { first: "Liam", last: "Cross", dob: "1988-02-14", gender: "Male", blood: "AB+" },       // Recovery Case
    { first: "Sophia", last: "Rhodes", dob: "1972-09-30", gender: "Female", blood: "O-" },
    { first: "Noah", last: "Harker", dob: "1942-05-18", gender: "Male", blood: "O+" },
    { first: "Emma", last: "Devereaux", dob: "1961-08-05", gender: "Female", blood: "A-" },
    { first: "Oliver", last: "McKinley", dob: "1950-12-12", gender: "Male", blood: "B-" }
  ];

  // Create 102 Patients
  const patients: PatientProfile[] = [];
  
  for (let i = 0; i < 102; i++) {
    const isSpecialCase = i < 4;
    const nameSeed = isSpecialCase ? patientNames[i] : {
      first: patientNames[i % patientNames.length].first + `-${i}`,
      last: patientNames[i % patientNames.length].last,
      dob: `${1940 + (i % 50)}-0${(i % 9) + 1}-${10 + (i % 18)}`,
      gender: i % 2 === 0 ? "Male" : "Female",
      blood: "O+"
    };
    
    const id = `pat-${i + 1}`;
    
    // Core details
    const fullName = `${nameSeed.first} ${nameSeed.last}`;
    const dob = nameSeed.dob;
    const gender = nameSeed.gender;
    const bloodType = nameSeed.blood;
    
    // Seed Vitals history
    const vitals: VitalSign[] = [];
    const baseTime = Date.now() - 10 * 24 * 60 * 60 * 1000;
    
    for (let j = 0; j < 12; j++) {
      let hr = 68 + Math.floor(Math.sin(j) * 5) + (i === 0 && j > 8 ? 25 : 0);
      let sbp = 118 + Math.floor(Math.sin(j * 0.8) * 8) + (i === 0 && j > 8 ? 32 : 0);
      let dbp = 75 + Math.floor(Math.sin(j * 0.8) * 5) + (i === 0 && j > 8 ? 12 : 0);
      let spO2 = 98 - (i === 0 && j > 8 ? 7 : 0);
      let steps = 7000 + Math.floor(Math.cos(j) * 1500) - (i === 0 && j > 8 ? 4000 : 0);
      let mood = 8 - (i === 0 && j > 8 ? 3 : 0);
      let stress = 3 + (i === 0 && j > 8 ? 5 : 0);
      
      // Carol Vance (Voice journal Case) deterioration at last index
      if (i === 2 && j === 11) {
        hr = 92;
        spO2 = 93;
        stress = 7.5;
        mood = 4;
      }
      
      vitals.push({
        id: `vit-${id}-${j}`,
        timestamp: new Date(baseTime + j * 16 * 60 * 60 * 1000).toISOString(),
        heartRate: hr,
        systolicBp: sbp,
        diastolicBp: dbp,
        spO2: spO2,
        temperature: 36.6 + Math.sin(j) * 0.2,
        sleepHours: 7.2 + Math.cos(j) * 0.8,
        moodRating: mood,
        stressLevel: stress,
        steps: Math.max(500, steps)
      });
    }
    
    // Compliance logic
    let compliance = 88;
    if (i === 0) compliance = 55; // Arthur Pendleton compliance drop
    
    // Medications
    const medications: Medication[] = [
      {
        id: `med-${id}-1`,
        name: i === 0 ? "Carvedilol (Beta Blocker)" : i === 1 ? "Losartan (ARB)" : "Lisinopril (ACE Inhibitor)",
        dosage: i === 0 ? "12.5 mg" : "50 mg",
        frequency: "Twice Daily",
        startDate: "2026-01-10T08:00:00Z",
        endDate: "2026-12-30T08:00:00Z",
        doctorName: doctors[i % doctors.length].fullName,
        active: true
      }
    ];
    
    // Logs
    const medicationLogs: MedicationLog[] = [];
    for (let d = 0; d < 8; d++) {
      const taken = i === 0 ? (d < 4 ? true : d % 2 === 0) : Math.random() > 0.12;
      medicationLogs.push({
        id: `log-${id}-${d}`,
        medicationId: medications[0].id,
        timestamp: new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString(),
        taken,
        notes: !taken ? "Patient forgot evening dose" : undefined
      });
    }
    
    // Risk Engine Calc
    const riskData = runRiskAnalysis(vitals, compliance, 2026 - parseInt(dob.split("-")[0]));
    
    const healthScore = i === 0 ? 38 : i === 2 ? 45 : 100 - Math.round(riskData.probability * 100);
    const riskScore = Math.round(riskData.probability * 100);
    
    // Timeline
    const timeline: TimelineEvent[] = [
      {
        id: `evt-${id}-1`,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        category: "doctor_note",
        title: "Initial Care Team Consult",
        description: "Patient baseline cardiology profiles registered. Remote telemetry streams connected.",
        doctorName: doctors[i % doctors.length].fullName
      }
    ];
    
    if (i === 0) {
      // Add medication warning logs to Arthur
      timeline.push({
        id: `evt-${id}-2`,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        category: "emergency",
        title: "AI Compliance Deterioration Flag",
        description: "Medication compliance fell to critical levels (55%). Core heart failure control at hazard."
      });
    }
    
    if (i === 1) {
      // Seed OCR event to Elena Sterling
      timeline.push({
        id: `evt-${id}-ocr`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: "ocr",
        title: "OCR Laboratory Analysis Extracted",
        description: "Ingested biochemistry report from LabCorp showing acute Potassium imbalance.",
        details: {
          parsedFields: {
            potassium: { value: 5.8, unit: "mEq/L", normalRange: "3.5 - 5.1" },
            creatinine: { value: 1.4, unit: "mg/dL", normalRange: "0.6 - 1.2" }
          },
          anomalies: ["Hyperkalemia detected (Potassium: 5.8 mEq/L). Risk of cardiac arrhythmia."]
        }
      });
    }
    
    if (i === 2) {
      // Seed Voice Journal event to Carol Vance
      timeline.push({
        id: `evt-${id}-voice`,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        category: "voice_journal",
        title: "Voice Health Journal Ingested",
        description: "Vocal recording transcript flags Orthopnea and acute respiratory dyspnea.",
        details: {
          symptoms: ["dyspnea", "orthopnea"],
          severity: "HIGH",
          vocalBiomarkers: { voiceStressIndex: 7.2, pauses: 2.3 }
        }
      });
    }
    
    patients.push({
      id,
      fullName,
      dob,
      gender,
      bloodType,
      allergies: i % 8 === 0 ? "Penicillin" : "None reported",
      emergencyContact: `Family Relative ${nameSeed.first}`,
      emergencyPhone: `555-01${i.toString().padStart(2, "0")}`,
      healthScore,
      recoveryScore: i === 3 ? 91 : 82,
      riskScore,
      complianceScore: compliance,
      mentalWellnessScore: i === 0 ? 50 : 80,
      twinSummary: i === 0 
        ? "CRITICAL ALERT: Cardiac decompensation indicator triggers. SpO2 hypoxia trend detected alongside Metoprolol non-adherence." 
        : i === 1
        ? "HIGH RISK: Renal clearance decline with hyperkalemia verified by OCR analysis."
        : i === 2
        ? "HIGH RISK: Acute vocal journal distress registers dyspnea and sleep posture discomfort."
        : "System operational. Parameters inside standard deviation models.",
      vitals,
      medications,
      medicationLogs,
      timeline,
      predictions: [
        {
          id: `pred-${id}-1`,
          timestamp: new Date().toISOString(),
          riskLevel: riskData.riskLevel,
          predictionType: "deterioration",
          probability: riskData.probability,
          explanation: riskData.explanation,
          suggestions: riskData.suggestions
        }
      ],
      insights: i === 0 ? [
        {
          id: `ins-${id}-1`,
          timestamp: new Date().toISOString(),
          category: "vital_anomaly",
          text: "Critical cardiovascular load alert. Pulse and pressure parameters trending upward with hypoxemia.",
          resolved: false
        }
      ] : [],
      simulations: []
    });
  }
  
  // Create 50 Beds
  const beds: HospitalBed[] = [];
  const departments = ["ICU", "Cardiology", "Pulmonology", "Neurology", "General Ward", "Emergency Care"] as const;
  
  let bedPatIdx = 4;
  for (let d = 0; d < departments.length; d++) {
    const dept = departments[d];
    const maxBeds = dept === "ICU" || dept === "Cardiology" ? 6 : 10;
    
    for (let r = 1; r <= 3; r++) {
      for (let b = 1; b <= (maxBeds / 3); b++) {
        const occupied = Math.random() < 0.76;
        let pName: string | undefined = undefined;
        
        if (occupied && bedPatIdx < patients.length) {
          pName = patients[bedPatIdx].fullName;
          bedPatIdx++;
        }
        
        // Place Arthur Pendleton (Patient 0) in Cardiogy ICU Room 01 Bed 1
        let finalOccupied = occupied;
        if (dept === "Cardiology" && r === 1 && b === 1) {
          finalOccupied = true;
          pName = "Arthur Pendleton";
        }
        
        beds.push({
          id: `bed-${dept}-${r}-${b}`,
          department: dept,
          roomNumber: `Room-${r.toString().padStart(2, "0")}`,
          bedNumber: `Bed-${b}`,
          status: finalOccupied ? "occupied" : Math.random() > 0.85 ? "cleaning" : "available",
          patientName: pName
        });
      }
    }
  }
  
  const outbreaks: Record<string, EpidemicData> = {
    "Influenza A": { name: "Influenza A", cases: 240, trend: "rising", color: "#f59e0b" },
    "Gastroenteritis": { name: "Gastroenteritis", cases: 85, trend: "stable", color: "#6b7280" },
    "COVID-19 (Omicron)": { name: "COVID-19 (Omicron)", cases: 312, trend: "declining", color: "#10b981" },
    "HFMD (Pediatric)": { name: "HFMD (Pediatric)", cases: 45, trend: "rising", color: "#f43f5e" }
  };
  
  const regions: RegionMetric[] = [
    { district: "North District", population: 240000, influenzaRate: 4.82, emergencyWaitMinutes: 28, pharmacyStockPercent: 82 },
    { district: "Central Valley", population: 310000, influenzaRate: 2.10, emergencyWaitMinutes: 18, pharmacyStockPercent: 91 },
    { district: "East Coast", population: 180000, influenzaRate: 1.54, emergencyWaitMinutes: 15, pharmacyStockPercent: 96 },
    { district: "South Bay", population: 290000, influenzaRate: 5.68, emergencyWaitMinutes: 52, pharmacyStockPercent: 68 }, // Stock dip
    { district: "Metropolitan", population: 490000, influenzaRate: 3.42, emergencyWaitMinutes: 44, pharmacyStockPercent: 78 }
  ];
  
  const auditLogs: AuditRecord[] = [
    { id: "aud-1", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), username: "dr_chen_1", action: "VIEW_TWIN", details: "Accessed Arthur Pendleton's Digital Twin telemetry" },
    { id: "aud-2", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), username: "dr_chen_1", action: "SIMULATE_TREATMENT", details: "Simulated Metoprolol titration on Patient Arthur Pendleton" }
  ];

  return { patients, doctors, beds, outbreaks, regions, auditLogs };
};

// --- INITIALIZE ZUSTAND STORE ---
export const useSentinelStore = create<SentinelState>((set, get) => {
  const seeds = generateSeedData();
  
  return {
    // Initial Session
    currentRole: "guest",
    currentUser: null,
    activePatientId: null,
    
    // Initial Seed Data
    patients: seeds.patients,
    doctors: seeds.doctors,
    beds: seeds.beds,
    outbreaks: seeds.outbreaks,
    regions: seeds.regions,
    auditLogs: seeds.auditLogs,
    offlineQueue: [],
    isOffline: false,
    theme: "dark",
    
    toggleTheme: () => {
      set(state => {
        const nextTheme = state.theme === "dark" ? "light" : "dark";
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", nextTheme);
        }
        return { theme: nextTheme };
      });
    },

    registerUser: (role, userData) => {
      const systemIdPrefix =
        role === "patient" ? "MIN-PAT" :
        role === "doctor" ? "DEA-DOC" :
        role === "hospital_admin" ? "INF-HOSP" : "GOV-INTEL";
      
      const systemId = `${systemIdPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
      const passcode = `SENTINEL-${Math.floor(1000 + Math.random() * 9000)}`;

      set(state => {
        const newUserId = `user-reg-${Date.now()}`;
        const userSession: UserSession = {
          id: newUserId,
          username: userData.username || userData.email.split('@')[0],
          email: userData.email,
          fullName: userData.fullName,
          role
        };

        let newPatients = [...state.patients];
        let newDoctors = [...state.doctors];
        let activePatientId = state.activePatientId;

        if (role === "patient") {
          const newPatientId = `pat-reg-${Date.now()}`;
          activePatientId = newPatientId;

          const newPatient: PatientProfile = {
            id: newPatientId,
            fullName: userData.fullName,
            dob: userData.dob || "1998-06-15",
            gender: userData.gender || "Unspecified",
            bloodType: userData.bloodType || "O+",
            allergies: userData.allergies || "None reported",
            emergencyContact: userData.emergencyContact || "Emergency Contact",
            emergencyPhone: userData.emergencyPhone || "555-0199",
            healthScore: 88,
            recoveryScore: 90,
            riskScore: 12,
            complianceScore: 100,
            mentalWellnessScore: 85,
            twinSummary: `New Digital Twin scaffolded for ${userData.fullName}. System ID: ${systemId}.`,
            vitals: [
              {
                id: `vit-${newPatientId}-init`,
                timestamp: new Date().toISOString(),
                heartRate: 72,
                systolicBp: 120,
                diastolicBp: 80,
                spO2: 98,
                temperature: 36.6,
                sleepHours: 7.5,
                moodRating: 8,
                stressLevel: 3,
                steps: 5000
              }
            ],
            medications: [
              {
                id: `med-${newPatientId}-init`,
                name: "Daily Preventive Vitamin C",
                dosage: "500 mg",
                frequency: "Once Daily",
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
                doctorName: "Dr. Robert Chen",
                active: true
              }
            ],
            medicationLogs: [],
            timeline: [
              {
                id: `evt-${newPatientId}-init`,
                timestamp: new Date().toISOString(),
                category: "doctor_note",
                title: "Digital Twin Account Registered",
                description: `Patient account for ${userData.fullName} registered with System ID ${systemId}.`
              }
            ],
            predictions: [
              {
                id: `pred-${newPatientId}-init`,
                timestamp: new Date().toISOString(),
                riskLevel: "LOW",
                predictionType: "deterioration",
                probability: 0.12,
                explanation: "Initial registration telemetry baseline normal.",
                suggestions: "Maintain routine health tracking and wear device."
              }
            ],
            insights: [],
            simulations: []
          };

          newPatients = [newPatient, ...newPatients];
        } else if (role === "doctor") {
          newDoctors = [
            {
              id: `doc-reg-${Date.now()}`,
              fullName: userData.fullName,
              specialty: userData.specialty || "General Practitioner",
              department: userData.department || "Internal Medicine"
            },
            ...newDoctors
          ];
        }

        const newAudit: AuditRecord = {
          id: `aud-reg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          username: userData.username || userData.email,
          action: "USER_REGISTRATION",
          details: `Registered new ${role.toUpperCase()} account (${systemId}) for ${userData.fullName}`
        };

        return {
          currentRole: role,
          currentUser: userSession,
          activePatientId: activePatientId || (newPatients[0] ? newPatients[0].id : null),
          patients: newPatients,
          doctors: newDoctors,
          auditLogs: [newAudit, ...state.auditLogs]
        };
      });

      return { systemId, passcode };
    },

    // Emergency Notifications
    notifications: [
      {
        id: "notif-1",
        timestamp: new Date().toISOString(),
        type: "critical",
        title: "Emergency Telemetry Warning",
        text: "Arthur Pendleton (Cardio-ICU Bed 1) reports cardiac compliance at 55% alongside arterial hypoxia (SpO2: 91%).",
        patientId: "pat-1"
      }
    ],
    
    activeSimParams: null,
    
    // Auth Role Switcher
    setRole: (role, patientId) => {
      let user: UserSession | null = null;
      let activeId = patientId || null;
      
      if (role === "patient") {
        user = { id: "user-pat-1", username: "pat_arthur_1", email: "arthur@sentinel.me", fullName: "Arthur Pendleton", role: "patient" };
        activeId = "pat-1"; // Defaults to Arthur
      } else if (role === "doctor") {
        user = { id: "user-doc-1", username: "dr_robert_chen", email: "chen@sentinelhealth.org", fullName: "Dr. Robert Chen", role: "doctor" };
      } else if (role === "hospital_admin") {
        user = { id: "user-hosp-1", username: "admin_sentinel", email: "admin@sentinelhealth.org", fullName: "Director Sarah Croft", role: "hospital_admin" };
      } else if (role === "government_admin") {
        user = { id: "user-gov-1", username: "gov_health_intel", email: "intel@cdc.gov", fullName: "Commissioner Raymond Vance", role: "government_admin" };
      }
      
      set({ currentRole: role, currentUser: user, activePatientId: activeId });
      
      // Audit log entry
      if (user) {
        const newAudit: AuditRecord = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          username: user.username,
          action: "ROLE_AUTHENTICATION",
          details: `Authenticated as ${role.toUpperCase()} (Session started)`
        };
        set(state => ({ auditLogs: [newAudit, ...state.auditLogs] }));
      }
    },
    
    // Ingest Vitals
    addVitals: (patientId, vitalData) => {
      const { isOffline, offlineQueue } = get();
      
      if (isOffline) {
        const offlineAct: OfflineAction = {
          id: `off-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "ADD_VITALS",
          payload: { patientId, vitalData }
        };
        set({ offlineQueue: [...offlineQueue, offlineAct] });
        return;
      }
      
      set(state => {
        const patients = state.patients.map(p => {
          if (p.id !== patientId) return p;
          
          const newVital: VitalSign = {
            id: `vit-${patientId}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...vitalData
          };
          
          const updatedVitals = [...p.vitals, newVital];
          
          // Re-evaluate compliance (med logs count)
          const takenLogs = p.medicationLogs.filter(l => l.taken).length;
          const totalLogs = p.medicationLogs.length;
          const compliance = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 90;
          
          // AI Predictive analysis
          const age = 2026 - parseInt(p.dob.split("-")[0]);
          const riskAnalysis = runRiskAnalysis(updatedVitals, compliance, age);
          
          const riskScore = Math.round(riskAnalysis.probability * 100);
          const healthScore = Math.max(10, 100 - riskScore - Math.round(vitalData.stressLevel));
          
          const updatedPrediction: Prediction = {
            id: `pred-${patientId}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            riskLevel: riskAnalysis.riskLevel,
            predictionType: "deterioration",
            probability: riskAnalysis.probability,
            explanation: riskAnalysis.explanation,
            suggestions: riskAnalysis.suggestions
          };
          
          // Add clinical alert if critical
          let notifications = state.notifications;
          if (riskAnalysis.riskLevel === "CRITICAL" || riskAnalysis.riskLevel === "HIGH") {
            const hasNotif = notifications.some(n => n.patientId === patientId && n.type === "critical");
            if (!hasNotif) {
              notifications = [{
                id: `notif-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: "critical",
                title: `Vital Instability Alert`,
                text: `${p.fullName} risk rating elevated to ${riskAnalysis.riskLevel} (${riskScore}%). explanation: ${riskAnalysis.explanation}`,
                patientId: p.id
              }, ...notifications];
            }
          }
          
          const newTimeline: TimelineEvent = {
            id: `evt-${patientId}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: "vital",
            title: "Wearable Physiological Stream Logged",
            description: `Pulse: ${vitalData.heartRate} bpm, O2 saturation: ${vitalData.spO2}%, BP: ${vitalData.systolicBp}/${vitalData.diastolicBp} mmHg.`
          };
          
          return {
            ...p,
            vitals: updatedVitals,
            healthScore,
            riskScore,
            complianceScore: compliance,
            mentalWellnessScore: Math.round(vitalData.moodRating * 10),
            twinSummary: `Vitals update processed at ${new Date().toLocaleTimeString()}. risk probability: ${riskScore}%. ${riskAnalysis.explanation}`,
            predictions: [updatedPrediction, ...p.predictions],
            timeline: [newTimeline, ...p.timeline]
          };
        });
        
        return { patients };
      });
    },
    
    // AI Treatment Simulation
    runSimulation: (patientId, intervention, targetParams) => {
      set(state => {
        const patients = state.patients.map(p => {
          if (p.id !== patientId) return p;
          
          let projectedScore = p.healthScore;
          let efficacyRating = 0.5;
          let notes = "";
          
          if (intervention === "drug_adjustment") {
            const dosage = targetParams.dosage_change;
            if (dosage === "increase") {
              projectedScore += 8;
              efficacyRating = 0.82;
              notes = "Decreases myocardial overload load. Compensates systolic pressure back to stable target ranges.";
            } else if (dosage === "add_new") {
              projectedScore += 12;
              efficacyRating = 0.90;
              notes = "Addition of ACE Inhibitor mitigates cardiac hypertrophy remodeling and controls peripheral arterial resistance.";
            } else {
              projectedScore -= 10;
              efficacyRating = 0.15;
              notes = "Withholding pharmacologic beta blockade precipitates tachycardia spike and elevations in pulmonary pressure.";
            }
          } else if (intervention === "exercise_program") {
            const steps = targetParams.steps_increase || 3000;
            projectedScore += Math.round(steps / 1000) * 1.5;
            efficacyRating = 0.75;
            notes = "Aerobic cardiac loading initiates vagal tone upregulation and improves systemic peripheral perfusion index.";
          }
          
          projectedScore = Math.max(10, Math.min(100, projectedScore));
          
          const newSim: SimulationRun = {
            id: `sim-${Date.now()}`,
            timestamp: new Date().toISOString(),
            interventionType: intervention,
            targetParams,
            projectedHealthScore: projectedScore,
            efficacyRating,
            durationDays: targetParams.duration_days || 30,
            notes
          };
          
          const newTimeline: TimelineEvent = {
            id: `evt-sim-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: "doctor_note",
            title: `Treatment Simulation Ran: ${intervention === "drug_adjustment" ? "Beta Blocker Mod" : "Cardiac Loading"}`,
            description: `AI Projection: projected health score rises to ${projectedScore}% (Efficacy: ${Math.round(efficacyRating*100)}%). ${notes}`
          };
          
          return {
            ...p,
            simulations: [newSim, ...p.simulations],
            timeline: [newTimeline, ...p.timeline]
          };
        });
        
        // Log audit
        const newAudit: AuditRecord = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          username: state.currentUser?.username || "system",
          action: "SIMULATE_TREATMENT",
          details: `Simulated treatment intervention (${intervention}) on patient ${patientId}`
        };
        
        return { patients, auditLogs: [newAudit, ...state.auditLogs] };
      });
    },
    
    // OCR Medical Document Parser
    processOCRUpload: (patientId, docText) => {
      set(state => {
        const textLower = docText.toLowerCase();
        let val = 4.2;
        let isAnomaly = false;
        
        if (textLower.includes("potassium") || textLower.includes("k+")) {
          if (textLower.includes("high") || textLower.includes("5.8")) {
            val = 5.8;
            isAnomaly = true;
          }
        }
        
        const patients = state.patients.map(p => {
          if (p.id !== patientId) return p;
          
          const newEvent: TimelineEvent = {
            id: `evt-ocr-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: "ocr",
            title: "OCR Laboratory Analysis Extracted",
            description: isAnomaly 
              ? `Ingested Chemistry report from LabCorp. CRITICAL: Potassium 5.8 mEq/L exceeds normal threshold (3.5 - 5.1).`
              : `Ingested Biochemistry Chemistry report. All levels within baseline standard ranges.`
          };
          
          let insights = p.insights;
          let predictions = p.predictions;
          let riskScore = p.riskScore;
          let healthScore = p.healthScore;
          let twinSummary = p.twinSummary;
          
          if (isAnomaly) {
            insights = [{
              id: `ins-ocr-${Date.now()}`,
              timestamp: new Date().toISOString(),
              category: "vital_anomaly",
              text: "Potassium 5.8 mEq/L (Hyperkalemia) verified via OCR upload. Requires urgent ECG verification.",
              resolved: false
            }, ...insights];
            
            riskScore = Math.min(98, riskScore + 30);
            healthScore = Math.max(10, healthScore - 20);
            twinSummary = `HIGH RISK. Metabolic panel anomalies (Potassium: 5.8 mEq/L). Cardiac excitability hazard flagged.`;
            
            predictions = [{
              id: `pred-ocr-${Date.now()}`,
              timestamp: new Date().toISOString(),
              riskLevel: "HIGH",
              predictionType: "deterioration",
              probability: 0.62,
              explanation: "OCR extracted serum Potassium of 5.8 mEq/L indicates moderate Hyperkalemia. Increases risk of fatal ventricular arrhythmias.",
              suggestions: "Order 12-lead ECG. Administer potassium binder (SPS or Lokelma). Check renal functions (Creatinine)."
            }, ...predictions];
          }
          
          return {
            ...p,
            timeline: [newEvent, ...p.timeline],
            insights,
            predictions,
            riskScore,
            healthScore,
            twinSummary
          };
        });
        
        const patient = state.patients.find(p => p.id === patientId);
        let notifications = state.notifications;
        if (isAnomaly && patient) {
          notifications = [{
            id: `notif-ocr-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: "critical",
            title: "OCR Biomarker Anomaly",
            text: `High potassium (5.8 mEq/L) extracted for ${patient.fullName}. Risk level elevated to HIGH.`,
            patientId
          }, ...notifications];
        }
        
        return { patients, notifications };
      });
    },
    
    // Voice Symptomatic analysis
    submitVoiceJournal: (patientId, transcript) => {
      set(state => {
        const textLower = transcript.toLowerCase();
        let symptoms: string[] = [];
        let clinicalNote = "";
        let isDecompensating = false;
        
        if (textLower.includes("breath") || textLower.includes("breathing") || textLower.includes("dyspnea")) {
          symptoms.push("Dyspnea");
          clinicalNote = "Respiratory pause dyspnea symptoms noted. ";
        }
        if (textLower.includes("pillow") || textLower.includes("flat") || textLower.includes("orthopnea")) {
          symptoms.push("Orthopnea");
          clinicalNote += "Classic Orthopnea posture constraints. Suggests pulmonary venous congestion.";
          isDecompensating = true;
        }
        if (textLower.includes("chest") || textLower.includes("pain") || textLower.includes("angina")) {
          symptoms.push("Chest Angina");
          clinicalNote += "Myocardial ischemia warning indicators. Needs urgent ECG.";
          isDecompensating = true;
        }
        
        const patients = state.patients.map(p => {
          if (p.id !== patientId) return p;
          
          const newEvent: TimelineEvent = {
            id: `evt-voice-${Date.now()}`,
            timestamp: new Date().toISOString(),
            category: "voice_journal",
            title: "Voice Health Journal Ingested",
            description: `Analyzed transcript: "${transcript.slice(0, 70)}...". Extracted Symptoms: ${symptoms.join(", ") || "None"}`,
            details: {
              symptoms,
              vocalStressIndex: isDecompensating ? 7.6 : 3.8,
              respiratoryRate: isDecompensating ? 24 : 16
            }
          };
          
          let insights = p.insights;
          let predictions = p.predictions;
          let riskScore = p.riskScore;
          let healthScore = p.healthScore;
          let twinSummary = p.twinSummary;
          
          if (isDecompensating) {
            insights = [{
              id: `ins-voice-${Date.now()}`,
              timestamp: new Date().toISOString(),
              category: "compliance_risk",
              text: `Voice telemetry indicates acute cardiac congestion indicators: ${symptoms.join(", ")}`,
              resolved: false
            }, ...insights];
            
            riskScore = Math.min(99, riskScore + 35);
            healthScore = Math.max(10, healthScore - 25);
            twinSummary = `HIGH RISK. Voice journal indicates cardio-respiratory distress. ${clinicalNote}`;
            
            predictions = [{
              id: `pred-voice-${Date.now()}`,
              timestamp: new Date().toISOString(),
              riskLevel: "HIGH",
              predictionType: "deterioration",
              probability: 0.78,
              explanation: `Vocal speech patterns and symptom transcript matches acute Congestive Heart Failure decompensation class. Breath pauses detected.`,
              suggestions: "Order urgent chest X-ray and NT-proBNP. Titrate loop diuretic (Furosemide). Instruct daily weight check."
            }, ...predictions];
          }
          
          return {
            ...p,
            timeline: [newEvent, ...p.timeline],
            insights,
            predictions,
            riskScore,
            healthScore,
            twinSummary
          };
        });
        
        const patient = state.patients.find(p => p.id === patientId);
        let notifications = state.notifications;
        if (isDecompensating && patient) {
          notifications = [{
            id: `notif-voice-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: "critical",
            title: "Vocal Symptom Warning",
            text: `${patient.fullName} voice journal reports ${symptoms.join(" and ")}. Potential pulmonary congestion alert.`,
            patientId
          }, ...notifications];
        }
        
        return { patients, notifications };
      });
    },
    
    // Offline Engine
    toggleOfflineMode: () => {
      set(state => {
        const nextOffline = !state.isOffline;
        
        if (nextOffline) {
          // Trigger critical alert for patient application showing offline mode active
          const offlineNotif = {
            id: `notif-off-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: "warning" as const,
            title: "Offline Emergency Mode Active",
            text: "Sentinel Health has entered local offline mode. Telemetry edits and logs will queue locally. System maps and diagnostics remain active."
          };
          return { isOffline: nextOffline, notifications: [offlineNotif, ...state.notifications] };
        } else {
          // Sync automatically when reconnecting
          setTimeout(() => {
            get().syncOfflineQueue();
          }, 100);
          return { isOffline: nextOffline };
        }
      });
    },
    
    syncOfflineQueue: () => {
      const { offlineQueue } = get();
      if (offlineQueue.length === 0) return;
      
      logger.info(`Synchronizing ${offlineQueue.length} offline operations...`);
      
      // Execute each action locally
      offlineQueue.forEach(action => {
        if (action.type === "ADD_VITALS") {
          get().addVitals(action.payload.patientId, action.payload.vitalData);
        }
      });
      
      const newAudit: AuditRecord = {
        id: `aud-sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: get().currentUser?.username || "system",
        action: "OFFLINE_SYNC",
        details: `Synchronized ${offlineQueue.length} queued vital operations back to cloud servers.`
      };
      
      // Clear queue
      set({ 
        offlineQueue: [], 
        auditLogs: [newAudit, ...get().auditLogs],
        notifications: [{
          id: `notif-sync-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "ai" as const,
          title: "Offline Synced",
          text: "Local queued events successfully reconciled and pushed to the cloud core databases."
        }, ...get().notifications]
      });
    },
    
    dismissNotification: (id) => {
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    },
    
    triggerEmergencyAlert: (patientId) => {
      set(state => {
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient) return state;
        
        // Add to emergency logs
        const newEvent: TimelineEvent = {
          id: `evt-em-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: "emergency",
          title: "CRITICAL PANIC TRIGGERED",
          description: "Patient pressed emergency SOS button. Dispatching nearby Emergency Response units."
        };
        
        // Push ICU bed to occupied or cleaning
        const updatedBeds = state.beds.map(b => {
          if (b.department === "Emergency Care" && b.status === "available") {
            return { ...b, status: "occupied" as const, patientName: patient.fullName };
          }
          return b;
        });
        
        const updatedPatients = state.patients.map(p => {
          if (p.id !== patientId) return p;
          return {
            ...p,
            riskScore: 99,
            healthScore: 10,
            timeline: [newEvent, ...p.timeline]
          };
        });
        
        const emergencyNotif = {
          id: `notif-em-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "critical" as const,
          title: "SOS CRITICAL ALERT",
          text: `${patient.fullName} initiated Emergency SOS panic button. Dispatching cardiac responders. Routing to Emergency Care.`,
          patientId
        };
        
        return {
          patients: updatedPatients,
          beds: updatedBeds,
          notifications: [emergencyNotif, ...state.notifications]
        };
      });
    },

    updateBedStatus: (bedId, newStatus, patientName) => {
      set(state => ({
        beds: state.beds.map(b => 
          b.id === bedId 
            ? { ...b, status: newStatus, patientName: newStatus === "occupied" ? (patientName || b.patientName || "Assigned Patient") : undefined }
            : b
        )
      }));
    },

    addEmergencyBed: (department) => {
      set(state => {
        const newBedId = `bed-em-${Date.now()}`;
        const newBed = {
          id: newBedId,
          department: department || "ICU",
          roomNumber: `Room-${Math.floor(Math.random()*10 + 1)}`,
          bedNumber: `Bed-${Math.floor(Math.random()*20 + 10)}`,
          status: "available" as const
        };
        return { beds: [...state.beds, newBed] };
      });
    },

    sanitizeAllCleaningBeds: () => {
      set(state => ({
        beds: state.beds.map(b => b.status === "cleaning" ? { ...b, status: "available" as const, patientName: undefined } : b)
      }));
    }
  };
});
