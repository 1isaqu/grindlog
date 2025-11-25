from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# --- Models ---

class Exercise(BaseModel):
    id: Union[str, int]
    name: str
    muscle: Optional[str] = None
    created_at: Optional[str] = None

class WorkoutSet(BaseModel):
    reps: float  # Changed to float to allow partial reps if needed, or just safety
    weight: float

class WorkoutLog(BaseModel):
    id: str
    exercise_id: str
    timestamp: str
    sets: List[WorkoutSet]

class BackupData(BaseModel):
    userId: str
    exercises: List[Exercise]
    logs: List[WorkoutLog]
    last_synced: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "GymLog API Online"}

@api_router.post("/backup")
async def create_backup(data: BackupData):
    """
    Saves the full local state to MongoDB.
    Upserts based on userId.
    """
    try:
        backup_dict = data.model_dump()
        # Use userId as the unique identifier for the backup
        await db.backups.update_one(
            {"userId": data.userId},
            {"$set": backup_dict},
            upsert=True
        )
        return {"status": "success", "message": "Backup saved successfully", "timestamp": backup_dict["last_synced"]}
    except Exception as e:
        logging.error(f"Backup failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/backup/{user_id}")
async def get_backup(user_id: str):
    """
    Retrieves the backup for a specific user.
    """
    backup = await db.backups.find_one({"userId": user_id}, {"_id": 0})
    if not backup:
        raise HTTPException(status_code=404, detail="No backup found for this user")
    return backup

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
