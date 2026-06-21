import { NextRequest } from 'next/server';
import { POST as logPOST } from '@/app/api/activities/log/route';
import { GET as summaryGET } from '@/app/api/activities/summary/route';
import { POST as insightsPOST } from '@/app/api/insights/generate/route';
import { POST as challengesPOST } from '@/app/api/challenges/generate/route';
import { POST as profilePOST } from '@/app/api/profile/setup/route';
import { adminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isRateLimited } from '@/lib/rateLimit';

// Mock firebase-admin
jest.mock('@/lib/firebase-admin', () => {
  const mockSet = jest.fn().mockResolvedValue({ id: 'doc-1' });
  const mockUpdate = jest.fn().mockResolvedValue(true);
  const mockGet = jest.fn().mockResolvedValue({
    exists: true,
    data: () => ({
      userId: 'test-user',
      lifestyle: 'Food',
      streakDays: 0,
      badgesEarned: [],
      insights: [{ title: 'Tip 1', tip: 'Eat dal', estimatedWeeklySaving: 3, impactLevel: 'High', category: 'Food' }],
      items: [{ id: 'chal-1', title: 'Car', completed: false }],
    }),
  });

  const mockDocs: any[] = [];
  const mockGetSnap = jest.fn().mockResolvedValue({
    docs: mockDocs,
    forEach: (cb: any) => mockDocs.forEach(cb),
  });

  const mockDocRef = {
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
  };

  const mockCollectionRef = {
    doc: jest.fn().mockReturnValue(mockDocRef),
    where: jest.fn().mockReturnThis(),
    get: mockGetSnap,
  };

  return {
    adminDb: {
      collection: jest.fn().mockReturnValue(mockCollectionRef),
    },
  };
});

// Mock @google/generative-ai
jest.mock('@google/generative-ai', () => {
  const generateContentMock = jest.fn();
  const getGenerativeModelMock = jest.fn().mockReturnValue({
    generateContent: generateContentMock,
  });

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: getGenerativeModelMock,
    })),
  };
});

// Mock rateLimit module
jest.mock('@/lib/rateLimit', () => ({
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
  isRateLimited: jest.fn().mockReturnValue(false),
}));

