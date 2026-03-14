"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, Plus, Loader2 } from "lucide-react";

type WgerExercise = {
  id: number;
  name: string;
  category: string;
  image: string | null;
};

export default function BrowseExercisesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WgerExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState<Set<number>>(new Set());

  const searchExercises = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/wger/search?q=${encodeURIComponent(query.trim())}`,
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setError("Failed to search exercises. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const importExercise = async (ex: WgerExercise) => {
    setImporting((prev) => new Set(prev).add(ex.id));
    try {
      // Fetch full exercise details from Wger
      let instructions = "";
      let imageUrl = ex.image;
      try {
        const detailRes = await fetch(`/api/wger/exercise/${ex.id}`);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          instructions = detail.description || "";
          if (detail.mainImage) imageUrl = detail.mainImage;
        }
      } catch { /* use defaults */ }

      const res = await fetch("/api/exercises/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ex.name,
          category: mapWgerCategory(ex.category),
          instructions,
          imageUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to import");
      setImported((prev) => new Set(prev).add(ex.id));
    } catch {
      setError("Failed to import exercise.");
    } finally {
      setImporting((prev) => {
        const next = new Set(prev);
        next.delete(ex.id);
        return next;
      });
    }
  };

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-muted hover:text-foreground mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to admin
      </Link>

      <h1 className="text-3xl font-bold mb-2">Browse Exercises</h1>
      <p className="text-muted mb-6 text-sm">
        Search the Wger open-source exercise database and import exercises into
        your library.
      </p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchExercises()}
          placeholder="Search exercises (e.g., bicep curl, squat...)"
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none"
        />
        <button
          onClick={searchExercises}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((ex) => (
            <div
              key={ex.id}
              className="flex items-start gap-4 bg-surface border border-border rounded-lg p-4"
            >
              {ex.image && (
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-border">
                  <Image
                    src={ex.image}
                    alt={ex.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{ex.name}</h3>
                {ex.category && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-2">
                    {ex.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => importExercise(ex)}
                disabled={imported.has(ex.id) || importing.has(ex.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors ${
                  imported.has(ex.id)
                    ? "bg-accent/10 text-accent"
                    : "bg-primary text-white hover:bg-primary-dark"
                }`}
              >
                {imported.has(ex.id) ? (
                  "Imported ✓"
                ) : importing.has(ex.id) ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Importing...</>
                ) : (
                  <>
                    <Plus className="w-3 h-3" /> Import
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && query && (
        <p className="text-muted text-center py-8">
          No results found. Try a different search term.
        </p>
      )}
    </div>
  );
}

function mapWgerCategory(wgerCat: string | undefined): string {
  if (!wgerCat) return "Upper Body";
  const lower = wgerCat.toLowerCase();
  if (
    lower.includes("arm") ||
    lower.includes("shoulder") ||
    lower.includes("chest")
  )
    return "Upper Body";
  if (
    lower.includes("leg") ||
    lower.includes("glute") ||
    lower.includes("calf")
  )
    return "Lower Body";
  if (lower.includes("back")) return "Back";
  if (lower.includes("ab") || lower.includes("core")) return "Core";
  return "Upper Body";
}
