"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createWorkout } from "@/lib/actions/workouts";
import { ArrowLeft } from "lucide-react";

export default function NewWorkoutPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createWorkout(formData);
      if (result.success && result.id) {
        router.push(`/admin/workouts/${result.id}/edit`);
      } else {
        setError(result.error || "Failed to create workout");
      }
    });
  };

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/workouts"
        className="inline-flex items-center gap-1 text-muted hover:text-foreground mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to workouts
      </Link>

      <h1 className="text-3xl font-bold mb-6">Create New Workout</h1>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            name="name"
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
            placeholder="Workout name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none resize-y"
            placeholder="Optional description"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create & Add Exercises"}
          </button>
          <Link
            href="/admin/workouts"
            className="px-6 py-2 rounded-lg border border-border hover:bg-surface transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
