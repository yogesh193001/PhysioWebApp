import { prisma } from "@/lib/db";
import Link from "next/link";
import { Calendar, Clock, Dumbbell, Flame, TrendingUp, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const sessions = await prisma.workoutSession.findMany({
    include: { workout: true },
    orderBy: { completedAt: "desc" },
  });

  const totalWorkouts = sessions.length;
  const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalSeconds / totalWorkouts / 60) : 0;

  // Streak calculation
  const uniqueDays = [...new Set(
    sessions.map((s) => s.completedAt.toISOString().slice(0, 10))
  )].sort().reverse();

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (uniqueDays[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  // This week's sessions
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const thisWeekSessions = sessions.filter(
    (s) => s.completedAt >= startOfWeek
  );
  const thisWeekMinutes = Math.round(
    thisWeekSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60
  );

  // Calendar data — last 30 days
  const last30Days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = sessions.filter(
      (s) => s.completedAt.toISOString().slice(0, 10) === dateStr
    ).length;
    last30Days.push({ date: dateStr, count });
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 rounded-lg border border-border hover:bg-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-3xl font-bold">Progress</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <Dumbbell className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{totalWorkouts}</div>
          <div className="text-xs text-muted">Total Workouts</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">{totalMinutes}</div>
          <div className="text-xs text-muted">Total Minutes</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
          <div className="text-2xl font-bold">{streak}</div>
          <div className="text-xs text-muted">Day Streak</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <div className="text-2xl font-bold">{avgDuration}</div>
          <div className="text-xs text-muted">Avg Minutes</div>
        </div>
      </div>

      {/* This week summary */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-8">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> This Week
        </h2>
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-2xl font-bold">{thisWeekSessions.length}</span>
            <span className="text-sm text-muted ml-1">workout{thisWeekSessions.length !== 1 ? "s" : ""}</span>
          </div>
          <div>
            <span className="text-2xl font-bold">{thisWeekMinutes}</span>
            <span className="text-sm text-muted ml-1">min</span>
          </div>
        </div>
      </div>

      {/* Activity heatmap (last 30 days) */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-8">
        <h2 className="font-semibold mb-3">Last 30 Days</h2>
        <div className="grid grid-cols-10 gap-1.5">
          {last30Days.map(({ date, count }) => (
            <div
              key={date}
              title={`${date}: ${count} workout${count !== 1 ? "s" : ""}`}
              className={`aspect-square rounded-sm ${
                count === 0
                  ? "bg-border"
                  : count === 1
                  ? "bg-primary/40"
                  : count === 2
                  ? "bg-primary/70"
                  : "bg-primary"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted justify-end">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-border" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/70" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>More</span>
        </div>
      </div>

      {/* Workout history */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Workout History</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No workouts completed yet.</p>
            <p className="text-sm mt-1">Complete a workout to start tracking your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{session.workout.name}</div>
                  <div className="text-sm text-muted">
                    {formatDate(session.completedAt)} at {formatTime(session.completedAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-medium">
                    {formatDuration(session.durationSeconds)}
                  </div>
                  <div className="text-xs text-muted">
                    {session.exercisesCompleted}/{session.totalExercises} exercises
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
