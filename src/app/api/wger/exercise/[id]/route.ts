import { NextRequest, NextResponse } from "next/server";

const WGER_API_BASE = "https://wger.de/api/v2";
const WGER_TOKEN = process.env.WGER_API_TOKEN || "";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Invalid exercise ID" }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (WGER_TOKEN) headers["Authorization"] = WGER_TOKEN;

    const res = await fetch(
      `${WGER_API_BASE}/exerciseinfo/${id}/?format=json`,
      { headers, next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch exercise details" },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Find English translation for description
    const englishTranslation = (data.translations || []).find(
      (t: { language: number }) => t.language === 2 // English = language ID 2
    );
    const description = englishTranslation?.description || "";

    // Get images
    const images: string[] = (data.images || []).map(
      (img: { image: string }) => img.image
    );

    // Get category name
    const categoryName = data.category?.name || "";

    return NextResponse.json({
      id: data.id,
      name: englishTranslation?.name || data.name || "",
      description: stripHtml(description),
      category: categoryName,
      images,
      mainImage: images[0] || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to Wger API" },
      { status: 502 }
    );
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
