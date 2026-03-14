import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft, Play, Clock, Repeat } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!workout) return notFound();

  const categoryGroups: Record<string, typeof workout.exercises> = {};
  for (const we of workout.exercises) {
    const cat = we.exercise.category;
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(we);
  }

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-muted hover:text-foreground mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to workouts
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{workout.name}</h1>
          {workout.description && (
            <p className="text-muted mt-1">{workout.description}</p>
          )}
        </div>
        <Link
          href={`/workout/${id}/play`}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <Play className="w-5 h-5" fill="currentColor" /> Start
        </Link>
      </div>

      {Object.entries(categoryGroups).map(([category, exercises]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-primary">
            {category}
          </h2>
          <div className="space-y-3">
            {exercises.map((we, i) => (
              <div
                key={we.id}
                className="flex items-center gap-4 bg-surface border border-border rounded-lg p-4"
              >
                <span className="text-muted font-mono text-sm w-6 text-right flex-shrink-0">
                  {we.orderIndex + 1}
                </span>
                {we.exercise.imageUrl && (
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-border">
                    <Image
                      src={we.exercise.imageUrl}
                      alt={we.exercise.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{we.exercise.name}</h3>
                  <div className="flex gap-3 text-sm text-muted mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      {we.reps} reps
                    </span>
                    {we.holdSeconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {we.holdSeconds}s hold
                      </span>
                    )}
                    {we.sides && (
                      <span className="text-primary/80">{we.sides}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
