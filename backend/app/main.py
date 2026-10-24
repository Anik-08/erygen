from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.config import FRONTEND_ORIGINS

app = FastAPI(
    title="UK Wind Forecast Accuracy API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "message": "UK Wind Forecast Accuracy API",
        "docs": "/docs",
        "health": "/api/health",
    }