import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# --- Base Schema ---
class BaseSchema(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# --- Authentication & User ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: uuid.UUID
    full_name: str

class UserResponse(BaseSchema, UserBase):
    is_active: bool

# --- Patient & Doctor Profiles ---
class PatientBase(BaseModel):
    dob: str
    gender: str
    blood_type: str
    allergies: Optional[str] = None
    emergency_contact: str
    emergency_phone: str

class PatientCreate(PatientBase):
    user_id: uuid.UUID

class PatientResponse(BaseSchema, PatientBase):
    user_id: uuid.UUID
    user: Optional[UserResponse] = None

class DoctorBase(BaseModel):
    specialty: str
    license_number: str
    hospital: str
    department: str
    is_available: bool = True

class DoctorCreate(DoctorBase):
    user_id: uuid.UUID

class DoctorResponse(BaseSchema, DoctorBase):
    user_id: uuid.UUID
    user: Optional[UserResponse] = None

# --- Digital Twin ---
class DigitalTwinBase(BaseModel):
    health_score: int
    recovery_score: int
    risk_score: int
    compliance_score: int
    mental_wellness_score: int
    twin_summary: str

class DigitalTwinResponse(BaseSchema, DigitalTwinBase):
    patient_id: uuid.UUID

# --- Vital Sign ---
class VitalSignBase(BaseModel):
    heart_rate: float
    systolic_bp: float
    diastolic_bp: float
    sp_o2: float
    temperature: float
    sleep_hours: float
    mood_rating: float
    stress_level: float
    steps: int

class VitalSignCreate(VitalSignBase):
    patient_id: uuid.UUID
    timestamp: Optional[datetime] = None

class VitalSignResponse(BaseSchema, VitalSignBase):
    patient_id: uuid.UUID
    timestamp: datetime

# --- Medication & Logs ---
class MedicationBase(BaseModel):
    name: str
    dosage: str
    frequency: str
    start_date: datetime
    end_date: datetime
    active: bool = True

class MedicationCreate(MedicationBase):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID

class MedicationResponse(BaseSchema, MedicationBase):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID

class MedicationLogBase(BaseModel):
    taken: bool
    notes: Optional[str] = None

class MedicationLogCreate(MedicationLogBase):
    medication_id: uuid.UUID
    patient_id: uuid.UUID
    timestamp: Optional[datetime] = None

class MedicationLogResponse(BaseSchema, MedicationLogBase):
    medication_id: uuid.UUID
    patient_id: uuid.UUID
    timestamp: datetime

# --- Timeline Event ---
class TimelineEventBase(BaseModel):
    category: str  # vital, medication, lab, doctor_note, ocr, voice_journal, emergency
    title: str
    description: str
    details: Optional[Dict[str, Any]] = None

class TimelineEventCreate(TimelineEventBase):
    patient_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    timestamp: Optional[datetime] = None

class TimelineEventResponse(BaseSchema, TimelineEventBase):
    patient_id: uuid.UUID
    doctor_id: Optional[uuid.UUID] = None
    timestamp: datetime

# --- Prediction & XAI ---
class PredictionBase(BaseModel):
    risk_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    prediction_type: str
    probability: float
    explanation: str
    suggestions: str

class PredictionCreate(PredictionBase):
    patient_id: uuid.UUID

class PredictionResponse(BaseSchema, PredictionBase):
    patient_id: uuid.UUID
    timestamp: datetime

# --- AI Insight ---
class AIInsightBase(BaseModel):
    category: str
    text: str
    details: Optional[Dict[str, Any]] = None
    resolved: bool = False

class AIInsightCreate(AIInsightBase):
    patient_id: uuid.UUID

class AIInsightResponse(BaseSchema, AIInsightBase):
    patient_id: uuid.UUID
    timestamp: datetime

# --- Simulation Run ---
class SimulationRequest(BaseModel):
    intervention_type: str
    target_vitals_params: Dict[str, Any]
    duration_days: Optional[int] = 30

class SimulationResponse(BaseSchema):
    patient_id: uuid.UUID
    timestamp: datetime
    intervention_type: str
    target_vitals_params: Dict[str, Any]
    projected_health_score: int
    efficacy_rating: float
    duration_days: int
    notes: str

# --- Hospital Bed Operations ---
class HospitalBedBase(BaseModel):
    department: str
    room_number: str
    bed_number: str
    status: str  # occupied, available, cleaning, maintenance
    patient_id: Optional[uuid.UUID] = None

class HospitalBedResponse(BaseSchema, HospitalBedBase):
    pass

# --- Audit Logs ---
class AuditLogResponse(BaseSchema):
    user_id: uuid.UUID
    timestamp: datetime
    action: str
    target_table: str
    record_id: str
    details: Optional[str] = None
