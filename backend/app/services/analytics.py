import numpy as np
import pandas as pd
from app.services.elexon import fetch_actuals, fetch_forecast

def compare_wind(start: str, end: str, publish_time: str):
    actuals = fetch_actuals(start, end)
    forecasts = fetch_forecast(publish_time)

    start_date = pd.to_datetime(start, utc=True)
    end_date = pd.to_datetime(end, utc=True)

    forecasts = forecasts[
        (forecasts["startTime"] >= start_date)
        & (forecasts["startTime"] < end_date)
    ]

    data = pd.merge(
        forecasts,
        actuals,
        on="startTime",
        how="inner"
    )

    if data.empty:
        metrics = {
            "mae_mw": None,
            "rmse_mw": None,
            "bias_mw": None,
            "matched_periods": 0,
            "forecast_periods": len(forecasts),
            "actual_periods": len(actuals),
            "matching_note": (
                "No matching timestamps were found between "
                "forecasts and actual generation."
            )
        }
        return data, metrics

    data["error_mw"] = data["forecast_mw"] - data["actual_mw"]
    errors = data["error_mw"]
    mae = np.mean(np.abs(errors))
    rmse = np.sqrt(np.mean(errors ** 2))
    bias = np.mean(errors)

    metrics = {
        "mae_mw": round(float(mae), 3),
        "rmse_mw": round(float(rmse), 3),
        "bias_mw": round(float(bias), 3),
        "matched_periods": len(data),
        "forecast_periods": len(forecasts),
        "actual_periods": len(actuals),
        "matching_note": (
            "Only exact matching timestamps are compared. "
            "Forecasts may be hourly while actuals are half-hourly."
        )
    }
    data = data.sort_values("startTime")
    return data, metrics

def overview(metrics: dict) -> dict:
    return {
        "mae_mw": metrics["mae_mw"],
        "rmse_mw": metrics["rmse_mw"],
        "bias_mw": metrics["bias_mw"],
        "matched_periods": metrics["matched_periods"]
    }