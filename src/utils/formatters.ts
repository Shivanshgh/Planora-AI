/**
 * Formatting and calculation utilities for Planora AI
 * Specifically tailored for Indian Rupee (INR) conventions and event schedules.
 */

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatNumberIndian(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'TBD';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function getDaysRemaining(targetDateStr: string | undefined): number {
  if (!targetDateStr) return 0;
  try {
    const target = new Date(targetDateStr).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function isOverdue(dueDateStr: string | undefined): boolean {
  if (!dueDateStr) return false;
  try {
    const due = new Date(dueDateStr).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today.getTime();
  } catch {
    return false;
  }
}

export function calculatePerGuestBudget(totalBudget: number, guestCount: number): number {
  if (!guestCount || guestCount <= 0) return 0;
  return Math.round(totalBudget / guestCount);
}

/**
 * Assesses whether the budget is realistic given event type, guest count, and tier.
 */
export function assessBudgetHealth(
  eventType: string,
  totalBudget: number,
  guestCount: number,
  city: string
): {
  status: 'healthy' | 'tight' | 'unrealistic' | 'luxury';
  perGuest: number;
  message: string;
} {
  const perGuest = calculatePerGuestBudget(totalBudget, guestCount);

  // Benchmarks per guest in INR for Indian venues and catering
  let minRealistic = 500;
  let comfortable = 1500;
  let luxury = 5000;

  if (eventType === 'wedding') {
    minRealistic = 1200; // Venue + decor + multi-course food
    comfortable = 3500;
    luxury = 10000;
  } else if (eventType === 'birthday') {
    minRealistic = 400;
    comfortable = 1200;
    luxury = 3500;
  } else if (eventType === 'community') {
    minRealistic = 250;
    comfortable = 800;
    luxury = 2500;
  }

  // Adjust for Tier 1 metro cities (Mumbai, Delhi, Bengaluru, etc.)
  const isMetro = ['mumbai', 'delhi', 'bengaluru', 'bangalore', 'chennai', 'hyderabad', 'kolkata', 'gurugram', 'noida', 'pune'].some(
    m => city.toLowerCase().includes(m)
  );

  if (isMetro) {
    minRealistic = Math.round(minRealistic * 1.3);
    comfortable = Math.round(comfortable * 1.25);
  }

  if (perGuest < minRealistic) {
    return {
      status: 'unrealistic',
      perGuest,
      message: `Budget of ${formatINR(perGuest)}/guest is likely too tight for a ${eventType} in ${city || 'this location'}. Standard venue, catering, and essential decor typically start at ${formatINR(minRealistic)}/guest. Consider trimming the guest list or increasing the budget.`,
    };
  }

  if (perGuest < comfortable) {
    return {
      status: 'tight',
      perGuest,
      message: `Budget of ${formatINR(perGuest)}/guest is modest. You will need strict venue and decor negotiations and cost-conscious catering selections.`,
    };
  }

  if (perGuest > luxury) {
    return {
      status: 'luxury',
      perGuest,
      message: `Generous budget of ${formatINR(perGuest)}/guest! You have ample room for premium styling, live entertainment, cinematic videography, and curated guest favors.`,
    };
  }

  return {
    status: 'healthy',
    perGuest,
    message: `Balanced budget of ${formatINR(perGuest)}/guest. Fits well with standard industry benchmarks for a polished experience.`,
  };
}
