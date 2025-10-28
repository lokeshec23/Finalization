from bson import ObjectId
from app.routes import auth_router
from app.db.database import db
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, Form, HTTPException, File  # ✅ Added File import
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import json, os, traceback
from datetime import datetime
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
        encodings = ['utf-8', 'utf-8-sig', 'windows-1252', 'latin-1', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                decoded_content = file_content.decode(encoding)
                raw_json = json.loads(decoded_content)
                print(f"✅ Successfully decoded with: {encoding}")
                break
            except (UnicodeDecodeError, json.JSONDecodeError):
                continue
        
        if raw_json is None:
            raise HTTPException(status_code=400, detail="Could not decode JSON file with any supported encoding")

        # ✅ UPDATED: Store original filename
        document = {
            "username": username,
            "email": email,
            "finalization_document_name": finalization_document_name,
            "original_filename": json_file.filename,  # ✅ ADD THIS LINE
            "raw_json": raw_json,
            "upload_date": datetime.utcnow()  # ✅ Optional: Add upload timestamp
        }

        result = await upload_json_collection.insert_one(document)

        print(f"✅ Document inserted with ID: {result.inserted_id}")

        return {
            "message": "File saved successfully!",
            "inserted_id": str(result.inserted_id),
            "filename": json_file.filename  # ✅ Return original filename
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Upload error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# Existing list endpoint (if not already added)
@app.get("/list_json")
async def list_json(username: str = None):
    try:
        query = {"username": username} if username else {}
        
        cursor = upload_json_collection.find(query).sort("_id", -1)
        documents = await cursor.to_list(length=100)
        
        # Convert ObjectId to string and prepare response
        for doc in documents:
            doc["_id"] = str(doc["_id"])
        
        return {"documents": documents}
    
    except Exception as e:
        print("List error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# DELETE endpoint
@app.delete("/delete_json/{document_id}")
async def delete_json(document_id: str):
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(document_id):
            raise HTTPException(status_code=400, detail="Invalid document ID")
        
        result = await upload_json_collection.delete_one({"_id": ObjectId(document_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted successfully", "deleted_id": document_id}
    
    except HTTPException:
        raise
    except Exception as e:
        print("Delete error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# GET single document endpoint (for view)
@app.get("/get_json/{document_id}")
async def get_json(document_id: str):
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(document_id):
            raise HTTPException(status_code=400, detail="Invalid document ID")
        
        document = await upload_json_collection.find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Convert ObjectId to string for JSON serialization
        document["_id"] = str(document["_id"])
        
        return document
    
    except HTTPException:
        raise
    except Exception as e:
        print("Fetch error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

app.include_router(auth_router.router)