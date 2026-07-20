import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Float, DateTime, Boolean, ForeignKey, JSON, Index, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class BaseModel(Base):
    __abstract__ = True
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)

class User(BaseModel):
    __tablename__ = "users"
    
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="patient")  # patient, doctor, hospital_admin, government_admin, caregiver, laboratory, pharmacy, emergency_response, insurance, super_admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    full_name: Mapped[str] = mapped_column(String(100))
    
    patient_profile: Mapped[Optional["Patient"]] = relationship("Patient", back_populates="user", uselist=False)
    doctor_profile: Mapped[Optional["Doctor"]] = relationship("Doctor", back_populates="user", uselist=False)
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")

class Patient(BaseModel):
    __tablename__ = "patients"
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    dob: Mapped[str] = mapped_column(String(20))
    gender: Mapped[str] = mapped_column(String(20))
    blood_type: Mapped[str] = mapped_column(String(10))
    allergies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emergency_contact: Mapped[str] = mapped_column(String(100))
    emergency_phone: Mapped[str] = mapped_column(String(30))
    
    user: Mapped["User"] = relationship("User", back_populates="patient_profile")
    digital_twin: Mapped[Optional["DigitalTwin"]] = relationship("DigitalTwin", back_populates="patient", uselist=False)
    vitals: Mapped[List["VitalSign"]] = relationship("VitalSign", back_populates="patient")
    medications: Mapped[List["Medication"]] = relationship("Medication", back_populates="patient")
    timeline_events: Mapped[List["TimelineEvent"]] = relationship("TimelineEvent", back_populates="patient")
    predictions: Mapped[List["Prediction"]] = relationship("Prediction", back_populates="patient")
    insights: Mapped[List["AIInsight"]] = relationship("AIInsight", back_populates="patient")
    simulations: Mapped[List["SimulationRun"]] = relationship("SimulationRun", back_populates="patient")
    hospital_bed: Mapped[Optional["HospitalBed"]] = relationship("HospitalBed", back_populates="patient", uselist=False)

class Doctor(BaseModel):
    __tablename__ = "doctors"
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    specialty: Mapped[str] = mapped_column(String(100), index=True)
    license_number: Mapped[str] = mapped_column(String(50), unique=True)
    hospital: Mapped[str] = mapped_column(String(100), index=True)
    department: Mapped[str] = mapped_column(String(50), index=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    
    user: Mapped["User"] = relationship("User", back_populates="doctor_profile")
    prescriptions: Mapped[List["Medication"]] = relationship("Medication", back_populates="doctor")
    events: Mapped[List["TimelineEvent"]] = relationship("TimelineEvent", back_populates="doctor")

class DigitalTwin(BaseModel):
    __tablename__ = "digital_twins"
    
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), unique=True, index=True)
    health_score: Mapped[int] = mapped_column(Integer, default=80)
    recovery_score: Mapped[int] = mapped_column(Integer, default=80)
    risk_score: Mapped[int] = mapped_column(Integer, default=20)
    compliance_score: Mapped[int] = mapped_column(Integer, default=90)
    mental_wellness_score: Mapped[int] = mapped_column(Integer, default=80)
    twin_summary: Mapped[str] = mapped_column(Text)
    
    patient: Mapped["Patient"] = relationship("Patient", back_populates="digital_twin")

class VitalSign(BaseModel):
    __tablename__ = "vital_signs"
    
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    heart_rate: Mapped[float] = mapped_column(Float)
    systolic_bp: Mapped[float] = mapped_column(Float)
    diastolic_bp: Mapped[float] = mapped_column(Float)
    sp_o2: Mapped[float] = mapped_column(Float)
    temperature: Mapped[float] = mapped_column(Float)
    sleep_hours: Mapped[float] = mapped_column(Float)
    mood_rating: Mapped[float] = mapped_column(Float)  # 1 to 10
    stress_level: Mapped[float] = mapped_column(Float)  # 1 to 10
    steps: Mapped[int] = mapped_column(Integer, default=0)
    
    patient: Mapped["Patient"] = relationship("Patient", back_populates="vitals")

