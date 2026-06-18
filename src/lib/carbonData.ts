/**
 * @module lib/carbonData
 * @description Core carbon emission factors, constants, and calculation utilities.
 *
 * Problem Statement Alignment:
 * - **Track**: Provides India-specific CO2 emission factors across 4 categories
 *   (Transport, Food, Energy, Shopping) used by the /track page to quantify
 *   every user activity in kg CO2.
 * - **Simple actions**: The `calculateCO2()` function enables one-tap logging
 *   by instantly computing the carbon impact of any activity + quantity pair.
 * - **Understand**: Constants like `INDIA_DAILY_AVERAGE` (11.2 kg) and
 *   `GLOBAL_DAILY_AVERAGE` (15.1 kg) power the comparison bars on /insights.
 * - **Reduce**: `TARGET_DAILY` (5.0 kg) sets the Paris-aligned sustainable
 *   target displayed on the Carbon Gauge and used for challenge difficulty.
 * - **Personalized insights**: Category metadata drives Gemini prompt context.
 */

/** Configuration shape for a single category's emission factors. */
export interface CarbonFactorConfig {
  [category: string]: {
    [activityType: string]: {
      factor: number;
      unit: string;
      label: string;
    };
  };
}

export const CARBON_FACTORS: CarbonFactorConfig = {
  Transport: {
    car_petrol: { factor: 0.21, unit: "km", label: "Car (Petrol)" },
    car_diesel: { factor: 0.17, unit: "km", label: "Car (Diesel)" },
    motorcycle: { factor: 0.11, unit: "km", label: "Motorcycle" },
    bus: { factor: 0.089, unit: "km", label: "Bus" },
    train: { factor: 0.041, unit: "km", label: "Train" },
    flight_domestic: { factor: 0.255, unit: "km", label: "Flight (Domestic)" },
    auto_rickshaw: { factor: 0.097, unit: "km", label: "Auto Rickshaw" },
  },
  Food: {
    Seafood_meal: { factor: 6.61, unit: "meals", label: "SeaFood Meal" },
    chicken_meal: { factor: 1.24, unit: "meals", label: "Chicken Meal" },
    vegetarian_meal: { factor: 0.37, unit: "meals", label: "Vegetarian Meal" },
    vegan_meal: { factor: 0.18, unit: "meals", label: "Vegan Meal" },
    dairy: { factor: 0.31, unit: "100ml", label: "Dairy" },
  },
  Energy: {
    electricity: { factor: 0.82, unit: "kWh", label: "Electricity (Grid)" },
    lpg_cooking: { factor: 0.34, unit: "hours", label: "LPG Cooking" },
    ac_usage: { factor: 1.25, unit: "hours", label: "AC Usage" },
    fan_usage: { factor: 0.038, unit: "hours", label: "Fan Usage" },
  },
  Shopping: {
    clothing: { factor: 10.0, unit: "items", label: "New Clothing Item" },
    electronics: { factor: 70.0, unit: "items", label: "Electronics Purchase" },
    delivery: { factor: 0.5, unit: "deliveries", label: "Online Order Delivery" },
    plastic_bag: { factor: 0.033, unit: "bags", label: "Plastic Bag" },
  },
};

export interface Category {
  id: "Transport" | "Food" | "Energy" | "Shopping";
  label: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind class
  hexColor: string; // Hex code for SVG/canvas
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "Transport",
    label: "Transport",
    icon: "Car",
    color: "blue",
    hexColor: "#3b82f6",
    description: "Commuting & travel",
  },
  {
    id: "Food",
    label: "Food",
    icon: "UtensilsCrossed",
    color: "green",
    hexColor: "#22c55e",
    description: "Diet & groceries",
  },
  {
    id: "Energy",
    label: "Energy",
    icon: "Zap",
    color: "amber",
    hexColor: "#f59e0b",
    description: "Home utility usage",
  },
  {
    id: "Shopping",
    label: "Shopping",
    icon: "ShoppingBag",
    color: "purple",
    hexColor: "#a855f7",
    description: "Goods & services",
  },
];

/** India national average daily CO2 footprint (kg) — CEA 2023. Used by /insights comparison bars. */
export const INDIA_DAILY_AVERAGE = 11.2; // kg CO2
/** Global average daily CO2 footprint (kg). Used by /insights comparison bars. */
export const GLOBAL_DAILY_AVERAGE = 15.1; // kg CO2
/** Paris Agreement-aligned sustainable daily target (kg). Used by CarbonGauge on /track. */
export const TARGET_DAILY = 5.0; // sustainable target kg CO2

/**
 * Calculates CO2 emissions for a given activity.
 *
 * Problem Statement: Enables "simple actions" by instantly computing the
 * carbon cost of any activity + quantity, powering the live CO2 preview
 * on the /track page.
 *
 * @param category - One of Transport, Food, Energy, Shopping
 * @param activityType - Specific activity key (e.g., 'car_petrol')
 * @param quantity - Amount in the activity's unit (km, meals, kWh, items)
 * @returns CO2 in kg, rounded to 3 decimal places. Returns 0 for unknown inputs.
 */
export function calculateCO2(
  category: string,
  activityType: string,
  quantity: number
): number {
  if (!quantity || quantity <= 0) return 0;
  const catFactors = CARBON_FACTORS[category];
  if (!catFactors) return 0;
  const config = catFactors[activityType];
  if (!config) return 0;
  return Number((config.factor * quantity).toFixed(3));
}

/**
 * Returns the Monday of the current ISO week as a YYYY-MM-DD string.
 *
 * Used to key weekly Firestore documents (weeklyReports, challenges)
 * ensuring each user gets one AI-generated insight set and challenge
 * set per week — supporting the "personalized insights" pillar.
 *
 * @returns Date string for Monday of the current week (e.g., '2026-06-15')
 */
export function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay();
  // Adjust so Monday is day 1, Sunday is day 7
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const dateVal = String(monday.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateVal}`;
}
