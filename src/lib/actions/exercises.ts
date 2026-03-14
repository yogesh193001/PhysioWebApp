"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getExercises() {
  return prisma.exercise.findMany({ orderBy: { name: "asc" } });
}

export async function getExercise(id: string) {
  return prisma.exercise.findUnique({ where: { id } });
}

async function uploadImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) return null;
  if (file.size > 5 * 1024 * 1024) return null;

  try {
    const { supabaseAdmin } = await import("@/lib/supabase");
    const BUCKET = "exercise-images";
    const { data: bucket } = await supabaseAdmin.storage.getBucket(BUCKET);
    if (!bucket) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
    }
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, arrayBuffer, { contentType: file.type });
    if (error) return null;
    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  } catch {
    return null;
  }
}

export async function createExercise(formData: FormData) {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const instructions = formData.get("instructions") as string;
  const breathingCue = (formData.get("breathingCue") as string) || null;
  let imageUrl = (formData.get("imageUrl") as string) || null;
  const imageFile = formData.get("imageFile") as File | null;

  if (!name || !category) {
    return { error: "Name and category are required" };
  }

  if (imageFile && imageFile.size > 0) {
    const uploaded = await uploadImage(imageFile);
    if (uploaded) imageUrl = uploaded;
  }

  const exercise = await prisma.exercise.create({
    data: { name, category, instructions: instructions || "", breathingCue, imageUrl },
  });

  revalidatePath("/admin/exercises");
  return { success: true, id: exercise.id };
}

export async function updateExercise(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const instructions = formData.get("instructions") as string;
  const breathingCue = (formData.get("breathingCue") as string) || null;
  let imageUrl = (formData.get("imageUrl") as string) || null;
  const imageFile = formData.get("imageFile") as File | null;

  if (!name || !category) {
    return { error: "Name and category are required" };
  }

  if (imageFile && imageFile.size > 0) {
    const uploaded = await uploadImage(imageFile);
    if (uploaded) imageUrl = uploaded;
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
