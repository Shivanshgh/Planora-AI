import express, { Request, Response } from 'express';
import type { NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';
import { z } from 'zod';
import { eventInputSchema } from './src/types/event';
import { getDefaultRunOfShow } from './src/utils/formatters';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

const budgetItemRequestSchema = z.object({
  category: z.string().trim().min(1).max(120),
  allocatedAmount: z.number().finite().min(0).max(1_000_000_000),
});
const planContextRequestSchema = z.object({
  input: eventInputSchema,
  budget: z.array(budgetItemRequestSchema).max(100),
  timeline: z.array(z.object({
    title: z.string().max(200),
    status: z.enum(['pending', 'in_progress', 'completed']),
  })).max(200).optional(),
  overview: z.object({ recommendedTheme: z.string().max(500).optional() }).optional(),
});
const regenerateRequestSchema = z.object({
  eventInput: eventInputSchema,
  section: z.enum(['budget', 'timeline', 'checklist', 'ideas', 'risks']),
  instruction: z.string().max(2000).optional(),
});
const optimizeRequestSchema = z.object({
  plan: planContextRequestSchema,
  targetSavingsPercent: z.number().finite().min(5).max(35).default(15),
});
const creativeRequestSchema = z.object({
  plan: planContextRequestSchema,
  focusArea: z.enum(['all', 'guest-experience', 'culinary', 'visual-decor']).default('all'),
});
const assistantRequestSchema = z.object({
  plan: planContextRequestSchema.nullable().optional(),
  messages: z.array(z.object({
    sender: z.enum(['user', 'assistant']),
    text: z.string().max(2000),
  })).max(20).default([]),
  userQuestion: z.string().trim().min(1).max(4000),
});
const generatedBudgetSchema = z.array(z.object({
  category: z.string().min(1).max(120),
  allocatedAmount: z.number().finite().min(0),
  percentage: z.number().finite(),
  explanation: z.string().max(2000),
  costSavingAlternative: z.string().max(2000),
})).max(100);
const generatedTimelineSchema = z.array(z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  suggestedDeadline: z.string().max(120),
  dueDate: z.string(),
  priority: z.string().max(30),
  category: z.string().max(120).optional(),
})).max(200);
const generatedChecklistSchema = z.array(z.object({
  category: z.string().min(1).max(120),
  task: z.string().min(1).max(300),
  notes: z.string().max(2000),
  priority: z.string().max(30),
  deadline: z.string(),
  estimatedCost: z.number().finite().min(0).max(1_000_000_000),
})).max(300);
const generatedRisksSchema = z.array(z.object({
  risk: z.string().min(1).max(300),
  severity: z.string().max(30),
  recommendation: z.string().max(2000),
  actionItem: z.string().max(1000),
})).max(100);
const generatedIdeasSchema = z.object({
  themesAndColors: z.array(z.object({
    name: z.string().max(120),
    description: z.string().max(2000),
    palette: z.array(z.object({ name: z.string().max(80), hex: z.string().regex(/^#[0-9a-fA-F]{3,8}$/) })).max(20),
  })).max(30),
  decorations: z.array(z.string().max(500)).max(100),
  foodAndRefreshments: z.array(z.string().max(500)).max(100),
  activitiesAndEntertainment: z.array(z.string().max(500)).max(100),
  guestExperiences: z.array(z.string().max(500)).max(100),
  invitationWording: z.object({ headline: z.string().max(300), body: z.string().max(3000), rsvpNote: z.string().max(1000) }),
  lowCostAlternatives: z.array(z.string().max(500)).max(100),
  ecoFriendlyOptions: z.array(z.string().max(500)).max(100),
});
const generatedPlanResponseSchema = z.object({
  overview: z.object({
    concept: z.string().max(2000),
    tagline: z.string().max(300),
    recommendedTheme: z.string().max(500),
    suggestedAtmosphere: z.string().max(1000),
    keyPriorities: z.array(z.string().max(500)).max(30),
    explanation: z.string().max(3000),
  }),
  budget: generatedBudgetSchema,
  timeline: generatedTimelineSchema,
  checklist: generatedChecklistSchema,
  ideas: generatedIdeasSchema,
  risks: generatedRisksSchema,
});
const optimizedResponseSchema = z.object({
  strategicAdvice: z.string().min(1).max(4000),
  recommendedBudget: z.array(z.object({
    category: z.string().min(1).max(120),
    proposedAmount: z.number().finite().min(0).max(1_000_000_000),
    savingsAmount: z.number().finite().min(0).max(1_000_000_000),
    rational: z.string().max(2000),
  })).max(100),
  quickWins: z.array(z.string().max(500)).max(100),
});
const creativeResponseSchema = z.object({
  themeConcept: z.string().min(1).max(2000),
  signatureGuestExperiences: z.array(z.string().max(500)).max(30),
  viralPhotoMoments: z.array(z.string().max(500)).max(30),
  culinaryTwists: z.array(z.string().max(500)).max(30),
  personalizedSurprises: z.array(z.string().max(500)).max(30),
});

function sendInvalidRequest(res: Response, details: unknown): void {
  res.status(400).json({ error: 'Invalid request data.', details });
}

function normalizeBudgetItems(rawBudget: z.infer<typeof generatedBudgetSchema>, totalBudget: number) {
  if (rawBudget.length === 0 || rawBudget.some(item =>
    !Number.isFinite(Number(item.allocatedAmount)) || Number(item.allocatedAmount) < 0
  )) {
    throw new Error('Gemini returned an invalid budget allocation.');
  }

  const rawTotal = rawBudget.reduce((sum, item) => sum + Number(item.allocatedAmount), 0);
  if (!Number.isFinite(rawTotal) || rawTotal <= 0) {
    throw new Error('Gemini returned an invalid budget total.');
  }

  const now = Date.now().toString(36);
  const budget = rawBudget.map((item, index) => {
    const allocatedAmount = Math.round((Number(item.allocatedAmount) / rawTotal) * totalBudget);
    return {
      id: `b-${index + 1}-${now}`,
      category: item.category,
      allocatedAmount,
      percentage: Math.round((allocatedAmount / totalBudget) * 100),
      explanation: item.explanation,
      costSavingAlternative: item.costSavingAlternative,
      actualSpent: 0,
    };
  });

  const remainder = totalBudget - budget.reduce((sum, item) => sum + item.allocatedAmount, 0);
  const contingencyIndex = budget.findIndex(item =>
    item.category.toLowerCase().includes('contingency') || item.category.toLowerCase().includes('emergency')
  );
  const largestIndex = budget.reduce((largest, item, index, items) =>
    item.allocatedAmount > items[largest].allocatedAmount ? index : largest, 0
  );
  const targetIndex = contingencyIndex >= 0 ? contingencyIndex : largestIndex;
  budget[targetIndex].allocatedAmount += remainder;
  budget[targetIndex].percentage = Math.round((budget[targetIndex].allocatedAmount / totalBudget) * 100);
  return budget;
}

function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function normalizePriority(value: string): 'high' | 'medium' | 'low' {
  const normalized = value.toLowerCase();
  return normalized === 'high' || normalized === 'low' ? normalized : 'medium';
}

function logGeminiFailure(operation: string, error: unknown): void {
  console.error(`${operation} failed:`, error instanceof Error ? error.name : 'Unknown error');
}

// Server-side initialization of GoogleGenAI
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Clean error message parser for nested Gemini API errors
function errorRecord(error: unknown): Record<string, unknown> {
  return typeof error === 'object' && error !== null ? error as Record<string, unknown> : {};
}

function formatGeminiErrorMessage(error: unknown): string {
  const record = errorRecord(error);
  const nested = errorRecord(record.error);
  const status = String(record.status ?? record.code ?? nested.code ?? '');
  if (status === '401' || status === '403') return 'Gemini rejected the server API key. Check the configured GEMINI_API_KEY.';
  if (status === '429' || status === 'RESOURCE_EXHAUSTED') return 'Gemini API rate limit reached. Please wait a moment and retry.';
  if (status === '503' || status === 'UNAVAILABLE') {
    return 'Gemini is temporarily unavailable. Please retry in a few moments or explore a sample plan.';
  }
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    return 'Gemini is not configured. Add GEMINI_API_KEY to the server environment to enable AI features.';
  }
  return 'The AI request could not be completed. Please retry shortly.';
}

// Automatic retry with backoff for transient errors
async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const record = errorRecord(err);
      const status = String(record.status ?? record.code ?? errorRecord(record.error).code ?? '');
      const isTransient = status === '503' || status === 'UNAVAILABLE' || status === '429' || status === 'RESOURCE_EXHAUSTED';
      if (attempt < maxRetries && isTransient) {
        console.log(`Gemini transient error on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
        delayMs *= 1.5;
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

// 1. Healthcheck endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// JSON Schema for full event plan generation
const fullPlanResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overview: {
      type: Type.OBJECT,
      properties: {
        concept: { type: Type.STRING },
        tagline: { type: Type.STRING },
        recommendedTheme: { type: Type.STRING },
        suggestedAtmosphere: { type: Type.STRING },
        keyPriorities: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        explanation: { type: Type.STRING },
      },
      required: ['concept', 'tagline', 'recommendedTheme', 'suggestedAtmosphere', 'keyPriorities', 'explanation'],
    },
    budget: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          allocatedAmount: { type: Type.NUMBER },
          percentage: { type: Type.NUMBER },
          explanation: { type: Type.STRING },
          costSavingAlternative: { type: Type.STRING },
        },
        required: ['category', 'allocatedAmount', 'percentage', 'explanation', 'costSavingAlternative'],
      },
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          suggestedDeadline: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          priority: { type: Type.STRING },
          category: { type: Type.STRING },
        },
        required: ['title', 'description', 'suggestedDeadline', 'dueDate', 'priority'],
      },
    },
    checklist: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          task: { type: Type.STRING },
          notes: { type: Type.STRING },
          priority: { type: Type.STRING },
          deadline: { type: Type.STRING },
          estimatedCost: { type: Type.NUMBER },
        },
        required: ['category', 'task', 'notes', 'priority', 'deadline', 'estimatedCost'],
      },
    },
    ideas: {
      type: Type.OBJECT,
      properties: {
        themesAndColors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              palette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                  },
                  required: ['name', 'hex'],
                },
              },
            },
            required: ['name', 'description', 'palette'],
          },
        },
        decorations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        foodAndRefreshments: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        activitiesAndEntertainment: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        guestExperiences: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        invitationWording: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            body: { type: Type.STRING },
            rsvpNote: { type: Type.STRING },
          },
          required: ['headline', 'body', 'rsvpNote'],
        },
        lowCostAlternatives: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        ecoFriendlyOptions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: [
        'themesAndColors',
        'decorations',
        'foodAndRefreshments',
        'activitiesAndEntertainment',
        'guestExperiences',
        'invitationWording',
        'lowCostAlternatives',
        'ecoFriendlyOptions',
      ],
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          risk: { type: Type.STRING },
          severity: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          actionItem: { type: Type.STRING },
        },
        required: ['risk', 'severity', 'recommendation', 'actionItem'],
      },
    },
  },
  required: ['overview', 'budget', 'timeline', 'checklist', 'ideas', 'risks'],
};

// 2. Generate Plan endpoint
app.post('/api/events/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = eventInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendInvalidRequest(res, parseResult.error.issues.map(({ path, message }) => ({ path, message })));
      return;
    }

    const input = parseResult.data;

    const ai = getAIClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Set GEMINI_API_KEY in the server environment.',
      });
      return;
    }

    const systemInstruction = `
You are Planora AI, an elite event planner, financial budget architect, and creative director with deep expertise in Indian weddings, milestone birthdays, and community gatherings.
You create pragmatic, budget-aware event plans with precise Indian Rupee (INR) financial breakdowns, realistic logistical milestones, and localized cultural elements.

Critical Rules:
1. CURRENCY & ARITHMETIC: Total budget is ₹${input.totalBudget} INR. The sum of allocatedAmount across all budget categories MUST equal exactly ₹${input.totalBudget}. Always include an Emergency Contingency Fund (between 4% and 7% of total budget).
2. REALISM: Do not fabricate vendor names, real phone numbers, or pretend bookings exist. Clearly formulate categories, tasks, and estimated rates.
3. EVENT DATE & TIMELINE: The event date is ${input.date}. Dates in timeline must be chronological and lead up to ${input.date}. Tasks should have realistic lead times (e.g., weddings require 2-6 months; birthdays 2-4 weeks; community events 3-6 weeks). Format all due dates as YYYY-MM-DD.
4. LOCAL CONTEXT: City is "${input.city}". Tailor catering, weather considerations, and local cultural norms to this location.
5. GUESTS: Guest count is ${input.guestCount} (${Math.round(input.totalBudget / input.guestCount)} INR per guest).
6. Return only valid JSON conforming strictly to the requested schema.
`;

    const userPrompt = `
Generate a comprehensive, bespoke event plan for the following event specifications:
- Event Name: "${input.name}"
- Event Type: ${input.eventType}
- Target Date: ${input.date}
- City / Location: ${input.city}
- Total Budget: ₹${input.totalBudget.toLocaleString('en-IN')} INR
- Guest Count: ${input.guestCount}
- Setting Preference: ${input.setting || 'Not specified (recommend best)'}
- Duration: ${input.durationHours ? `${input.durationHours} hours` : 'Standard duration'}
- Theme / Style: ${input.theme || 'Suggest creative concept'}
- Dietary Needs: ${input.dietary || 'Standard regional menu with vegetarian options'}
- Cultural Background: ${input.cultural || 'Standard Indian traditions'}
- Language / Tone: ${input.language || 'English / Hindi'}
- Must-have Activities: ${input.mustHaveActivities || 'Standard festive flow'}
- Special Requirements: ${input.specialRequirements || 'None specified'}
- Budget Flexibility: ${input.budgetFlexibility || 'moderate'}

Ensure every section is filled with high quality, specific, actionable details.
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: fullPlanResponseSchema,
        },
      })
    );

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini model.');
    }

    const generated = generatedPlanResponseSchema.parse(JSON.parse(responseText));

    // Recalculate allocations in application code so their sum equals the requested budget.
    const normalizedBudget = normalizeBudgetItems(generated.budget, input.totalBudget);

    // Attach unique IDs and default statuses to timeline, checklist, risks
    const timeline = generated.timeline.map((t, idx) => ({
      id: `t-${idx + 1}-${Date.now().toString(36)}`,
      title: t.title || 'Event Milestone',
      description: t.description || '',
      suggestedDeadline: t.suggestedDeadline || '',
      dueDate: isValidISODate(t.dueDate) ? t.dueDate : input.date,
      priority: normalizePriority(t.priority),
      status: 'pending' as const,
      category: t.category || 'General',
    }));

    const checklist = generated.checklist.map((c, idx) => ({
      id: `c-${idx + 1}-${Date.now().toString(36)}`,
      category: c.category || 'Vendor',
      task: c.task || 'Vendor task',
      notes: c.notes || '',
      priority: normalizePriority(c.priority),
      deadline: isValidISODate(c.deadline) ? c.deadline : input.date,
      status: 'not_started' as const,
      estimatedCost: Number(c.estimatedCost) || 0,
    }));

    const risks = generated.risks.map((r, idx) => ({
      id: `r-${idx + 1}-${Date.now().toString(36)}`,
      risk: r.risk || 'General Risk',
      severity: normalizePriority(r.severity),
      recommendation: r.recommendation || '',
      actionItem: r.actionItem || '',
    }));

    const planId = input.id || `plan-${Date.now().toString(36)}`;

    const fullPlan = {
      id: planId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input,
      overview: generated.overview || {
        concept: input.name,
        tagline: 'Crafted with Planora AI',
        recommendedTheme: input.theme || 'Celebration',
        suggestedAtmosphere: 'Festive and organized',
        keyPriorities: ['Budget adherence', 'Guest experience'],
        explanation: 'Customized based on your parameters.',
      },
      budget: normalizedBudget,
      timeline,
      runOfShow: getDefaultRunOfShow(input.eventType),
      checklist,
      ideas: generated.ideas || {
        themesAndColors: [],
        decorations: [],
        foodAndRefreshments: [],
        activitiesAndEntertainment: [],
        guestExperiences: [],
        invitationWording: { headline: input.name, body: 'Join us!', rsvpNote: 'RSVP soon.' },
        lowCostAlternatives: [],
        ecoFriendlyOptions: [],
      },
      risks,
      isSample: false,
    };

    res.json(fullPlan);
  } catch (error: unknown) {
    logGeminiFailure('Plan generation', error);
    res.status(500).json({ error: formatGeminiErrorMessage(error) });
  }
});

