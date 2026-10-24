
import os

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000"
).split(",")

REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "60"))
