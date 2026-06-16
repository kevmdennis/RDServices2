import { NextResponse } from "next/server";
import {
  BatchGenerateError,
  generateBatch,
} from "@/lib/batches/generate-batch";

type BatchGenerateRequestBody = {
  batchId?: unknown;
};

export async function POST(request: Request) {
  let body: BatchGenerateRequestBody;

  try {
    body = (await request.json()) as BatchGenerateRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  if (typeof body.batchId !== "string" || !body.batchId.trim()) {
    return NextResponse.json(
      { error: "A non-empty batchId string is required.", code: "INVALID_BATCH_ID" },
      { status: 400 },
    );
  }

  try {
    const result = await generateBatch(body.batchId.trim());
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BatchGenerateError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        error: "Unexpected error while generating batch.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
