"use client";

import { useCallback, useEffect, useState } from "react";
import BatchItemsTable from "@/components/BatchItemsTable";
import {
  computeBatchStatusCounts,
  hasEligibleBatchItems,
} from "@/lib/batches/status";
import type { Batch, BatchItemWithBusiness } from "@/lib/supabase/types";
import type { BatchStatusCounts } from "@/lib/batches/status";

type BatchDashboardProps = {
  batch: Batch;
  initialItems: BatchItemWithBusiness[];
};

type BatchStatusResponse = {
  batch: Batch;
  counts: BatchStatusCounts;
  items: BatchItemWithBusiness[];
};

const POLL_INTERVAL_MS = 3000;

export default function BatchDashboard({
  batch: initialBatch,
  initialItems,
}: BatchDashboardProps) {
  const [batch, setBatch] = useState(initialBatch);
  const [items, setItems] = useState(initialItems);
  const [counts, setCounts] = useState(() => computeBatchStatusCounts(initialItems));
  const [isGenerating, setIsGenerating] = useState(initialBatch.status === "processing");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    setBatch(initialBatch);
    setItems(initialItems);
    setCounts(computeBatchStatusCounts(initialItems));
  }, [initialBatch, initialItems]);

  const refreshBatchStatus = useCallback(async () => {
    const response = await fetch(
      `/api/batch-status?batchId=${encodeURIComponent(batch.id)}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return false;
    }

    const snapshot = (await response.json()) as BatchStatusResponse;
    setBatch(snapshot.batch);
    setItems(snapshot.items);
    setCounts(snapshot.counts);
    return true;
  }, [batch.id]);

  useEffect(() => {
    if (!isGenerating && batch.status !== "processing") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshBatchStatus();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [batch.status, isGenerating, refreshBatchStatus]);

  useEffect(() => {
    if (isGenerating && batch.status !== "processing") {
      setIsGenerating(false);
    }
  }, [batch.status, isGenerating]);

  async function handleGenerateAll() {
    const eligibleCount = items.filter(
      (item) =>
        item.status === "pending" || item.status === "business_data_saved",
    ).length;

    const confirmed = window.confirm(
      `Generate websites for ${eligibleCount} item(s) in this batch? This runs sequentially and may take several minutes.`,
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setIsGenerating(true);

    void refreshBatchStatus();

    try {
      const response = await fetch("/api/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: batch.id }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setActionError(payload.error ?? "Failed to generate batch.");
        setIsGenerating(false);
        await refreshBatchStatus();
        return;
      }

      setActionMessage(
        `Batch finished: ${payload.succeeded} succeeded, ${payload.failed} failed, ${payload.skipped} skipped.`,
      );
      await refreshBatchStatus();
      setIsGenerating(false);
    } catch {
      setActionError("Network error while generating batch.");
      setIsGenerating(false);
      await refreshBatchStatus();
    }
  }

  const canGenerateAll =
    hasEligibleBatchItems(items) && !isGenerating && batch.status !== "processing";

  return (
    <>
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-medium text-zinc-900">Batch generation</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Process all pending items sequentially: fetch Google data, then generate websites.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={!canGenerateAll}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors enabled:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
          >
            {isGenerating ? "Generating all..." : "Generate All Websites"}
          </button>
        </div>

        {actionError && (
          <div
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {actionMessage && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {actionMessage}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ProgressCard label="Total" value={counts.total} />
          <ProgressCard label="Pending" value={counts.pending} tone="amber" />
          <ProgressCard
            label="Fetching details"
            value={counts.fetching_place_details}
            tone="blue"
          />
          <ProgressCard
            label="Business saved"
            value={counts.business_data_saved}
            tone="emerald"
          />
          <ProgressCard
            label="Generating site"
            value={counts.generating_site}
            tone="blue"
          />
          <ProgressCard label="Complete" value={counts.complete} tone="emerald" />
          <ProgressCard label="Failed" value={counts.failed} tone="red" />
          <ProgressCard
            label="Batch processed"
            value={`${batch.processed_rows} / ${batch.total_rows}`}
          />
        </div>

        {(isGenerating || batch.status === "processing") && (
          <p className="mt-4 text-sm text-zinc-600">
            Processing batch... refreshing every few seconds.
          </p>
        )}
      </section>

      <BatchItemsTable items={items} disableActions={isGenerating || batch.status === "processing"} />
    </>
  );
}

function ProgressCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "amber" | "blue" | "emerald" | "red";
}) {
  const toneClasses = {
    neutral: "border-zinc-200 bg-zinc-50 text-zinc-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    red: "border-red-200 bg-red-50 text-red-900",
  };

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
