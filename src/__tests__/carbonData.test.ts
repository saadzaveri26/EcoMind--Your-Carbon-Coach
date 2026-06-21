import {
  calculateCO2,
  CARBON_FACTORS,
  INDIA_DAILY_AVERAGE,
  GLOBAL_DAILY_AVERAGE,
  TARGET_DAILY,
  CATEGORIES,
  getMondayOfCurrentWeek,
} from '@/lib/carbonData';

describe('calculateCO2 - All Activity Types', () => {
  // Transport Category Tests
  describe('Transport Category', () => {
    it('calculates correct CO2 for car_petrol', () => {
      expect(calculateCO2('Transport', 'car_petrol', 10)).toBe(2.1); // 0.21 * 10
    });
    it('calculates correct CO2 for car_diesel', () => {
      expect(calculateCO2('Transport', 'car_diesel', 10)).toBe(1.7); // 0.17 * 10
    });
    it('calculates correct CO2 for motorcycle', () => {
      expect(calculateCO2('Transport', 'motorcycle', 10)).toBe(1.1); // 0.11 * 10
    });
    it('calculates correct CO2 for bus', () => {
      expect(calculateCO2('Transport', 'bus', 10)).toBe(0.89); // 0.089 * 10
    });
    it('calculates correct CO2 for train', () => {
      expect(calculateCO2('Transport', 'train', 10)).toBe(0.41); // 0.041 * 10
    });
    it('calculates correct CO2 for flight_domestic', () => {
      expect(calculateCO2('Transport', 'flight_domestic', 100)).toBe(25.5); // 0.255 * 100
    });
    it('calculates correct CO2 for auto_rickshaw', () => {
      expect(calculateCO2('Transport', 'auto_rickshaw', 10)).toBe(0.97); // 0.097 * 10
    });
  });

  // Food Category Tests
  describe('Food Category', () => {
    it('calculates correct CO2 for Seafood_meal', () => {
      expect(calculateCO2('Food', 'Seafood_meal', 2)).toBe(13.22); // 6.61 * 2
    });
    it('calculates correct CO2 for chicken_meal', () => {
      expect(calculateCO2('Food', 'chicken_meal', 2)).toBe(2.48); // 1.24 * 2
    });
    it('calculates correct CO2 for vegetarian_meal', () => {
      expect(calculateCO2('Food', 'vegetarian_meal', 3)).toBe(1.11); // 0.37 * 3
    });
    it('calculates correct CO2 for vegan_meal', () => {
      expect(calculateCO2('Food', 'vegan_meal', 3)).toBe(0.54); // 0.18 * 3
    });
    it('calculates correct CO2 for dairy', () => {
      expect(calculateCO2('Food', 'dairy', 5)).toBe(1.55); // 0.31 * 5
    });
  });

  // Energy Category Tests
  describe('Energy Category', () => {
    it('calculates correct CO2 for electricity', () => {
      expect(calculateCO2('Energy', 'electricity', 10)).toBe(8.2); // 0.82 * 10
    });
    it('calculates correct CO2 for lpg_cooking', () => {
      expect(calculateCO2('Energy', 'lpg_cooking', 3)).toBe(1.02); // 0.34 * 3
    });
    it('calculates correct CO2 for ac_usage', () => {
      expect(calculateCO2('Energy', 'ac_usage', 4)).toBe(5.0); // 1.25 * 4
    });
    it('calculates correct CO2 for fan_usage', () => {
      expect(calculateCO2('Energy', 'fan_usage', 10)).toBe(0.38); // 0.038 * 10
    });
  });

  // Shopping Category Tests
  describe('Shopping Category', () => {
    it('calculates correct CO2 for clothing', () => {
      expect(calculateCO2('Shopping', 'clothing', 2)).toBe(20.0); // 10.0 * 2
    });
    it('calculates correct CO2 for electronics', () => {
      expect(calculateCO2('Shopping', 'electronics', 1)).toBe(70.0); // 70.0 * 1
    });
    it('calculates correct CO2 for delivery', () => {
      expect(calculateCO2('Shopping', 'delivery', 5)).toBe(2.5); // 0.5 * 5
    });
    it('calculates correct CO2 for plastic_bag', () => {
      expect(calculateCO2('Shopping', 'plastic_bag', 10)).toBe(0.33); // 0.033 * 10
    });
  });

  // Defensive and Boundary Cases
  describe('Defensive & Boundary Cases', () => {
    it('returns 0 when quantity is zero', () => {
      expect(calculateCO2('Transport', 'car_petrol', 0)).toBe(0);
    });

    it('returns 0 when quantity is negative', () => {
      expect(calculateCO2('Transport', 'car_petrol', -10)).toBe(0);
    });

    it('returns 0 for an unknown activity type', () => {
      expect(calculateCO2('Transport', 'unknown_type', 10)).toBe(0);
    });

    it('returns 0 for an unknown category', () => {
      expect(calculateCO2('UnknownCategory', 'car_petrol', 10)).toBe(0);
    });
  });
});

describe('CARBON_FACTORS Structure Validation', () => {
  it('contains exactly the 4 required categories', () => {
    const categories = Object.keys(CARBON_FACTORS);
    expect(categories).toEqual(
      expect.arrayContaining(['Transport', 'Food', 'Energy', 'Shopping'])
    );
    expect(categories).toHaveLength(4);
  });

  it('validates that every activity has a numeric factor, unit, and label', () => {
    for (const category of Object.keys(CARBON_FACTORS)) {
      const activities = CARBON_FACTORS[category];
      expect(Object.keys(activities).length).toBeGreaterThan(0);
      for (const activityKey of Object.keys(activities)) {
        const item = activities[activityKey];
        expect(typeof item.factor).toBe('number');
        expect(item.factor).toBeGreaterThan(0);
        expect(typeof item.unit).toBe('string');
        expect(item.unit.length).toBeGreaterThan(0);
        expect(typeof item.label).toBe('string');
        expect(item.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Constants Validation', () => {
  it('has the correct numeric value for INDIA_DAILY_AVERAGE', () => {
    expect(INDIA_DAILY_AVERAGE).toBe(11.2);
  });

  it('has the correct numeric value for GLOBAL_DAILY_AVERAGE', () => {
    expect(GLOBAL_DAILY_AVERAGE).toBe(15.1);
  });

  it('has the correct numeric value for TARGET_DAILY', () => {
    expect(TARGET_DAILY).toBe(5.0);
  });
});

describe('CATEGORIES Metadata Validation', () => {
  it('contains metadata for all 4 categories', () => {
    expect(CATEGORIES).toHaveLength(4);
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['Transport', 'Food', 'Energy', 'Shopping']));
  });

  it('verifies that each category config contains required styling properties', () => {
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

describe('getMondayOfCurrentWeek', () => {
  it('returns a string formatted as YYYY-MM-DD', () => {
    const result = getMondayOfCurrentWeek();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a date that is a Monday', () => {
    const result = getMondayOfCurrentWeek();
    const date = new Date(result + 'T00:00:00');
    expect(date.getDay()).toBe(1); // 1 = Monday
  });
});
