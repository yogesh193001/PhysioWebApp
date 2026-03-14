"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  updateWorkoutExercise,
  reorderWorkoutExercises,
  updateWorkout,
} from "@/lib/actions/workouts";
import { createExercise } from "@/lib/actions/exercises";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Save,
  GripVertical,
  Search,
  Loader2,
} from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  category: string;
  instructions: string;
  breathingCue: string | null;
  imageUrl: string | null;
  defaultReps: number;
  defaultHoldSecs: number | null;
  defaultRepDelay: number;
  defaultSides: string | null;
};

type WorkoutExercise = {
  id: string;
  orderIndex: number;
  reps: number;
  holdSeconds: number | null;
  repDelay: number;
  sides: string | null;
  notes: string | null;
  supersetGroupId: number | null;
  exercise: Exercise;
};

type Workout = {
  id: string;
  name: string;
  description: string | null;
  exercises: WorkoutExercise[];
};

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

export default function WorkoutEditor({
  workout,
  allExercises,
}: {
  workout: Workout;
  allExercises: Exercise[];
}) {
  const [items, setItems] = useState(workout.exercises);
  const [name, setName] = useState(workout.name);
  const [description, setDescription] = useState(workout.description || "");
  const [addExerciseId, setAddExerciseId] = useState("");
  const [addReps, setAddReps] = useState(3);
  const [addHold, setAddHold] = useState<string>("");
  const [addRepDelay, setAddRepDelay] = useState(5);
  const [addSides, setAddSides] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addSupersetGroupId, setAddSupersetGroupId] = useState<string>("");

  const handleSelectExercise = (id: string) => {
    setAddExerciseId(id);
    const ex = exercises.find((e) => e.id === id);
    if (ex) {
      setAddReps(ex.defaultReps);
      setAddHold(ex.defaultHoldSecs?.toString() || "");
      setAddRepDelay(ex.defaultRepDelay);
      setAddSides(ex.defaultSides || "");
    }
  };
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Inline exercise creation
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExCategory, setNewExCategory] = useState("");
  const [newExInstructions, setNewExInstructions] = useState("");

  // Wger search for inline creation
  const [wgerQuery, setWgerQuery] = useState("");
  const [wgerResults, setWgerResults] = useState<WgerResult[]>([]);
  const [wgerSearching, setWgerSearching] = useState(false);
  const [showWger, setShowWger] = useState(false);

  const [exercises, setExercises] = useState(allExercises);

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];
    setItems(newItems);

    startTransition(async () => {
      await reorderWorkoutExercises(
        workout.id,
        newItems.map((i) => i.id),
      );
    });
  };

  const handleRemove = (weId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== weId));
    startTransition(async () => {
      await removeExerciseFromWorkout(weId, workout.id);
    });
  };

  const handleAdd = () => {
    if (!addExerciseId) return;
    startTransition(async () => {
      await addExerciseToWorkout(
        workout.id,
        addExerciseId,
        addReps,
        addHold ? parseInt(addHold) : null,
        addSides || null,
        addNotes || null,
        addRepDelay,
        addSupersetGroupId ? parseInt(addSupersetGroupId) : null,
      );
      window.location.reload();
    });
  };

  const handleUpdateItem = (
    weId: string,
    field: string,
    value: string | number | null,
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.id === weId ? { ...i, [field]: value } : i)),
    );
    startTransition(async () => {
      await updateWorkoutExercise(weId, workout.id, {
        [field]: value,
      });
    });
  };

  const handleSaveDetails = () => {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    startTransition(async () => {
      await updateWorkout(workout.id, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleCreateExercise = () => {
    if (!newExName || !newExCategory) return;
    const formData = new FormData();
    formData.set("name", newExName);
    formData.set("category", newExCategory);
    formData.set("instructions", newExInstructions);
    startTransition(async () => {
      const result = await createExercise(formData);
      if (result.success && result.id) {
        const newEx: Exercise = {
          id: result.id,
          name: newExName,
          category: newExCategory,
          instructions: newExInstructions,
          breathingCue: null,
          imageUrl: null,
          defaultReps: 3,
          defaultHoldSecs: null,
          defaultRepDelay: 5,
          defaultSides: null,
        };
        setExercises((prev) => [...prev, newEx].sort((a, b) => a.name.localeCompare(b.name)));
        setAddExerciseId(result.id);
        setNewExName("");
        setNewExCategory("");
        setNewExInstructions("");
        setShowCreateExercise(false);
      }
    });
  };

  const searchWger = async () => {
    if (!wgerQuery.trim()) return;
    setWgerSearching(true);
    try {
      const res = await fetch(`/api/wger/search?q=${encodeURIComponent(wgerQuery.trim())}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWgerResults(data.results || []);
    } catch {
      setWgerResults([]);
    } finally {
      setWgerSearching(false);
    }
  };

  const importWger = async (ex: WgerResult) => {
    startTransition(async () => {
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
      if (res.ok) {
        const imported = await res.json();
        const newEx: Exercise = {
          id: imported.id,
          name: imported.name,
          category: imported.category,
          instructions: imported.instructions || "",
          breathingCue: null,
          imageUrl: imported.imageUrl || null,
          defaultReps: 3,
          defaultHoldSecs: null,
          defaultRepDelay: 5,
          defaultSides: null,
        };
        setExercises((prev) => [...prev, newEx].sort((a, b) => a.name.localeCompare(b.name)));
        setAddExerciseId(imported.id);
        setShowWger(false);
        setWgerResults([]);
        setWgerQuery("");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Workout details */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Workout Details</h2>
        <div>
          <label className="block text-sm text-muted mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none resize-y"
          />
        </div>
        <button
          onClick={handleSaveDetails}
          disabled={isPending}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 text-sm"
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Details"}
        </button>
      </div>

      {/* Exercise list */}
      <div>
        <h2 className="font-semibold mb-3">Exercises ({items.length})</h2>
        <div className="space-y-2">
          {items.map((we, index) => (
            <div
              key={we.id}
              className="bg-surface border border-border rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted flex-shrink-0" />

                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                    className="p-0.5 rounded hover:bg-border disabled:opacity-30"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moveItem(index, "down")}
                    disabled={index === items.length - 1}
                    className="p-0.5 rounded hover:bg-border disabled:opacity-30"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <span className="text-sm text-muted font-mono w-5">
                  {index + 1}
                </span>

                {we.exercise.imageUrl && (
                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-border">
                    <Image
                      src={we.exercise.imageUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">
                    {we.exercise.name}
                  </span>
                  <span className="text-xs text-muted ml-2">
                    {we.exercise.category}
                  </span>
                  {we.supersetGroupId != null && (
                    <span className="text-xs ml-2 px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                      Superset {we.supersetGroupId}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleRemove(we.id)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>

              {/* Editable fields */}
              <div className="flex gap-3 mt-2 ml-16 flex-wrap">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted">Reps:</label>
                  <input
                    type="number"
                    min={1}
                    value={we.reps}
                    onChange={(e) =>
                      handleUpdateItem(
                        we.id,
                        "reps",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="w-14 px-2 py-1 text-sm rounded border border-border bg-background"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted">Hold (s):</label>
                  <input
                    type="number"
                    min={0}
                    value={we.holdSeconds || ""}
                    onChange={(e) =>
                      handleUpdateItem(
                        we.id,
                        "holdSeconds",
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="w-14 px-2 py-1 text-sm rounded border border-border bg-background"
                    placeholder="—"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted">Rep delay:</label>
                  <input
                    type="number"
                    min={1}
                    value={we.repDelay}
                    onChange={(e) =>
                      handleUpdateItem(
                        we.id,
                        "repDelay",
                        parseInt(e.target.value) || 5,
                      )
                    }
                    className="w-14 px-2 py-1 text-sm rounded border border-border bg-background"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted">Sides:</label>
                  <input
                    type="text"
                    value={we.sides || ""}
                    onChange={(e) =>
                      handleUpdateItem(we.id, "sides", e.target.value || null)
                    }
                    className="w-32 px-2 py-1 text-sm rounded border border-border bg-background"
                    placeholder="e.g., each side"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted">Superset:</label>
                  <input
                    type="number"
                    min={1}
                    value={we.supersetGroupId ?? ""}
                    onChange={(e) =>
                      handleUpdateItem(
                        we.id,
                        "supersetGroupId",
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="w-14 px-2 py-1 text-sm rounded border border-border bg-background"
                    placeholder="—"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted">Notes:</label>
                  <input
                    type="text"
                    value={we.notes || ""}
                    onChange={(e) =>
                      handleUpdateItem(we.id, "notes", e.target.value || null)
                    }
                    className="w-40 px-2 py-1 text-sm rounded border border-border bg-background"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add exercise */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Add Exercise</h2>

        {/* Wger import */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowWger(!showWger)}
            className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
          >
            <Search className="w-3 h-3" />
            {showWger ? "Hide Wger search" : "Import from Wger API"}
          </button>
          {showWger && (
            <div className="p-3 bg-background border border-border rounded-lg mb-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={wgerQuery}
                  onChange={(e) => setWgerQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchWger()}
                  placeholder="Search Wger exercises..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none text-sm"
                />
                <button
                  onClick={searchWger}
                  disabled={wgerSearching}
                  className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                >
                  {wgerSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                </button>
              </div>
              {wgerResults.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {wgerResults.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => importWger(ex)}
                      disabled={isPending}
                      className="w-full text-left p-2 rounded hover:bg-border text-sm flex items-center justify-between"
                    >
                      <span>
                        <span className="font-medium">{ex.name}</span>
                        {ex.category && (
                          <span className="text-xs text-muted ml-2">{ex.category}</span>
                        )}
                      </span>
                      <Plus className="w-3 h-3 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inline create exercise */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowCreateExercise(!showCreateExercise)}
            className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
          >
            <Plus className="w-3 h-3" />
            {showCreateExercise ? "Hide" : "Create new exercise"}
          </button>
          {showCreateExercise && (
            <div className="p-3 bg-background border border-border rounded-lg mb-3 space-y-2">
              <input
                type="text"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="Exercise name *"
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none text-sm"
              />
              <select
                value={newExCategory}
                onChange={(e) => setNewExCategory(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none text-sm"
              >
                <option value="">Select category *</option>
                <option value="Upper Body">Upper Body</option>
                <option value="Neck">Neck</option>
                <option value="Back">Back</option>
                <option value="Lower Body">Lower Body</option>
                <option value="Core">Core</option>
              </select>
              <textarea
                value={newExInstructions}
                onChange={(e) => setNewExInstructions(e.target.value)}
                placeholder="Instructions (optional)"
                rows={2}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface focus:border-primary focus:outline-none text-sm resize-y"
              />
              <button
                onClick={handleCreateExercise}
                disabled={!newExName || !newExCategory || isPending}
                className="bg-accent text-white px-4 py-1.5 rounded-lg text-sm hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                Create & Select
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <select
              value={addExerciseId}
              onChange={(e) => handleSelectExercise(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none"
            >
              <option value="">Select an exercise...</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Reps</label>
            <input
              type="number"
              min={1}
              value={addReps}
              onChange={(e) => setAddReps(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Hold (seconds)
            </label>
            <input
              type="number"
              min={0}
              value={addHold}
              onChange={(e) => setAddHold(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Rep delay (s)
            </label>
            <input
              type="number"
              min={1}
              value={addRepDelay}
              onChange={(e) => setAddRepDelay(parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Sides</label>
            <input
              type="text"
              value={addSides}
              onChange={(e) => setAddSides(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              placeholder="e.g., each side"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Superset group
            </label>
            <input
              type="number"
              min={1}
              value={addSupersetGroupId}
              onChange={(e) => setAddSupersetGroupId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted mb-1">Notes</label>
            <input
              type="text"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              placeholder="Optional notes"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAdd}
              disabled={!addExerciseId || isPending}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
