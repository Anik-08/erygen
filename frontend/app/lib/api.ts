const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export type WindRow = {
  startTime: string;
  actual_mw: number;
  forecast_mw: number;
  error_mw: number;
};

export type WindMetrics = {
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  matched_periods: number;
  forecast_periods: number;
  actual_periods: number;
  matching_note: string;
};

export type WindComparison = {
  requested_publish_time: string;
  metrics: WindMetrics;
  data: WindRow[];
};

export async function getWindComparison(start: string, end: string, publishTime: string): Promise<WindComparison> {
  const params = new URLSearchParams({
    start,
    end,
    publish_time: publishTime,
  });

  const response = await fetch(
    `${API_URL}/api/wind/compare?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Could not load wind data.");
  }

  return response.json();
}