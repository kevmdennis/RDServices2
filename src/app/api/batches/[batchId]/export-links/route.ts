import { NextResponse } from "next/server";
import {
  buildBatchPublicLinksCsv,
  ExportPublicLinksError,
} from "@/lib/batches/export-public-links";

type ExportLinksRouteProps = {
  params: Promise<{ batchId: string }>;
};

export async function GET(_request: Request, { params }: ExportLinksRouteProps) {
  const { batchId } = await params;

  if (!batchId.trim()) {
    return NextResponse.json(
      { error: "batchId is required.", code: "INVALID_BATCH_ID" },
      { status: 400 },
    );
  }

  try {
    const csv = await buildBatchPublicLinksCsv(batchId.trim());
    const filename = `public-website-links-${batchId.trim()}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ExportPublicLinksError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unexpected error while exporting public links.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
