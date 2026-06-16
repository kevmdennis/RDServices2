"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export type CreateBatchInput = {
  filename: string;
  totalRows: number;
  placeIds: string[];
};

export async function createBatch(input: CreateBatchInput): Promise<void> {
  const { filename, totalRows, placeIds } = input;

  if (!filename.trim()) {
    throw new Error("Filename is required.");
  }

  if (totalRows < 0) {
    throw new Error("Total rows must be zero or greater.");
  }

  if (placeIds.length === 0) {
    throw new Error("At least one valid Place ID is required.");
  }

  const supabase = createAdminClient();

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .insert({
      filename: filename.trim(),
      total_rows: totalRows,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    throw new Error(batchError?.message ?? "Failed to create batch.");
  }

  const batchItems = placeIds.map((placeId) => ({
    batch_id: batch.id,
    place_id: placeId,
    status: "pending" as const,
  }));

  const { error: itemsError } = await supabase
    .from("batch_items")
    .insert(batchItems);

  if (itemsError) {
    await supabase.from("batches").delete().eq("id", batch.id);
    throw new Error(itemsError.message);
  }

  redirect(`/batch/${batch.id}`);
}
