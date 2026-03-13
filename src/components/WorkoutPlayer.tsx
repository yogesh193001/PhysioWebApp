"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  SkipForward,
  ArrowLeft,
  Volume2,
  VolumeX,
  ToggleLeft,
  ToggleRight,
  Wind,
} from "lucide-react";

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
  sides: string | null;
  notes: string | null;
  exercise: Exercise;
};

type WorkoutData = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
};

export default function WorkoutPlayer({ workout }: { workout: WorkoutData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRep, setCurrentRep] = useState(1);
  const [currentSide, setCurrentSide] = useState(0); // 0 = first side, 1 = second side
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showReadyScreen, setShowReadyScreen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentExercise = workout.exercises[currentIndex];
  const totalExercises = workout.exercises.length;

  const getSides = useCallback((we: WorkoutExercise): string[] => {
    if (!we.sides) return [];
    if (we.sides.includes("each side")) return ["Left Side", "Right Side"];
    if (we.sides.includes("forwards then backwards"))
      return ["Forwards", "Backwards"];
    if (we.sides.includes("back & front"))
      return we.sides.split(", ").map((s) => s.trim());
    return [];
  }, []);

  const getHoldTime = useCallback((we: WorkoutExercise): number => {
    return we.holdSeconds || 3; // default 3s for exercises without hold
  }, []);

  const playBeep = useCallback(
    (frequency: number = 800, duration: number = 200) => {
      if (!soundEnabled) return;
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + duration / 1000);
      } catch {
        // Audio not supported
      }
    },
    [soundEnabled],
  );

  const playCompletionSound = useCallback(() => {
    playBeep(1000, 150);
    setTimeout(() => playBeep(1200, 150), 200);
    setTimeout(() => playBeep(1500, 300), 400);
  }, [playBeep]);

  // Initialize timer for current state
  const initTimer = useCallback(() => {
    if (!currentExercise) return;
    setTimeLeft(getHoldTime(currentExercise));
  }, [currentExercise, getHoldTime]);

  // Move to next rep/side/exercise
  const advance = useCallback(() => {
    if (!currentExercise) return;

    const sides = getSides(currentExercise);
    const hasSides = sides.length > 0;
    const totalReps = currentExercise.reps;

    // If we have sides and we're on the first side, go to second side
    if (hasSides && currentSide < sides.length - 1) {
      setCurrentSide((s) => s + 1);
      setTimeLeft(getHoldTime(currentExercise));
      playBeep(600, 100);
      return;
    }

    // If we have more reps, go to next rep (reset side)
    if (currentRep < totalReps) {
      setCurrentRep((r) => r + 1);
      setCurrentSide(0);
      setTimeLeft(getHoldTime(currentExercise));
      playBeep(600, 100);
      return;
    }

    // Exercise done - play completion sound
    playCompletionSound();

    // Move to next exercise
    if (currentIndex < totalExercises - 1) {
      if (autoAdvance) {
        setShowReadyScreen(true);
        setIsRunning(false);
      } else {
        setIsRunning(false);
      }
    } else {
      // Workout complete
      setIsComplete(true);
      setIsRunning(false);
    }
  }, [
    currentExercise,
    currentSide,
    currentRep,
    currentIndex,
    totalExercises,
    autoAdvance,
    getSides,
    getHoldTime,
    playBeep,
    playCompletionSound,
  ]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          advance();
          return 0;
        }
        if (t <= 4) playBeep(400, 80);
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, advance, playBeep]);

  const goToNextExercise = useCallback(() => {
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex((i) => i + 1);
      setCurrentRep(1);
      setCurrentSide(0);
      setShowReadyScreen(false);
    }
  }, [currentIndex, totalExercises]);

  // Init timer when exercise changes
  useEffect(() => {
    initTimer();
  }, [currentIndex, initTimer]);

  // Auto start after ready screen
  useEffect(() => {
    if (showReadyScreen) {
      const timeout = setTimeout(() => {
        goToNextExercise();
        setIsRunning(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showReadyScreen, goToNextExercise]);

  const startWorkout = () => {
    setIsStarted(true);
    setIsRunning(true);
    initTimer();
  };

  const togglePause = () => {
    setIsRunning((r) => !r);
  };

  const skipExercise = () => {
    if (currentIndex < totalExercises - 1) {
      goToNextExercise();
      setIsRunning(true);
    } else {
      setIsComplete(true);
      setIsRunning(false);
    }
  };

  const manualNext = () => {
    goToNextExercise();
    setIsRunning(true);
  };

  const restartWorkout = () => {
    setCurrentIndex(0);
    setCurrentRep(1);
    setCurrentSide(0);
    setIsComplete(false);
    setIsStarted(false);
    setShowReadyScreen(false);
    setIsRunning(false);
  };

  const progressPercent = (currentIndex / totalExercises) * 100;

  // Pre-start screen
  if (!isStarted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold mb-2">{workout.name}</h1>
        <p className="text-muted mb-8">{totalExercises} exercises</p>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setAutoAdvance(!autoAdvance)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border"
          >
            {autoAdvance ? (
              <ToggleRight className="w-5 h-5 text-accent" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-muted" />
            )}
            Auto-advance: {autoAdvance ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-accent" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted" />
            )}
            Sound: {soundEnabled ? "ON" : "OFF"}
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

  // Completion screen
  if (isComplete) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-2">Workout Complete!</h1>
        <p className="text-muted mb-8">Great job finishing {workout.name}!</p>
        <div className="flex gap-4">
          <button
            onClick={restartWorkout}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Do it again
          </button>
          <Link
            href={`/workout/${workout.id}`}
            className="px-6 py-3 rounded-lg border border-border hover:bg-surface transition-colors"
          >
            Back to overview
          </Link>
        </div>
      </div>
    );
  }

  // Ready screen between exercises
  if (showReadyScreen) {
    const next = workout.exercises[currentIndex + 1];
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
        <p className="text-muted text-sm mb-2">Next up</p>
        <h2 className="text-2xl font-bold mb-4">{next?.exercise.name}</h2>
        {next?.exercise.imageUrl && (
          <div className="w-48 h-48 rounded-xl overflow-hidden mb-4">
            <Image
              src={next.exercise.imageUrl}
              alt={next.exercise.name}
              width={192}
              height={192}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="text-muted animate-pulse">Starting in 3 seconds...</p>
      </div>
    );
  }

  if (!currentExercise) return null;

  const sides = getSides(currentExercise);
  const currentSideName = sides[currentSide] || null;

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-border rounded-full h-2 mb-4">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header controls */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted">
          Exercise {currentIndex + 1} of {totalExercises}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoAdvance(!autoAdvance)}
            className="p-2 rounded-lg border border-border hover:bg-surface text-sm flex items-center gap-1"
            title={`Auto-advance: ${autoAdvance ? "ON" : "OFF"}`}
          >
            {autoAdvance ? (
              <ToggleRight className="w-4 h-4 text-accent" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-muted" />
            )}
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg border border-border hover:bg-surface"
            title={`Sound: ${soundEnabled ? "ON" : "OFF"}`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Exercise content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Category badge */}
        <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
          {currentExercise.exercise.category}
        </span>

        {/* Exercise name */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">
          {currentExercise.exercise.name}
        </h1>

        {/* Image */}
        {currentExercise.exercise.imageUrl && (
          <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden mb-6 shadow-lg">
            <Image
              src={currentExercise.exercise.imageUrl}
              alt={currentExercise.exercise.name}
              width={288}
              height={288}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Side indicator */}
        {currentSideName && (
          <div className="text-lg font-semibold text-primary mb-2">
            {currentSideName}
          </div>
        )}

        {/* Timer circle */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-border"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-primary"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${
                2 * Math.PI * 54 * (1 - timeLeft / getHoldTime(currentExercise))
              }`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-bold font-mono">
              {timeLeft}
            </span>
            <span className="text-xs text-muted">seconds</span>
          </div>
        </div>

        {/* Rep counter */}
        <div className="text-sm text-muted mb-4">
          Rep {currentRep} of {currentExercise.reps}
          {currentExercise.holdSeconds && (
            <span> · {currentExercise.holdSeconds}s hold</span>
          )}
        </div>

        {/* Breathing cue */}
        {currentExercise.exercise.breathingCue && (
          <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-lg mb-4 text-sm max-w-md">
            <Wind className="w-4 h-4 flex-shrink-0" />
            {currentExercise.exercise.breathingCue}
          </div>
        )}

        {/* Instructions */}
        <p className="text-muted text-sm max-w-md mb-6">
          {currentExercise.exercise.instructions}
        </p>

        {/* Notes */}
        {currentExercise.notes && (
          <p className="text-xs text-muted/70 italic mb-4 max-w-md">
            Note: {currentExercise.notes}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4">
        <button
          onClick={togglePause}
          className="bg-primary text-white p-4 rounded-full hover:bg-primary-dark transition-colors"
        >
          {isRunning ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8" fill="currentColor" />
          )}
        </button>

        {/* Manual next button when auto-advance is off and exercise is done */}
        {!autoAdvance && !isRunning && timeLeft === 0 && (
          <button
            onClick={manualNext}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/80 transition-colors flex items-center gap-2"
          >
            Next <SkipForward className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={skipExercise}
          className="p-3 rounded-full border border-border hover:bg-surface transition-colors text-muted"
          title="Skip exercise"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
