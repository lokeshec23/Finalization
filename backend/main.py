from app.routes import auth_router
from app.db.database import db
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, Form, HTTPException, File, Query
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Optional
from pathlib import Path
from app.validation.compare_strings import safe_string_compare
import json
import os
import traceback
import tempfile
import zipfile
import glob


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

# ✅ NEW: Define separate collections for each team
dd_collection = db["dd_collection"]
ic_collection = db["ic_collection"]
filtered_key_collection = db["filteredKey"]

# ✅ NEW: Helper function to get the correct collection based on the team
def get_collection_for_team(team: str):
    if team == "dd":
        return dd_collection
    elif team == "ic":
        return ic_collection
    else:
        raise HTTPException(status_code=400, detail=f"Invalid team specified: {team}")

# Helper function to transform input JSON structure
def transform_input_json(raw_data):
    try:
        transformed = {}
        if "Summary" in raw_data and isinstance(raw_data["Summary"], list):
            for summary_item in raw_data["Summary"]:
                if "Labels" in summary_item and isinstance(summary_item["Labels"], list):
                    for label in summary_item["Labels"]:
                        label_name = label.get("LabelName", "Unknown")
                        values_array = label.get("Values", [])
                        extracted_values = [v.get("Value", "") for v in values_array if isinstance(v, dict)]
                        extracted_values = [v for v in extracted_values if v]
                        if len(extracted_values) == 0:
                            transformed[label_name] = ""
                        elif len(extracted_values) == 1:
                            transformed[label_name] = extracted_values[0]
                        else:
                            transformed[label_name] = extracted_values
        return transformed
    except Exception as e:
        print(f"Error transforming JSON: {e}")
        traceback.print_exc()
        return {}

# Helper function to update filter keys
async def update_filter_keys(raw_json):
    try:
        if not raw_json or "finalisation" not in raw_json:
            return
        filter_doc = await filtered_key_collection.find_one({"_id": "filter_keys"})
        new_keys = list(raw_json["finalisation"].keys())
        if filter_doc:
            existing_keys = filter_doc.get("keys", [])
            merged_keys = list(set(existing_keys + new_keys))
            await filtered_key_collection.update_one({"_id": "filter_keys"}, {"$set": {"keys": merged_keys}})
        else:
            await filtered_key_collection.insert_one({"_id": "filter_keys", "keys": new_keys})
    except Exception as e:
        print(f"Error updating filter keys: {e}")

