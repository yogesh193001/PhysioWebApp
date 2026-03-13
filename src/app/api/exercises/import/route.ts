import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, instructions } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.create({
      data: {
        name: String(name),
        category: String(category),
        instructions: String(instructions || ""),
      },
    });

    return NextResponse.json(exercise);
  } catch {
    return NextResponse.json(
      { error: "Failed to import exercise" },
      { status: 500 }
    );
  }
}
