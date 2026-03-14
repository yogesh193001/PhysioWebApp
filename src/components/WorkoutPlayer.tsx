"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ArrowLeft,
  Volume2,
  VolumeX,
  ToggleLeft,
  ToggleRight,
  Wind,
  Speech,
  List,
} from "lucide-react";

/* ─── types ─── */
type Exercise = {
  id: string;
  name: string;
  category: string;
  instructions: string;
  breathingCue: string | null;
  imageUrl: string | null;
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

type WorkoutData = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
};

/* A single playable step the player iterates through */
type Step = {
  we: WorkoutExercise;
  rep: number;
  totalReps: number;
  supersetLabel: string | null;
};

/* ─── helpers ─── */
function buildSteps(exercises: WorkoutExercise[]): Step[] {
  const steps: Step[] = [];
  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];
    if (ex.supersetGroupId != null) {
      const group: WorkoutExercise[] = [ex];
      while (
        i + 1 < exercises.length &&
        exercises[i + 1].supersetGroupId === ex.supersetGroupId
      ) {
        group.push(exercises[++i]);
      }
      const maxReps = Math.max(...group.map((g) => g.reps));
      for (let rep = 1; rep <= maxReps; rep++) {
        for (let gi = 0; gi < group.length; gi++) {
          if (rep <= group[gi].reps) {
            steps.push({
              we: group[gi],
              rep,
              totalReps: group[gi].reps,
              supersetLabel: `${gi + 1}/${group.length}`,
            });
          }
        }
      }
    } else {
      for (let rep = 1; rep <= ex.reps; rep++) {
        steps.push({ we: ex, rep, totalReps: ex.reps, supersetLabel: null });
      }
    }
    i++;
  }
  return steps;
}

function getSides(we: WorkoutExercise): string[] {
  if (!we.sides) return [];
  const s = we.sides.toLowerCase();
  if (s.includes("each side") || s.includes("left then right") || s.includes("left/right"))
    return ["Left Side", "Right Side"];
  if (s.includes("forwards then backwards"))
    return ["Forwards", "Backwards"];
  if (s.includes("back & front"))
    return we.sides.split(", ").map((p) => p.trim());
  return [];
}

function getTimerDuration(we: WorkoutExercise): number {
  return we.holdSeconds || we.repDelay || 5;
}

function ordinal(n: number): string {
  const words = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
  return words[n] || `${n}th`;
}

