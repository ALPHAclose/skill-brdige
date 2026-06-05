import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app.database import Base

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructor_id: Mapped[str] = mapped_column(String(255), nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    analytics: Mapped[List["Analytics"]] = relationship("Analytics", back_populates="course", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="course", cascade="all, delete-orphan")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")

class Analytics(Base):
    __tablename__ = "analytics"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[Optional[uuid.UUID]] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    course: Mapped[Optional["Course"]] = relationship("Course", back_populates="analytics")

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    generated_by: Mapped[str] = mapped_column(String(255), nullable=False)
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    course: Mapped["Course"] = relationship("Course", back_populates="reports")