class Medication(BaseModel):
    __tablename__ = "medications"
    
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    dosage: Mapped[str] = mapped_column(String(50))
    frequency: Mapped[str] = mapped_column(String(50))
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[datetime] = mapped_column(DateTime)
    doctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("doctors.id"))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    patient: Mapped["Patient"] = relationship("Patient", back_populates="medications")
    doctor: Mapped["Doctor"] = relationship("Doctor", back_populates="prescriptions")
    logs: Mapped[List["MedicationLog"]] = relationship("MedicationLog", back_populates="medication")

class MedicationLog(BaseModel):
    __tablename__ = "medication_logs"
    
    medication_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("medications.id"), index=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    taken: Mapped[bool] = mapped_column(Boolean)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    medication: Mapped["Medication"] = relationship("Medication", back_populates="logs")

class TimelineEvent(BaseModel):
    __tablename__ = "timeline_events"
    
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    category: Mapped[str] = mapped_column(String(30), index=True)  # vital, medication, lab, doctor_note, ocr, voice_journal, emergency
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Store JSON details e.g., blood panel readings
    doctor_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("doctors.id"), nullable=True)
    
    patient: Mapped["Patient"] = relationship("Patient", back_populates="timeline_events")
    doctor: Mapped[Optional["Doctor"]] = relationship("Doctor", back_populates="events")

class Prediction(BaseModel):
    __tablename__ = "predictions"
    
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    risk_level: Mapped[str] = mapped_column(String(20), index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    prediction_type: Mapped[str] = mapped_column(String(50), index=True)  # hospitalization, adherence, deterioration, recovery
    probability: Mapped[float] = mapped_column(Float)  # 0.0 to 1.0
    explanation: Mapped[str] = mapped_column(Text)  # Explainable AI logic
    suggestions: Mapped[str] = mapped_column(Text)  # Dynamic treatment recommendations
    
    patient: Mapped["Patient"] = relationship("Patient", back_populates="predictions")

class AIInsight(BaseModel):
    __tablename__ = "ai_insights"
    
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    category: Mapped[str] = mapped_column(String(50), index=True)  # vital_anomaly, compliance_risk, stress_indicator, dynamic_plan
    text: Mapped[str] = mapped_column(Text)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    
    patient: Mapped["Patient"] = relationship("Patient", back_populates="insights")

class SimulationRun(BaseModel):
    __tablename__ = "simulation_runs"
    
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    intervention_type: Mapped[str] = mapped_column(String(100))  # drug_change, exercise_increase, beta_blocker_dosage_bump
    target_vitals_params: Mapped[dict] = mapped_column(JSON)  # parameters simulated
    projected_health_score: Mapped[int] = mapped_column(Integer)
    efficacy_rating: Mapped[float] = mapped_column(Float)  # projected improvement index
    duration_days: Mapped[int] = mapped_column(Integer, default=30)
    notes: Mapped[str] = mapped_column(Text)
    
    patient: Mapped["Patient"] = relationship("Patient", back_populates="simulations")

class HospitalBed(BaseModel):
    __tablename__ = "hospital_beds"
    
    department: Mapped[str] = mapped_column(String(50), index=True)  # ICU, Cardiology, Oncology, General Ward, Emergency
    room_number: Mapped[str] = mapped_column(String(20))
    bed_number: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="available")  # occupied, available, cleaning, maintenance
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("patients.id"), unique=True, nullable=True)
    
    patient: Mapped[Optional["Patient"]] = relationship("Patient", back_populates="hospital_bed")

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    action: Mapped[str] = mapped_column(String(50), index=True)  # READ_RECORD, WRITE_RECORD, VIEW_TWIN, SIMULATE_TREATMENT
    target_table: Mapped[str] = mapped_column(String(50))
    record_id: Mapped[uuid.UUID] = mapped_column(String(50))
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    user: Mapped["User"] = relationship("User", back_populates="audit_logs")

# Indexing for lookup optimizations
Index("idx_vital_signs_patient_time", VitalSign.patient_id, VitalSign.timestamp.desc())
Index("idx_timeline_events_patient_time", TimelineEvent.patient_id, TimelineEvent.timestamp.desc())
Index("idx_medication_logs_patient_time", MedicationLog.patient_id, MedicationLog.timestamp.desc())
Index("idx_predictions_patient_time", Prediction.patient_id, Prediction.timestamp.desc())
Index("idx_insights_patient_time", AIInsight.patient_id, AIInsight.timestamp.desc())
