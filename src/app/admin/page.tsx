import Link from "next/link";
import { Dumbbell, ListOrdered, Settings } from "lucide-react";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/exercises"
          className="bg-surface border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all"
        >
          <Dumbbell className="w-10 h-10 text-primary mb-3" />
          <h2 className="text-xl font-semibold mb-1">Exercises</h2>
          <p className="text-muted text-sm">
            Add, edit, and manage individual exercises with images and
            instructions.
          </p>
        </Link>

        <Link
          href="/admin/workouts"
          className="bg-surface border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all"
        >
          <ListOrdered className="w-10 h-10 text-primary mb-3" />
          <h2 className="text-xl font-semibold mb-1">Workouts</h2>
          <p className="text-muted text-sm">
            Build workout routines by combining exercises in order with reps and
            timers.
          </p>
        </Link>

        <Link
          href="/admin/exercises/browse"
          className="bg-surface border border-border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all"
        >
          <Settings className="w-10 h-10 text-primary mb-3" />
          <h2 className="text-xl font-semibold mb-1">Browse Exercises</h2>
          <p className="text-muted text-sm">
            Search the Wger exercise database and import exercises into your
            library.
          </p>
        </Link>
      </div>
    </div>
  );
}
