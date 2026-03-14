import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { workoutId, startedAt, durationSeconds, exercisesCompleted, totalExercises } = body;

  if (!workoutId || !startedAt || durationSeconds == null || exercisesCompleted == null || totalExercises == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const session = await prisma.workoutSession.create({
    data: {
      workoutId,
      startedAt: new Date(startedAt),
      durationSeconds: Math.round(durationSeconds),
      exercisesCompleted,
      totalExercises,
    },
  });

  return NextResponse.json(session);
}
