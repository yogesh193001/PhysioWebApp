"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getExercises() {
  return prisma.exercise.findMany({ orderBy: { name: "asc" } });
}

export async function getExercise(id: string) {
  return prisma.exercise.findUnique({ where: { id } });
}

export async function createExercise(formData: FormData) {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const instructions = formData.get("instructions") as string;
  const breathingCue = (formData.get("breathingCue") as string) || null;
  const imageUrl = (formData.get("imageUrl") as string) || null;

  if (!name || !category) {
    return { error: "Name and category are required" };
  }

  await prisma.exercise.create({
    data: { name, category, instructions: instructions || "", breathingCue, imageUrl },
  });

  revalidatePath("/admin/exercises");
  return { success: true };
}

export async function updateExercise(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const instructions = formData.get("instructions") as string;
  const breathingCue = (formData.get("breathingCue") as string) || null;
  const imageUrl = (formData.get("imageUrl") as string) || null;

  if (!name || !category) {
    return { error: "Name and category are required" };
  }

  await prisma.exercise.update({
    where: { id },
    data: { name, category, instructions: instructions || "", breathingCue, imageUrl },
  });

  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${id}/edit`);
  return { success: true };
}

export async function deleteExercise(id: string) {
  await prisma.exercise.delete({ where: { id } });
  revalidatePath("/admin/exercises");
  return { success: true };
}
