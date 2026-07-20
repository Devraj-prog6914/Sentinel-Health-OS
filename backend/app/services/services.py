import math
import random
from typing import List, Dict, Any, Optional
from datetime import datetime

class PredictiveRiskEngine:
    """
    Predictive Risk Engine for Sentinel Health.
    Analyzes historical vitals, stress, sleep, and compliance to project deterioration and hospitalization risks.
    Provides rigorous, clinical Explainable AI (XAI) justifications.
    """
    
    @staticmethod
    def calculate_risk(
        vitals: List[Dict[str, Any]], 
        compliance_rate: float, 
        age: int = 65
    ) -> Dict[str, Any]:
        if not vitals:
            return {
                "risk_level": "LOW",
                "probability": 0.05,
                "explanation": "Insufficient vital sign telemetry history to construct predictive risk projections.",
                "suggestions": "Establish consistent vitals tracking via connected wearable device."
            }
        
        # Take the most recent readings
        latest = vitals[-1]
        hr = latest.get("heart_rate", 72)
        sbp = latest.get("systolic_bp", 120)
        dbp = latest.get("diastolic_bp", 80)
        spo2 = latest.get("sp_o2", 98)
        temp = latest.get("temperature", 37.0)
        stress = latest.get("stress_level", 3.0)
        sleep = latest.get("sleep_hours", 7.5)
        
        # Calculate risk scores based on physiological thresholds
        risk_score = 0.0
        explanations = []
        suggestions = []
        
        # SpO2 hypoxia markers (High weight)
        if spo2 < 90:
            risk_score += 0.45
            explanations.append(f"Severe hypoxia detected (SpO2: {spo2}%). Immediate oxygenation impairment.")
            suggestions.append("Administer supplemental O2 and alert emergency response.")
        elif spo2 < 93:
            risk_score += 0.25
            explanations.append(f"Mild hypoxia (SpO2: {spo2}%). Borderline pulmonary gas exchange efficiency.")
            suggestions.append("Initiate spirometry checks and request urgent cardiology review.")
            
        # Blood pressure checks (Hypertensive crisis / Shock)
        if sbp >= 180 or dbp >= 120:
            risk_score += 0.40
            explanations.append(f"Hypertensive Crisis (BP: {int(sbp)}/{int(dbp)} mmHg) presents acute stroke and cardiovascular failure risk.")
            suggestions.append("Immediate administration of rapid-acting antihypertensive agent (e.g., intravenous labetalol) under supervision.")
        elif sbp >= 140 or dbp >= 90:
            risk_score += 0.15
            explanations.append(f"Stage 2 Hypertension (BP: {int(sbp)}/{int(dbp)} mmHg) accelerating cardiovascular strain.")
            suggestions.append("Optimize medication regimen. Review dosage compliance of ACE inhibitors.")
        elif sbp < 90 or dbp < 60:
            risk_score += 0.25
            explanations.append(f"Hypotension detected (BP: {int(sbp)}/{int(dbp)} mmHg). Possible hypovolemia or cardiogenic shock risk.")
            suggestions.append("Check hydration status. Perform fluid volume assessment and review beta-blocker doses.")
            
        # Heart rate tachycardia/bradycardia
        if hr > 115:
            risk_score += 0.25
            explanations.append(f"Severe tachycardia (HR: {int(hr)} bpm) causing elevated myocardial oxygen demand.")
            suggestions.append("Review EKG trace for atrial fibrillation or supraventricular tachycardia.")
        elif hr > 95:
            risk_score += 0.10
            explanations.append(f"Moderate tachycardia (HR: {int(hr)} bpm) correlating with physical stress or systemic inflammatory response.")
            suggestions.append("Assess for subclinical infection, dehydration, or emotional stressors.")
        elif hr < 50:
            risk_score += 0.20
            explanations.append(f"Bradycardia (HR: {int(hr)} bpm) raising concern for sinus node dysfunction or drug toxicity.")
            suggestions.append("Assess patient for symptomatic lightheadedness. Hold next beta-blocker dosage.")
            
        # Medication compliance risk
        if compliance_rate < 60:
            risk_score += 0.35
            explanations.append(f"Critical medication non-compliance (adherence: {compliance_rate:.1f}%). Loss of therapeutic blood levels.")
            suggestions.append("Initiate direct-to-patient medication reminders. Notify primary caregiver.")
        elif compliance_rate < 80:
            risk_score += 0.15
            explanations.append(f"Sub-optimal medication compliance (adherence: {compliance_rate:.1f}%). Reduces efficacy of chronic condition control.")
            suggestions.append("Deploy automated SMS prompts. Review adherence barriers (e.g., side effects, complexity).")
            
        # Sleep & stress factors (Lifestyle multipliers)
        if sleep < 5.0:
            risk_score += 0.08
            explanations.append("Extreme sleep deprivation (< 5h) depressing heart rate variability (HRV).")
            suggestions.append("Integrate sleep hygiene guidelines. Assess for obstructive sleep apnea.")
        if stress > 8.0:
            risk_score += 0.08
            explanations.append("Elevated autonomic nervous system stress response accelerating cortisol levels.")
            suggestions.append("Introduce guided biofeedback exercises via patient mobile interface.")
            
        # Apply age multiplier
        age_factor = 1.0 + (max(0, age - 50) * 0.01)
        probability = min(0.99, max(0.01, risk_score * age_factor))
        
        # Risk level categorization
        if probability >= 0.70:
            risk_level = "CRITICAL"
        elif probability >= 0.40:
            risk_level = "HIGH"
        elif probability >= 0.15:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        # Default suggestions if clean bill of health
        if not explanations:
            explanations.append("Physiological parameters reside within standard baseline reference ranges.")
            suggestions.append("Maintain current pharmacological and lifestyle regimen. Re-evaluate monthly.")
            
        return {
            "risk_level": risk_level,
            "probability": round(probability, 3),
            "explanation": " AND ".join(explanations),
            "suggestions": " | ".join(suggestions)
        }