@app.delete("/delete_all_json")
async def delete_all_json(team: str = Query(...)):
    """
    Deletes all documents from the specified team's collection.
    """
    try:
        collection = get_collection_for_team(team)
        result = await collection.delete_many({})
        return {
            "message": f"Deleted {result.deleted_count} documents from {team}_collection",
            "deleted_count": result.deleted_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete all documents")


@app.post("/upload_json")
async def upload_json(
    team: str = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    finalization_document_name: str = Form(...),
    json_file: UploadFile = File(None),
    input_files: List[UploadFile] = File(None),
    output_file: UploadFile = File(None)
):
    try:
        collection = get_collection_for_team(team)
        encodings = ['utf-8', 'utf-8-sig', 'windows-1252', 'latin-1', 'iso-8859-1']

        if json_file and not input_files and not output_file:
            file_content = await json_file.read()
            raw_json = None
            for encoding in encodings:
                try:
                    raw_json = json.loads(file_content.decode(encoding))
                    break
                except (UnicodeDecodeError, json.JSONDecodeError): continue
            if raw_json is None: raise HTTPException(status_code=400, detail="Could not decode JSON file")
            await update_filter_keys(raw_json)
            document = {"username": username, "email": email, "finalization_document_name": finalization_document_name, "original_filename": json_file.filename, "raw_json": raw_json, "upload_date": datetime.utcnow(), "upload_type": "single_file"}
            result = await collection.insert_one(document)
            return {"message": "File saved successfully!", "inserted_id": str(result.inserted_id), "filename": json_file.filename, "upload_type": "single_file"}

        elif input_files and output_file:
            input_finalisation, original_bm_json = {}, {}
            if len(input_files) == 1 and input_files[0].filename.endswith(".zip"):
                with tempfile.TemporaryDirectory() as temp_dir:
                    zip_path = Path(temp_dir) / input_files[0].filename
                    with open(zip_path, "wb") as f: f.write(await input_files[0].read())
                    with zipfile.ZipFile(zip_path, "r") as zip_ref: zip_ref.extractall(temp_dir)
                    for root, _, files in os.walk(temp_dir):
                        for file in files:
                            if not file.endswith(".json"): continue
                            file_path = Path(root) / file
                            relative_path = file_path.relative_to(Path(temp_dir))
                            parts = str(relative_path).split(os.sep)
                            category = parts[0] if len(parts) > 1 else "Uncategorized"
                            with open(file_path, "r", encoding="utf-8") as f: raw_json = json.load(f)
                            original_bm_json.setdefault(category, []).append({"filename": file, "data": raw_json})
                            transformed = transform_input_json(raw_json)
                            transformed["filename"] = file
                            input_finalisation.setdefault(category, []).append(transformed)
            else:
                for uploaded_file in input_files:
                    parts = uploaded_file.filename.split('/')
                    category = parts[-2] if len(parts) >= 2 else "Uncategorized"
                    raw_json = None
                    file_content = await uploaded_file.read()
                    for encoding in encodings:
                        try:
                            raw_json = json.loads(file_content.decode(encoding))
                            break
                        except: continue
                    if raw_json is None: continue
                    original_bm_json.setdefault(category, []).append({"filename": uploaded_file.filename, "data": raw_json})
                    transformed_data = transform_input_json(raw_json)
                    transformed_data["filename"] = uploaded_file.filename
                    input_finalisation.setdefault(category, []).append(transformed_data)
            
            output_content = await output_file.read()
            output_json = None
            for encoding in encodings:
                try:
                    output_json = json.loads(output_content.decode(encoding))
                    break
                except: continue
            if output_json is None: raise HTTPException(status_code=400, detail="Could not decode output JSON file")
            
            await update_filter_keys({"finalisation": input_finalisation})
            await update_filter_keys(output_json)
            
            document = {
                "username": username, "email": email, "finalization_document_name": finalization_document_name, "original_filename": output_file.filename,
                "input_data": {"finalisation": input_finalisation}, "original_bm_json": original_bm_json, "raw_json": output_json,
                "upload_date": datetime.utcnow(), "upload_type": "folder_structure", "input_categories": list(input_finalisation.keys()),
                "total_input_files": sum(len(v) for v in input_finalisation.values())
            }
            result = await collection.insert_one(document)
            return {"message": "Upload successful!", "inserted_id": str(result.inserted_id)}

        else:
            raise HTTPException(status_code=400, detail="Invalid upload configuration")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/filter_keys")
async def get_filter_keys():
    try:
        filter_doc = await filtered_key_collection.find_one({"_id": "filter_keys"})
        return {"keys": filter_doc.get("keys", []) if filter_doc else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents_by_category")
async def get_documents_by_category(team: str, category: str, username: str = None):
    try:
        collection = get_collection_for_team(team)
        query = {"$or": [{f"raw_json.finalisation.{category}": {"$exists": True}}, {f"input_data.finalisation.{category}": {"$exists": True}}]}
        if username: query["username"] = username
        cursor = collection.find(query).sort("_id", -1)
        documents = await cursor.to_list(length=100)
        result = [
            {"_id": str(doc["_id"]), "original_filename": doc.get("original_filename"), "finalization_document_name": doc.get("finalization_document_name"), "username": doc.get("username"), "upload_date": doc.get("upload_date"), "upload_type": doc.get("upload_type"),
             "category_data": doc.get("input_data", {}).get("finalisation", {}).get(category, []) if "input_data" in doc else doc.get("raw_json", {}).get("finalisation", {}).get(category, [])}
            for doc in documents
        ]
        return {"documents": result, "category": category, "count": len(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list_json")
async def list_json(team: str, username: str = None):
    try:
        collection = get_collection_for_team(team)
        query = {"username": username} if username else {}
        projection = {"original_filename": 1, "finalization_document_name": 1, "upload_date": 1, "username": 1, "upload_type": 1}
        cursor = collection.find(query, projection).sort("_id", -1)
        documents = await cursor.to_list(length=100)
        for doc in documents: doc["_id"] = str(doc["_id"])
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_json_by_filename")
async def get_json_by_filename(team: str, filename: str, username: str = None):
    try:
        collection = get_collection_for_team(team)
        query = {"original_filename": filename}
        if username: query["username"] = username
        document = await collection.find_one(query)
        if not document: raise HTTPException(status_code=404, detail="Document not found")
        document["_id"] = str(document["_id"])
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_json/{document_id}")
async def get_json(document_id: str, team: str = Query(...)):
    try:
        from bson import ObjectId
        collection = get_collection_for_team(team)
        if not ObjectId.is_valid(document_id): raise HTTPException(status_code=400, detail="Invalid document ID")
        document = await collection.find_one({"_id": ObjectId(document_id)})
        if not document: raise HTTPException(status_code=404, detail="Document not found")
        document["_id"] = str(document["_id"])
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_json/{document_id}")
async def delete_json(document_id: str, team: str = Query(...)):
    try:
        from bson import ObjectId
        collection = get_collection_for_team(team)
        if not ObjectId.is_valid(document_id): raise HTTPException(status_code=400, detail="Invalid document ID")
        result = await collection.delete_one({"_id": ObjectId(document_id)})
        if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Document not found")
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/validate_property")
async def validate_property(value1: str = Form(...), value2: str = Form(...), match_type: str = Form(...)):
    try:
        field_type_map = {"Address": "address", "Name": "name"}
        field_type = field_type_map.get(match_type, "default")
        result = safe_string_compare(value1, value2, field_type=field_type)
        return {"is_valid": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch_process")
async def batch_process(
    input_folder_path: str = Form(...),
    output_folder_path: str = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    team: str = Form(...)
):
    try:
        collection = get_collection_for_team(team)
        if not os.path.exists(input_folder_path): raise HTTPException(status_code=400, detail=f"Input folder not found: {input_folder_path}")
        if not os.path.exists(output_folder_path): raise HTTPException(status_code=400, detail=f"Output folder not found: {output_folder_path}")

        base_root = os.path.dirname(os.path.dirname(input_folder_path.rstrip("\\/")))
        processed_root = os.path.join(base_root, "Processed")
        processed_input = os.path.join(processed_root, "input")
        processed_output = os.path.join(processed_root, "output")
        os.makedirs(processed_input, exist_ok=True)
        os.makedirs(processed_output, exist_ok=True)

        zip_files = glob.glob(os.path.join(input_folder_path, "*.zip"))
        if not zip_files: raise HTTPException(status_code=400, detail="No ZIP files found")

        results = {"total": len(zip_files), "successful": [], "failed": [], "skipped": []}
        encodings = ["utf-8", "utf-8-sig", "windows-1252", "latin-1", "iso-8859-1"]

        for zip_path in zip_files:
            zip_filename = os.path.basename(zip_path)
            base_name = zip_filename.replace(".zip", "")
            try:
                output_json_name = f"{base_name}_final.json"
                output_json_path = os.path.join(output_folder_path, output_json_name)
                if not os.path.exists(output_json_path):
                    results["skipped"].append({"filename": zip_filename, "reason": "Output JSON missing"})
                    continue

                with tempfile.TemporaryDirectory() as temp_dir:
                    with zipfile.ZipFile(zip_path, "r") as zip_ref: zip_ref.extractall(temp_dir)
                    input_finalisation, original_bm_json = {}, {}
                    for root, _, files in os.walk(temp_dir):
                        for file in files:
                            if not file.endswith(".json"): continue
                            file_path = Path(root) / file
                            relative_path = file_path.relative_to(Path(temp_dir))
                            parts = str(relative_path).split(os.sep)
                            category = parts[0] if len(parts) > 1 else "Uncategorized"
                            with open(file_path, "r", encoding="utf-8") as f: raw_json = json.load(f)
                            original_bm_json.setdefault(category, []).append({"filename": file, "data": raw_json})
                            transformed = transform_input_json(raw_json)
                            transformed["filename"] = file
                            input_finalisation.setdefault(category, []).append(transformed)

                    with open(output_json_path, "r", encoding="utf-8") as f: content = f.read()
                    output_json = None
                    for enc in encodings:
                        try:
                            output_json = json.loads(content)
                            break
                        except: f.seek(0)
                    if output_json is None: raise Exception("Could not decode output JSON")

                    await update_filter_keys({"finalisation": input_finalisation})
                    await update_filter_keys(output_json)

                    document = {
                        "username": username, "email": email, "finalization_document_name": base_name, "original_filename": output_json_name,
                        "input_data": {"finalisation": input_finalisation}, "original_bm_json": original_bm_json, "raw_json": output_json,
                        "upload_date": datetime.utcnow(), "upload_type": "batch_zip", "input_categories": list(input_finalisation.keys()),
                        "total_input_files": sum(len(v) for v in input_finalisation.values()),
                    }

                    update_result = await collection.update_one({"username": username, "finalization_document_name": base_name}, {"$set": document}, upsert=True)
                    
                    action = "updated" if update_result.modified_count > 0 else "inserted"
                    
                    dest_zip, dest_json = os.path.join(processed_input, zip_filename), os.path.join(processed_output, output_json_name)
                    if os.path.exists(dest_zip): os.remove(dest_zip)
                    if os.path.exists(dest_json): os.remove(dest_json)
                    os.replace(zip_path, dest_zip)
                    os.replace(output_json_path, dest_json)

                    results["successful"].append({"zip_file": zip_filename, "action": action})

            except Exception as e:
                results["failed"].append({"filename": zip_filename, "error": str(e)})

        return {"message": "Batch processing completed", "summary": {"total": results["total"], "successful": len(results["successful"]), "failed": len(results["failed"]), "skipped": len(results["skipped"])}, "details": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(auth_router.router)