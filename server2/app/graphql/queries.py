import strawberry
import uuid
from typing import List, Optional
from strawberry.types import Info
from app.database import SessionLocal
from app.models import Course, Enrollment, Analytics, Report
from app.graphql.types import CourseType, AnalyticsType, ReportType

@strawberry.type
class Query:
    @strawberry.field
    def courses(self, info: Info) -> List[CourseType]:
        user = info.context.get("user")
        db = SessionLocal()
        try:
            if user and user.role == "ADMIN":
                # Admins see all courses
                items = db.query(Course).all()
            elif user and user.role == "INSTRUCTOR":
                # Instructors see their own courses (published or not) + all published courses from others
                from sqlalchemy import or_
                items = db.query(Course).filter(
                    or_(
                        Course.instructor_id == user.id,  # Their own courses
                        Course.is_published == True        # All published courses
                    )
                ).all()
            else:
                # Students and unauthenticated users see only published courses
                items = db.query(Course).filter(Course.is_published == True).all()

            return [
                CourseType(
                    id=strawberry.ID(str(item.id)),
                    title=item.title,
                    description=item.description,
                    instructor_id=item.instructor_id,
                    is_published=item.is_published,
                    created_at=item.created_at,
                    updated_at=item.updated_at
                )
                for item in items
            ]
        finally:
            db.close()

    @strawberry.field
    def course(self, info: Info, id: strawberry.ID) -> Optional[CourseType]:
        user = info.context.get("user")
        db = SessionLocal()
        try:
            course_uuid = uuid.UUID(id)
            item = db.query(Course).filter(Course.id == course_uuid).first()
            if not item:
                return None

            # Enforce that only instructors of the course or admins can view unpublished courses
            if not item.is_published:
                if not user or (user.role != "ADMIN" and item.instructor_id != user.id):
                    raise Exception("Unauthorized to view unpublished course")

            return CourseType(
                id=strawberry.ID(str(item.id)),
                title=item.title,
                description=item.description,
                instructor_id=item.instructor_id,
                is_published=item.is_published,
                created_at=item.created_at,
                updated_at=item.updated_at
            )
        finally:
            db.close()

    @strawberry.field
    def my_courses(self, info: Info) -> List[CourseType]:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            if user.role == "ADMIN":
                items = db.query(Course).all()
            elif user.role == "INSTRUCTOR":
                items = db.query(Course).filter(Course.instructor_id == user.id).all()
            else:  # STUDENT
                # Find all enrollments, then resolve courses
                enrollments = db.query(Enrollment).filter(Enrollment.user_id == user.id).all()
                course_ids = [e.course_id for e in enrollments]
                items = db.query(Course).filter(Course.id.in_(course_ids)).all()

            return [
                CourseType(
                    id=strawberry.ID(str(item.id)),
                    title=item.title,
                    description=item.description,
                    instructor_id=item.instructor_id,
                    is_published=item.is_published,
                    created_at=item.created_at,
                    updated_at=item.updated_at
                )
                for item in items
            ]
        finally:
            db.close()

    @strawberry.field
    def course_analytics(self, info: Info, course_id: strawberry.ID) -> List[AnalyticsType]:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            course_uuid = uuid.UUID(course_id)
            course = db.query(Course).filter(Course.id == course_uuid).first()
            if not course:
                raise Exception("Course not found")

            # Check authorization: only course instructor or admin can read course analytics
            if user.role != "ADMIN" and course.instructor_id != user.id:
                raise Exception("Unauthorized to view course analytics")

            analytics_items = db.query(Analytics).filter(Analytics.course_id == course_uuid).all()
            return [
                AnalyticsType(
                    id=strawberry.ID(str(item.id)),
                    course_id=strawberry.ID(str(item.course_id)) if item.course_id else None,
                    user_id=item.user_id,
                    event_type=item.event_type,
                    metadata=item.event_metadata,
                    created_at=item.created_at
                )
                for item in analytics_items
            ]
        finally:
            db.close()

    @strawberry.field
    def reports(self, info: Info) -> List[ReportType]:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            if user.role == "ADMIN":
                items = db.query(Report).all()
            elif user.role == "INSTRUCTOR":
                items = db.query(Report).filter(Report.generated_by == user.id).all()
            else:
                raise Exception("Unauthorized to view reports")

            return [
                ReportType(
                    id=strawberry.ID(str(item.id)),
                    title=item.title,
                    course_id=strawberry.ID(str(item.course_id)),
                    generated_by=item.generated_by,
                    data=item.data,
                    created_at=item.created_at
                )
                for item in items
            ]
        finally:
            db.close()

    @strawberry.field
    def report(self, info: Info, id: strawberry.ID) -> Optional[ReportType]:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            report_uuid = uuid.UUID(id)
            item = db.query(Report).filter(Report.id == report_uuid).first()
            if not item:
                return None

            # Only generator or admin can view
            if user.role != "ADMIN" and item.generated_by != user.id:
                raise Exception("Unauthorized to view this report")

            return ReportType(
                id=strawberry.ID(str(item.id)),
                title=item.title,
                course_id=strawberry.ID(str(item.course_id)),
                generated_by=item.generated_by,
                data=item.data,
                created_at=item.created_at
            )
        finally:
            db.close()
