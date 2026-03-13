import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { Dumbbell, Clock, ListOrdered } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const workouts = await prisma.workout.findMany({
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (workouts.length === 0) {
    return (
      <div className="text-center py-20">
        <Dumbbell className="mx-auto h-16 w-16 text-muted mb-4" />
        <h1 className="text-2xl font-bold mb-2">No Workouts Yet</h1>
        <p className="text-muted mb-6">
          Create your first workout in the admin panel.
        </p>
        <Link
          href="/admin/workouts/new"
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
        >
          Create Workout
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Your Workouts</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        {workouts.map((workout) => {
          const categories = [
            ...new Set(workout.exercises.map((we) => we.exercise.category)),
          ];
          const totalTime = workout.exercises.reduce((acc, we) => {
            const hold = we.holdSeconds || 3;
            const sideMultiplier = we.sides?.includes("each side") ? 2 : 1;
            return acc + we.reps * hold * sideMultiplier;
          }, 0);
          const minutes = Math.ceil(totalTime / 60);

          return (
            <Link
              key={workout.id}
              href={`/workout/${workout.id}`}
              className="block bg-surface border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                {workout.exercises[0]?.exercise.imageUrl && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-border">
                    <Image
                      src={workout.exercises[0].exercise.imageUrl}
                      alt=""
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold mb-1">{workout.name}</h2>
                  {workout.description && (
                    <p className="text-muted text-sm mb-3 line-clamp-2">
                      {workout.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <ListOrdered className="w-4 h-4" />
                      {workout.exercises.length} exercises
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />~{minutes} min
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
