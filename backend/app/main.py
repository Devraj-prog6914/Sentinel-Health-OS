import uuid
import random
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings
from app.models.models import Base, User, Patient, Doctor, DigitalTwin, VitalSign, Medication, MedicationLog, TimelineEvent, Prediction, AIInsight, SimulationRun, HospitalBed, AuditLog
from app.schemas import schemas
from app.services.services import PredictiveRiskEngine, SimulationEngine, MedicalOCRService, VoiceIntelligenceService

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sentinel_health")

# --- Database Setup ---
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Authentication Helpers ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

# --- Real-Time Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Remaining connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# --- Initialize FastAPI App ---
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs"
)

# Set CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Initialisation & Mock Data Seeder ---
@app.on_event("startup")
def startup_event():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if database is empty
        user_count = db.query(User).count()
        if user_count == 0:
            logger.info("Database is empty. Initiating 100+ Patient Sentinel Clinical Seeder...")
            seed_clinical_database(db)
        else:
            logger.info(f"Database already populated with {user_count} users. Skipping seeder.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

# --- Security Dependency ---
def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- AUTH ENDPOINTS ---
@app.post(f"{settings.API_V1_STR}/auth/signup", response_model=schemas.UserResponse)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # If role is patient or doctor, scaffold their profile automatically
    if new_user.role == "patient":
        patient_profile = Patient(
            user_id=new_user.id,
            dob="1978-05-15",
            gender="Unspecified",
            blood_type="O+",
            allergies="None reported",
            emergency_contact="Emergency Contact",
            emergency_phone="555-0199"
        )
        db.add(patient_profile)
        db.commit()
        db.refresh(patient_profile)
        
        # Add Digital Twin
        dt = DigitalTwin(
            patient_id=patient_profile.id,
            health_score=80,
            recovery_score=80,
            risk_score=20,
            compliance_score=100,
            mental_wellness_score=80,
            twin_summary="System initialization in progress."
        )
        db.add(dt)
        db.commit()
        
    elif new_user.role == "doctor":
        doctor_profile = Doctor(
            user_id=new_user.id,
            specialty="General Medicine",
            license_number=f"LIC-{random.randint(10000, 99999)}",
            hospital="Sentinel General",
            department="Emergency Care"
        )
        db.add(doctor_profile)
        db.commit()
        
    return new_user

@app.post(f"{settings.API_V1_STR}/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_in.username).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    token = create_access_token({"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name
    }

# --- REAL-TIME WEBSOCKET ENDPOINT ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive client ping/event message
            data = await websocket.receive_text()
            # Respond to echo
            await manager.send_personal_message({"status": "alive", "timestamp": datetime.utcnow().isoformat()}, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- CLINICAL APIS ---

# Get Patient Twin
@app.get(f"{settings.API_V1_STR}/patient/twin", response_model=schemas.DigitalTwinResponse)
def get_patient_twin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can access their twin directly.")
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient or not patient.digital_twin:
        raise HTTPException(status_code=404, detail="Digital twin profile not found.")
    return patient.digital_twin

# Get Patient Timeline
@app.get(f"{settings.API_V1_STR}/patient/timeline", response_model=List[schemas.TimelineEventResponse])
def get_patient_timeline(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
    return db.query(TimelineEvent).filter(TimelineEvent.patient_id == patient.id).order_by(TimelineEvent.timestamp.desc()).all()

# Get Vitals Stream
@app.get(f"{settings.API_V1_STR}/patient/vitals", response_model=List[schemas.VitalSignResponse])
def get_patient_vitals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
    return db.query(VitalSign).filter(VitalSign.patient_id == patient.id).order_by(VitalSign.timestamp.desc()).limit(50).all()

# Post Vitals (Wearable ingestion mock)
@app.post(f"{settings.API_V1_STR}/patient/vitals", response_model=schemas.VitalSignResponse)
async def add_patient_vitals(vital_in: schemas.VitalSignBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
        
    new_vital = VitalSign(
        patient_id=patient.id,
        heart_rate=vital_in.heart_rate,
        systolic_bp=vital_in.systolic_bp,
        diastolic_bp=vital_in.diastolic_bp,
        sp_o2=vital_in.sp_o2,
        temperature=vital_in.temperature,
        sleep_hours=vital_in.sleep_hours,
        mood_rating=vital_in.mood_rating,
        stress_level=vital_in.stress_level,
        steps=vital_in.steps
    )
    db.add(new_vital)
    db.commit()
    db.refresh(new_vital)
    
    # Recalculate Risk Engine
    logs = db.query(MedicationLog).filter(MedicationLog.patient_id == patient.id).all()
    total_logs = len(logs)
    compliance = (sum(1 for l in logs if l.taken) / total_logs * 100) if total_logs > 0 else 92.0
    
    risk_data = PredictiveRiskEngine.calculate_risk(
        vitals=[{"heart_rate": new_vital.heart_rate, "systolic_bp": new_vital.systolic_bp, "diastolic_bp": new_vital.diastolic_bp, "sp_o2": new_vital.sp_o2, "temperature": new_vital.temperature, "stress_level": new_vital.stress_level, "sleep_hours": new_vital.sleep_hours}],
        compliance_rate=compliance
    )
    
    # Update Digital Twin Scores
    twin = patient.digital_twin
    if twin:
        twin.risk_score = int(risk_data["probability"] * 100)
        twin.health_score = max(10, 100 - twin.risk_score - int(new_vital.stress_level))
        twin.mental_wellness_score = int(new_vital.mood_rating * 10)
        twin.twin_summary = f"Vitals log ingested at {datetime.utcnow().strftime('%H:%M:%S')}. {risk_data['explanation']}"
        db.commit()
        
    # Save Prediction
    new_pred = Prediction(
        patient_id=patient.id,
        risk_level=risk_data["risk_level"],
        prediction_type="deterioration",
        probability=risk_data["probability"],
        explanation=risk_data["explanation"],
        suggestions=risk_data["suggestions"]
    )
    db.add(new_pred)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="WRITE_RECORD",
        target_table="vital_signs",
        record_id=str(new_vital.id),
        details=f"Wearable vitals update processed. Risk probability projected at {new_pred.probability}."
    )
    db.add(audit)
    db.commit()
    
    # Broadcast to doctors/mission controls via socket
    payload = {
        "event": "VITAL_UPDATE",
        "patient_id": str(patient.id),
        "patient_name": current_user.full_name,
        "vitals": {
            "heart_rate": new_vital.heart_rate,
            "blood_pressure": f"{int(new_vital.systolic_bp)}/{int(new_vital.diastolic_bp)}",
            "sp_o2": new_vital.sp_o2,
            "temperature": new_vital.temperature
        },
        "prediction": {
            "risk_level": new_pred.risk_level,
            "probability": new_pred.probability,
            "explanation": new_pred.explanation
        }
    }
    await manager.broadcast(payload)
    
    return new_vital

# --- DOCTOR MISSION CONTROL APIS ---

# Get Critical Patient Queue
@app.get(f"{settings.API_V1_STR}/doctor/patients", response_model=List[Dict[str, Any]])
def get_doctor_patient_list(db: Session = Depends(get_db)):
    patients = db.query(Patient).join(User).all()
    results = []
    for p in patients:
        latest_vital = db.query(VitalSign).filter(VitalSign.patient_id == p.id).order_by(VitalSign.timestamp.desc()).first()
        latest_pred = db.query(Prediction).filter(Prediction.patient_id == p.id).order_by(Prediction.timestamp.desc()).first()
        
        results.append({
            "patient_id": p.id,
            "full_name": p.user.full_name,
            "gender": p.gender,
            "age": 2026 - int(p.dob.split("-")[0]) if p.dob else 45,
            "health_score": p.digital_twin.health_score if p.digital_twin else 80,
            "risk_score": p.digital_twin.risk_score if p.digital_twin else 20,
            "risk_level": latest_pred.risk_level if latest_pred else "LOW",
            "latest_vitals": {
                "heart_rate": latest_vital.heart_rate if latest_vital else 72,
                "blood_pressure": f"{int(latest_vital.systolic_bp)}/{int(latest_vital.diastolic_bp)}" if latest_vital else "120/80",
                "sp_o2": latest_vital.sp_o2 if latest_vital else 98,
                "temperature": latest_vital.temperature if latest_vital else 37.0
            } if latest_vital else None,
            "summary": p.digital_twin.twin_summary if p.digital_twin else ""
        })
        
    # Sort critical and high risks to the top
    def sort_key(item):
        levels = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        return (levels.get(item["risk_level"], 3), -item["risk_score"])
        
    results.sort(key=sort_key)
    return results

# Get Individual Patient Dashboard Details for Mission Control
@app.get(f"{settings.API_V1_STR}/doctor/patient/{patient_id}")
def get_doctor_patient_details(patient_id: uuid.UUID, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
        
    vitals = db.query(VitalSign).filter(VitalSign.patient_id == patient.id).order_by(VitalSign.timestamp.desc()).limit(30).all()
    meds = db.query(Medication).filter(Medication.patient_id == patient.id).all()
    timeline = db.query(TimelineEvent).filter(TimelineEvent.patient_id == patient.id).order_by(TimelineEvent.timestamp.desc()).all()
    predictions = db.query(Prediction).filter(Prediction.patient_id == patient.id).order_by(Prediction.timestamp.desc()).limit(10).all()
    insights = db.query(AIInsight).filter(AIInsight.patient_id == patient.id).order_by(AIInsight.timestamp.desc()).all()
    
    return {
        "patient": {
            "id": patient.id,
            "full_name": patient.user.full_name,
            "dob": patient.dob,
            "gender": patient.gender,
            "blood_type": patient.blood_type,
            "allergies": patient.allergies,
            "emergency_contact": patient.emergency_contact,
            "emergency_phone": patient.emergency_phone
        },
        "digital_twin": {
            "health_score": patient.digital_twin.health_score if patient.digital_twin else 80,
            "recovery_score": patient.digital_twin.recovery_score if patient.digital_twin else 80,
            "risk_score": patient.digital_twin.risk_score if patient.digital_twin else 20,
            "compliance_score": patient.digital_twin.compliance_score if patient.digital_twin else 90,
            "mental_wellness_score": patient.digital_twin.mental_wellness_score if patient.digital_twin else 80,
            "twin_summary": patient.digital_twin.twin_summary if patient.digital_twin else ""
        },
        "vitals_history": vitals,
        "medications": meds,
        "timeline": timeline,
        "predictions": predictions,
        "insights": insights
    }

# --- SIMULATION ENDPOINT ---
@app.post(f"{settings.API_V1_STR}/doctor/simulate/{patient_id}", response_model=schemas.SimulationResponse)
def simulate_intervention(patient_id: uuid.UUID, sim_req: schemas.SimulationRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
        
    twin = patient.digital_twin
    current_health = twin.health_score if twin else 80
    
    sim_data = SimulationEngine.run_simulation(
        current_health_score=current_health,
        intervention=sim_req.intervention_type,
        params=sim_req.target_vitals_params
    )
    
    new_sim = SimulationRun(
        patient_id=patient.id,
        intervention_type=sim_req.intervention_type,
        target_vitals_params=sim_req.target_vitals_params,
        projected_health_score=sim_data["projected_health_score"],
        efficacy_rating=sim_data["efficacy_rating"],
        duration_days=sim_req.duration_days or 30,
        notes=sim_data["notes"]
    )
    
    db.add(new_sim)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="SIMULATE_TREATMENT",
        target_table="simulation_runs",
        record_id=str(new_sim.id),
        details=f"Simulated intervention: {sim_req.intervention_type}. Projected Health: {new_sim.projected_health_score}."
    )
    db.add(audit)
    db.commit()
    db.refresh(new_sim)
    
    return new_sim

# --- OCR INGESTION ENDPOINT ---
class OCRTextRequest(BaseModel):
    raw_text: str
    patient_id: uuid.UUID

@app.post(f"{settings.API_V1_STR}/ocr/process")
async def process_ocr_report(req: OCRTextRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
        
    ocr_result = MedicalOCRService.parse_document(req.raw_text)
    
    # Store OCR report in patient timeline
    event = TimelineEvent(
        patient_id=patient.id,
        category="ocr",
        title="OCR Laboratory Analysis Extracted",
        description=f"OCR extracted chemistry report. Class: {ocr_result['document_type']}. Confidence: {int(ocr_result['confidence_score']*100)}%.",
        details={
            "parsed_fields": ocr_result["parsed_fields"],
            "anomalies": ocr_result["anomalies"],
            "raw_text": req.raw_text[:200]
        }
    )
    db.add(event)
    
    # If anomalies, trigger AI insight & notification
    if ocr_result["anomalies"]:
        insight = AIInsight(
            patient_id=patient.id,
            category="vital_anomaly",
            text=f"OCR report detected blood panel anomalies: {', '.join(ocr_result['anomalies'])}",
            details={"anomalies": ocr_result["anomalies"]}
        )
        db.add(insight)
        
        # Broadcast critical alert
        await manager.broadcast({
            "event": "CRITICAL_ALERT",
            "patient_id": str(patient.id),
            "patient_name": patient.user.full_name,
            "alert": f"Lab report anomalies detected via OCR: {ocr_result['anomalies'][0]}"
        })
        
    db.commit()
    return {"status": "success", "extracted": ocr_result}

# --- VOICE INTELLIGENCE ENDPOINT ---
class VoiceJournalRequest(BaseModel):
    transcript: str
    patient_id: uuid.UUID

@app.post(f"{settings.API_V1_STR}/voice/analyze")
async def analyze_voice_journal(req: VoiceJournalRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
        
    analysis = VoiceIntelligenceService.analyze_vocal_journal(req.transcript)
    
    # Store in patient timeline
    event = TimelineEvent(
        patient_id=patient.id,
        category="voice_journal",
        title="Voice Health Journal Ingested",
        description=f"Transcript analyzed: '{req.transcript[:60]}...'",
        details={
            "symptoms": analysis["extracted_symptoms"],
            "severity": analysis["severity_assessment"],
            "vocal_biomarkers": analysis["vocal_biomarkers"],
            "clinical_consequences": analysis["clinical_consequences"]
        }
    )
    db.add(event)
    
    # If high severity, trigger alert
    if analysis["severity_assessment"] in ["HIGH", "CRITICAL"]:
        insight = AIInsight(
            patient_id=patient.id,
            category="compliance_risk",
            text=f"Voice journal indicates acute {analysis['extracted_symptoms'][0]}. Stress marker: {analysis['vocal_biomarkers']['voice_stress_index']}/10.",
            details={"symptoms": analysis["extracted_symptoms"], "clinical_notes": analysis["clinical_consequences"]}
        )
        db.add(insight)
        
        # Update Twin Risk
        twin = patient.digital_twin
        if twin:
            twin.risk_score = min(99, twin.risk_score + 35)
            twin.health_score = max(10, twin.health_score - 30)
            db.commit()
            
        await manager.broadcast({
            "event": "CRITICAL_ALERT",
            "patient_id": str(patient.id),
            "patient_name": patient.user.full_name,
            "alert": f"Voice log detected clinical deterioration: {', '.join(analysis['clinical_consequences'])}"
        })
        
    db.commit()
    return {"status": "success", "analysis": analysis}

# --- HOSPITAL OPERATIONS ENDPOINTS ---
@app.get(f"{settings.API_V1_STR}/hospital/beds")
def get_hospital_beds(db: Session = Depends(get_db)):
    beds = db.query(HospitalBed).all()
    results = []
    for b in beds:
        p_name = None
        if b.patient_id:
            patient = db.query(Patient).filter(Patient.id == b.patient_id).first()
            if patient:
                p_name = patient.user.full_name
        results.append({
            "id": b.id,
            "department": b.department,
            "room_number": b.room_number,
            "bed_number": b.bed_number,
            "status": b.status,
            "patient_name": p_name
        })
    return results

@app.get(f"{settings.API_V1_STR}/hospital/occupancy")
def get_hospital_occupancy(db: Session = Depends(get_db)):
    beds = db.query(HospitalBed).all()
    total = len(beds)
    occupied = sum(1 for b in beds if b.status == "occupied")
    cleaning = sum(1 for b in beds if b.status == "cleaning")
    available = total - occupied - cleaning
    
    # Department breakdowns
    dept_stats = {}
    for b in beds:
        if b.department not in dept_stats:
            dept_stats[b.department] = {"total": 0, "occupied": 0}
        dept_stats[b.department]["total"] += 1
        if b.status == "occupied":
            dept_stats[b.department]["occupied"] += 1
            
    return {
        "overall": {
            "total_beds": total,
            "occupied": occupied,
            "available": available,
            "cleaning": cleaning,
            "rate_percent": round((occupied / total * 100), 1) if total > 0 else 0
        },
        "departments": dept_stats,
        "ai_prediction": {
            "overcrowd_warning": occupied > (total * 0.82),
            "projected_overload_hours": 14 if occupied > (total * 0.80) else 0,
            "recommendation": "Initiate early discharge checklist for general ward patients in recovery." if occupied > (total * 0.80) else "Optimal bed buffer capacity maintained."
        }
    }

# --- POPULATION INTELLIGENCE (GOVERNMENT) APIS ---
@app.get(f"{settings.API_V1_STR}/government/epidemiology")
def get_government_intel(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    
    # Generate mock regional stats based on patient cohort
    districts = ["North District", "Central Valley", "East Coast", "South Bay", "Metropolitan"]
    outbreaks = {
        "Influenza A": {"cases": 240, "trend": "rising", "color": "orange"},
        "Gastroenteritis": {"cases": 85, "trend": "stable", "color": "yellow"},
        "COVID-19 (Omicron)": {"cases": 312, "trend": "declining", "color": "green"},
        "HFMD (Pediatric)": {"cases": 45, "trend": "rising", "color": "red"}
    }
    
    district_data = []
    for d in districts:
        district_data.append({
            "district": d,
            "population": random.randint(150000, 500000),
            "influenza_rate": round(random.uniform(1.2, 5.8), 2),
            "emergency_wait_minutes": random.randint(12, 65),
            "pharmacy_stock_percent": random.randint(72, 98)
        })
        
    # Calculate macro health KPIs
    critical_count = db.query(Prediction).filter(Prediction.risk_level == "CRITICAL").distinct(Prediction.patient_id).count()
    high_count = db.query(Prediction).filter(Prediction.risk_level == "HIGH").distinct(Prediction.patient_id).count()
    
    return {
        "national_health_score": 83.4,
        "critical_cases_monitored": critical_count + high_count,
        "outbreaks": outbreaks,
        "regions": district_data,
        "ai_insights": [
            "Influenza rates in South Bay show a 24% week-on-week spike. Correlates with local drop in Tamiflu pharmacy stockpiles (now at 68%). Recommendation: Dispatch emergency medical inventory."
        ]
    }


# =====================================================================
# --- CLINICAL SEEDER FOR 100+ PATIENTS & 30+ DOCTORS ---
# =====================================================================
def seed_clinical_database(db: Session):
    # 1. Create Doctors
    first_names = ["Robert", "Sarah", "James", "Elena", "Marcus", "Patricia", "David", "Linda", "John", "Jessica"]
    last_names = ["Chen", "Gomez", "Patel", "Miller", "O'Connor", "Kim", "Taylor", "Silva", "Hansen", "Foster"]
    specialties = [
        ("Cardiology", "Cardio-ICU"), 
        ("Pulmonology", "Respiratory Ward"), 
        ("Endocrinology", "Metabolic Health"), 
        ("Neurology", "Neuroscience Wing"),
        ("Internal Medicine", "General Ward"),
        ("Emergency Medicine", "Emergency Care")
    ]
    
    doctors = []
    # Create 30 Doctor Users & Profiles
    for i in range(30):
        fn = first_names[i % len(first_names)]
        ln = last_names[i % len(last_names)]
        full_name = f"Dr. {fn} {ln}"
        username = f"dr_{fn.lower()}_{ln.lower()}_{i}"
        email = f"{fn.lower()}.{ln.lower()}{i}@sentinelhealth.org"
        
        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash("SentinelDoc123!"),
            role="doctor",
            full_name=full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        spec, dept = specialties[i % len(specialties)]
        doc = Doctor(
            user_id=user.id,
            specialty=spec,
            license_number=f"LIC-990{i:02d}",
            hospital="Sentinel General Command",
            department=dept
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        doctors.append(doc)
        
    # 2. Create 105 Patient Users & Profiles
    patient_first = ["Arthur", "Grace", "Liam", "Sophia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Isabella", "Frank", "Carol", "Henry", "Diana", "George"]
    patient_last = ["Pendleton", "Vance", "Cross", "Sterling", "Rhodes", "Harker", "Devereaux", "McKinley", "Nakamura", "Belmont", "Sinclair", "Vargas", "Thornton", "Kingsley", "Wyatt"]
    genders = ["Male", "Female"]
    bloods = ["O+", "A+", "B+", "AB+", "O-", "A-"]
    
    patients = []
    # Seed 105 patients
    for i in range(105):
        fn = random.choice(patient_first)
        ln = random.choice(patient_last)
        full_name = f"{fn} {ln}"
        username = f"pat_{fn.lower()}_{ln.lower()}_{i}"
        email = f"{fn.lower()}.{ln.lower()}{i}@sentinel.me"
        
        # Age bias: make ~30% elderly, ~50% middle age, ~20% young
        r_age = random.choice([random.randint(65, 88), random.randint(40, 64), random.randint(19, 39)])
        dob_year = 2026 - r_age
        dob = f"{dob_year}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        
        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash("PatientSecret123!"),
            role="patient",
            full_name=full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        pat = Patient(
            user_id=user.id,
            dob=dob,
            gender=random.choice(genders),
            blood_type=random.choice(bloods),
            allergies="Penicillin" if i % 10 == 0 else "Sulfa Drugs" if i % 15 == 0 else "None reported",
            emergency_contact=f"Relative {fn}",
            emergency_phone=f"555-01{i:02d}"
        )
        db.add(pat)
        db.commit()
        db.refresh(pat)
        patients.append(pat)
        
        # Scaffold Digital Twin
        health_score = random.randint(55, 95)
        risk_score = 100 - health_score - random.randint(-5, 8)
        risk_score = max(5, min(95, risk_score))
        
        dt = DigitalTwin(
            patient_id=pat.id,
            health_score=health_score,
            recovery_score=random.randint(60, 95),
            risk_score=risk_score,
            compliance_score=random.randint(65, 100),
            mental_wellness_score=random.randint(60, 95),
            twin_summary="Stable physiological telemetry. Routine cardiac monitoring active."
        )
        db.add(dt)
        db.commit()
        
    # 3. Create Specific Clinical Scenario Cases
    
    # --- Case 1: CHF Deterioration (Arthur Pendleton, Patient 0) ---
    p_chf = patients[0]
    p_chf.user.full_name = "Arthur Pendleton"
    p_chf.gender = "Male"
    p_chf.dob = "1948-03-12" # 78 years old
    db.commit()
    
    # CHF vitals worsening (Tachycardia, Hypoxia, Hypertensive)
    chf_vitals = []
    base_time = datetime.utcnow() - timedelta(days=5)
    for d in range(15):
        # Gradual decompensation
        t = base_time + timedelta(hours=d*8)
        hr = 70 + (d * 3) + random.randint(-5, 5)
        sbp = 130 + (d * 3.5) + random.randint(-5, 5)
        spo2 = 98 - (d * 0.5)
        spo2 = max(89, spo2)
        
        v = VitalSign(
            patient_id=p_chf.id,
            timestamp=t,
            heart_rate=hr,
            systolic_bp=sbp,
            diastolic_bp=85 + (d * 1.2),
            sp_o2=spo2,
            temperature=36.8 + random.uniform(-0.3, 0.3),
            sleep_hours=7.0 - (d * 0.2),
            mood_rating=8 - (d * 0.3),
            stress_level=3 + (d * 0.4),
            steps=6000 - (d * 350)
        )
        db.add(v)
        chf_vitals.append(v)
    
    # CHF Medication & Logs (Declining Adherence)
    med_chf = Medication(
        patient_id=p_chf.id,
        name="Carvedilol (Beta Blocker)",
        dosage="12.5 mg",
        frequency="Twice daily",
        start_date=datetime.utcnow() - timedelta(days=90),
        end_date=datetime.utcnow() + timedelta(days=90),
        doctor_id=doctors[0].id,
        active=True
    )
    db.add(med_chf)
    db.commit()
    
    # Med logs showing compliance dropping
    for d in range(10):
        taken = True if d < 4 else (False if d % 2 == 0 else True)
        log = MedicationLog(
            medication_id=med_chf.id,
            patient_id=p_chf.id,
            timestamp=datetime.utcnow() - timedelta(days=d),
            taken=taken,
            notes="Forgot evening dose" if not taken else "Taken with food"
        )
        db.add(log)
        
    # CHF Predictions
    pred_chf = Prediction(
        patient_id=p_chf.id,
        timestamp=datetime.utcnow(),
        risk_level="CRITICAL",
        prediction_type="hospitalization",
        probability=0.88,
        explanation="Hypoxia trending (SpO2 91% down from 98%). Elevated resting heart rate of 112 bpm (Tachycardia). Beta-blocker adherence drop of 40% over past 4 days. Ejection fraction warning.",
        suggestions="Immediate cardiac consult. Titrate beta-blocker. Administer loop diuretic."
    )
    db.add(pred_chf)
    
    # CHF Twin updates
    p_chf.digital_twin.health_score = 38
    p_chf.digital_twin.risk_score = 88
    p_chf.digital_twin.compliance_score = 60
    p_chf.digital_twin.twin_summary = "CRITICAL DETERIORATION RISK. Cardio-pulmonary decompensation indices triggered. SpO2 and compliance declining."
    db.commit()
    
    # --- Case 2: OCR Blood panel abnormality (Elena Sterling, Patient 1) ---
    p_ocr = patients[1]
    p_ocr.user.full_name = "Elena Sterling"
    p_ocr.gender = "Female"
    p_ocr.dob = "1965-11-20"
    db.commit()
    
    # Vitals are normal
    v_ocr = VitalSign(
        patient_id=p_ocr.id,
        timestamp=datetime.utcnow(),
        heart_rate=68,
        systolic_bp=118,
        diastolic_bp=75,
        sp_o2=99,
        temperature=36.6,
        sleep_hours=8.0,
        mood_rating=7.5,
        stress_level=2.5,
        steps=8500
    )
    db.add(v_ocr)
    
    # Log OCR Event
    ocr_event = TimelineEvent(
        patient_id=p_ocr.id,
        timestamp=datetime.utcnow() - timedelta(hours=3),
        category="ocr",
        title="OCR Laboratory Analysis Extracted",
        description="OCR extracted chemistry report from LabCorp. High Potassium flagged.",
        details={
            "parsed_fields": {
                "potassium": {"value": 5.8, "unit": "mEq/L", "normal_range": "3.5 - 5.1"},
                "creatinine": {"value": 1.4, "unit": "mg/dL", "normal_range": "0.6 - 1.2"}
            },
            "anomalies": ["Hyperkalemia detected (Potassium: 5.8 mEq/L). Risk of cardiac arrhythmia."]
        }
    )
    db.add(ocr_event)
    
    insight_ocr = AIInsight(
        patient_id=p_ocr.id,
        timestamp=datetime.utcnow() - timedelta(hours=3),
        category="vital_anomaly",
        text="Abnormal Lab panel extracted via OCR: Potassium 5.8 mEq/L (Hyperkalemia) and Creatinine 1.4 mg/dL. Renal filtration deficiency.",
        details={"anomalies": ["Hyperkalemia (5.8)", "Elevated Creatinine (1.4)"]}
    )
    db.add(insight_ocr)
    
    pred_ocr = Prediction(
        patient_id=p_ocr.id,
        timestamp=datetime.utcnow(),
        risk_level="HIGH",
        prediction_type="deterioration",
        probability=0.62,
        explanation="Hyperkalemia (Potassium 5.8 mEq/L) elevates risk of cardiac excitability, conduction defects, and sinoatrial exit block.",
        suggestions="Obtain urgent 12-lead EKG. Review and hold potassium-sparing medications or supplements. Re-draw electrolyte panel."
    )
    db.add(pred_ocr)
    
    p_ocr.digital_twin.health_score = 54
    p_ocr.digital_twin.risk_score = 62
    p_ocr.digital_twin.twin_summary = "HIGH RISK. Blood chemistry report shows metabolic renal stress (Potassium 5.8, Creatinine 1.4)."
    db.commit()
    
    # --- Case 3: Voice journal symptom triggers (Carol Vance, Patient 2) ---
    p_voice = patients[2]
    p_voice.user.full_name = "Carol Vance"
    p_voice.gender = "Female"
    p_voice.dob = "1956-07-04"
    db.commit()
    
    v_voice = VitalSign(
        patient_id=p_voice.id,
        timestamp=datetime.utcnow(),
        heart_rate=88,
        systolic_bp=135,
        diastolic_bp=82,
        sp_o2=94,
        temperature=37.1,
        sleep_hours=5.5,
        mood_rating=5.0,
        stress_level=7.2,
        steps=2500
    )
    db.add(v_voice)
    
    voice_event = TimelineEvent(
        patient_id=p_voice.id,
        timestamp=datetime.utcnow() - timedelta(hours=1),
        category="voice_journal",
        title="Voice Health Journal Ingested",
        description="Voice journal transcribing respiratory difficulties and chest tightness.",
        details={
            "symptoms": ["dyspnea", "orthopnea", "angina"],
            "severity": "HIGH",
            "vocal_biomarkers": {
                "voice_stress_index": 7.4,
                "respiratory_pause_frequency": 2.2,
                "jitter_percent": 1.5
            },
            "clinical_consequences": ["Orthopnea signs present. Highly correlated with congestive heart failure worsening."]
        }
    )
    db.add(voice_event)
    
    insight_voice = AIInsight(
        patient_id=p_voice.id,
        timestamp=datetime.utcnow() - timedelta(hours=1),
        category="compliance_risk",
        text="Voice audio analysis flags vocal stress (7.4) and breathlessness during speech. Clinically aligns with exacerbation of respiratory distress.",
        details={"symptoms": ["dyspnea", "orthopnea", "chest tightness"]}
    )
    db.add(insight_voice)
    
    pred_voice = Prediction(
        patient_id=p_voice.id,
        timestamp=datetime.utcnow(),
        risk_level="HIGH",
        prediction_type="deterioration",
        probability=0.74,
        explanation="Voice journal transcript signals Orthopnea (needing pillows to sleep) and exertional Dyspnea. Subclinical pulmonary congestion is indicated.",
        suggestions="Review ejection fraction, check weight gain for fluid retention. Schedule urgent clinical telehealth visit."
    )
    db.add(pred_voice)
    
    p_voice.digital_twin.health_score = 45
    p_voice.digital_twin.risk_score = 74
    p_voice.digital_twin.twin_summary = "HIGH RISK. Voice journal indicates cardiopulmonary symptoms (dyspnea, orthopnea) with vocal tremors."
    db.commit()

    # Seed general events for all patients
    for i in range(3, 105):
        pat = patients[i]
        # Vitals
        v = VitalSign(
            patient_id=pat.id,
            heart_rate=random.randint(60, 90),
            systolic_bp=random.randint(110, 135),
            diastolic_bp=random.randint(70, 85),
            sp_o2=random.randint(95, 99),
            temperature=36.5 + random.uniform(-0.3, 0.4),
            sleep_hours=random.uniform(6.0, 8.5),
            mood_rating=random.randint(6, 9),
            stress_level=random.randint(2, 5),
            steps=random.randint(4000, 11000)
        )
        db.add(v)
        
        # Active Medications
        med_names = [
            ("Lisinopril", "10 mg", "Once daily"),
            ("Metoprolol", "25 mg", "Once daily"),
            ("Metformin", "500 mg", "Twice daily"),
            ("Atorvastatin", "20 mg", "Once daily"),
            ("Amlodipine", "5 mg", "Once daily")
        ]
        chosen_med = random.choice(med_names)
        m = Medication(
            patient_id=pat.id,
            name=chosen_med[0],
            dosage=chosen_med[1],
            frequency=chosen_med[2],
            start_date=datetime.utcnow() - timedelta(days=60),
            end_date=datetime.utcnow() + timedelta(days=120),
            doctor_id=random.choice(doctors).id,
            active=True
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        
        # Medication Logs
        for d in range(5):
            taken = random.choice([True, True, True, False]) # 75% compliance average
            log = MedicationLog(
                medication_id=m.id,
                patient_id=pat.id,
                timestamp=datetime.utcnow() - timedelta(days=d),
                taken=taken
            )
            db.add(log)
            
        # Standard Prediction
        pred = Prediction(
            patient_id=pat.id,
            risk_level="LOW" if pat.digital_twin.health_score > 75 else "MEDIUM",
            prediction_type="deterioration",
            probability=round((100 - pat.digital_twin.health_score) / 100.0, 2),
            explanation="Normal vital ranges. Chronic conditions stable.",
            suggestions="Maintain standard monitoring protocols."
        )
        db.add(pred)
        
        # Normal timeline entry
        event = TimelineEvent(
            patient_id=pat.id,
            category="doctor_note",
            title="Routine Telehealth Review",
            description="Patient reports general wellness. All physiological telemetry within acceptable baselines.",
            doctor_id=random.choice(doctors).id
        )
        db.add(event)
        db.commit()
        
    # 4. Seed Hospital Beds (50 beds total)
    departments = ["ICU", "Cardiology", "Pulmonology", "Neurology", "General Ward", "Emergency Care"]
    bed_idx = 0
    for dept in departments:
        rooms = 5
        beds_per_room = 2 if dept in ["ICU", "Cardiology"] else 4
        for r in range(1, rooms + 1):
            for b in range(1, beds_per_room + 1):
                # Occupy ~78% of the beds
                occupied = random.random() < 0.78
                p_id = None
                status_str = "available"
                
                if occupied and bed_idx < len(patients):
                    p_id = patients[bed_idx].id
                    status_str = "occupied"
                    bed_idx += 1
                    
                bed = HospitalBed(
                    department=dept,
                    room_number=f"Room-{r:02d}",
                    bed_number=f"Bed-{b}",
                    status=status_str if not (not occupied and random.random() < 0.1) else "cleaning",
                    patient_id=p_id
                )
                db.add(bed)
                
    # Place Arthur Pendleton in a Cardiology ICU bed
    icu_bed = db.query(HospitalBed).filter(HospitalBed.department == "Cardiology", HospitalBed.status == "available").first()
    if icu_bed:
        icu_bed.patient_id = p_chf.id
        icu_bed.status = "occupied"
        
    db.commit()
    logger.info("Database Seeding Completed Successfully! 100+ Patients, 30+ Doctors, 50 Beds seeded.")
