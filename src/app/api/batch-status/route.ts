import { NextResponse } from "next/server";
import {
  BatchGenerateError,
  getBatchStatusSnapshot,
} from "@/lib/batches/generate-batch";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");

  if (!batchId?.trim()) {
    return NextResponse.json(
      { error: "batchId query parameter is required.", code: "INVALID_BATCH_ID" },
      { status: 400 },
    );
  }

  try {
    const snapshot = await getBatchStatusSnapshot(batchId.trim());
    return NextResponse.json(snapshot);
  } catch (error) {
    if (error instanceof BatchGenerateError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unexpected error while loading batch status.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
