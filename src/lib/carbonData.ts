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

export const INDIA_DAILY_AVERAGE = 11.2; // kg CO2
export const GLOBAL_DAILY_AVERAGE = 15.1; // kg CO2
export const TARGET_DAILY = 5.0; // sustainable target kg CO2

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