// 3. Regenerate single section endpoint
app.post('/api/events/regenerate-section', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedRequest = regenerateRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      sendInvalidRequest(res, parsedRequest.error.issues.map(({ path, message }) => ({ path, message })));
      return;
    }
    const { eventInput, section, instruction } = parsedRequest.data;

    const ai = getAIClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini API key is not configured.' });
      return;
    }

    let sectionSchema: Schema;
    let promptGoal = '';

    if (section === 'budget') {
      sectionSchema = fullPlanResponseSchema.properties.budget;
      promptGoal = `Regenerate the budget section for this ${eventInput.eventType} with total budget ₹${eventInput.totalBudget} INR for ${eventInput.guestCount} guests in ${eventInput.city}. Sum of allocatedAmount must equal ₹${eventInput.totalBudget}.`;
    } else if (section === 'timeline') {
      sectionSchema = fullPlanResponseSchema.properties.timeline;
      promptGoal = `Regenerate the preparation timeline leading up to ${eventInput.date} for this ${eventInput.eventType}.`;
    } else if (section === 'checklist') {
      sectionSchema = fullPlanResponseSchema.properties.checklist;
      promptGoal = `Regenerate vendor checklist categories and preparation tasks for this ${eventInput.eventType}.`;
    } else if (section === 'ideas') {
      sectionSchema = fullPlanResponseSchema.properties.ideas;
      promptGoal = `Regenerate personalized themes, decor, food, and activities for this ${eventInput.eventType}.`;
    } else if (section === 'risks') {
      sectionSchema = fullPlanResponseSchema.properties.risks;
      promptGoal = `Regenerate potential risks and actionable recommendations for this ${eventInput.eventType}.`;
    } else {
      res.status(400).json({ error: `Unknown section: ${section}` });
      return;
    }

    const prompt = `
${promptGoal}
${instruction ? `User special instructions: ${instruction}` : ''}
Event Details:
- Name: "${eventInput.name}"
- Date: ${eventInput.date}
- City: ${eventInput.city}
- Guests: ${eventInput.guestCount}
- Budget: ₹${eventInput.totalBudget} INR
- Theme: ${eventInput.theme || 'Open'}
Return only valid JSON matching the schema.
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: sectionSchema,
        },
      })
    );

    const responseText = response.text;
    if (!responseText) throw new Error('Empty response from model');
    const result = JSON.parse(responseText);
    const idSuffix = Date.now().toString(36);
    let normalizedResult: unknown = result;

    if (section === 'budget') {
      normalizedResult = normalizeBudgetItems(generatedBudgetSchema.parse(result), eventInput.totalBudget);
    } else if (section === 'timeline') {
      normalizedResult = generatedTimelineSchema.parse(result).map((item, index) => ({
        ...item,
        id: `t-${index + 1}-${idSuffix}`,
        dueDate: isValidISODate(item.dueDate) ? item.dueDate : eventInput.date,
        priority: normalizePriority(item.priority),
        status: 'pending' as const,
      }));
    } else if (section === 'checklist') {
      normalizedResult = generatedChecklistSchema.parse(result).map((item, index) => ({
        ...item,
        id: `c-${index + 1}-${idSuffix}`,
        deadline: isValidISODate(item.deadline) ? item.deadline : eventInput.date,
        priority: normalizePriority(item.priority),
        estimatedCost: Number.isFinite(Number(item.estimatedCost)) && Number(item.estimatedCost) >= 0 ? Number(item.estimatedCost) : 0,
        status: 'not_started' as const,
      }));
    } else if (section === 'risks') {
      normalizedResult = generatedRisksSchema.parse(result).map((item, index) => ({
        ...item,
        id: `r-${index + 1}-${idSuffix}`,
        severity: normalizePriority(item.severity),
      }));
    } else {
      normalizedResult = generatedIdeasSchema.parse(result);
    }

    res.json({ section, data: normalizedResult });
  } catch (error: unknown) {
    logGeminiFailure('Section regeneration', error);
    res.status(500).json({ error: formatGeminiErrorMessage(error) });
  }
});

// 4. Optimize Budget endpoint
app.post('/api/events/optimize-budget', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedRequest = optimizeRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      sendInvalidRequest(res, parsedRequest.error.issues.map(({ path, message }) => ({ path, message })));
      return;
    }
    const { plan, targetSavingsPercent } = parsedRequest.data;

    const ai = getAIClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini API key is not configured.' });
      return;
    }

    const prompt = `
