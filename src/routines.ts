import { WorkoutName } from "./types";

// Exercise routines from the client's "Blueprint_Workout routine_V01.xlsx".
// Display-only reference: the app tracks completion + self-reported burn per
// workout slot, never per exercise. Keyed by location (UI toggle, not
// persisted) and the coach-set weekly frequency.

export type RoutineLocation = "gym" | "home";

export interface Routine {
  warmup: string[];
  workout: string[];
  finisher: string[]; // optional finishers; pick one
}

export const ROUTINES: Record<RoutineLocation, Record<2 | 3, Partial<Record<WorkoutName, Routine>>>> = {
  gym: {
    2: {
      "Lower Body": {
        warmup: [
          "BW Squats: 2 sets x 12 reps",
          "Hip Opener: 2 sets x 30 secs each side",
          "Banded Hip-Bridge: 2 sets x 15 reps"
        ],
        workout: [
          "Barbell-Back Squats / Dumbbell Squats Variety / Goblet Squat: 4 sets x 12 reps",
          "Walking Lunges / Step-Back Lunges / Bulgarian Lunges: 3 sets x 12 reps each side",
          "Lying / Seated Leg Curls: 3 sets x 15 reps",
          "RDL (Romanian Deadlifts) with Barbell / Dumbbell: 3 sets x 12 reps"
        ],
        finisher: [
          "Forearm Planks: 2 sets x 40 secs",
          "Lying Knee / Leg Raises: 2 sets x 15 reps"
        ]
      },
      "Upper Body": {
        warmup: [
          "Slow Arm Circles: 2 sets x 15 reps each side",
          "Banded Pull-Aparts: 2 sets x 15 reps",
          "Glute Bridge: 2 sets x 10 reps"
        ],
        workout: [
          "Assisted Pull Ups: 3 sets x 12 reps",
          "Neutral Grip Single Arm Rows: 2 sets x 12 reps",
          "Bent-over Barbell / Dumbbell / Smith Machine Rows: 2 sets x 12 reps",
          "Barbell / Dumbbell Bench Press: 2 sets x 12 reps",
          "Machine / Cable Chest Flyers: 3 sets x 12 reps",
          "Assisted Parallel Bar Dips: 2 sets x 10 reps"
        ],
        finisher: [
          "Sit Ups: 2 sets x 15 reps",
          "Forearm Planks: 2 sets x 40 secs"
        ]
      }
    },
    3: {
      "Lower Body": {
        warmup: [
          "BW Squats: 2 sets x 12 reps",
          "Hip Opener: 2 sets x 30 secs each side",
          "Banded Hip-Bridge: 2 sets x 15 reps"
        ],
        workout: [
          "Heavy Leg Press: 3 sets x 12 reps",
          "Barbell Squats / Machine Hack Squats: 3 sets x 12 reps",
          "Lying / Seated Leg Curls: 3 sets x 12 reps",
          "Seated Leg Extension: 2 sets x 15 reps"
        ],
        finisher: [
          "Lying Knee or Leg Raises: 2 sets x 15 reps",
          "Forearm Planks: 3 sets x 40 secs"
        ]
      },
      "Upper Body Push": {
        warmup: [
          "Slow Arm Circles: 2 sets x 15 reps each side",
          "Banded Pull-Aparts: 2 sets x 15 reps",
          "Glute Bridge: 2 sets x 10 reps"
        ],
        workout: [
          "Flat Bench Press (Smith Machine / Barbell / Dumbbells): 4 sets x 12 reps",
          "Inclined Press (Smith Machine / Barbell / Dumbbells): 2 sets x 15 reps",
          "Parallel Bar Dips (Assisted / BW): 3 sets x 12 reps",
          "Lateral Raises (Dumbbells / Machine): 3 sets x 15 reps",
          "Tricep Cable Rope Press (alternative: V-bar / Dumbbell overhead press): 2 sets x 15 reps"
        ],
        finisher: [
          "Sit Ups: 3 sets x 15 reps",
          "Cable Rope Crunches: 3 sets x AMAP (As Many As Possible)"
        ]
      },
      "Upper Body Pull": {
        warmup: [
          "Scapular Pulls: 2 sets x 10 reps",
          "Slow Arm Circles: 2 sets x 15 reps each side",
          "Banded Pull-Aparts: 2 sets x 15 reps"
        ],
        workout: [
          "Neutral Grip Single Arm Rows: 3 sets x 12 reps",
          "Bent-over Barbell / Dumbbell / Smith Machine Rows: 2 sets x 12 reps",
          "Single Arm Dumbbell Rows: 2 sets x 12 reps",
          "Assisted Pull Ups (alternative: BW): 2 sets x 12 reps",
          "Machine / Dumbbell Lateral Raises: 2 sets x 12 reps",
          "Machine / Dumbbell Rear Delts Raises: 2 sets x 15 reps"
        ],
        finisher: [
          "Hanging Leg Raises: 3 sets x 15 reps",
          "Lying Leg Raises / Knee Raises: 3 sets x 15 reps"
        ]
      }
    }
  },
  home: {
    2: {
      "Lower Body": {
        warmup: [
          "Body Weight Squats: 2 sets x 12 reps",
          "Hip Opener: 2 sets x 30 secs each side",
          "Banded Hip-Bridge: 2 sets x 15 reps"
        ],
        workout: [
          "Body Weight Squats (with or without added resistance): 4 sets x 20 reps",
          "Body Weight Step-Back Lunges (with or without resistance): 4 sets x 15 reps each side",
          "Body Weight Single-leg Deadlifts (with or without resistance): 4 sets x 20 reps each side",
          "Body Weight Reverse-hyper (with or without resistance): 4 sets x 20 reps"
        ],
        finisher: [
          "Forearm Planks: 2 sets x 40 secs",
          "Lying Knee / Leg Raises: 2 sets x 15 reps"
        ]
      },
      // The source xlsx repeated the gym exercises here by mistake; this is
      // a home-equipment substitute built from the Home 3-day push/pull days
      // - pending the trainer's confirmation.
      "Upper Body": {
        warmup: [
          "Slow Arm Circles: 2 sets x 15 reps each side",
          "Banded Pull-Aparts: 2 sets x 15 reps",
          "Glute Bridge: 2 sets x 10 reps"
        ],
        workout: [
          "Floor Push Ups: 4 sets x 12 reps",
          "Bent Over Dumbbell / Barbell Rows: 4 sets x 12 reps",
          "Pike Push Ups / Dumbbell Overhead Press: 3 sets x 10 reps",
          "Banded Face Pulls: 3 sets x 12 reps",
          "Renegade Rows: 2 sets x 12 reps",
          "Mountain Climbers: 3 sets x 15 reps each side"
        ],
        finisher: [
          "Sit Ups: 2 sets x 15 reps",
          "Forearm Planks: 2 sets x 40 secs"
        ]
      }
    },
    3: {
      "Lower Body": {
        warmup: [
          "Body Weight Squats: 2 sets x 12 reps",
          "Hip Opener: 2 sets x 30 secs each side",
          "Banded Hip-Bridge: 2 sets x 15 reps"
        ],
        workout: [
          "Body Weight Squats (with or without resistance): 4 sets x 15 reps",
          "Body Weight Lunges / Step-Forward or Step-Back Lunges (with or without resistance): 3 sets x 12 reps each side",
          "Glute Bridge (with or without resistance): 3 sets x 15 reps",
          "Bench / Chair Step-Ups: 3 sets x 15 reps each side",
          "Forearm Planks: 3 sets x 40 secs"
        ],
        finisher: [
          "Lying Knee or Leg Raises: 2 sets x 15 reps",
          "Floor Crunches: 3 sets x 20 reps"
        ]
      },
      "Upper Body Push": {
        warmup: [
          "Slow Arm Circles: 2 sets x 15 reps each side",
          "Banded Pull-Aparts: 2 sets x 15 reps",
          "Glute Bridge: 2 sets x 10 reps"
        ],
        workout: [
          "Floor Push Ups: 4 sets x 15 reps",
          "Slow Burpees: 4 sets x 12 reps",
          "Alternating Staggering Push Ups: 3 sets x 6 reps each side",
          "Mountain Climbers: 4 sets x 15 reps each side",
          "Floor Crunches: 4 sets x 15 reps"
        ],
        finisher: []
      },
      "Upper Body Pull": {
        warmup: [
          "Slow Arm Circles: 2 sets x 15 reps each side",
          "Banded Pull-Aparts: 2 sets x 15 reps",
          "Shoulder Scapular Retraction: 2 sets x 10 reps"
        ],
        workout: [
          "Bent Over Dumbbell / Barbell Rows: 4 sets x 12 reps",
          "Banded Face Pulls: 4 sets x 12 reps",
          "Renegade Rows: 2 sets x 12 reps",
          "Dumbbell Shrugs: 4 sets x 12 reps",
          "Forearm Planks: 3 sets x 40 secs"
        ],
        finisher: [
          "Aussie Rows: 3 sets x 10 reps",
          "Dumbbell Bicep Curls: 2 sets x 12 reps"
        ]
      }
    }
  }
};
