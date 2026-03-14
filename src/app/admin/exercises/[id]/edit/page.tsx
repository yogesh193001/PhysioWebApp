import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import EditExerciseForm from "./EditExerciseForm";

export const dynamic = "force-dynamic";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) return notFound();

  return <EditExerciseForm exercise={exercise} />;
}