describe('API Route - /api/activities/log', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isRateLimited as jest.Mock).mockReturnValue(false);
  });

  it('returns 200 on valid input and saves to db', async () => {
    const body = {
      userId: 'user-123',
      category: 'Food',
      activityType: 'vegetarian_meal',
      quantity: 3,
      date: '2026-06-21',
    };

    const req = new NextRequest('http://localhost/api/activities/log', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await logPOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.co2kg).toBe(1.11); // 0.37 * 3
  });

  it('returns 400 on missing fields', async () => {
    const body = {
      userId: 'user-123',
      category: 'Food',
    };

    const req = new NextRequest('http://localhost/api/activities/log', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await logPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 on negative quantity', async () => {
    const body = {
      userId: 'user-123',
      category: 'Food',
      activityType: 'vegetarian_meal',
      quantity: -5,
      date: '2026-06-21',
    };

    const req = new NextRequest('http://localhost/api/activities/log', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await logPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    (isRateLimited as jest.Mock).mockReturnValue(true);

    const body = {
      userId: 'user-123',
      category: 'Food',
      activityType: 'vegetarian_meal',
      quantity: 3,
      date: '2026-06-21',
    };

    const req = new NextRequest('http://localhost/api/activities/log', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await logPOST(req);
    expect(res.status).toBe(429);
  });
});

describe('API Route - /api/insights/generate', () => {
  let modelMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (isRateLimited as jest.Mock).mockReturnValue(false);
    const clientInstance = new GoogleGenerativeAI('test-key');
    modelMock = clientInstance.getGenerativeModel({} as any);
  });

  it('returns cached insights from firestore if present (200)', async () => {
    // Mock getDoc to return true (already cached)
    const mockCollection = adminDb.collection('weeklyReports');
    const mockDoc = mockCollection.doc('some-id');
    (mockDoc.get as jest.Mock).mockResolvedValueOnce({
      exists: true,
      data: () => ({
        insights: [{ title: 'Tip 1', tip: 'Eat vegan', estimatedWeeklySaving: 2, impactLevel: 'Medium', category: 'Food' }],
      }),
    });

    const body = {
      userId: 'user-123',
      lifestyle: 'Food',
      weekData: {
        totalCO2: 12.5,
        breakdown: { Transport: 0, Food: 12.5, Energy: 0, Shopping: 0 },
      },
    };

    const req = new NextRequest('http://localhost/api/insights/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await insightsPOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Tip 1');
  });

  it('returns 400 on missing userId', async () => {
    const body = {
      lifestyle: 'Food',
      weekData: {
        totalCO2: 12.5,
        breakdown: { Transport: 0, Food: 12.5, Energy: 0, Shopping: 0 },
      },
    };

    const req = new NextRequest('http://localhost/api/insights/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await insightsPOST(req);
    expect(res.status).toBe(400);
  });

  it('handles Gemini json parse failure and retries successfully', async () => {
    // First get() returns false (not cached)
    const mockCollection = adminDb.collection('weeklyReports');
    const mockDoc = mockCollection.doc('some-id');
    (mockDoc.get as jest.Mock).mockResolvedValueOnce({
      exists: false,
    });

    // Gemini first attempt returns invalid text, second returns valid JSON
    const badResponse = { response: { text: () => 'Invalid non-json output' } };
    const goodResponse = {
      response: {
        text: () => JSON.stringify([
          { title: 'AI Tip', tip: 'Unplug chargers', estimatedWeeklySaving: 1.5, impactLevel: 'Low', category: 'Energy' },
        ]),
      },
    };

    (modelMock.generateContent as jest.Mock)
      .mockResolvedValueOnce(badResponse)
      .mockResolvedValueOnce(goodResponse);

    const body = {
      userId: 'user-123',
      lifestyle: 'Food',
      weekData: {
        totalCO2: 12.5,
        breakdown: { Transport: 0, Food: 12.5, Energy: 0, Shopping: 0 },
      },
    };

    const req = new NextRequest('http://localhost/api/insights/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await insightsPOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('AI Tip');
    expect(modelMock.generateContent).toHaveBeenCalledTimes(2); // Retried
  });
});

describe('API Route - /api/challenges/generate', () => {
  let modelMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (isRateLimited as jest.Mock).mockReturnValue(false);
    const clientInstance = new GoogleGenerativeAI('test-key');
    modelMock = clientInstance.getGenerativeModel({} as any);
  });

  it('returns cached challenges from firestore if present (200)', async () => {
    const mockCollection = adminDb.collection('challenges');
    const mockDoc = mockCollection.doc('some-id');
    (mockDoc.get as jest.Mock).mockResolvedValueOnce({
      exists: true,
      data: () => ({
        items: [{ id: 'chal-1', title: 'Eat organic', completed: false }],
      }),
    });

    const body = {
      userId: 'user-123',
      topCategories: ['Food'],
      lifestyle: 'Food',
    };

    const req = new NextRequest('http://localhost/api/challenges/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await challengesPOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('chal-1');
  });

  it('returns 400 on invalid payload', async () => {
    const body = {
      userId: 'user-123',
      // topCategories is missing
    };

    const req = new NextRequest('http://localhost/api/challenges/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await challengesPOST(req);
    expect(res.status).toBe(400);
  });
});

describe('API Route - /api/profile/setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isRateLimited as jest.Mock).mockReturnValue(false);
  });

  it('returns 200 on valid lifestyle value', async () => {
    const body = {
      userId: 'user-123',
      lifestyle: 'Transport',
    };

    const req = new NextRequest('http://localhost/api/profile/setup', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await profilePOST(req);
    expect(res.status).toBe(200);
  });

  it('returns 400 on invalid lifestyle value', async () => {
    const body = {
      userId: 'user-123',
      lifestyle: 'InvalidLifestyleValue',
    };

    const req = new NextRequest('http://localhost/api/profile/setup', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const res = await profilePOST(req);
    expect(res.status).toBe(400);
  });
});
