import { apiGet } from "./api/client";

// Malaysian food calorie reference. Lives in the reference/foods Firestore
// doc (seeded by the backend's `npm run seed:foods`), served by the API,
// and cached in memory here - one fetch per session, on first open of the
// reference panel.

export interface FoodItem {
  name: string;
  calories: number;
}

export interface FoodCategory {
  name: string;
  items: FoodItem[];
}

export interface FoodReferenceData {
  disclaimer: string;
  categories: FoodCategory[];
}

let cache: FoodReferenceData | null = null;

export async function getFoodReference(): Promise<FoodReferenceData> {
  if (!cache) {
    cache = await apiGet<FoodReferenceData>("/v1/reference/foods");
  }
  return cache;
}