Act as a master event financial auditor. Review this event plan and propose concrete, practical budget optimizations to achieve approximately ${targetSavingsPercent}% cost savings or reallocate funds to high-impact guest touchpoints without sacrificing core vision.

Event: "${plan.input.name}" (${plan.input.eventType}) in ${plan.input.city} for ${plan.input.guestCount} guests.
Current Budget: ₹${plan.input.totalBudget} INR.
Current Allocations: ${JSON.stringify(plan.budget.map(b => ({ category: b.category, amount: b.allocatedAmount })))}

Return a JSON object with:
1. "strategicAdvice": string (summary of 3-4 key tactical savings)
2. "recommendedBudget": array of items (each with category, proposedAmount, savingsAmount, rational)
3. "quickWins": array of strings (immediate low-friction cost cuts)
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategicAdvice: { type: Type.STRING },
              recommendedBudget: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    proposedAmount: { type: Type.NUMBER },
                    savingsAmount: { type: Type.NUMBER },
                    rational: { type: Type.STRING },
                  },
                  required: ['category', 'proposedAmount', 'savingsAmount', 'rational'],
                },
              },
              quickWins: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['strategicAdvice', 'recommendedBudget', 'quickWins'],
          },
        },
      })
    );

    const responseText = response.text;
    if (!responseText) throw new Error('Empty response from model');
    res.json(optimizedResponseSchema.parse(JSON.parse(responseText)));
  } catch (error: unknown) {
    logGeminiFailure('Budget optimization', error);
    res.status(500).json({ error: formatGeminiErrorMessage(error) });
  }
});

