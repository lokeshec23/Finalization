from fastapi.middleware.cors import CORSMiddleware
from app.models.upload_json_model import UploadJsonModel
from app.routes import auth_router
from fastapi import FastAPI
from app.db.database import db

app = FastAPI(title="Finalization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # during dev; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)


# @app.post("/upload_json")
# async def upload_json(data: UploadJsonModel):
#     try:
#         await db.uploadJson.insert_one(data.dict())
#         return {"message": "File saved ok!"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/")
# def read_root():
#     return {"message": "Finalization API is running"}



# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
