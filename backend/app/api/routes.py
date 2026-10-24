import pandas as pd
from fastapi import APIRouter, HTTPException
from app.services.analytics import compare_wind
from app.services.elexon import fetch_actuals, fetch_forecast

router = APIRouter(prefix="/api", tags=["Wind generation"])

def validate_dates(start: str, end: str):
    try:
        start_date = pd.to_datetime(start, utc=True)
        end_date = pd.to_datetime(end, utc=True)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Please enter valid dates."
        )

    if start_date >= end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date."
        )

def convert_records(df):
    df = df.astype(object).where(pd.notna(df), None)
    return df.to_dict(orient="records")

@router.get("/health")
def health():
    return {"status": "ok", "service": "wind-forecast-api"}

@router.get("/wind/actuals")
def get_actuals(start: str, end: str):
    validate_dates(start, end)
    try:
        df = fetch_actuals(start, end)
        return {
            "count": len(df),
            "data": convert_records(df)
        }
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch actual generation: {e}"
        )

@router.get("/wind/forecasts")
def get_forecasts(publish_time: str, start: str, end: str):
    validate_dates(start, end)
    try:
        df = fetch_forecast(publish_time)
        start_date = pd.to_datetime(start, utc=True)
        end_date = pd.to_datetime(end, utc=True)
        df = df[
            (df["startTime"] >= start_date)
            & (df["startTime"] < end_date)
        ]
        publish_times = (
            df["publishTime"].dropna().astype(str).unique().tolist()
        )

        return {
            "count": len(df),
            "requested_publish_time": publish_time,
            "returned_publish_times": publish_times,
            "data": convert_records(df)
        }
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch forecasts: {e}"
        )

@router.get("/wind/compare")
def get_comparison(start: str, end: str, publish_time: str):
    validate_dates(start, end)

    try:
        df, metrics = compare_wind(start, end, publish_time)

        return {
            "requested_publish_time": publish_time,
            "metrics": metrics,
            "data": convert_records(df)
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not compare wind data: {e}"
        )

@router.get("/metrics")
def get_metrics(start: str, end: str, publish_time: str):
    validate_dates(start, end)

    try:
        _, metrics = compare_wind(start, end, publish_time)
        return metrics
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not calculate metrics: {e}"
        )
    
@router.get("/overview")
def get_overview(start: str, end: str, publish_time: str):
    validate_dates(start, end)

    try:
        df, metrics = compare_wind(start, end, publish_time)

        if df.empty:
            average_actual = None
            average_forecast = None
        else:
            average_actual = round(df["actual_mw"].mean(), 3)
            average_forecast = round(df["forecast_mw"].mean(), 3)

        return {
            "period": {
                "start": start,
                "end": end
            },
            "requested_publish_time": publish_time,
            "metrics": metrics,
            "average_actual_mw": average_actual,
            "average_forecast_mw": average_forecast
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not create overview: {e}"
        )