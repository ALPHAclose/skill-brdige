import strawberry
import uuid
from typing import Optional
from strawberry.types import Info
from app.database import SessionLocal
from app.models import Course, Enrollment, Analytics, Report
from app.graphql.types import CourseType, EnrollmentType, AnalyticsType, ReportType
from app.redis_client import publish_course_enrolled, publish_course_completed, publish_notification_send

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_course(self, info: Info, title: str, description: Optional[str] = None) -> CourseType:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")
        if user.role not in ["INSTRUCTOR", "ADMIN"]:
            raise Exception("Unauthorized: Only instructors or admins can create courses")

        db = SessionLocal()
        try:
            course = Course(
                title=title,
                description=description,
                instructor_id=user.id,
                is_published=False
            )
            db.add(course)
            db.commit()
            db.refresh(course)
            return CourseType(
                id=strawberry.ID(str(course.id)),
                title=course.title,
                description=course.description,
                instructor_id=course.instructor_id,
                is_published=course.is_published,
                created_at=course.created_at,
                updated_at=course.updated_at
            )
        finally:
            db.close()

    @strawberry.mutation
    def update_course(self, info: Info, id: strawberry.ID, title: Optional[str] = None, description: Optional[str] = None) -> CourseType:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            course_uuid = uuid.UUID(id)
            course = db.query(Course).filter(Course.id == course_uuid).first()
            if not course:
                raise Exception("Course not found")

            if user.role != "ADMIN" and course.instructor_id != user.id:
                raise Exception("Unauthorized: You do not own this course")

            if title is not None:
                course.title = title
            if description is not None:
                course.description = description

            db.commit()
            db.refresh(course)
            return CourseType(
                id=strawberry.ID(str(course.id)),
                title=course.title,
                description=course.description,
                instructor_id=course.instructor_id,
                is_published=course.is_published,
                created_at=course.created_at,
                updated_at=course.updated_at
            )
        finally:
            db.close()

    @strawberry.mutation
    def delete_course(self, info: Info, id: strawberry.ID) -> bool:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            course_uuid = uuid.UUID(id)
            course = db.query(Course).filter(Course.id == course_uuid).first()
            if not course:
                raise Exception("Course not found")

            if user.role != "ADMIN" and course.instructor_id != user.id:
                raise Exception("Unauthorized: You do not own this course")

            db.delete(course)
            db.commit()
            return True
        finally:
            db.close()

    @strawberry.mutation
    def publish_course(self, info: Info, id: strawberry.ID, publish: bool) -> CourseType:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            course_uuid = uuid.UUID(id)
            course = db.query(Course).filter(Course.id == course_uuid).first()
            if not course:
                raise Exception("Course not found")

            if user.role != "ADMIN" and course.instructor_id != user.id:
                raise Exception("Unauthorized: You do not own this course")

            course.is_published = publish
            db.commit()
            db.refresh(course)
            return CourseType(
                id=strawberry.ID(str(course.id)),
                title=course.title,
                description=course.description,
                instructor_id=course.instructor_id,
                is_published=course.is_published,
                created_at=course.created_at,
                updated_at=course.updated_at
            )
        finally:
            db.close()

    @strawberry.mutation
    def enroll_course(self, info: Info, course_id: strawberry.ID) -> EnrollmentType:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            course_uuid = uuid.UUID(course_id)
            course = db.query(Course).filter(Course.id == course_uuid).first()
            if not course:
                raise Exception("Course not found")

            if not course.is_published and user.role != "ADMIN" and course.instructor_id != user.id:
                raise Exception("Cannot enroll in an unpublished course")

            # Check if already enrolled
            existing = db.query(Enrollment).filter(
                Enrollment.course_id == course_uuid,
                Enrollment.user_id == user.id
            ).first()
            if existing:
                return EnrollmentType(
                    id=strawberry.ID(str(existing.id)),
                    course_id=strawberry.ID(str(existing.course_id)),
                    user_id=existing.user_id,
                    enrolled_at=existing.enrolled_at
                )

            enrollment = Enrollment(
                course_id=course_uuid,
                user_id=user.id
            )
            db.add(enrollment)
            db.commit()
            db.refresh(enrollment)

            # Publish course:enrolled event to Redis
            publish_course_enrolled(user.id, str(course_uuid))

            # Send Redis notification to notify the instructor
            notification_msg = f"A student ({user.email}) has enrolled in your course: {course.title}"
            publish_notification_send(
                user_id=course.instructor_id,
                title="New Course Enrollment",
                message=notification_msg,
                metadata={"courseId": str(course_uuid), "studentId": user.id}
            )

            return EnrollmentType(
                id=strawberry.ID(str(enrollment.id)),
                course_id=strawberry.ID(str(enrollment.course_id)),
                user_id=enrollment.user_id,
                enrolled_at=enrollment.enrolled_at
            )
        finally:
            db.close()

    @strawberry.mutation
    def track_event(self, info: Info, course_id: Optional[strawberry.ID], event_type: str, metadata: Optional[strawberry.scalars.JSON] = None) -> AnalyticsType:
        user = info.context.get("user")
        user_id = user.id if user else None

        db = SessionLocal()
        try:
            course_uuid = uuid.UUID(course_id) if course_id else None

            # Optional check: verify course exists if provided
            if course_uuid:
                course_exists = db.query(Course).filter(Course.id == course_uuid).first()
                if not course_exists:
                    raise Exception("Course not found")

            analytics = Analytics(
                course_id=course_uuid,
                user_id=user_id,
                event_type=event_type,
                event_metadata=metadata
            )
            db.add(analytics)
            db.commit()
            db.refresh(analytics)

            # If user completed the course, publish course:completed event to Redis
            if event_type == "course_completed" and user_id and course_uuid:
                publish_course_completed(user_id, str(course_uuid))

            return AnalyticsType(
                id=strawberry.ID(str(analytics.id)),
                course_id=strawberry.ID(str(analytics.course_id)) if analytics.course_id else None,
                user_id=analytics.user_id,
                event_type=analytics.event_type,
                metadata=analytics.event_metadata,
                created_at=analytics.created_at
            )
        finally:
            db.close()

    @strawberry.mutation
    def generate_report(self, info: Info, course_id: strawberry.ID, title: str) -> ReportType:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            course_uuid = uuid.UUID(course_id)
            course = db.query(Course).filter(Course.id == course_uuid).first()
            if not course:
                raise Exception("Course not found")

            if user.role != "ADMIN" and course.instructor_id != user.id:
                raise Exception("Unauthorized to generate reports for this course")

            # Simple analytical aggregation
            enrollment_count = db.query(Enrollment).filter(Enrollment.course_id == course_uuid).count()
            event_count = db.query(Analytics).filter(Analytics.course_id == course_uuid).count()
            
            report_data = {
                "course_id": str(course_uuid),
                "course_title": course.title,
                "enrollment_count": enrollment_count,
                "total_analytics_events": event_count,
                "generated_at": str(uuid.uuid4()) # simple unique ID / timestamp
            }

            report = Report(
                title=title,
                course_id=course_uuid,
                generated_by=user.id,
                data=report_data
            )
            db.add(report)
            db.commit()
            db.refresh(report)

            return ReportType(
                id=strawberry.ID(str(report.id)),
                title=report.title,
                course_id=strawberry.ID(str(report.course_id)),
                generated_by=report.generated_by,
                data=report.data,
                created_at=report.created_at
            )
        finally:
            db.close()

    @strawberry.mutation
    def delete_report(self, info: Info, id: strawberry.ID) -> bool:
        user = info.context.get("user")
        if not user:
            raise Exception("Authentication required")

        db = SessionLocal()
        try:
            report_uuid = uuid.UUID(id)
            report = db.query(Report).filter(Report.id == report_uuid).first()
            if not report:
                raise Exception("Report not found")

            if user.role != "ADMIN" and report.generated_by != user.id:
                raise Exception("Unauthorized: You did not generate this report")

            db.delete(report)
            db.commit()
            return True
        finally:
            db.close()
