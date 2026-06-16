"use client";

import { useMemo, useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createBatch } from "@/app/actions/batch";
import {
  parseCsv,
  validateRows,
  type ParsedCsv,
  type RowValidation,
} from "@/lib/csv";

type UploadState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "parsed"; data: ParsedCsv };

export default function CsvUploader() {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [fileName, setFileName] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validations = useMemo<RowValidation[]>(() => {
    if (uploadState.status !== "parsed") {
      return [];
    }

    const { rows, placeIdColumn } = uploadState.data;
    return validateRows(rows, placeIdColumn);
  }, [uploadState]);

  const stats = useMemo(() => {
    const total = validations.length;
    const valid = validations.filter((row) => row.isValid).length;
    const invalid = total - valid;

    return { total, valid, invalid };
  }, [validations]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setUploadState({ status: "idle" });
      setFileName(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadState({ status: "error", message: "Please upload a CSV file." });
      setFileName(file.name);
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCsv(text);

      if (parsed.headers.length === 0) {
        setUploadState({
          status: "error",
          message: "The CSV file appears to be empty.",
        });
        setFileName(file.name);
        return;
      }

      setUploadState({ status: "parsed", data: parsed });
      setFileName(file.name);
    } catch {
      setUploadState({
        status: "error",
        message: "Failed to read or parse the CSV file.",
      });
      setFileName(file.name);
    }
  }

  const parsedData = uploadState.status === "parsed" ? uploadState.data : null;
  const validPlaceIds = validations
    .filter((validation) => validation.isValid && validation.placeId)
    .map((validation) => validation.placeId as string);
  const canCreateBatch =
    parsedData !== null &&
    parsedData.placeIdColumn !== null &&
    validPlaceIds.length > 0 &&
    fileName !== null;

  function handleCreateBatch() {
    if (!canCreateBatch || !fileName) {
      return;
    }

    setBatchError(null);

    startTransition(async () => {
      try {
        await createBatch({
          filename: fileName,
          totalRows: stats.total,
          placeIds: validPlaceIds,
        });
      } catch (error) {
        if (isRedirectError(error)) {
          throw error;
        }

        setBatchError(
          error instanceof Error ? error.message : "Failed to create batch.",
        );
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Outscraper CSV Upload
        </h1>
        <p className="max-w-2xl text-zinc-600">
          Upload an Outscraper export to preview rows, detect Place IDs, and
          validate your data before generating websites.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <label
          htmlFor="csv-upload"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          CSV file
        </label>
        <input
          id="csv-upload"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="block w-full cursor-pointer rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700"
        />
        {fileName && (
          <p className="mt-2 text-sm text-zinc-500">Selected: {fileName}</p>
        )}
        {uploadState.status === "error" && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {uploadState.message}
          </p>
        )}
      </section>

      {parsedData && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total rows" value={stats.total} />
            <StatCard label="Valid rows" value={stats.valid} tone="valid" />
            <StatCard label="Invalid rows" value={stats.invalid} tone="invalid" />
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-medium text-zinc-900">Preview</h2>
              {parsedData.placeIdColumn ? (
                <p className="text-sm text-zinc-600">
                  Place ID column detected:{" "}
                  <span className="font-medium text-zinc-900">
                    {parsedData.placeIdColumn}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-amber-700" role="alert">
                  No Place ID column found. Expected one of: place_id, google_id,
                  google_place_id, placeId, Place ID, Google Place ID.
                </p>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-zinc-700">#</th>
                    <th className="px-4 py-3 font-medium text-zinc-700">Status</th>
                    {parsedData.headers.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 font-medium text-zinc-700"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {validations.map((validation) => (
                    <tr
                      key={validation.index}
                      className={
                        validation.isValid ? "" : "bg-red-50/80"
                      }
                    >
                      <td className="px-4 py-3 text-zinc-500">
                        {validation.index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            validation.isValid
                              ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                              : "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
                          }
                        >
                          {validation.isValid ? "Valid" : "Invalid"}
                        </span>
                      </td>
                      {parsedData.headers.map((header) => (
                        <td
                          key={`${validation.index}-${header}`}
                          className="max-w-xs truncate px-4 py-3 text-zinc-700"
                          title={validation.row[header]}
                        >
                          {validation.row[header] || (
                            <span className="text-zinc-400 italic">empty</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex flex-col items-end gap-3">
            {batchError && (
              <p className="text-sm text-red-600" role="alert">
                {batchError}
              </p>
            )}
            <button
              type="button"
              onClick={handleCreateBatch}
              disabled={!canCreateBatch || isPending}
              className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors enabled:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              {isPending ? "Creating batch..." : "Create Batch"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "valid" | "invalid";
}) {
  const toneClasses = {
    neutral: "border-zinc-200 bg-white text-zinc-900",
    valid: "border-emerald-200 bg-emerald-50 text-emerald-900",
    invalid: "border-red-200 bg-red-50 text-red-900",
  };

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${toneClasses[tone]}`}
    >
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
