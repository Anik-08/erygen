from datetime import datetime, timezone
import pandas as pd
import requests
from app.config import ELEXON_BASE_URL, REQUEST_TIMEOUT

def _get_json(url: str, params: dict) -> dict | list:
    try:
        timeout = int(REQUEST_TIMEOUT) if REQUEST_TIMEOUT is not None else 60
        response = requests.get(
            url,
            params=params,
            timeout=timeout,
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise RuntimeError(f"Elexon API request failed: {exc}") from exc
    except ValueError as exc:
        raise RuntimeError("Elexon returned invalid JSON.") from exc

def fetch_actuals(start: str, end: str) -> pd.DataFrame:
    url = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"

    params = {
        "publishDateTimeFrom": start,
        "publishDateTimeTo": end,
        "fuelType": "WIND",
    }

    data = _get_json(url, params)
    df = pd.DataFrame(data)

    if df.empty:
        return pd.DataFrame(columns=["startTime", "actual_mw"])

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["actual_mw"] = pd.to_numeric(df["generation"], errors="coerce")

    df = df[
        (df["startTime"] >= pd.to_datetime(start, utc=True))
        & (df["startTime"] < pd.to_datetime(end, utc=True))
    ]

    df = df.dropna(subset=["actual_mw"])
    df = df.drop_duplicates(subset=["startTime"])
    df = df.sort_values("startTime")

    return df[["startTime", "actual_mw"]].reset_index(drop=True)


def fetch_forecast(publish_time: str) -> pd.DataFrame:
    url = f"{ELEXON_BASE_URL}/forecast/generation/wind/history"

    params = {
        "publishTime": publish_time,
        "format": "json",
    }

    data = _get_json(url, params)

    if isinstance(data, dict):
        data = data.get("data", [])

    df = pd.DataFrame(data)

    if df.empty:
        return pd.DataFrame(
            columns=["startTime", "publishTime", "forecast_mw"]
        )

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["forecast_mw"] = pd.to_numeric(
        df["generation"], errors="coerce"
    )

    if "publishTime" in df.columns:
        df["publishTime"] = pd.to_datetime(
            df["publishTime"], utc=True, errors="coerce"
        )
    else:
        df["publishTime"] = None

    df = df.dropna(subset=["startTime", "forecast_mw"])
    df = df.drop_duplicates(subset=["startTime"], keep="last")
    df = df.sort_values("startTime")

    return df[["startTime", "publishTime", "forecast_mw"]].reset_index(drop=True)