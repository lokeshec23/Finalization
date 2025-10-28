from app.routes import auth_router
from app.db.database import db
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, Form, HTTPException, File
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
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
filtered_key_collection = db["filteredKey"]  # ✅ New collection

# ✅ Helper function to update filter keys
async def update_filter_keys(raw_json):
    """Extract keys from raw_json.finalisation and update filteredKey collection"""
    try:
        if not raw_json or "finalisation" not in raw_json:
            return
        
        # Get existing filter keys document
        filter_doc = await filtered_key_collection.find_one({"_id": "filter_keys"})
        
        # Extract new keys from uploaded JSON
        new_keys = list(raw_json["finalisation"].keys())
        
        if filter_doc:
            # Existing document - merge keys without duplicates
            existing_keys = filter_doc.get("keys", [])
            merged_keys = list(set(existing_keys + new_keys))
            
            await filtered_key_collection.update_one(
                {"_id": "filter_keys"},
                {"$set": {"keys": merged_keys}}
            )
            print(f"✅ Updated filter keys: {merged_keys}")
        else:
            # First time - create new document
            await filtered_key_collection.insert_one({
                "_id": "filter_keys",
                "keys": new_keys
            })
            print(f"✅ Created filter keys: {new_keys}")
            
    except Exception as e:
        print(f"Error updating filter keys: {e}")


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

        # ✅ Update filter keys collection
        await update_filter_keys(raw_json)

        document = {
            "username": username,
            "email": email,
            "finalization_document_name": finalization_document_name,
            "original_filename": json_file.filename,
            "raw_json": raw_json,
            "upload_date": datetime.utcnow()
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


# ✅ Get all filter keys
@app.get("/filter_keys")
async def get_filter_keys():
    try:
        filter_doc = await filtered_key_collection.find_one({"_id": "filter_keys"})
        
        if not filter_doc:
            return {"keys": []}
        
        return {"keys": filter_doc.get("keys", [])}
    
    except Exception as e:
        print("Get filter keys error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# ✅ Get documents by category
@app.get("/documents_by_category")
async def get_documents_by_category(category: str, username: str = None):
    try:
        # Build query to find documents that have this category in raw_json.finalisation
        query = {f"raw_json.finalisation.{category}": {"$exists": True}}
        
        if username:
            query["username"] = username
        
        cursor = upload_json_collection.find(query).sort("_id", -1)
        documents = await cursor.to_list(length=100)
        
        # Convert ObjectId to string and prepare response
        result = []
        for doc in documents:
            result.append({
                "_id": str(doc["_id"]),
                "original_filename": doc.get("original_filename", "Unknown"),
                "finalization_document_name": doc.get("finalization_document_name", ""),
                "username": doc.get("username", ""),
                "category_data": doc["raw_json"]["finalisation"].get(category, []),
                "upload_date": doc.get("upload_date")
            })
        
        return {"documents": result, "category": category, "count": len(result)}
    
    except Exception as e:
        print("Get documents by category error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# Existing endpoints...
@app.get("/list_json")
async def list_json(username: str = None):
    try:
        query = {"username": username} if username else {}
        
        cursor = upload_json_collection.find(query).sort("_id", -1)
        documents = await cursor.to_list(length=100)
        
        for doc in documents:
            doc["_id"] = str(doc["_id"])
        
        return {"documents": documents}
    
    except Exception as e:
        print("List error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/get_json_by_filename")
async def get_json_by_filename(filename: str, username: str = None):
    try:
        query = {"original_filename": filename}
        if username:
            query["username"] = username
        
        document = await upload_json_collection.find_one(query)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document["_id"] = str(document["_id"])
        
        print(f"✅ Found document by filename: {filename}")
        
        return document
    
    except HTTPException:
        raise
    except Exception as e:
        print("Fetch by filename error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/get_json/{document_id}")
async def get_json(document_id: str):
    try:
        from bson import ObjectId
        
        if not ObjectId.is_valid(document_id):
            raise HTTPException(status_code=400, detail="Invalid document ID")
        
        document = await upload_json_collection.find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document["_id"] = str(document["_id"])
        
        return document
    
    except HTTPException:
        raise
    except Exception as e:
        print("Fetch error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.delete("/delete_json/{document_id}")
async def delete_json(document_id: str):
    try:
        from bson import ObjectId
        
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


app.include_router(auth_router.router)