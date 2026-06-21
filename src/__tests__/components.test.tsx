/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarbonGauge from '@/components/CarbonGauge';
import ActivityCard from '@/components/ActivityCard';
import ChallengeCard, { ChallengeItem } from '@/components/ChallengeCard';
import ComparisonBar from '@/components/ComparisonBar';
import CategoryPicker from '@/components/CategoryPicker';
import InsightCard, { Insight } from '@/components/InsightCard';

// Mock framer-motion to avoid animation delays and errors in node environment
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref) => (
      <div ref={ref} {...props}>{children}</div>
    )),
    circle: React.forwardRef((props: any, ref) => (
      <circle ref={ref} {...props} />
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const mockIcon = (name: string) => (props: any) => <svg data-testid={`icon-${name}`} {...props} />;
  return {
    Leaf: mockIcon('Leaf'),
    Car: mockIcon('Car'),
    UtensilsCrossed: mockIcon('UtensilsCrossed'),
    Zap: mockIcon('Zap'),
    ShoppingBag: mockIcon('ShoppingBag'),
    ChevronDown: mockIcon('ChevronDown'),
    Loader2: mockIcon('Loader2'),
    PlusCircle: mockIcon('PlusCircle'),
    Check: mockIcon('Check'),
    CheckCircle2: mockIcon('CheckCircle2'),
    AlertTriangle: mockIcon('AlertTriangle'),
    AlertCircle: mockIcon('AlertCircle'),
    CheckCircle: mockIcon('CheckCircle'),
    Plus: mockIcon('Plus'),
  };
});

describe('CarbonGauge Component', () => {
  it('renders green color classes when totalCO2 <= 5', () => {
    render(<CarbonGauge totalCO2={3.5} />);
    const valueEl = screen.getByText('3.50');
    expect(valueEl).toHaveClass('text-green-500');
  });

  it('renders amber color classes when totalCO2 is between 5 and 10', () => {
    render(<CarbonGauge totalCO2={7.2} />);
    const valueEl = screen.getByText('7.20');
    expect(valueEl).toHaveClass('text-amber-500');
  });

  it('renders red color classes when totalCO2 > 10', () => {
    render(<CarbonGauge totalCO2={12.8} />);
    const valueEl = screen.getByText('12.80');
    expect(valueEl).toHaveClass('text-red-500');
  });
});

describe('ActivityCard Component', () => {
  const onActivityLogged = jest.fn();

  beforeEach(() => {
    onActivityLogged.mockClear();
    (global as any).fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true, co2kg: 2.1, totalToday: 2.1 }),
      } as Response)
    );
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it('updates live CO2 preview correctly on quantity input', async () => {
    render(
      <ActivityCard
        category="Transport"
        userId="test-user-123"
        onActivityLogged={onActivityLogged}
      />
    );

    // Wait for the async category reset to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const quantityInput = screen.getByPlaceholderText('Enter amount in km');
    expect(screen.getByText('0 kg CO2')).toBeInTheDocument();

    // Input 10 km (Car Petrol factor is 0.21 => 2.1 kg)
    fireEvent.change(quantityInput, { target: { value: '10' } });

    expect(screen.getByText('2.1 kg CO2')).toBeInTheDocument();
  });

  it('performs submission and calls onActivityLogged', async () => {
    render(
      <ActivityCard
        category="Transport"
        userId="test-user-123"
        onActivityLogged={onActivityLogged}
      />
    );

    // Wait for the async category reset to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const quantityInput = screen.getByPlaceholderText('Enter amount in km');
    fireEvent.change(quantityInput, { target: { value: '10' } });

    const submitBtn = screen.getByRole('button', { name: /Log Activity/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onActivityLogged).toHaveBeenCalled();
    });
    expect(screen.getByText(/Logged successfully! Saved 2.1 kg CO2./i)).toBeInTheDocument();
  });
});

describe('ChallengeCard Component', () => {
  const mockChallenge: ChallengeItem = {
    id: 'challenge-1',
    title: 'Eat vegan meals',
    description: 'Try eating vegan for a day',
    targetCO2Saving: 4.5,
    completed: false,
    category: 'Food',
    difficulty: 'Easy',
  };

  it('disables mark complete button on click and shows completed checkmark', async () => {
    const onComplete = jest.fn().mockImplementation(() => Promise.resolve());
    const { rerender } = render(
      <ChallengeCard challenge={mockChallenge} onComplete={onComplete} />
    );

    // Get the button using its accessible name derived from aria-label
    const completeBtn = screen.getByRole('button', { name: /Mark challenge "Eat vegan meals" as complete/i });
    expect(completeBtn).toBeInTheDocument();

    fireEvent.click(completeBtn);
    expect(onComplete).toHaveBeenCalledWith('challenge-1');

    // Simulate completion state update via rerender
    const completedChallenge = { ...mockChallenge, completed: true };
    rerender(<ChallengeCard challenge={completedChallenge} onComplete={onComplete} />);

    expect(screen.queryByRole('button', { name: /Mark challenge "Eat vegan meals" as complete/i })).not.toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});

describe('ComparisonBar Component', () => {
  it('renders three comparison bars with correct values', () => {
    render(<ComparisonBar userCO2={5.0} indiaCO2={11.2} globalCO2={15.1} />);

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('5.0 kg')).toBeInTheDocument();

    expect(screen.getByText('India Avg')).toBeInTheDocument();
    expect(screen.getByText('11.2 kg')).toBeInTheDocument();

    expect(screen.getByText('Global Avg')).toBeInTheDocument();
    expect(screen.getByText('15.1 kg')).toBeInTheDocument();
  });
});

describe('CategoryPicker Component', () => {
  it('triggers onChange callback with correct category id when tab is clicked', () => {
    const onChange = jest.fn();
    render(<CategoryPicker selectedId="Transport" onChange={onChange} />);

    const foodTab = screen.getByRole('button', { name: /Select category Food/i });
    fireEvent.click(foodTab);

    expect(onChange).toHaveBeenCalledWith('Food');
  });
});

describe('InsightCard Component', () => {
  const mockInsight: Insight = {
    title: 'Optimize AC usage',
    tip: 'Set AC to 24 degrees to save power.',
    estimatedWeeklySaving: 5.2,
    impactLevel: 'Medium',
    category: 'Energy',
  };

  it('renders correct impact badge classes for High, Medium, and Low', () => {
    const { rerender } = render(<InsightCard insight={mockInsight} />);
    let badge = screen.getByText('Medium Impact');
    expect(badge).toHaveClass('bg-amber-500/15');

    const highInsight = { ...mockInsight, impactLevel: 'High' as const };
    rerender(<InsightCard insight={highInsight} />);
    badge = screen.getByText('High Impact');
    expect(badge).toHaveClass('bg-red-500/15');

    const lowInsight = { ...mockInsight, impactLevel: 'Low' as const };
    rerender(<InsightCard insight={lowInsight} />);
    badge = screen.getByText('Low Impact');
    expect(badge).toHaveClass('bg-green-500/15');
  });
});
