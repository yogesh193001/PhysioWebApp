"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getWorkouts() {
  return prisma.workout.findMany({
    include: { exercises: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkout(id: string) {
  return prisma.workout.findUnique({
    where: { id },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
}

export async function createWorkout(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  if (!name) return { error: "Name is required" };

  const workout = await prisma.workout.create({
    data: { name, description },
  });

  revalidatePath("/admin/workouts");
  return { success: true, id: workout.id };
}

export async function updateWorkout(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  if (!name) return { error: "Name is required" };

  await prisma.workout.update({
    where: { id },
    data: { name, description },
  });

  revalidatePath("/admin/workouts");
  revalidatePath(`/admin/workouts/${id}/edit`);
  return { success: true };
}

export async function deleteWorkout(id: string) {
  await prisma.workout.delete({ where: { id } });
  revalidatePath("/admin/workouts");
  return { success: true };
}

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  reps: number,
  holdSeconds: number | null,
  sides: string | null,
  notes: string | null,
  repDelay: number = 5,
  supersetGroupId: number | null = null
) {
  const maxOrder = await prisma.workoutExercise.findFirst({
    where: { workoutId },
    orderBy: { orderIndex: "desc" },
  });

  const orderIndex = maxOrder ? maxOrder.orderIndex + 1 : 0;

  await prisma.workoutExercise.create({
    data: { workoutId, exerciseId, orderIndex, reps, holdSeconds, sides, notes, repDelay, supersetGroupId },
  });

  revalidatePath(`/admin/workouts/${workoutId}/edit`);
  return { success: true };
}

export async function removeExerciseFromWorkout(workoutExerciseId: string, workoutId: string) {
  await prisma.workoutExercise.delete({ where: { id: workoutExerciseId } });

  // Re-index remaining exercises
  const remaining = await prisma.workoutExercise.findMany({
    where: { workoutId },
    orderBy: { orderIndex: "asc" },
  });

  for (let i = 0; i < remaining.length; i++) {
    await prisma.workoutExercise.update({
      where: { id: remaining[i].id },
      data: { orderIndex: i },
    });
  }

  revalidatePath(`/admin/workouts/${workoutId}/edit`);
  return { success: true };
}

export async function updateWorkoutExercise(
  workoutExerciseId: string,
  workoutId: string,
  data: { reps?: number; holdSeconds?: number | null; sides?: string | null; notes?: string | null; repDelay?: number; supersetGroupId?: number | null }
) {
  await prisma.workoutExercise.update({
    where: { id: workoutExerciseId },
    data,
  });

  revalidatePath(`/admin/workouts/${workoutId}/edit`);
  return { success: true };
}

export async function reorderWorkoutExercises(
  workoutId: string,
  orderedIds: string[]
) {
  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.workoutExercise.update({
      where: { id: orderedIds[i] },
      data: { orderIndex: i },
    });
  }

  revalidatePath(`/admin/workouts/${workoutId}/edit`);
  return { success: true };
}
