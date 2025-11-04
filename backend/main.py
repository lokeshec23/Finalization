from app.routes import auth_router
from app.db.database import db
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, Form, HTTPException, File
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
upload_json_collection = db["uploadedJSON"]
filtered_key_collection = db["filteredKey"]

# ✅ Helper function to transform input JSON structure
# ✅ UPDATED: Helper function to transform input JSON structure
# ✅ UPDATED: Helper function to transform input JSON structure
def transform_input_json(raw_data):
    """
    Transform input JSON - Only Labels array data
    - Single value: "LabelName": "Value"
    - Multiple values: "LabelName": ["Value1", "Value2"]
    """
    try:
        transformed = {}
        
        # Process Summary -> Labels ONLY
        if "Summary" in raw_data and isinstance(raw_data["Summary"], list):
            for summary_item in raw_data["Summary"]:
                if "Labels" in summary_item and isinstance(summary_item["Labels"], list):
                    for label in summary_item["Labels"]:
                        # Keep original LabelName
                        label_name = label.get("LabelName", "Unknown")
                        
                        # Get Values array
                        values_array = label.get("Values", [])
                        
                        # Extract "Value" field from each object
                        extracted_values = [
                            v.get("Value", "") for v in values_array 
                            if isinstance(v, dict)
                        ]
                        
                        # Filter out empty values
                        extracted_values = [v for v in extracted_values if v]
                        
                        # Store based on count
                        if len(extracted_values) == 0:
                            transformed[label_name] = ""
                        elif len(extracted_values) == 1:
                            transformed[label_name] = extracted_values[0]  # Single value as string
                        else:
                            transformed[label_name] = extracted_values  # Multiple values as array
        
        return transformed
    except Exception as e:
        print(f"Error transforming JSON: {e}")
        traceback.print_exc()
        return {}


# ✅ Helper function to update filter keys
async def update_filter_keys(raw_json):
    """Extract keys from raw_json.finalisation and update filteredKey collection"""
    try:
        if not raw_json or "finalisation" not in raw_json:
            return
        
        filter_doc = await filtered_key_collection.find_one({"_id": "filter_keys"})
        new_keys = list(raw_json["finalisation"].keys())
        
        if filter_doc:
            existing_keys = filter_doc.get("keys", [])
            merged_keys = list(set(existing_keys + new_keys))
            await filtered_key_collection.update_one(
                {"_id": "filter_keys"},
                {"$set": {"keys": merged_keys}}
            )
            print(f"✅ Updated filter keys: {merged_keys}")
        else:
            await filtered_key_collection.insert_one({
                "_id": "filter_keys",
                "keys": new_keys
            })
            print(f"✅ Created filter keys: {new_keys}")
            
    except Exception as e:
        print(f"Error updating filter keys: {e}")