/* ──────────────────── COMPONENT ──────────────────── */
export default function WorkoutPlayer({ workout }: { workout: WorkoutData }) {
  const steps = useMemo(() => buildSteps(workout.exercises), [workout.exercises]);

  const [stepIndex, setStepIndex] = useState(0);
  const [currentSide, setCurrentSide] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showReadyScreen, setShowReadyScreen] = useState(false);
  const [showingInstructions, setShowingInstructions] = useState(false);
  const [changingSides, setChangingSides] = useState(false);
  const [sideChangeCountdown, setSideChangeCountdown] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [showExerciseList, setShowExerciseList] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const ttsSpokenForStep = useRef(-1);
  const instructionPhaseRef = useRef(false);

  const step = steps[stepIndex] as Step | undefined;

  /* ─── Wake Lock ─── */
  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch { /* not supported or denied */ }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && isRunning) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [isRunning, requestWakeLock]);

  /* ─── Audio beep ─── */
  const playBeep = useCallback(
    (frequency = 800, duration = 200) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + duration / 1000);
      } catch { /* audio not available */ }
    },
    [soundEnabled],
  );

  const playCompletionSound = useCallback(() => {
    playBeep(1000, 150);
    setTimeout(() => playBeep(1200, 150), 200);
    setTimeout(() => playBeep(1500, 300), 400);
  }, [playBeep]);

  /* ─── TTS ─── */
  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || typeof speechSynthesis === "undefined") return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      u.pitch = 1.0;
      speechSynthesis.speak(u);
    },
    [ttsEnabled],
  );

  const speakCountdown = useCallback(
    (n: number) => {
      if (!ttsEnabled || typeof speechSynthesis === "undefined") return;
      const u = new SpeechSynthesisUtterance(String(n));
      u.rate = 1.2;
      speechSynthesis.speak(u);
    },
    [ttsEnabled],
  );

  const dismissInstructions = useCallback(() => {
    instructionPhaseRef.current = false;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    setShowingInstructions(false);
    setIsRunning(true);
  }, []);

  /* ─── Instruction phase TTS ─── */
  useEffect(() => {
    if (!showingInstructions || !step) return;
    instructionPhaseRef.current = true;

    const parts: string[] = [step.we.exercise.name];

    // For supersets on rep > 1, just say the name
    const isSuperset = step.supersetLabel != null;
    if (isSuperset && step.rep > 1) {
      // Just the exercise name, no full instructions
    } else {
      if (step.supersetLabel) parts.push(`Superset ${step.supersetLabel}`);
      if (step.we.exercise.instructions) parts.push(step.we.exercise.instructions);
      if (step.we.notes) parts.push(step.we.notes);
      if (step.we.exercise.breathingCue) parts.push(step.we.exercise.breathingCue);
    }

    if (!ttsEnabled || typeof speechSynthesis === "undefined") {
      const tid = setTimeout(dismissInstructions, 3000);
      return () => clearTimeout(tid);
    }

    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(parts.join(". "));
    u.rate = 1.0;
    u.pitch = 1.0;
    u.onend = () => {
      if (instructionPhaseRef.current) {
        dismissInstructions();
      }
    };
    speechSynthesis.speak(u);
  }, [showingInstructions, step, ttsEnabled, dismissInstructions]);

  /* ─── Active phase TTS (rep announcements + breathing cue) ─── */
  useEffect(() => {
    if (!step || !isStarted || !ttsEnabled || showingInstructions || changingSides) return;
    const key = stepIndex * 100 + currentSide;
    if (ttsSpokenForStep.current === key) return;
    ttsSpokenForStep.current = key;

    // Rep 1, side 0: already spoken in instruction phase
    if (step.rep === 1 && currentSide === 0) return;

    const parts: string[] = [];
    const sides = getSides(step.we);
    const sideName = sides[currentSide] || null;

    if (sideName) parts.push(sideName);

    if (step.totalReps > 1 && currentSide === 0 && step.rep > 1) {
      // For supersets, just say the exercise name
      if (step.supersetLabel) {
        parts.push(step.we.exercise.name);
      } else {
        parts.push(`This is your ${ordinal(step.rep)} rep`);
        // Occasionally say how many reps are left
        const repsLeft = step.totalReps - step.rep;
        if (repsLeft > 0 && (repsLeft <= 2 || step.rep % 3 === 0)) {
          parts.push(`${repsLeft} rep${repsLeft > 1 ? "s" : ""} left`);
        }
      }
    }

    if (step.we.exercise.breathingCue) parts.push(step.we.exercise.breathingCue);

    if (parts.length > 0) speak(parts.join(". "));
  }, [stepIndex, currentSide, step, isStarted, ttsEnabled, speak, showingInstructions, changingSides]);

  /* ─── Init timer ─── */
  const initTimer = useCallback(() => {
    if (!step) return;
    const isRepBased = step.we.holdSeconds == null;
    if (isRepBased) {
      // Rep-based: count up with repDelay interval
      setRepCount(0);
      setTimeLeft(step.we.repDelay || 5);
    } else {
      setTimeLeft(step.we.holdSeconds!);
    }
  }, [step]);

  /* ─── Side change countdown ─── */
  useEffect(() => {
    if (!changingSides || sideChangeCountdown <= 0) return;
    const interval = setInterval(() => {
      setSideChangeCountdown((t) => {
        if (t <= 1) {
          setChangingSides(false);
          setIsRunning(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [changingSides, sideChangeCountdown]);

  /* ─── Advance logic ─── */
  const advance = useCallback(() => {
    if (!step) return;
    const sides = getSides(step.we);

    if (sides.length > 0 && currentSide < sides.length - 1) {
      // Pause for side change with 3-second countdown
      const nextSideName = sides[currentSide + 1];
      setIsRunning(false);
      setChangingSides(true);
      setSideChangeCountdown(3);
      speak(`Change to ${nextSideName}`);
      setCurrentSide((s) => s + 1);
      const isRepBased = step.we.holdSeconds == null;
      if (isRepBased) {
        setRepCount(0);
        setTimeLeft(step.we.repDelay || 5);
      } else {
        setTimeLeft(step.we.holdSeconds!);
      }
      playBeep(600, 100);
      return;
    }

    if (stepIndex < steps.length - 1) {
      playCompletionSound();
      const nextStep = steps[stepIndex + 1];
      if (nextStep.we.exercise.id !== step.we.exercise.id) {
        if (autoAdvance) {
          setShowReadyScreen(true);
          setIsRunning(false);
        } else {
          setIsRunning(false);
        }
      } else {
        setStepIndex((i) => i + 1);
        setCurrentSide(0);
        const isRepBased = nextStep.we.holdSeconds == null;
        if (isRepBased) {
          setRepCount(0);
          setTimeLeft(nextStep.we.repDelay || 5);
        } else {
          setTimeLeft(nextStep.we.holdSeconds!);
        }
        playBeep(600, 100);
      }
      return;
    }

    playCompletionSound();
    setIsComplete(true);
    setIsRunning(false);
    releaseWakeLock();
  }, [step, stepIndex, steps, currentSide, autoAdvance, playBeep, playCompletionSound, releaseWakeLock, speak]);

  /* ─── Timer countdown ─── */
  useEffect(() => {
    if (!isRunning || timeLeft <= 0 || !step) return;
    const isRepBased = step.we.holdSeconds == null;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (isRepBased) {
            // Count this rep
            setRepCount((prev) => {
              const newCount = prev + 1;
              if (newCount >= step.totalReps) {
                // All reps done for this step, advance
                advance();
                return newCount;
              }
              // Beep for the rep
              playBeep(600, 100);
              speakCountdown(newCount + 1);
              return newCount;
            });
            // Reset the delay timer for the next rep
            return step.we.repDelay || 5;
          } else {
            advance();
            return 0;
          }
        }
        if (!isRepBased && t <= 6) {
          speakCountdown(t - 1);
          playBeep(400, 80);
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, advance, playBeep, speakCountdown, step]);

  useEffect(() => {
    initTimer();
  }, [stepIndex, initTimer]);

  const goToNextStep = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      setCurrentSide(0);
      setShowReadyScreen(false);
    }
  }, [stepIndex, steps.length]);

  useEffect(() => {
    if (!showReadyScreen) return;
    const timeout = setTimeout(() => {
      goToNextStep();
      setShowingInstructions(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [showReadyScreen, goToNextStep]);

  const startWorkout = () => {
    setIsStarted(true);
    setShowingInstructions(true);
    requestWakeLock();
    initTimer();
  };

  const togglePause = () => setIsRunning((r) => !r);

  const skipForward = () => {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    ttsSpokenForStep.current = -1;
    let next = stepIndex + 1;
    if (step) {
      while (next < steps.length && steps[next].we.exercise.id === step.we.exercise.id) {
        next++;
      }
    }
    if (next < steps.length) {
      setStepIndex(next);
      setCurrentSide(0);
      setIsRunning(false);
      setShowReadyScreen(false);
      setChangingSides(false);
      setSideChangeCountdown(0);
      setShowingInstructions(true);
    } else {
      setIsComplete(true);
      setIsRunning(false);
      releaseWakeLock();
    }
  };

  const skipBackward = () => {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    ttsSpokenForStep.current = -1;
    if (stepIndex === 0) return;
    const curExId = step?.we.exercise.id;
    let first = stepIndex;
    while (first > 0 && steps[first - 1].we.exercise.id === curExId) first--;
    if (first < stepIndex) {
      setStepIndex(first);
    } else {
      let prev = first - 1;
      if (prev >= 0) {
        const prevExId = steps[prev].we.exercise.id;
        while (prev > 0 && steps[prev - 1].we.exercise.id === prevExId) prev--;
        setStepIndex(prev);
      }
    }
    setCurrentSide(0);
    setIsRunning(false);
    setShowReadyScreen(false);
    setChangingSides(false);
    setSideChangeCountdown(0);
    setShowingInstructions(true);
  };

  const manualNext = () => {
    goToNextStep();
    setShowingInstructions(true);
  };

  const restartWorkout = () => {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    ttsSpokenForStep.current = -1;
    setStepIndex(0);
    setCurrentSide(0);
    setRepCount(0);
    setIsComplete(false);
    setIsStarted(false);
    setShowReadyScreen(false);
    setShowingInstructions(false);
    setChangingSides(false);
    setSideChangeCountdown(0);
    setIsRunning(false);
    releaseWakeLock();
  };

  const jumpToExercise = useCallback((exerciseId: string) => {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    ttsSpokenForStep.current = -1;
    const targetIndex = steps.findIndex(s => s.we.exercise.id === exerciseId);
    if (targetIndex >= 0) {
      setStepIndex(targetIndex);
      setCurrentSide(0);
      setRepCount(0);
      setIsRunning(false);
      setShowReadyScreen(false);
      setChangingSides(false);
      setSideChangeCountdown(0);
      setShowExerciseList(false);
      setShowingInstructions(true);
    }
  }, [steps]);

  const uniqueExercises = useMemo(() => {
    const seen = new Set<string>();
    return steps.filter((s) => {
      if (seen.has(s.we.exercise.id)) return false;
      seen.add(s.we.exercise.id);
      return true;
    }).map(s => s.we);
  }, [steps]);

  const uniqueExerciseIds = useMemo(
    () => uniqueExercises.map(we => we.exercise.id),
    [uniqueExercises],
  );

  const currentExIndex = step ? uniqueExerciseIds.indexOf(step.we.exercise.id) : 0;
  const progressPercent = (currentExIndex / uniqueExerciseIds.length) * 100;

  /* ─── Exercise list overlay ─── */
  const exerciseListOverlay = showExerciseList && (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Exercises</h2>
          <button onClick={() => setShowExerciseList(false)} className="p-2 rounded-lg border border-border hover:bg-surface text-lg">
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {uniqueExercises.map((we, idx) => {
            const isCurrent = step?.we.exercise.id === we.exercise.id;
            const isRepBasedEx = we.holdSeconds == null;
            const hasSides = getSides(we).length > 0;
            return (
              <button
                key={we.id}
                onClick={() => jumpToExercise(we.exercise.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${isCurrent ? "border-primary bg-primary/10" : "border-border hover:bg-surface"}`}
              >
                {we.exercise.imageUrl ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-border">
                    <Image src={we.exercise.imageUrl} alt="" width={48} height={48} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-border flex items-center justify-center shrink-0 text-muted text-lg font-bold">
                    {idx + 1}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{we.exercise.name}</div>
                  <div className="flex gap-2 text-xs text-muted mt-1 flex-wrap">
                    <span>{we.reps} rep{we.reps > 1 ? "s" : ""}</span>
                    {isRepBasedEx ? (
                      <span>· {we.repDelay}s/rep</span>
                    ) : (
                      <span>· {we.holdSeconds}s hold</span>
                    )}
                    {hasSides && <span>· {we.sides}</span>}
                  </div>
                </div>
                {isCurrent && <span className="text-xs px-2 py-1 rounded-full bg-primary text-white shrink-0">Current</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ─── Shared nav bar ─── */
  const navBar = (
    <div className="flex items-center justify-center gap-4 mt-6">
      <button onClick={skipBackward} disabled={stepIndex === 0} className="p-3 rounded-full border border-border hover:bg-surface transition-colors text-muted disabled:opacity-30" title="Previous exercise">
        <SkipBack className="w-5 h-5" />
      </button>
      <button onClick={() => setShowExerciseList(true)} className="p-3 rounded-full border border-border hover:bg-surface transition-colors text-muted" title="Exercise list">
        <List className="w-5 h-5" />
      </button>
      <button onClick={skipForward} className="p-3 rounded-full border border-border hover:bg-surface transition-colors text-muted" title="Skip exercise">
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );

  /* ─── PRE-START SCREEN ─── */
  if (!isStarted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold mb-2">{workout.name}</h1>
        <p className="text-muted mb-8">{workout.exercises.length} exercises</p>

        <div className="flex gap-3 mb-8 flex-wrap justify-center">
          <button
            onClick={() => setAutoAdvance(!autoAdvance)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border"
          >
            {autoAdvance ? <ToggleRight className="w-5 h-5 text-accent" /> : <ToggleLeft className="w-5 h-5 text-muted" />}
            Auto-advance: {autoAdvance ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-accent" /> : <VolumeX className="w-5 h-5 text-muted" />}
            Sound: {soundEnabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border"
          >
            <Speech className={`w-5 h-5 ${ttsEnabled ? "text-accent" : "text-muted"}`} />
            Voice: {ttsEnabled ? "ON" : "OFF"}
          </button>
        </div>

        <button
          onClick={startWorkout}
          className="bg-primary text-white px-10 py-4 rounded-2xl text-xl font-semibold hover:bg-primary-dark transition-colors flex items-center gap-3"
        >
          <Play className="w-7 h-7" fill="currentColor" />
          Start Workout
        </button>

        <Link
          href={`/workout/${workout.id}`}
          className="mt-6 text-muted hover:text-foreground text-sm flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to overview
        </Link>
      </div>
    );
  }

  /* ─── COMPLETION SCREEN ─── */
  if (isComplete) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
        <p className="text-muted mb-8">Great job finishing {workout.name}!</p>
        <div className="flex gap-4">
          <button onClick={restartWorkout} className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors">
            Do it again
          </button>
          <Link href={`/workout/${workout.id}`} className="px-6 py-3 rounded-lg border border-border hover:bg-surface transition-colors">
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  /* ─── READY SCREEN ─── */
  if (showReadyScreen) {
    const next = steps[stepIndex + 1];
    return (
      <>
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <p className="text-muted text-sm mb-2">Next up</p>
        <h2 className="text-2xl font-bold mb-4">{next?.we.exercise.name}</h2>
        {next?.supersetLabel && (
          <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent mb-3">
            Superset {next.supersetLabel}
          </span>
        )}
        {next?.we.exercise.imageUrl && (
          <div className="w-48 h-48 rounded-xl overflow-hidden mb-4 bg-border">
            <Image src={next.we.exercise.imageUrl} alt={next.we.exercise.name} width={192} height={192} className="w-full h-full object-contain" />
          </div>
        )}
        <p className="text-muted animate-pulse">Starting in 3 seconds...</p>
        {navBar}
      </div>
      {exerciseListOverlay}
      </>
    );
  }

  /* ─── CHANGING SIDES SCREEN ─── */
  if (changingSides && step) {
    const sides = getSides(step.we);
    const nextSideName = sides[currentSide] || "";
    return (
      <>
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <p className="text-muted text-sm mb-2">Get ready</p>
        <h2 className="text-2xl font-bold mb-4">Change to {nextSideName}</h2>
        {step.we.exercise.imageUrl && (
          <div className="w-48 h-48 rounded-xl overflow-hidden mb-4 bg-border">
            <Image src={step.we.exercise.imageUrl} alt={step.we.exercise.name} width={192} height={192} className="w-full h-full object-contain" />
          </div>
        )}
        <div className="text-5xl font-bold text-primary mb-4">{sideChangeCountdown}</div>
        <p className="text-muted animate-pulse">Switching sides...</p>
        {navBar}
      </div>
      {exerciseListOverlay}
      </>
    );
  }

  /* ─── INSTRUCTION SCREEN ─── */
  if (showingInstructions && step) {
    const isSuperset = step.supersetLabel != null;
    const showFullInstructions = !isSuperset || step.rep === 1;

    return (
      <>
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-muted text-sm mb-2">
          Exercise {(step ? uniqueExerciseIds.indexOf(step.we.exercise.id) : 0) + 1} of {uniqueExerciseIds.length}
        </p>

        <div className="flex gap-2 mb-3 flex-wrap justify-center">
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">{step.we.exercise.category}</span>
          {step.we.holdSeconds != null
            ? <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-600">{step.we.holdSeconds}s hold</span>
            : <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-600">{step.we.reps} reps · {step.we.repDelay}s each</span>}
          {getSides(step.we).length > 0 && <span className="text-xs px-3 py-1 rounded-full bg-orange-500/10 text-orange-600">{step.we.sides}</span>}
          {step.supersetLabel && <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent">Superset {step.supersetLabel}</span>}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4">{step.we.exercise.name}</h1>

        {step.we.exercise.imageUrl && (
          <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden mb-6 shadow-lg bg-border">
            <Image src={step.we.exercise.imageUrl} alt={step.we.exercise.name} width={288} height={288} className="w-full h-full object-contain" />
          </div>
        )}

        {showFullInstructions && step.we.exercise.instructions && (
          <p className="text-muted text-sm max-w-md mb-4">{step.we.exercise.instructions}</p>
        )}

        {showFullInstructions && step.we.exercise.breathingCue && (
          <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-lg mb-4 text-sm max-w-md">
            <Wind className="w-4 h-4 flex-shrink-0" />
            {step.we.exercise.breathingCue}
          </div>
        )}

        {showFullInstructions && step.we.notes && (
          <p className="text-xs text-muted/70 italic mb-4 max-w-md">Note: {step.we.notes}</p>
        )}

        {!showFullInstructions && (
          <p className="text-muted text-sm mb-4">Rep {step.rep} of {step.totalReps}</p>
        )}

        <div className="flex items-center justify-center gap-4">
          <button onClick={skipBackward} disabled={stepIndex === 0} className="p-3 rounded-full border border-border hover:bg-surface transition-colors text-muted disabled:opacity-30" title="Previous exercise">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={dismissInstructions}
            className="bg-primary text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Start Timer
          </button>
          <button onClick={skipForward} className="p-3 rounded-full border border-border hover:bg-surface transition-colors text-muted" title="Skip exercise">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <button onClick={() => setShowExerciseList(true)} className="mt-3 p-2 rounded-lg border border-border hover:bg-surface transition-colors text-muted text-sm flex items-center gap-1 mx-auto" title="Exercise list">
          <List className="w-4 h-4" /> All exercises
        </button>

        {ttsEnabled && (
          <p className="text-muted text-xs mt-3 animate-pulse">Listening to instructions... will auto-start when done</p>
        )}
      </div>
      {exerciseListOverlay}
      </>
    );
  }

  if (!step) return null;

  const sides = getSides(step.we);
  const currentSideName = sides[currentSide] || null;
  const isRepBased = step.we.holdSeconds == null;
  const timerMax = isRepBased ? (step.we.repDelay || 5) : step.we.holdSeconds!;

  /* ─── ACTIVE WORKOUT SCREEN ─── */
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-border rounded-full h-2 mb-4">
        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">Exercise {currentExIndex + 1} of {uniqueExerciseIds.length}</span>
        <div className="flex gap-2">
          <button onClick={() => setTtsEnabled(!ttsEnabled)} className="p-2 rounded-lg border border-border hover:bg-surface" title={`Voice: ${ttsEnabled ? "ON" : "OFF"}`}>
            <Speech className={`w-4 h-4 ${ttsEnabled ? "text-accent" : "text-muted"}`} />
          </button>
          <button onClick={() => setAutoAdvance(!autoAdvance)} className="p-2 rounded-lg border border-border hover:bg-surface" title={`Auto-advance: ${autoAdvance ? "ON" : "OFF"}`}>
            {autoAdvance ? <ToggleRight className="w-4 h-4 text-accent" /> : <ToggleLeft className="w-4 h-4 text-muted" />}
          </button>
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-lg border border-border hover:bg-surface" title={`Sound: ${soundEnabled ? "ON" : "OFF"}`}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted" />}
          </button>
        </div>
      </div>

      {/* Exercise content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="flex gap-2 mb-3 flex-wrap justify-center">
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">{step.we.exercise.category}</span>
          {isRepBased
            ? <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-600">{step.we.reps} reps · {step.we.repDelay}s each</span>
            : <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-600">{step.we.holdSeconds}s hold</span>}
          {sides.length > 0 && <span className="text-xs px-3 py-1 rounded-full bg-orange-500/10 text-orange-600">{step.we.sides}</span>}
          {step.supersetLabel && <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent">Superset {step.supersetLabel}</span>}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4">{step.we.exercise.name}</h1>

        {step.we.exercise.imageUrl && (
          <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden mb-6 shadow-lg bg-border">
            <Image src={step.we.exercise.imageUrl} alt={step.we.exercise.name} width={288} height={288} className="w-full h-full object-contain" />
          </div>
        )}

        {currentSideName && <div className="text-lg font-semibold text-primary mb-2">{currentSideName}</div>}

        {/* Timer circle */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6"
              className={isRepBased ? "text-accent" : "text-primary"}
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={isRepBased
                ? `${2 * Math.PI * 54 * (1 - repCount / step.totalReps)}`
                : `${2 * Math.PI * 54 * (1 - timeLeft / timerMax)}`}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isRepBased ? (
              <>
                <span className="text-3xl sm:text-4xl font-bold font-mono">{repCount}</span>
                <span className="text-xs text-muted">of {step.totalReps} reps</span>
              </>
            ) : (
              <>
                <span className="text-3xl sm:text-4xl font-bold font-mono">{timeLeft}</span>
                <span className="text-xs text-muted">seconds</span>
              </>
            )}
          </div>
        </div>

        <div className="text-sm text-muted mb-4">
          Rep {step.rep} of {step.totalReps}
          {step.we.holdSeconds && <span> · {step.we.holdSeconds}s hold</span>}
          {isRepBased && <span> · {timeLeft}s to next</span>}
        </div>

        {step.we.exercise.breathingCue && (
          <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-lg mb-4 text-sm max-w-md">
            <Wind className="w-4 h-4 flex-shrink-0" />
            {step.we.exercise.breathingCue}
          </div>
        )}

        <p className="text-muted text-sm max-w-md mb-6">{step.we.exercise.instructions}</p>

        {step.we.notes && <p className="text-xs text-muted/70 italic mb-4 max-w-md">Note: {step.we.notes}</p>}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4">
        <button onClick={skipBackward} disabled={stepIndex === 0} className="p-3 rounded-full border border-border hover:bg-surface transition-colors text-muted disabled:opacity-30" title="Previous exercise">
          <SkipBack className="w-5 h-5" />
        </button>
        <button onClick={() => setShowExerciseList(true)} className="p-3 rounded-full border border-border hover:bg-surface transition-colors text-muted" title="Exercise list">
          <List className="w-5 h-5" />
        </button>
        <button onClick={togglePause} className="bg-primary text-white p-4 rounded-full hover:bg-primary-dark transition-colors">
          {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" fill="currentColor" />}
        </button>
        {!autoAdvance && !isRunning && timeLeft === 0 && (
          <button onClick={manualNext} className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/80 transition-colors flex items-center gap-2">
            Next <SkipForward className="w-5 h-5" />
          </button>
        )}
        <button onClick={skipForward} className="p-3 rounded-full border border-border hover:bg-surface transition-colors text-muted" title="Skip exercise">
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
      {exerciseListOverlay}
    </div>
  );
}
