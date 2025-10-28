from pydantic import BaseModel
from typing import Dict

class UploadJsonModel(BaseModel):
    username: str
    email: str
    finalization_document_name: str
    raw_json: Dict
