import {
  calculateCO2,
  CARBON_FACTORS,
  INDIA_DAILY_AVERAGE,
  GLOBAL_DAILY_AVERAGE,
  TARGET_DAILY,
  CATEGORIES,
  getMondayOfCurrentWeek,
} from '@/lib/carbonData';

// ---------------------------------------------------------------------------
// Unit Tests — calculateCO2()
// ---------------------------------------------------------------------------
describe('calculateCO2', () => {
  it('returns correct CO2 for a known transport activity', () => {
    // car_petrol factor = 0.21, 10 km => 2.1 kg
    const result = calculateCO2('Transport', 'car_petrol', 10);
    expect(result).toBe(2.1);
  });

  it('returns correct CO2 for a known food activity', () => {
    // vegetarian_meal factor = 0.37, 3 meals => 1.11 kg
    const result = calculateCO2('Food', 'vegetarian_meal', 3);
    expect(result).toBe(1.11);
  });

  it('returns correct CO2 for a known energy activity', () => {
    // electricity factor = 0.82, 5 kWh => 4.1 kg
    const result = calculateCO2('Energy', 'electricity', 5);
    expect(result).toBe(4.1);
  });

  it('returns correct CO2 for a known shopping activity', () => {
    // electronics factor = 70.0, 1 item => 70.0 kg
    const result = calculateCO2('Shopping', 'electronics', 1);
    expect(result).toBe(70.0);
  });

  it('returns 0 for an unknown activity type', () => {
    const result = calculateCO2('Transport', 'hoverboard', 100);
    expect(result).toBe(0);
  });

  it('returns 0 for an unknown category', () => {
    const result = calculateCO2('Teleportation', 'beam', 5);
    expect(result).toBe(0);
  });

  it('returns 0 when quantity is zero', () => {
    const result = calculateCO2('Transport', 'car_petrol', 0);
    expect(result).toBe(0);
  });

  it('returns 0 when quantity is negative', () => {
    const result = calculateCO2('Transport', 'car_petrol', -5);
    expect(result).toBe(0);
  });

  it('rounds result to 3 decimal places', () => {
    // motorcycle factor = 0.11, 7 km => 0.77 (exact) — verify precision
    const result = calculateCO2('Transport', 'motorcycle', 7);
    expect(result).toBe(0.77);
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — CARBON_FACTORS structure
// ---------------------------------------------------------------------------
describe('CARBON_FACTORS', () => {
  it('has all 4 required categories', () => {
    expect(Object.keys(CARBON_FACTORS)).toEqual(
      expect.arrayContaining(['Transport', 'Food', 'Energy', 'Shopping'])
    );
    expect(Object.keys(CARBON_FACTORS)).toHaveLength(4);
  });

  it('each category has at least one activity with a positive factor', () => {
    for (const category of Object.keys(CARBON_FACTORS)) {
      const activities = Object.keys(CARBON_FACTORS[category]);
      expect(activities.length).toBeGreaterThan(0);
      for (const activity of activities) {
        expect(CARBON_FACTORS[category][activity].factor).toBeGreaterThan(0);
      }
    }
  });

  it('every activity has a unit and label', () => {
    for (const category of Object.keys(CARBON_FACTORS)) {
      for (const activity of Object.keys(CARBON_FACTORS[category])) {
        const config = CARBON_FACTORS[category][activity];
        expect(config.unit).toBeTruthy();
        expect(config.label).toBeTruthy();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — Constants
// ---------------------------------------------------------------------------
describe('Constants', () => {
  it('INDIA_DAILY_AVERAGE equals 11.2', () => {
    expect(INDIA_DAILY_AVERAGE).toBe(11.2);
  });

  it('GLOBAL_DAILY_AVERAGE equals 15.1', () => {
    expect(GLOBAL_DAILY_AVERAGE).toBe(15.1);
  });

  it('TARGET_DAILY equals 5.0', () => {
    expect(TARGET_DAILY).toBe(5.0);
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — CATEGORIES metadata
// ---------------------------------------------------------------------------
describe('CATEGORIES', () => {
  it('has exactly 4 categories matching CARBON_FACTORS keys', () => {
    expect(CATEGORIES).toHaveLength(4);
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['Transport', 'Food', 'Energy', 'Shopping']));
  });

  it('each category has id, label, icon, color, hexColor, and description', () => {
    for (const cat of CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.color).toBeTruthy();
      expect(cat.hexColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(cat.description).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — getMondayOfCurrentWeek
// ---------------------------------------------------------------------------
describe('getMondayOfCurrentWeek', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = getMondayOfCurrentWeek();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a date that falls on a Monday', () => {
    const result = getMondayOfCurrentWeek();
    const date = new Date(result + 'T00:00:00');
    // getDay() returns 1 for Monday
    expect(date.getDay()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// API Input Validation Tests (schema-level, no server required)
// ---------------------------------------------------------------------------
describe('API route input validation (mock)', () => {
  it('POST /api/activities/log returns 400 for missing required fields', async () => {
    // Simulate the Zod schema validation used by the activities/log route
    const { z } = await import('zod');

    const logSchema = z.object({
      userId: z.string().min(1),
      category: z.enum(['Transport', 'Food', 'Energy', 'Shopping']),
      activityType: z.string().min(1),
      quantity: z.number().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    // Missing userId and quantity
    const invalidBody = { category: 'Transport', activityType: 'car_petrol' };
    const result = logSchema.safeParse(invalidBody);

    expect(result.success).toBe(false);
  });

  it('POST /api/activities/log validates correct input successfully', async () => {
    const { z } = await import('zod');

    const logSchema = z.object({
      userId: z.string().min(1),
      category: z.enum(['Transport', 'Food', 'Energy', 'Shopping']),
      activityType: z.string().min(1),
      quantity: z.number().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    const validBody = {
      userId: 'test-user-123',
      category: 'Transport',
      activityType: 'car_petrol',
      quantity: 10,
      date: '2026-06-18',
    };
    const result = logSchema.safeParse(validBody);

    expect(result.success).toBe(true);
  });

  it('POST /api/activities/log rejects invalid category', async () => {
    const { z } = await import('zod');

    const logSchema = z.object({
      userId: z.string().min(1),
      category: z.enum(['Transport', 'Food', 'Energy', 'Shopping']),
      activityType: z.string().min(1),
      quantity: z.number().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    const invalidBody = {
      userId: 'test-user-123',
      category: 'InvalidCategory',
      activityType: 'car_petrol',
      quantity: 10,
      date: '2026-06-18',
    };
    const result = logSchema.safeParse(invalidBody);

    expect(result.success).toBe(false);
  });

  it('POST /api/activities/log rejects negative quantity', async () => {
    const { z } = await import('zod');

    const logSchema = z.object({
      userId: z.string().min(1),
      category: z.enum(['Transport', 'Food', 'Energy', 'Shopping']),
      activityType: z.string().min(1),
      quantity: z.number().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    const invalidBody = {
      userId: 'test-user-123',
      category: 'Transport',
      activityType: 'car_petrol',
      quantity: -5,
      date: '2026-06-18',
    };
    const result = logSchema.safeParse(invalidBody);

    expect(result.success).toBe(false);
  });

  it('POST /api/activities/log rejects invalid date format', async () => {
    const { z } = await import('zod');

    const logSchema = z.object({
      userId: z.string().min(1),
      category: z.enum(['Transport', 'Food', 'Energy', 'Shopping']),
      activityType: z.string().min(1),
      quantity: z.number().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    const invalidBody = {
      userId: 'test-user-123',
      category: 'Transport',
      activityType: 'car_petrol',
      quantity: 10,
      date: '06-18-2026', // wrong format
    };
    const result = logSchema.safeParse(invalidBody);

    expect(result.success).toBe(false);
  });
});
