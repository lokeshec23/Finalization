from app.routes import auth_router
from app.db.database import db
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, Form, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import json, os, traceback

# Load .env
load_dotenv()

app = FastAPI(title="Finalization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB setup
database_url = os.getenv("MONGODB_URL")
db_name = os.getenv("DB_Name")

print(f"Connecting to database: {database_url} | DB Name: {db_name}")

client = AsyncIOMotorClient(database_url)
db = client[db_name]
upload_json_collection = db["uploadedJSON"]

@app.post("/upload_json")
async def upload_json(
    username: str = Form(...),
    email: str = Form(...),
    finalization_document_name: str = Form(...),
    json_file: UploadFile = None,
):
    try:
        if not json_file:
            raise HTTPException(status_code=400, detail="No file provided")

        # Read and validate JSON
        file_content = await json_file.read()
        try:
            raw_json = json.loads(file_content.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON file")

        document = {
            "username": username,
            "email": email,
            "finalization_document_name": finalization_document_name,
            "raw_json": raw_json,
        }

        result = await upload_json_collection.insert_one(document)

        return {"message": "File saved ok!", "inserted_id": str(result.inserted_id)}

    except HTTPException:
        raise
    except Exception as e:
        print("Upload error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")




app.include_router(auth_router.router)