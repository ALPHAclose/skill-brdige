import json
import redis
from app.config import settings

# Initialize Redis client with decode_responses=True for convenient JSON handling
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def publish_course_enrolled(user_id: str, course_id: str):
    """
    Publishes a course:enrolled event to Redis.
    Matches Server1 socket handler expectation.
    """
    payload = {
        "userId": user_id,
        "role": "STUDENT",
        "courseId": course_id
    }
    redis_client.publish("course:enrolled", json.dumps(payload))

def publish_course_completed(user_id: str, course_id: str):
    """
    Publishes a course:completed event to Redis.
    """
    payload = {
        "userId": user_id,
        "courseId": course_id
    }
    redis_client.publish("course:completed", json.dumps(payload))

def publish_notification_send(user_id: str, title: str, message: str, metadata: dict = None):
    """
    Publishes a notification:send event to Redis.
    Server1 subscribes to this to persist and push the notification in real-time.
    """
    payload = {
        "userId": user_id,
        "title": title,
        "message": message,
        "metadata": metadata or {}
    }
    redis_client.publish("notification:send", json.dumps(payload))
