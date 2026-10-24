"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import { getWindComparison } from "../lib/api";
import type { WindComparison } from "../lib/api";

export default function WindDashboard() {
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-02-01");
  const [publishTime, setPublishTime] = useState("2026-01-15T15:00");
  const [result, setResult] = useState<WindComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const data = await getWindComparison(
        `${start}T00:00:00Z`,
        `${end}T00:00:00Z`,
        new Date(publishTime).toISOString()
      );

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const data = await getWindComparison(
          "2026-01-01T00:00:00Z",
          "2026-02-01T00:00:00Z",
          new Date("2026-01-15T15:00").toISOString()
        );

        if (!cancelled) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = result?.metrics;

  const chartData = (result?.data || []).map((row) => ({
    ...row,
    time: new Date(row.startTime).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }),
  }));

  function formatMW(value: number | null | undefined) {
    if (value == null) return "—";
    return `${value.toLocaleString("en-GB", {
      maximumFractionDigits: 2,
    })} MW`;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-teal-700">
              ENERGY ANALYTICS
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              UK Wind Forecast Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Compare national wind generation forecasts with actual output.
            </p>
          </div>

          <span className="w-fit rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
            Elexon data
          </span>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="start">
              Start date (UTC)
            </label>
            <input
              id="start"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="end">
              End date (UTC, exclusive)
            </label>
            <input
              id="end"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="publishTime"
            >
              Forecast publication time (local)
            </label>
            <input
              id="publishTime"
              type="datetime-local"
              value={publishTime}
              onChange={(e) => setPublishTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading..." : "Update dashboard"}
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Unable to load data</p>
            <p className="mt-1 wrap-break-words">{error}</p>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Mean Absolute Error"
            value={formatMW(metrics?.mae_mw)}
            description="Average absolute forecast error"
          />
          <MetricCard
            title="Root Mean Squared Error"
            value={formatMW(metrics?.rmse_mw)}
            description="Penalises larger errors"
          />
          <MetricCard
            title="Forecast Bias"
            value={formatMW(metrics?.bias_mw)}
            description="Positive means over-forecasting"
          />
          <MetricCard
            title="Matched Periods"
            value={
              metrics ? metrics.matched_periods.toLocaleString() : "—"
            }
            description="Timestamps compared"
          />
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Forecast vs Actual Generation
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Generation in megawatts (MW), timestamps in UTC
            </p>
          </div>

          {loading ? (
            <p className="py-16 text-center text-slate-500">
              Loading chart data...
            </p>
          ) : chartData.length === 0 ? (
            <p className="py-16 text-center text-slate-500">
              No matching data available for this selection.
            </p>
          ) : (
            <div className="h-80 w-full sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    minTickGap={35}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Generation (MW)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual_mw"
                    name="Actual generation"
                    stroke="#0d9488"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast_mw"
                    name="Forecast generation"
                    stroke="#6366f1"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">Forecast Comparison</h2>
              <p className="mt-1 text-sm text-slate-500">
                Actual output, forecast output and prediction error
              </p>
            </div>
            <span className="text-sm text-slate-500">
              {chartData.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Time (UTC)</th>
                  <th className="px-4 py-3">Actual (MW)</th>
                  <th className="px-4 py-3">Forecast (MW)</th>
                  <th className="px-4 py-3">Error (MW)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData.map((row) => (
                  <tr key={row.startTime} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Date(row.startTime).toLocaleString("en-GB", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {row.actual_mw.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {row.forecast_mw.toLocaleString()}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        row.error_mw > 0
                          ? "text-amber-700"
                          : row.error_mw < 0
                            ? "text-teal-700"
                            : "text-slate-700"
                      }`}
                    >
                      {row.error_mw.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {chartData.length === 0 && !loading && (
            <p className="py-8 text-center text-slate-500">
              No comparison records to display.
            </p>
          )}
        </section>

        {metrics?.matching_note && (
          <p className="mt-4 text-xs leading-6 text-slate-500">
            {metrics.matching_note}
          </p>
        )}

        <footer className="py-6 text-center text-xs text-slate-500">
          Data source: Elexon BMRS · National wind generation · January 2026
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </h2>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}
