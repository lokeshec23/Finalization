from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_router

app = FastAPI(title="Finalization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # during dev; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)

@app.get("/")
def read_root():
    return {"message": "Finalization API is running"}



# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
