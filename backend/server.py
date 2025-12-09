from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# --- Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-this") # In production, set this in .env!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# App setup
app = FastAPI()

# CORS - restrict in production
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Utils ---
def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")

def init_db():
    """Verify database connection on startup"""
    try:
        conn = get_db_connection()
        conn.close()
        logger.info("Database connection verified.")
    except Exception as e:
        logger.error(f"Database connection failed on startup: {e}")

# Call init on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# --- Models ---
class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Auth Utils ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency for protected routes
async def get_current_user(token: str = Depends(lambda x: x)): # Simplifying for now, usually OAuth2PasswordBearer
    # Placeholder for proper header extraction if not using OAuth2 scheme fully in frontend yet
    # But usually frontend sends "Authorization: Bearer <token>"
    pass

# --- Routes ---
api_router = APIRouter(prefix="/api")

@api_router.get("/")
def read_root():
    return {"message": "GrindLog API Secure"}

@api_router.post("/auth/register")
def register(user: UserRegister):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        hashed_pw = get_password_hash(user.password)
        cur.execute(
            "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id, email",
            (user.email, hashed_pw)
        )
        new_user = cur.fetchone()
        conn.commit()
        return {"status": "success", "user_id": new_user[0]}
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        conn.rollback()
        logger.error(f"Register error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")
    finally:
        cur.close()
        conn.close()

@api_router.post("/auth/login", response_model=Token)
def login(user: UserLogin):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (user.email,))
        db_user = cur.fetchone()
        
        if not db_user or not verify_password(user.password, db_user['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user['email'], "user_id": str(db_user['id'])},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    finally:
        cur.close()
        conn.close()

# Include router
app.include_router(api_router)
