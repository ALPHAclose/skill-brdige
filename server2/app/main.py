from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.config import settings
from app.database import engine, Base
from app.auth import get_current_user
from app.graphql.schema import schema
from app.redis_client import redis_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically on startup
    Base.metadata.create_all(bind=engine)
    # Ping Redis to verify connectivity on boot
    try:
        redis_client.ping()
        print("[Redis] Connected successfully")
    except Exception as e:
        print(f"[Redis] Connection error: {e}")
    yield

app = FastAPI(
    title="SkillBridge Server2 (Courses, Analytics & Reports)",
    lifespan=lifespan
)

# Set up CORS middleware
origins = [o.strip() for o in settings.CORS_ORIGIN.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_context(request: Request):
    """Inject current user context based on trusted gateway headers."""
    try:
        user = get_current_user(request)
    except Exception:
        user = None
    return {
        "request": request,
        "user": user
    }

# Create GraphQL router with custom context getter
graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")

@app.get("/health")
def health_check():
    """Health check endpoint to verify service and Redis connectivity."""
    redis_ok = False
    try:
        redis_ok = redis_client.ping()
    except Exception:
        pass
        
    return {
        "status": "ok" if redis_ok else "degraded",
        "service": "server2",
        "redis_connected": redis_ok
    }