// 5. Make Creative endpoint
app.post('/api/events/make-creative', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedRequest = creativeRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      sendInvalidRequest(res, parsedRequest.error.issues.map(({ path, message }) => ({ path, message })));
      return;
    }
    const { plan, focusArea } = parsedRequest.data;

    const ai = getAIClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini API key is not configured.' });
      return;
    }

    const prompt = `
Act as an award-winning creative event producer. Take this event plan and inject unexpected, high-emotion, viral, memorable creative concepts suitable for ${plan.input.city} and within the ₹${plan.input.totalBudget} INR budget.

Event: "${plan.input.name}" (${plan.input.eventType}), ${plan.input.guestCount} guests. Focus area: ${focusArea}.

Return a JSON object with:
1. "themeConcept": string
2. "signatureGuestExperiences": array of strings (3 unique experiential moments)
3. "viralPhotoMoments": array of strings (Instagrammable decor setups)
4. "culinaryTwists": array of strings (interactive food or beverage stations)
5. "personalizedSurprises": array of strings (touching personalized gestures)
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              themeConcept: { type: Type.STRING },
              signatureGuestExperiences: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              viralPhotoMoments: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              culinaryTwists: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              personalizedSurprises: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'themeConcept',
              'signatureGuestExperiences',
              'viralPhotoMoments',
              'culinaryTwists',
              'personalizedSurprises',
            ],
          },
        },
      })
    );

    const responseText = response.text;
    if (!responseText) throw new Error('Empty response from model');
    res.json(creativeResponseSchema.parse(JSON.parse(responseText)));
  } catch (error: unknown) {
    logGeminiFailure('Creative ideas', error);
    res.status(500).json({ error: formatGeminiErrorMessage(error) });
  }
});

// 6. Conversational Event Assistant endpoint
app.post('/api/events/assistant', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedRequest = assistantRequestSchema.safeParse(req.body);
    if (!parsedRequest.success) {
      sendInvalidRequest(res, parsedRequest.error.issues.map(({ path, message }) => ({ path, message })));
      return;
    }
    const { plan, messages, userQuestion } = parsedRequest.data;

    const ai = getAIClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini API key is not configured.' });
      return;
    }

    const eventContext = plan
      ? `
