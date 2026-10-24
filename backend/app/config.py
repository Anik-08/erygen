import os

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
FRONTEND_ORIGINS_RAW = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
FRONTEND_ORIGINS = [origin.strip() for origin in FRONTEND_ORIGINS_RAW.split(",") if origin.strip()]
REQUEST_TIMEOUT = os.getenv("REQUEST_TIMEOUT", "60")