class SimulationEngine:
    """
    Simulates the physiological impact of medical, pharmacological, and lifestyle interventions.
    Projects future states of the Digital Health Twin.
    """
    
    @staticmethod
    def run_simulation(
        current_health_score: int,
        intervention: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates projected health output.
        Intervention cases: 'drug_adjustment', 'exercise_program', 'sleep_optimization', 'stress_reduction'
        """
        projected_score = current_health_score
        efficacy_rating = 0.0
        notes = []
        
        if intervention == "drug_adjustment":
            dosage_change = params.get("dosage_change", "increase") # 'increase', 'decrease', 'add_new'
            drug_class = params.get("drug_class", "beta_blocker")
            compliance_impact = params.get("expected_compliance", 0.90)
            
            if drug_class == "beta_blocker":
                if dosage_change == "increase":
                    projected_score += 8
                    efficacy_rating = 0.85
                    notes.append("Expected to lower chronic hypertensive strain. Restores cardiac load margins.")
                elif dosage_change == "add_new":
                    projected_score += 12
                    efficacy_rating = 0.92
                    notes.append("Initiation of beta-blocker therapy blocks catecholamine cardiotoxicity, boosting long-term ejection fraction.")
                else:
                    projected_score -= 10
                    efficacy_rating = 0.10
                    notes.append("Decreasing beta-blocker risk raising heart rate and sympathetic tone, elevating decompensation risk.")
            
            # Apply compliance penalty
            projected_score = int(projected_score * compliance_impact)
            
        elif intervention == "exercise_program":
            steps_increase = params.get("steps_increase", 3000)
            days_per_week = params.get("days_per_week", 4)
            
            impact = (steps_increase / 1000) * (days_per_week / 7.0) * 2.5
            projected_score += int(impact)
            efficacy_rating = min(0.95, 0.5 + (days_per_week * 0.08))
            notes.append(f"Cardiorespiratory fitness load increased. Promotes myocardial capillarization and improves insulin sensitivity.")
            
        elif intervention == "stress_reduction":
            biofeedback_minutes = params.get("minutes_per_day", 15)
            projected_score += int(biofeedback_minutes * 0.4)
            efficacy_rating = 0.70
            notes.append("Guided vagus nerve stimulation and mindfulness breathing exercises lower baseline cortisol and elevate HRV.")
            
        else:
            projected_score += 3
            efficacy_rating = 0.50
            notes.append("General lifestyle optimization program initiated.")
            
        # Bound scores
        projected_score = max(10, min(100, projected_score))
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "intervention_type": intervention,
            "projected_health_score": projected_score,
            "efficacy_rating": round(efficacy_rating, 2),
            "notes": " ".join(notes)
        }


class MedicalOCRService:
    """
    Mock AI engine representing OCR text ingestion.
    Extracts structured values from unstructured clinical lab PDFs and documents.
    """
    
    @staticmethod
    def parse_document(text: str) -> Dict[str, Any]:
        """
        Ingests messy report text and returns parsed structured biomarkers.
        """
        text_lower = text.lower()
        extracted_data = {}
        anomalies = []
        
        # 1. Potassium
        if "potassium" in text_lower or "k+" in text_lower:
            # Simulate OCR extraction of Potassium
            val = 5.6 if "high potassium" in text_lower else (3.2 if "low potassium" in text_lower else 4.1)
            extracted_data["potassium"] = {"value": val, "unit": "mEq/L", "normal_range": "3.5 - 5.1"}
            if val > 5.1:
                anomalies.append(f"Hyperkalemia detected (Potassium: {val} mEq/L). Risk of cardiac arrhythmia.")
            elif val < 3.5:
                anomalies.append(f"Hypokalemia detected (Potassium: {val} mEq/L). Cardiac excitability hazard.")
                
        # 2. Creatinine (Kidney Function)
        if "creatinine" in text_lower or "scr" in text_lower:
            val = 1.8 if "high creatinine" in text_lower else 0.9
            extracted_data["creatinine"] = {"value": val, "unit": "mg/dL", "normal_range": "0.6 - 1.2"}
            if val > 1.2:
                anomalies.append(f"Elevated Serum Creatinine ({val} mg/dL) indicating impaired glomerular filtration (Stage 2/3 CKD).")
                
        # 3. Hemoglobin
        if "hemoglobin" in text_lower or "hgb" in text_lower:
            val = 9.8 if "low hemoglobin" in text_lower else 14.2
            extracted_data["hemoglobin"] = {"value": val, "unit": "g/dL", "normal_range": "12.0 - 16.0"}
            if val < 12.0:
                anomalies.append(f"Anemia identified (Hemoglobin: {val} g/dL). Reduces oxygen-carrying capacity of red blood cells.")
                
        # Default fallback if nothing matches
        if not extracted_data:
            extracted_data["general_lab"] = {"status": "unstructured_captured", "raw_length": len(text)}
            
        return {
            "parsed_fields": extracted_data,
            "anomalies": anomalies,
            "confidence_score": 0.94 if extracted_data else 0.50,
            "document_type": "LAB_CHEMISTRY_PANEL" if extracted_data else "CLINICAL_DISCHARGE_SUMMARY"
        }


class VoiceIntelligenceService:
    """
    Processes patient audio speech patterns and vocal journal recordings to extract clinical symptoms.
    """
    
    @staticmethod
    def analyze_vocal_journal(transcript: str) -> Dict[str, Any]:
        transcript_lower = transcript.lower()
        symptoms = []
        severity = "LOW"
        clinical_concerns = []
        
        # Symptoms rules
        if any(w in transcript_lower for w in ["breath", "breathing", "pant", "gasp", "shortness of breath", "dyspnea"]):
            symptoms.append("dyspnea")
            clinical_concerns.append("Pulmonary congestion or diminished lung volume excursion.")
            
        if any(w in transcript_lower for w in ["pillow", "elevate head", "lie flat", "choke sleeping", "orthopnea"]):
            symptoms.append("orthopnea")
            clinical_concerns.append("Exhibiting classic signs of orthopnea. Highly correlated with congestive heart failure worsening.")
            severity = "HIGH"
            
        if any(w in transcript_lower for w in ["chest pain", "tightness", "pressure", "angina"]):
            symptoms.append("angina")
            clinical_concerns.append("Acute myocardial ischemia risk. Needs immediate assessment.")
            severity = "CRITICAL"
            
        if any(w in transcript_lower for w in ["swell", "swelling", "edema", "ankles", "legs"]):
            symptoms.append("peripheral_edema")
            clinical_concerns.append("Right-sided heart failure manifestation or fluid retention secondary to kidney clearance drop.")
            if severity != "CRITICAL":
                severity = "HIGH"
                
        if any(w in transcript_lower for w in ["tired", "exhausted", "fatigue", "no energy"]):
            symptoms.append("clinical_fatigue")
            clinical_concerns.append("Low cardiac output syndrome causing tissue hypoperfusion.")
            
        # Tone/Stress patterns simulation
        voice_stress_score = 4.2
        if severity == "CRITICAL":
            voice_stress_score = 8.9
        elif severity == "HIGH":
            voice_stress_score = 6.8
            
        return {
            "extracted_symptoms": symptoms,
            "severity_assessment": severity,
            "clinical_consequences": clinical_concerns,
            "vocal_biomarkers": {
                "voice_stress_index": voice_stress_score, # Simulated pitch variance metric
                "respiratory_pause_frequency": 2.4 if "dyspnea" in symptoms else 0.8, # pauses per minute
                "jitter_percent": 1.8 if severity in ["HIGH", "CRITICAL"] else 0.8
            }
        }
