from app.routes import auth_router
from app.db.database import db
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, Form, HTTPException, File  # ✅ Added File import
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
    json_file: UploadFile = File(...)
):
    try:
        if not json_file or not json_file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        file_content = await json_file.read()
        
        print(f"Received file: {json_file.filename}, size: {len(file_content)} bytes")
        
        # Try multiple encodings
        raw_json = None
        encodings = ['utf-8', 'utf-8-sig', 'windows-1252', 'latin-1', 'iso-8859-1', 'cp1252']
        
        for encoding in encodings:
            try:
                decoded_content = file_content.decode(encoding)
                
                # ✅ Normalize unicode characters
                import unicodedata
                decoded_content = unicodedata.normalize('NFKC', decoded_content)
                
                raw_json = json.loads(decoded_content)
                print(f"✅ Successfully decoded with: {encoding}")
                break
            except (UnicodeDecodeError, json.JSONDecodeError):
                continue
        
        if raw_json is None:
            raise HTTPException(status_code=400, detail="Could not decode JSON file")

        # ✅ Clean the JSON data recursively
        def clean_text(obj):
            if isinstance(obj, dict):
                return {k: clean_text(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_text(item) for item in obj]
            elif isinstance(obj, str):
                # Normalize and clean text
                return obj.encode('utf-8', errors='ignore').decode('utf-8')
            return obj
        
        raw_json = clean_text(raw_json)

        document = {
            "username": username,
            "email": email,
            "finalization_document_name": finalization_document_name,
            "raw_json": raw_json,
        }

        result = await upload_json_collection.insert_one(document)

        print(f"✅ Document inserted with ID: {result.inserted_id}")

        return {
            "message": "File saved successfully!",
            "inserted_id": str(result.inserted_id),
            "filename": json_file.filename
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Upload error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

app.include_router(auth_router.router)