# ✅ UPDATED: Upload both single JSON and folder structure
@app.post("/upload_json")
async def upload_json(
    username: str = Form(...),
    email: str = Form(...),
    finalization_document_name: str = Form(...),
    json_file: UploadFile = File(None),
    input_files: List[UploadFile] = File(None),
    output_file: UploadFile = File(None)
):
    """
    Handles uploads of:
    1. Single JSON file (legacy)
    2. Folder structure (multiple JSON files)
    3. Single ZIP file (containing categorized JSONs)
    """
    try:
        encodings = ['utf-8', 'utf-8-sig', 'windows-1252', 'latin-1', 'iso-8859-1']

        # ===== CASE 1: Single JSON File Upload =====
        if json_file and not input_files and not output_file:
            print(f"📄 Single file upload: {json_file.filename}")

            file_content = await json_file.read()
            raw_json = None

            for encoding in encodings:
                try:
                    decoded_content = file_content.decode(encoding)
                    raw_json = json.loads(decoded_content)
                    print(f"✅ Successfully decoded with: {encoding}")
                    break
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue

            if raw_json is None:
                raise HTTPException(status_code=400, detail="Could not decode JSON file")

            await update_filter_keys(raw_json)

            document = {
                "username": username,
                "email": email,
                "finalization_document_name": finalization_document_name,
                "original_filename": json_file.filename,
                "raw_json": raw_json,
                "upload_date": datetime.utcnow(),
                "upload_type": "single_file",
            }

            result = await upload_json_collection.insert_one(document)
            print(f"✅ Single file inserted with ID: {result.inserted_id}")

            return {
                "message": "File saved successfully!",
                "inserted_id": str(result.inserted_id),
                "filename": json_file.filename,
                "upload_type": "single_file",
            }

        # ===== CASE 2 & 3: Folder or ZIP Upload =====
        elif input_files and output_file:
            print(f"📁 Folder or ZIP upload: {finalization_document_name}")

            input_finalisation = {}
            original_bm_json = {}

            # ✅ Detect ZIP upload (single .zip)
            if len(input_files) == 1 and input_files[0].filename.endswith(".zip"):
                uploaded_zip = input_files[0]
                print(f"📦 ZIP upload detected: {uploaded_zip.filename}")

                with tempfile.TemporaryDirectory() as temp_dir:
                    temp_path = Path(temp_dir)
                    zip_path = temp_path / uploaded_zip.filename

                    # Save uploaded zip
                    with open(zip_path, "wb") as f:
                        f.write(await uploaded_zip.read())

                    # Extract zip
                    with zipfile.ZipFile(zip_path, "r") as zip_ref:
                        zip_ref.extractall(temp_dir)

                    print(f"✅ Extracted ZIP contents to: {temp_dir}")

                    # Walk through all JSON files inside
                    for root, _, files in os.walk(temp_dir):
                        for file in files:
                            if not file.endswith(".json"):
                                continue

                            file_path = Path(root) / file
                            relative_path = file_path.relative_to(temp_path)
                            parts = str(relative_path).split(os.sep)
                            category = parts[0] if len(parts) > 1 else "Uncategorized"

                            try:
                                with open(file_path, "r", encoding="utf-8") as f:
                                    content = f.read()
                                    raw_json = json.loads(content)
                            except Exception as e:
                                print(f"⚠️ Could not decode {file_path.name}: {e}")
                                continue

                            # ✅ Save original JSON
                            original_bm_json.setdefault(category, []).append({
                                "filename": file,
                                "data": raw_json,
                            })

                            # ✅ Transform for finalisation
                            transformed = transform_input_json(raw_json)
                            transformed["filename"] = file
                            input_finalisation.setdefault(category, []).append(transformed)

                            print(f"✅ Processed {category}/{file}")

            else:
                # ✅ Multiple JSON files (folder structure)
                for uploaded_file in input_files:
                    file_path = uploaded_file.filename
                    parts = file_path.split('/')
                    category = parts[-2] if len(parts) >= 2 else "Uncategorized"
                    filename = parts[-1]

                    file_content = await uploaded_file.read()
                    raw_json = None

                    for encoding in encodings:
                        try:
                            decoded_content = file_content.decode(encoding)
                            raw_json = json.loads(decoded_content)
                            break
                        except (UnicodeDecodeError, json.JSONDecodeError):
                            continue

                    if raw_json is None:
                        print(f"⚠️ Could not decode {filename}, skipping...")
                        continue

                    original_bm_json.setdefault(category, []).append({
                        "filename": filename,
                        "data": raw_json,
                    })

                    transformed_data = transform_input_json(raw_json)
                    transformed_data["filename"] = filename
                    input_finalisation.setdefault(category, []).append(transformed_data)

                    print(f"✅ Processed {category}/{filename}")

            # ✅ Process output file
            output_content = await output_file.read()
            output_json = None
            for encoding in encodings:
                try:
                    decoded_content = output_content.decode(encoding)
                    output_json = json.loads(decoded_content)
                    print(f"✅ Decoded output file with: {encoding}")
                    break
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue

            if output_json is None:
                raise HTTPException(status_code=400, detail="Could not decode output JSON file")

            # ✅ Update filter keys from both input and output
            await update_filter_keys({"finalisation": input_finalisation})
            await update_filter_keys(output_json)

            # ✅ Combine document
            document = {
                "username": username,
                "email": email,
                "finalization_document_name": finalization_document_name,
                "original_filename": output_file.filename,
                "input_data": {"finalisation": input_finalisation},
                "original_bm_json": original_bm_json,
                "raw_json": output_json,
                "upload_date": datetime.utcnow(),
                "upload_type": "zip_folder" if len(input_files) == 1 and input_files[0].filename.endswith(".zip") else "folder_structure",
                "input_categories": list(input_finalisation.keys()),
                "total_input_files": sum(len(v) for v in input_finalisation.values()),
            }

            result = await upload_json_collection.insert_one(document)
            print(f"✅ Uploaded successfully with ID: {result.inserted_id}")
            print(f"📊 Stored {len(original_bm_json)} categories with original JSONs")

            return {
                "message": "Upload successful!",
                "inserted_id": str(result.inserted_id),
                "filename": output_file.filename,
                "upload_type": document["upload_type"],
                "input_categories": list(input_finalisation.keys()),
                "total_input_files": document["total_input_files"],
            }

        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid upload: provide either a single JSON file or ZIP/folder structure"
            )

    except HTTPException:
        raise
    except Exception as e:
        print("❌ Upload error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")



