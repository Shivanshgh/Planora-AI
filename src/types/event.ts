import { z } from 'zod';

export type EventType = 'wedding' | 'birthday' | 'community' | 'corporate' | 'anniversary';

export type BudgetFlexibility = 'strict' | 'moderate' | 'flexible';

export type SettingType = 'indoor' | 'outdoor' | 'hybrid' | 'any';

export interface EventInput {
  id: string;
  name: string;
  eventType: EventType;
  date: string; // YYYY-MM-DD
  city: string;
  guestCount: number;
  totalBudget: number; // in INR
  durationHours?: number;
  theme?: string;
  setting?: SettingType;
  dietary?: string;
  cultural?: string;
  language?: string;
  mustHaveActivities?: string;
  specialRequirements?: string;
  budgetFlexibility?: BudgetFlexibility;
}

export const eventInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, 'Event name must be at least 2 characters').max(120),
  eventType: z.enum(['wedding', 'birthday', 'community', 'corporate', 'anniversary']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD)')
    .refine(value => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    }, 'Date must be a real calendar date'),
  city: z.string().trim().min(2, 'City/location is required').max(120),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1').max(20000, 'Guest count exceeds maximum'),
  totalBudget: z.number().min(5000, 'Minimum budget is ₹5,000').max(1000000000, 'Budget exceeds limit'),
  durationHours: z.number().min(1).max(72).optional(),
  theme: z.string().max(500).optional(),
  setting: z.enum(['indoor', 'outdoor', 'hybrid', 'any']).optional(),
  dietary: z.string().max(1000).optional(),
  cultural: z.string().max(1000).optional(),
  language: z.string().max(100).optional(),
  mustHaveActivities: z.string().max(1000).optional(),
  specialRequirements: z.string().max(2000).optional(),
  budgetFlexibility: z.enum(['strict', 'moderate', 'flexible']).optional(),
});

export interface EventOverview {
  concept: string;
  tagline: string;
  recommendedTheme: string;
  suggestedAtmosphere: string;
  keyPriorities: string[];
  explanation: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  allocatedAmount: number; // in INR
  percentage: number;
  explanation: string;
  costSavingAlternative: string;
  actualSpent?: number;
  notes?: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  suggestedDeadline: string; // e.g., "3 months before event"
  dueDate: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  category?: string;
}

export interface VendorItem {
  id: string;
  category: string;
  task: string;
  notes: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  status: 'not_started' | 'in_progress' | 'completed';
  estimatedCost: number;
  actualCost?: number;
}

export interface ColorPaletteItem {
  name: string;
  hex: string;
}

export interface ThemeIdea {
  name: string;
  palette: ColorPaletteItem[];
  description: string;
}

export interface PersonalizedIdeas {
  themesAndColors: ThemeIdea[];
  decorations: string[];
  foodAndRefreshments: string[];
  activitiesAndEntertainment: string[];
  guestExperiences: string[];
  invitationWording: {
    headline: string;
    body: string;
    rsvpNote: string;
  };
  lowCostAlternatives: string[];
  ecoFriendlyOptions: string[];
}

export interface RiskAndRecommendation {
  id: string;
  risk: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  actionItem: string;
}

export interface EventPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: EventInput;
  overview: EventOverview;
  budget: BudgetItem[];
  timeline: TimelineTask[];
  checklist: VendorItem[];
  ideas: PersonalizedIdeas;
  risks: RiskAndRecommendation[];
  isSample?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
