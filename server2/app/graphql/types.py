import strawberry
import uuid
from datetime import datetime
from typing import Optional, List

@strawberry.type
class EnrollmentType:
    id: strawberry.ID
    course_id: strawberry.ID
    user_id: str
    enrolled_at: datetime

from strawberry.types import Info

@strawberry.type
class CourseType:
    id: strawberry.ID
    title: str
    description: Optional[str]
    instructor_id: str
    is_published: bool
    created_at: datetime
    updated_at: datetime

    @strawberry.field
    def enrollments(self, info: Info) -> List[EnrollmentType]:
        # Lazily fetch enrollments if needed, or get them from db session
        from app.database import SessionLocal
        from app.models import Enrollment
        db = SessionLocal()
        try:
            items = db.query(Enrollment).filter(Enrollment.course_id == uuid.UUID(self.id)).all()
            return [
                EnrollmentType(
                    id=strawberry.ID(str(item.id)),
                    course_id=strawberry.ID(str(item.course_id)),
                    user_id=item.user_id,
                    enrolled_at=item.enrolled_at
                )
                for item in items
            ]
        finally:
            db.close()

@strawberry.type
class AnalyticsType:
    id: strawberry.ID
    course_id: Optional[strawberry.ID]
    user_id: Optional[str]
    event_type: str
    metadata: Optional[strawberry.scalars.JSON]
    created_at: datetime

@strawberry.type
class ReportType:
    id: strawberry.ID
    title: str
    course_id: strawberry.ID
    generated_by: str
    data: strawberry.scalars.JSON
    created_at: datetime
