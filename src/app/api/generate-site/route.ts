import { NextResponse } from "next/server";
import {
  generateSiteForBusiness,
  GenerateSiteError,
} from "@/lib/sites/generate-site";

type GenerateSiteRequestBody = {
  businessId?: unknown;
};

export async function POST(request: Request) {
  let body: GenerateSiteRequestBody;

  try {
    body = (await request.json()) as GenerateSiteRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  if (typeof body.businessId !== "string" || !body.businessId.trim()) {
    return NextResponse.json(
      { error: "A non-empty businessId string is required.", code: "INVALID_BUSINESS_ID" },
      { status: 400 },
    );
  }

  try {
    const { siteId } = await generateSiteForBusiness(body.businessId.trim());

    return NextResponse.json({ siteId });
  } catch (error) {
    if (error instanceof GenerateSiteError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        error: "Unexpected error while generating site.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
