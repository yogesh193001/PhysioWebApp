import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { deleteExercise } from "@/lib/actions/exercises";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const exercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
  });

  const categories = [...new Set(exercises.map((e) => e.category))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Exercises</h1>
        <Link
          href="/admin/exercises/new"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Exercise
        </Link>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-primary">
            {category}
          </h2>
          <div className="space-y-2">
            {exercises
              .filter((e) => e.category === category)
              .map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center gap-4 bg-surface border border-border rounded-lg p-3"
                >
                  {exercise.imageUrl && (
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-border">
                      <Image
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{exercise.name}</h3>
                    {exercise.breathingCue && (
                      <p className="text-xs text-muted truncate">
                        {exercise.breathingCue}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/exercises/${exercise.id}/edit`}
                      className="p-2 rounded hover:bg-border transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted" />
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteExercise(exercise.id);
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
        </div>
      ))}
    </div>
  );
}
