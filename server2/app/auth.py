from fastapi import Request, HTTPException, status
from pydantic import BaseModel
from app.config import settings

class CurrentUser(BaseModel):
    id: str
    role: str
    email: str

def get_current_user(request: Request) -> CurrentUser:
    # 1. Verify trusted gateway secret (case-insensitive key retrieval via request.headers)
    trusted_secret = request.headers.get(settings.TRUSTED_GATEWAY_HEADER.lower())
    if trusted_secret != settings.TRUSTED_GATEWAY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Request did not come from the trusted API Gateway"
        )

    # 2. Extract identity headers
    user_id = request.headers.get("x-user-id")
    user_role = request.headers.get("x-user-role")
    user_email = request.headers.get("x-user-email")

    if not user_id or not user_role or not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing trusted user headers"
        )

    return CurrentUser(id=user_id, role=user_role, email=user_email)