# ===== EXISTING ENDPOINTS (Keep as is) =====

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


@app.get("/documents_by_category")
async def get_documents_by_category(category: str, username: str = None):
    try:
        # Query both old structure and new structure
        query = {
            "$or": [
                {f"raw_json.finalisation.{category}": {"$exists": True}},
                {f"input_data.finalisation.{category}": {"$exists": True}}
            ]
        }
        
        if username:
            query["username"] = username
        
        cursor = upload_json_collection.find(query).sort("_id", -1)
        documents = await cursor.to_list(length=100)
        
        result = []
        for doc in documents:
            # Check if it's input_data or raw_json
            if "input_data" in doc and "finalisation" in doc["input_data"]:
                category_data = doc["input_data"]["finalisation"].get(category, [])
            else:
                category_data = doc.get("raw_json", {}).get("finalisation", {}).get(category, [])
            
            result.append({
                "_id": str(doc["_id"]),
                "original_filename": doc.get("original_filename", "Unknown"),
                "finalization_document_name": doc.get("finalization_document_name", ""),
                "username": doc.get("username", ""),
                "category_data": category_data,
                "upload_date": doc.get("upload_date"),
                "upload_type": doc.get("upload_type", "single_file")
            })
        
        return {"documents": result, "category": category, "count": len(result)}
    
    except Exception as e:
        print("Get documents by category error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/list_json")
async def list_json(username: str = None):
    try:
        query = {"username": username} if username else {}
        
        # ✅ OPTIMIZATION: Use a projection to fetch only necessary fields
        projection = {
            "original_filename": 1,
            "finalization_document_name": 1,
            "upload_date": 1,
            "username": 1,
            "upload_type": 1,
        }
        
        cursor = upload_json_collection.find(query, projection).sort("_id", -1)
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


# ✅ NEW: Property/Name Validation Endpoint
@app.post("/validate_property")
async def validate_property(
    value1: str = Form(...),
    value2: str = Form(...),
    match_type: str = Form(...)
):
    """
    Validates if two strings match using fuzzy comparison.
    Uses manager's validation logic from compare_strings.py
    
    :param value1: First string to compare
    :param value2: Second string to compare  
    :param match_type: "Address" or "Name"
    :return: {"is_valid": bool, "match_type": str, "values": [str, str]}
    """
    try:
        # Map frontend types to backend field types
        field_type_map = {
            "Address": "address",
            "Name": "name"
        }
        
        field_type = field_type_map.get(match_type, "default")
        
        print(f"🔍 Validating ({match_type}): '{value1}' vs '{value2}'")
        
        # ✅ Call manager's validation function
        result = safe_string_compare(value1, value2, field_type=field_type)
        
        print(f"✅ Result: {result}")
        
        return {
            "is_valid": result,
            "match_type": match_type,
            "values": [value1, value2]
        }
    
    except Exception as e:
        print(f"❌ Validation error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")



