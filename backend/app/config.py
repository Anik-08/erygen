import os

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS")
REQUEST_TIMEOUT = os.getenv("REQUEST_TIMEOUT")
