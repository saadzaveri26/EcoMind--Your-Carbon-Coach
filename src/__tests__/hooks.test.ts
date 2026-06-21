/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useActivities } from '@/lib/hooks/useActivities';
import { useChallenges } from '@/lib/hooks/useChallenges';
import { db } from '@/lib/firebase';
import * as firestore from 'firebase/firestore';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => {
  const unsubscribeMock = jest.fn();
  const onSnapshotMock = jest.fn().mockImplementation((queryOrRef, callback) => {
    // Save callback for manual trigger
    (onSnapshotMock as any).lastCallback = callback;
    return unsubscribeMock;
  });

  return {
    collection: jest.fn().mockReturnValue({ id: 'mock-collection' }),
    query: jest.fn().mockReturnValue({ id: 'mock-query' }),
    where: jest.fn(),
    doc: jest.fn().mockReturnValue({ id: 'mock-doc' }),
    onSnapshot: onSnapshotMock,
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
  };
});

jest.mock('@/lib/firebase', () => ({
  db: { id: 'mock-db' },
}));

describe('useActivities hook', () => {
  let onSnapshotMock: any;
  let unsubscribeMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    onSnapshotMock = firestore.onSnapshot;
    unsubscribeMock = (firestore.onSnapshot(null as any, null as any) as any);
    unsubscribeMock.mockClear();
  });

  it('returns initial states correctly (loading=true)', () => {
    const { result } = renderHook(() => useActivities('test-user'));
    expect(result.current.loading).toBe(true);
    expect(result.current.activities).toEqual([]);
  });

  it('resolves loading and sets activities when snapshot callback is triggered', () => {
    const { result } = renderHook(() => useActivities('test-user'));

    // Trigger onSnapshot mock callback
    const mockDoc = {
      id: 'activity-1',
      data: () => ({
        userId: 'test-user',
        category: 'Food',
        activityType: 'vegetarian_meal',
        quantity: 2,
        co2kg: 0.74,
        date: '2026-06-21',
        timestamp: { seconds: 1772613237, nanoseconds: 0 },
      }),
    };

    const mockSnapshot = [mockDoc];
    
    act(() => {
      (onSnapshotMock as any).lastCallback(mockSnapshot);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.activities).toHaveLength(1);
    expect(result.current.activities[0].id).toBe('activity-1');
  });

  it('calls unsubscribe cleanups on unmount', () => {
    const { unmount } = renderHook(() => useActivities('test-user'));
    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});

describe('useChallenges hook', () => {
  let onSnapshotMock: any;
  let unsubscribeMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    onSnapshotMock = firestore.onSnapshot;
    unsubscribeMock = (firestore.onSnapshot(null as any, null as any) as any);
    unsubscribeMock.mockClear();
  });

  it('returns initial states correctly (loading=true)', () => {
    const { result } = renderHook(() => useChallenges('test-user'));
    expect(result.current.loading).toBe(true);
    expect(result.current.challenges).toEqual([]);
  });

  it('resolves loading and sets challenges when snap exists', () => {
    const { result } = renderHook(() => useChallenges('test-user'));

    const mockDocSnap = {
      exists: () => true,
      data: () => ({
        userId: 'test-user',
        weekStart: '2026-06-15',
        items: [
          {
            id: 'challenge-1',
            title: 'Eat vegan meals',
            description: 'Try eating vegan for a day',
            targetCO2Saving: 4.5,
            completed: false,
            category: 'Food',
            difficulty: 'Easy',
          },
        ],
      }),
    };

    act(() => {
      (onSnapshotMock as any).lastCallback(mockDocSnap);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.challenges).toHaveLength(1);
    expect(result.current.challenges[0].id).toBe('challenge-1');
  });

  it('markComplete calls updateDoc on Firestore and updates streak/badges', async () => {
    const getDocMock = firestore.getDoc as jest.Mock;
    const updateDocMock = firestore.updateDoc as jest.Mock;

    const mockChallengeDoc = {
      exists: () => true,
      data: () => ({
        userId: 'test-user',
        weekStart: '2026-06-15',
        items: [
          {
            id: 'challenge-1',
            title: 'Eat vegan meals',
            description: 'Try eating vegan for a day',
            targetCO2Saving: 4.5,
            completed: false,
            category: 'Food',
            difficulty: 'Easy',
          },
        ],
      }),
    };

    const mockProfileDoc = {
      exists: () => true,
      data: () => ({
        userId: 'test-user',
        streakDays: 2,
        badgesEarned: [],
      }),
    };

    getDocMock
      .mockResolvedValueOnce(mockChallengeDoc) // for challenges doc
      .mockResolvedValueOnce(mockProfileDoc); // for user profile doc

    updateDocMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useChallenges('test-user'));

    await act(async () => {
      await result.current.markComplete('challenge-1');
    });

    expect(getDocMock).toHaveBeenCalledTimes(2);
    // Verifies it updates user challenges doc
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'challenge-1', completed: true }),
        ]),
      })
    );
    // Verifies it increments streak and awards first_challenge badge
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        streakDays: 3,
        badgesEarned: ['first_challenge'],
      })
    );
  });
});
