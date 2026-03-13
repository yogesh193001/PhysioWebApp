import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteWorkout } from "@/lib/actions/workouts";
import { Plus, Pencil, Trash2, ListOrdered } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkoutsAdminPage() {
  const workouts = await prisma.workout.findMany({
    include: { exercises: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Workouts</h1>
        <Link
          href="/admin/workouts/new"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> New Workout
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="text-muted text-center py-12">
          No workouts yet. Create one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="flex items-center gap-4 bg-surface border border-border rounded-lg p-4"
            >
              <ListOrdered className="w-8 h-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{workout.name}</h3>
                <p className="text-sm text-muted">
                  {workout.exercises.length} exercises
                  {workout.description && ` · ${workout.description}`}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/admin/workouts/${workout.id}/edit`}
                  className="p-2 rounded hover:bg-border transition-colors"
                >
                  <Pencil className="w-4 h-4 text-muted" />
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteWorkout(workout.id);
                  }}
                >
                  <button
                    type="submit"
                    className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
