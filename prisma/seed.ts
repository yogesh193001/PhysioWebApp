import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  {
    name: "Deltoid stretch",
    category: "Upper Body",
    instructions:
      "Stand or sit upright. Bring one arm across your body at shoulder height. Use the opposite hand to gently press the arm closer to your chest. Hold the stretch, then switch sides.",
    breathingCue: null,
    imageUrl: "/images/Deltoid stretch.jpeg",
    reps: 3,
    holdSeconds: 20,
    sides: "each side",
    notes: null,
  },
  {
    name: "Triceps stretch",
    category: "Upper Body",
    instructions:
      "Raise one arm overhead and bend the elbow so your hand reaches toward the opposite shoulder blade. Use the other hand to gently push the elbow back. Hold, then switch sides.",
    breathingCue: null,
    imageUrl: "/images/Triceps stretch.jpeg",
    reps: 3,
    holdSeconds: 20,
    sides: "each side",
    notes: null,
  },
  {
    name: "Pectoralis stretch",
    category: "Upper Body",
    instructions:
      "Stand in a doorway or next to a wall. Place your forearm against the wall with your elbow at shoulder height. Gently rotate your body away from the wall to feel the stretch across your chest. Hold, then switch sides.",
    breathingCue: null,
    imageUrl: "/images/Pectoralis stretch.jpeg",
    reps: 3,
    holdSeconds: 20,
    sides: "each side",
    notes: null,
  },
  {
    name: "Shoulder wire",
    category: "Upper Body",
    instructions:
      "Using a stick or towel held with both hands, perform shoulder passes: move the stick from front to back overhead, then diagonal passes, then reverse. 3 reps for each pattern.",
    breathingCue: null,
    imageUrl: "/images/Shoulder wire.jpeg",
    reps: 3,
    holdSeconds: null,
    sides: "back & front, diagonal & reverse, back & front",
    notes: "3 reps back & front, 3 reps diagonal & reverse, 3 reps back & front",
  },
  {
    name: "Anterior forearm stretch",
    category: "Upper Body",
    instructions:
      "Extend your arm in front with the palm facing up. Use the other hand to gently pull the fingers downward toward the floor. Hold the stretch.",
    breathingCue: null,
    imageUrl: "/images/Anterior forearm stretch.jpeg",
    reps: 5,
    holdSeconds: 10,
    sides: null,
    notes: null,
  },
  {
    name: "Posterior forearm stretch",
    category: "Upper Body",
    instructions:
      "Extend your arm in front with the palm facing down. Use the other hand to gently pull the fingers back toward your body. Hold the stretch.",
    breathingCue: null,
    imageUrl: "/images/Posterior forearm stretch.jpeg",
    reps: 3,
    holdSeconds: 10,
    sides: null,
    notes: null,
  },
  {
    name: "Carpal tunnel stretch",
    category: "Upper Body",
    instructions:
      "Press your palms together in a prayer position in front of your chest. Slowly lower your hands while keeping palms pressed together until you feel a stretch in your wrists and forearms. Hold.",
    breathingCue: null,
    imageUrl: "/images/Carpal tunnel stretch.jpeg",
    reps: 5,
    holdSeconds: 10,
    sides: null,
    notes: null,
  },
  {
    name: "Neck flexion and extension",
    category: "Neck",
    instructions:
      "Sit or stand with good posture. Slowly tilt your head forward bringing your chin toward your chest (flexion), then slowly tilt your head back looking up toward the ceiling (extension). Move smoothly through the full range.",
    breathingCue: "Breathe in going up and breathe out coming down",
    imageUrl: "/images/Neck flexion and extension.jpeg",
    reps: 5,
    holdSeconds: null,
    sides: null,
    notes: null,
  },
  {
    name: "Neck rotation",
    category: "Neck",
    instructions:
      "Sit or stand with good posture. Slowly turn your head to look over one shoulder, then return to center and turn to the other side. Keep movements smooth and controlled.",
    breathingCue: "Breathe in going to the side and breathe out coming to the middle",
    imageUrl: "/images/Neck rotation.jpeg",
    reps: 5,
    holdSeconds: null,
    sides: null,
    notes: null,
  },
  {
    name: "Neck side flexion",
    category: "Neck",
    instructions:
      "Sit or stand with good posture. Slowly tilt your head to one side, bringing your ear toward your shoulder. Return to center and repeat on the other side. Do not raise your shoulder.",
    breathingCue: "Breathe out coming to the side and breathe in going back up",
    imageUrl: "/images/Neck side flexion.jpeg",
    reps: 5,
    holdSeconds: null,
    sides: null,
    notes: null,
  },
  {
    name: "Neck circumduction",
    category: "Neck",
    instructions:
      "Slowly roll your head in a circle, moving through flexion, side flexion, extension, and back. Complete one full circle then reverse direction. One full circle each way equals one rep.",
    breathingCue:
      "Breathe in going to the back and breathe out coming to the other side. Reverse to complete one rep.",
    imageUrl: "/images/Neck circumduction.jpeg",
    reps: 3,
    holdSeconds: null,
    sides: null,
    notes: null,
  },
  {
    name: "Shoulder rolls",
    category: "Neck",
    instructions:
      "Stand with arms relaxed at your sides. Roll your shoulders forward in a circular motion for 5 reps, then reverse and roll backwards for 5 reps.",
    breathingCue: "Breathe in going up and breathe out coming down",
    imageUrl: "/images/Shoulder rolls.jpeg",
    reps: 5,
    holdSeconds: null,
    sides: "forwards then backwards",
    notes: "5 reps consecutively forwards then backwards",
  },
  {
    name: "Femoral nerve stretch",
    category: "Back",
    instructions:
      "Lie on your back. Bend one knee and bring it toward your chest, holding it with both hands. Keep the other leg straight on the ground. Hold the stretch, then switch sides.",
    breathingCue: null,
    imageUrl: "/images/Femoral nerve stretch.jpeg",
    reps: 3,
    holdSeconds: 20,
    sides: "each side",
    notes: null,
  },
  {
    name: "Sciatic nerve stretch",
    category: "Back",
    instructions:
      "Lie on your back with both knees bent. Cross one ankle over the opposite knee. Pull the uncrossed leg toward your chest until you feel a stretch in your buttock/hip. Hold, then switch sides.",
    breathingCue: null,
    imageUrl: "/images/Sciatic nerve stretch.jpeg",
    reps: 3,
    holdSeconds: 10,
    sides: "each side",
    notes: null,
  },
  {
    name: "Lumbar rotational stretch",
    category: "Back",
    instructions:
      "Lie on your back with knees bent and feet flat. Keeping your shoulders on the ground, slowly let both knees fall to one side. Hold the stretch, then return to center and repeat on the other side.",
    breathingCue: null,
    imageUrl: "/images/Lumbar rotational stretch.jpeg",
    reps: 3,
    holdSeconds: 20,
    sides: "each side",
    notes: null,
  },
  {
    name: "McKenzie back extension",
    category: "Back",
    instructions:
      "Lie face down with hands placed under your shoulders. Slowly push your upper body up while keeping your hips on the ground, extending your lower back. Hold at the top, then slowly lower back down.",
    breathingCue: null,
    imageUrl: "/images/Mckenzie back extension.jpeg",
    reps: 10,
    holdSeconds: 10,
    sides: null,
    notes: "Superset: alternate with Child Pose each rep",
    supersetGroupId: 1,
  },
  {
    name: "Child pose",
    category: "Back",
    instructions:
      "Kneel on the floor and sit back onto your heels. Stretch your arms forward on the ground and lower your forehead to the floor. Relax into the stretch and breathe deeply.",
    breathingCue: null,
    imageUrl: "/images/Child pose.jpeg",
    reps: 10,
    holdSeconds: 20,
    sides: null,
    notes: "Superset: alternate with McKenzie each rep",
    supersetGroupId: 1,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.workoutExercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.exercise.deleteMany();

  // Create exercises
  const createdExercises = [];
  for (const ex of exercises) {
    const created = await prisma.exercise.create({
      data: {
        name: ex.name,
        category: ex.category,
        instructions: ex.instructions,
        breathingCue: ex.breathingCue,
        imageUrl: ex.imageUrl,
        defaultReps: ex.reps,
        defaultHoldSecs: ex.holdSeconds,
        defaultRepDelay: 5,
        defaultSides: ex.sides,
      },
    });
    createdExercises.push({ ...created, ...ex });
  }

  // Create the default workout
  const workout = await prisma.workout.create({
    data: {
      name: "Full Physio Routine",
      description:
        "Complete physiotherapy routine covering upper body stretches, neck exercises, and back exercises.",
    },
  });

  // Add exercises to workout in order
  for (let i = 0; i < createdExercises.length; i++) {
    const ex = createdExercises[i];
    await prisma.workoutExercise.create({
      data: {
        workoutId: workout.id,
        exerciseId: ex.id,
        orderIndex: i,
        reps: ex.reps,
        holdSeconds: ex.holdSeconds,
        sides: ex.sides,
        notes: ex.notes,
        supersetGroupId: (ex as any).supersetGroupId ?? null,
      },
    });
  }

  console.log(
    `✅ Seeded ${createdExercises.length} exercises and 1 workout ("${workout.name}")`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