CURRENT EVENT DETAILS:
- Event: "${plan.input.name}" (${plan.input.eventType})
- Date: ${plan.input.date} (${plan.input.durationHours || 5} hours)
- Location: ${plan.input.city}
- Guests: ${plan.input.guestCount}
- Budget: ₹${plan.input.totalBudget.toLocaleString('en-IN')} INR
- Theme: ${plan.overview?.recommendedTheme || plan.input.theme || 'Custom'}
- Allocations: ${plan.budget?.map(b => `${b.category}: ₹${b.allocatedAmount}`).join(', ')}
- Pending tasks: ${plan.timeline?.filter(t => t.status !== 'completed').map(t => t.title).join('; ')}
`
      : 'No specific event plan currently open.';

    const systemInstruction = `
You are the Planora AI Assistant — a friendly, world-class event concierge and logistical strategist.
You directly reference the user's specific event parameters (date, budget in INR, guest count, city, venue notes) to provide actionable, crisp, helpful answers.
You can:
- Write personalized invitation copy or WhatsApp message drafts.
- Advise on vendor negotiation tactics for Indian markets.
- Suggest realistic day-of run-of-show schedules with specific time-slots.
- Provide weather/seasonal tips for the event city.
Keep your response concise, polite, well-structured with bullet points where appropriate, and directly applicable.
`;

    const priorQuestions = messages
      .filter(message => message.sender === 'user')
      .slice(-6)
      .map(message => message.text)
      .join('\n');
    const chatContents = [{
      role: 'user' as const,
      parts: [{
        text: `${eventContext}\n\nRECENT USER QUESTIONS:\n${priorQuestions || 'None'}\n\nCURRENT USER QUESTION:\n${userQuestion}`,
      }],
    }];

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatContents,
        config: {
          systemInstruction,
        },
      })
    );

    const reply = response.text?.trim();
    if (!reply) throw new Error('Empty response from model');
    res.json({ reply });
  } catch (error: unknown) {
    logGeminiFailure('Event assistant', error);
    res.status(500).json({ error: formatGeminiErrorMessage(error) });
  }
});

// Keep unknown API URLs from falling through to the single-page app HTML.
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Convert parser failures to bounded JSON errors without exposing internals.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  const errorType = errorRecord(error).type;
  if (errorType === 'entity.parse.failed') {
    res.status(400).json({ error: 'Request body must contain valid JSON.' });
    return;
  }
  if (errorType === 'entity.too.large') {
    res.status(413).json({ error: 'Request body is too large.' });
    return;
  }
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// Vite Middleware integration in Dev / Static serving in Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Planora AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
