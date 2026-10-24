
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    service: str


class WindMetrics(BaseModel):
    mae_mw: Optional[float] = None
    rmse_mw: Optional[float] = None
    bias_mw: Optional[float] = None
    matched_periods: int
    forecast_periods: int
    actual_periods: int
    matching_note: str


class WindComparisonRow(BaseModel):
    startTime: datetime
    publishTime: Optional[datetime] = None
    forecast_mw: float
    actual_mw: float
    error_mw: float
    absolute_error_mw: float
