import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import WorkoutPlayer from "@/components/WorkoutPlayer";

export const dynamic = "force-dynamic";

export default async function PlayWorkoutPage({
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

  return <WorkoutPlayer workout={workout} />;
}
