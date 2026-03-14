"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Upload, X } from "lucide-react";
import { updateExercise } from "@/lib/actions/exercises";

type ExerciseData = {
  id: string;
  name: string;
  category: string;
  instructions: string;
  breathingCue: string | null;
  imageUrl: string | null;
};

export default function EditExerciseForm({ exercise }: { exercise: ExerciseData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(exercise.name);
  const [category, setCategory] = useState(exercise.category);
  const [instructions, setInstructions] = useState(exercise.instructions);
  const [breathingCue, setBreathingCue] = useState(exercise.breathingCue || "");
  const [imageUrl, setImageUrl] = useState(exercise.imageUrl || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl("");
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!name || !category) {
      setError("Name and category are required");
      return;
    }
    setError("");
    const formData = new FormData();
    formData.set("name", name);
    formData.set("category", category);
    formData.set("instructions", instructions);
    formData.set("breathingCue", breathingCue);
    formData.set("imageUrl", imageUrl);
    if (imageFile) formData.set("imageFile", imageFile);

    startTransition(async () => {
      const result = await updateExercise(exercise.id, formData);
      if (result.success) {
        router.push("/admin/exercises");
      } else {
        setError(result.error || "Failed to update exercise");
      }
    });
  };

  const currentImage = imagePreview || imageUrl || exercise.imageUrl;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/exercises"
        className="inline-flex items-center gap-1 text-muted hover:text-foreground mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to exercises
      </Link>

      <h1 className="text-3xl font-bold mb-6">Edit Exercise</h1>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
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
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Breathing Cue</label>
          <input
            value={breathingCue}
            onChange={(e) => setBreathingCue(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-surface border border-border px-4 py-2 rounded-lg text-sm hover:bg-border transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload New Image
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {(imagePreview || imageUrl) && (
                <button type="button" onClick={clearImage} className="p-1 hover:bg-border rounded">
                  <X className="w-4 h-4 text-muted" />
                </button>
              )}
            </div>
            {!imageFile && (
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none text-sm"
                placeholder="Or enter image URL"
              />
            )}
            {currentImage && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-border">
                {imagePreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Image src={currentImage} alt="Current" width={96} height={96} className="w-full h-full object-cover" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/admin/exercises"
            className="px-6 py-2 rounded-lg border border-border hover:bg-surface transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