# ✅ NEW: Batch Processing Endpoint
@app.post("/batch_process")
async def batch_process(
    input_folder_path: str = Form(...),
    output_folder_path: str = Form(...),
    username: str = Form(...),
    email: str = Form(...)
):
    """
    Batch process all ZIP files from input folder and match with output JSONs
    
    :param input_folder_path: Folder containing ZIP files
    :param output_folder_path: Folder containing final JSON files
    :param username: Logged-in username
    :param email: Logged-in email
    :return: Summary of processed files
    """
    try:
        print(f"🚀 Starting batch process")
        print(f"📁 Input folder: {input_folder_path}")
        print(f"📁 Output folder: {output_folder_path}")
        
        # Validate folder paths
        if not os.path.exists(input_folder_path):
            raise HTTPException(status_code=400, detail=f"Input folder not found: {input_folder_path}")
        
        if not os.path.exists(output_folder_path):
            raise HTTPException(status_code=400, detail=f"Output folder not found: {output_folder_path}")
        
        # Find all ZIP files in input folder
        zip_files = glob.glob(os.path.join(input_folder_path, "*.zip"))
        
        if not zip_files:
            raise HTTPException(status_code=400, detail="No ZIP files found in input folder")
        
        print(f"📦 Found {len(zip_files)} ZIP files")
        
        results = {
            "total": len(zip_files),
            "successful": [],
            "failed": [],
            "skipped": []
        }
        
        encodings = ['utf-8', 'utf-8-sig', 'windows-1252', 'latin-1', 'iso-8859-1']
        
        # Process each ZIP file
        for zip_path in zip_files:
            zip_filename = os.path.basename(zip_path)
            # Extract base name (remove .zip)
            base_name = zip_filename.replace('.zip', '')
            
            print(f"\n{'='*60}")
            print(f"📦 Processing: {zip_filename}")
            
            try:
                # Find matching output JSON
                output_json_name = f"{base_name}_final.json"
                output_json_path = os.path.join(output_folder_path, output_json_name)
                
                if not os.path.exists(output_json_path):
                    print(f"⚠️ Output JSON not found: {output_json_name}")
                    results["skipped"].append({
                        "filename": zip_filename,
                        "reason": f"Output JSON not found: {output_json_name}"
                    })
                    continue
                
                print(f"✅ Found matching output: {output_json_name}")
                
                # Create temporary directory for extraction
                with tempfile.TemporaryDirectory() as temp_dir:
                    temp_path = Path(temp_dir)
                    
                    # Extract ZIP file
                    print(f"📂 Extracting ZIP to: {temp_dir}")
                    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                        zip_ref.extractall(temp_dir)
                    
                    # Process extracted JSON files (input data)
                    input_finalisation = {}
                    original_bm_json = {}
                    
                    # Walk through extracted directories
                    for root, dirs, files in os.walk(temp_dir):
                        for file in files:
                            if file.endswith('.json'):
                                file_path = Path(root) / file
                                relative_path = file_path.relative_to(temp_path)
                                
                                # Extract category from path
                                path_parts = str(relative_path).split(os.sep)
                                if len(path_parts) > 1:
                                    category = path_parts[0]  # First folder is category (1003, Credit_Report, etc.)
                                    filename = path_parts[-1]
                                else:
                                    category = "Uncategorized"
                                    filename = file
                                
                                # Read and parse JSON
                                with open(file_path, 'r', encoding='utf-8') as f:
                                    content = f.read()
                                    raw_json = None
                                    
                                    for encoding in encodings:
                                        try:
                                            raw_json = json.loads(content)
                                            break
                                        except (UnicodeDecodeError, json.JSONDecodeError):
                                            continue
                                    
                                    if raw_json is None:
                                        print(f"⚠️ Could not decode {filename}, skipping...")
                                        continue
                                    
                                    # Store original JSON
                                    if category not in original_bm_json:
                                        original_bm_json[category] = []
                                    
                                    original_json_entry = {
                                        "filename": filename,
                                        "data": raw_json
                                    }
                                    original_bm_json[category].append(original_json_entry)
                                    
                                    # Transform for input_data
                                    transformed_data = transform_input_json(raw_json)
                                    transformed_data["filename"] = filename
                                    
                                    if category not in input_finalisation:
                                        input_finalisation[category] = []
                                    
                                    input_finalisation[category].append(transformed_data)
                                    print(f"✅ Processed {category}/{filename}")
                    
                    # Read output JSON
                    with open(output_json_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        output_json = None
                        
                        for encoding in encodings:
                            try:
                                output_json = json.loads(content)
                                print(f"✅ Decoded output file with: {encoding}")
                                break
                            except (UnicodeDecodeError, json.JSONDecodeError):
                                continue
                        
                        if output_json is None:
                            raise Exception("Could not decode output JSON file")
                    
                    # Update filter keys
                    temp_input_structure = {"finalisation": input_finalisation}
                    await update_filter_keys(temp_input_structure)
                    await update_filter_keys(output_json)
                    
                    # Check if document already exists (for update)
                    existing_doc = await upload_json_collection.find_one({
                        "username": username,
                        "finalization_document_name": base_name
                    })
                    
                    # Create document
                    document = {
                        "username": username,
                        "email": email,
                        "finalization_document_name": base_name,
                        "original_filename": output_json_name,
                        "input_data": {
                            "finalisation": input_finalisation
                        },
                        "original_bm_json": original_bm_json,
                        "raw_json": output_json,
                        "upload_date": datetime.utcnow(),
                        "upload_type": "batch_zip",
                        "input_categories": list(input_finalisation.keys()),
                        "total_input_files": sum(len(files) for files in input_finalisation.values())
                    }
                    
                    if existing_doc:
                        # Update existing document
                        await upload_json_collection.update_one(
                            {"_id": existing_doc["_id"]},
                            {"$set": document}
                        )
                        print(f"🔄 Updated existing document: {base_name}")
                        action = "updated"
                        doc_id = str(existing_doc["_id"])
                    else:
                        # Insert new document
                        result = await upload_json_collection.insert_one(document)
                        print(f"✅ Inserted new document: {base_name}")
                        action = "inserted"
                        doc_id = str(result.inserted_id)
                    
                    results["successful"].append({
                        "zip_file": zip_filename,
                        "output_file": output_json_name,
                        "document_name": base_name,
                        "action": action,
                        "document_id": doc_id,
                        "categories": list(input_finalisation.keys()),
                        "total_files": sum(len(files) for files in input_finalisation.values())
                    })
                    
                    print(f"✅ Successfully processed: {zip_filename}")
            
            except Exception as e:
                print(f"❌ Error processing {zip_filename}: {str(e)}")
                traceback.print_exc()
                results["failed"].append({
                    "filename": zip_filename,
                    "error": str(e)
                })
                continue  # Skip to next ZIP file
        
        print(f"\n{'='*60}")
        print(f"📊 Batch Processing Complete")
        print(f"✅ Successful: {len(results['successful'])}")
        print(f"❌ Failed: {len(results['failed'])}")
        print(f"⏭️ Skipped: {len(results['skipped'])}")
        
        return {
            "message": "Batch processing completed",
            "summary": {
                "total": results["total"],
                "successful": len(results["successful"]),
                "failed": len(results["failed"]),
                "skipped": len(results["skipped"])
            },
            "details": results
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Batch process error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

app.include_router(auth_router.router)