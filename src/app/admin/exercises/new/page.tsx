"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, Loader2, Upload, X } from "lucide-react";
import { createExercise } from "@/lib/actions/exercises";

type WgerResult = { id: number; name: string; category: string; image: string | null };

function mapWgerCategory(cat: string | undefined): string {
  if (!cat) return "Upper Body";
  const l = cat.toLowerCase();
  if (l.includes("arm") || l.includes("shoulder") || l.includes("chest")) return "Upper Body";
  if (l.includes("leg") || l.includes("glute") || l.includes("calf")) return "Lower Body";
  if (l.includes("back")) return "Back";
  if (l.includes("ab") || l.includes("core")) return "Core";
  return "Upper Body";
}

export default function NewExercisePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [instructions, setInstructions] = useState("");
  const [breathingCue, setBreathingCue] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [defaultReps, setDefaultReps] = useState(3);
  const [defaultHoldSecs, setDefaultHoldSecs] = useState<string>("");
  const [defaultRepDelay, setDefaultRepDelay] = useState(5);
  const [defaultSides, setDefaultSides] = useState("");

  // Wger search
  const [wgerQuery, setWgerQuery] = useState("");
  const [wgerResults, setWgerResults] = useState<WgerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showWger, setShowWger] = useState(false);

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

  const searchWger = async () => {
    if (!wgerQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/wger/search?q=${encodeURIComponent(wgerQuery.trim())}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWgerResults(data.results || []);
    } catch {
      setWgerResults([]);
    } finally {
      setSearching(false);
    }
  };

  const importWger = async (ex: WgerResult) => {
    setName(ex.name);
    setCategory(mapWgerCategory(ex.category));
    if (ex.image) setImageUrl(ex.image);

    // Fetch full details
    try {
      const res = await fetch(`/api/wger/exercise/${ex.id}`);
      if (res.ok) {
        const detail = await res.json();
        if (detail.description) setInstructions(detail.description);
        if (detail.mainImage) setImageUrl(detail.mainImage);
      }
    } catch { /* use search data */ }

    setShowWger(false);
    setWgerResults([]);
    setWgerQuery("");
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
    formData.set("defaultReps", String(defaultReps));
    formData.set("defaultHoldSecs", defaultHoldSecs);
    formData.set("defaultRepDelay", String(defaultRepDelay));
    formData.set("defaultSides", defaultSides);
    if (imageFile) formData.set("imageFile", imageFile);

    startTransition(async () => {
      const result = await createExercise(formData);
      if (result.success) {
        router.push("/admin/exercises");
      } else {
        setError(result.error || "Failed to create exercise");
      }
    });
  };

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/exercises"
        className="inline-flex items-center gap-1 text-muted hover:text-foreground mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to exercises
      </Link>

      <h1 className="text-3xl font-bold mb-6">Add New Exercise</h1>

      {/* Wger import section */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowWger(!showWger)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Search className="w-3 h-3" />
          {showWger ? "Hide" : "Import from Wger exercise database"}
        </button>

        {showWger && (
          <div className="mt-3 p-4 bg-surface border border-border rounded-lg">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={wgerQuery}
                onChange={(e) => setWgerQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchWger()}
                placeholder="Search exercises..."
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none text-sm"
              />
              <button
                onClick={searchWger}
                disabled={searching}
                className="bg-primary text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"
              >
                {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                Search
              </button>
            </div>
            {wgerResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {wgerResults.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => importWger(ex)}
                    className="w-full text-left p-2 rounded hover:bg-border text-sm flex items-center gap-2"
                  >
                    <span className="font-medium">{ex.name}</span>
                    {ex.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{ex.category}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
            placeholder="Exercise name"
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
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none resize-y"
            placeholder="Step-by-step instructions for performing this exercise"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Breathing Cue</label>
          <input
            value={breathingCue}
            onChange={(e) => setBreathingCue(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
            placeholder="e.g., Breathe in going up, breathe out coming down"
          />
        </div>

        {/* Default timer settings */}
        <div className="border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted">Default Timer Settings</h3>
          <p className="text-xs text-muted">These defaults are used when adding this exercise to a workout.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Default Reps</label>
              <input
                type="number"
                min={1}
                value={defaultReps}
                onChange={(e) => setDefaultReps(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Default Hold (seconds)</label>
              <input
                type="number"
                min={0}
                value={defaultHoldSecs}
                onChange={(e) => setDefaultHoldSecs(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
                placeholder="None (rep-based)"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Default Rep Delay (s)</label>
              <input
                type="number"
                min={1}
                value={defaultRepDelay}
                onChange={(e) => setDefaultRepDelay(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Default Sides</label>
              <input
                type="text"
                value={defaultSides}
                onChange={(e) => setDefaultSides(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
                placeholder="e.g., each side"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-surface border border-border px-4 py-2 rounded-lg text-sm hover:bg-border transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Image
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
            {imagePreview && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            {!imagePreview && imageUrl && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-border">
                <Image src={imageUrl} alt="Preview" width={96} height={96} className="w-full h-full object-cover" />
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
            {isPending ? "Creating..." : "Create Exercise"}
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
