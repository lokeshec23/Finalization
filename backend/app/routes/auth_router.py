from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.user_schema import UserCreate, UserLogin, UserResponse
from app.db.database import db
from app.utils.jwt_handler import create_access_token
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password

    await db.users.insert_one(user_dict)
    return UserResponse(name=user.name, email=user.email)

@router.post("/login")
async def login_user(user: UserLogin):
    existing_user = await db.users.find_one({"email": user.email})
    if not existing_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not pwd_context.verify(user.password, existing_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": str(existing_user["_id"]), "email": existing_user["email"]})
    return {"access_token": token, "token_type": "bearer"}
