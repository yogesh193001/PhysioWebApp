import { NextRequest, NextResponse } from "next/server";

const WGER_API_BASE = "https://wger.de/api/v2";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `${WGER_API_BASE}/exercise/search/?term=${encodeURIComponent(query)}&language=english&format=json`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Wger API" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const results = (data.suggestions || []).map(
      (item: { data: { id: number; name: string; description: string; category: { id: number; name: string } } }) => item.data
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to Wger API" },
      { status: 502 }
    );
  }
}
