import { redirect } from "next/navigation";
import Link from "next/link";
import { createExercise } from "@/lib/actions/exercises";
import { ArrowLeft } from "lucide-react";

export default function NewExercisePage() {
  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createExercise(formData);
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

      <h1 className="text-3xl font-bold mb-6">Add New Exercise</h1>

      <form action={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            name="name"
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
            placeholder="Exercise name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            name="category"
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
          >
            <option value="">Select category</option>
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
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none resize-y"
            placeholder="Step-by-step instructions for performing this exercise"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Breathing Cue
          </label>
          <input
            name="breathingCue"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
            placeholder="e.g., Breathe in going up, breathe out coming down"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            name="imageUrl"
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
            placeholder="/images/exercise-name.jpeg"
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
            Create Exercise
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
