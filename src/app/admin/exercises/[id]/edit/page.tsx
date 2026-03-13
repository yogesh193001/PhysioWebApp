import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateExercise } from "@/lib/actions/exercises";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) return notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    const result = await updateExercise(id, formData);
    if (result.success) redirect("/admin/exercises");
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/exercises"
        className="inline-flex items-center gap-1 text-muted hover:text-foreground mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to exercises
      </Link>

      <h1 className="text-3xl font-bold mb-6">Edit Exercise</h1>

      <form action={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            name="name"
            required
            defaultValue={exercise.name}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            name="category"
            required
            defaultValue={exercise.category}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
          >
            <option value="Upper Body">Upper Body</option>
            <option value="Neck">Neck</option>
            <option value="Back">Back</option>
            <option value="Lower Body">Lower Body</option>
            <option value="Core">Core</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Instructions</label>
          <textarea
            name="instructions"
            rows={4}
            defaultValue={exercise.instructions}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Breathing Cue
          </label>
          <input
            name="breathingCue"
            defaultValue={exercise.breathingCue || ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            name="imageUrl"
            defaultValue={exercise.imageUrl || ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
          />
          <p className="text-xs text-muted mt-1">
            Path to image in /public/images/ directory
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Save Changes
          </button>
          <Link
            href="/admin/exercises"
            className="px-6 py-2 rounded-lg border border-border hover:bg-surface transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
