from fastapi.middleware.cors import CORSMiddleware
from app.models.upload_json_model import UploadJsonModel
from app.routes import auth_router
from fastapi import FastAPI
from app.db.database import db
import traceback
from fastapi import FastAPI, UploadFile, Form, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import json
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Finalization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # during dev; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database_url = os.getenv("MONGODB_URL")
db_name = os.getenv("DB_Name")

print("Connecting to database:", database_url, "DB Name:", db_name)

# Mongo connection
client = AsyncIOMotorClient(database_url)
db = client[db_name]
upload_json_collection = db["uploadedJSON"]

@app.post("/upload_json")
async def upload_json(
    username: str = Form(...),
    email: str = Form(...),
    finalization_document_name: str = Form(...),
    json_file: UploadFile = None
):
    try:
        # Read and parse uploaded file
        file_content = await json_file.read()
        raw_json = json.loads(file_content.decode("utf-8"))

        # Prepare document
        document = {
            "username": username,
            "email": email,
            "finalization_document_name": finalization_document_name,
            "raw_json": raw_json
        }

        # Save document to MongoDB
        result = await upload_json_collection.insert_one(document)

        return {
            "message": "File saved ok!",
            "inserted_id": str(result.inserted_id)
        }

    except Exception as e:
        print("Upload error:", e)
        raise HTTPException(status_code=500, detail="Failed to save document")


app.include_router(auth_router.router)