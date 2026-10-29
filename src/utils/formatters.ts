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

export function getDefaultRunOfShow(eventType: string): {
  id: string;
  time: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed';
}[] {
  if (eventType === 'wedding') {
    return [
      { id: 'ros-w1', time: '08:00 AM', title: 'Vendor Load-In & Mandap Production', description: 'Florists, sound engineers, and stage decorators arrive for setup and sound testing.', assignedTo: 'Lead Coordinator', status: 'completed' },
      { id: 'ros-w2', time: '10:30 AM', title: 'Bridal & Groom Styling and Makeup', description: 'Hair, makeup, and attire dressing in bridal suites. Ensure emergency kit is accessible.', assignedTo: 'Stylist & Bridesmaids', status: 'in_progress' },
      { id: 'ros-w3', time: '01:30 PM', title: 'Pre-Ceremony Candid Photo Session', description: 'Couple portraits and family photos during natural daylight in the courtyard.', assignedTo: 'Lead Photographer', status: 'pending' },
      { id: 'ros-w4', time: '04:00 PM', title: 'Guest Reception & Welcome Refreshments', description: 'Kesariya thandai and mocktails served as guests arrive and are seated.', assignedTo: 'Hospitality Team', status: 'pending' },
      { id: 'ros-w5', time: '04:45 PM', title: 'Grand Baraat Procession', description: 'Groom arrival with dhol ensemble and synchronized cousin flashmob along the boulevard.', assignedTo: 'Groomsmen Lead', status: 'pending' },
      { id: 'ros-w6', time: '05:30 PM', title: 'Sunset Varmala Exchange', description: 'Floral garland exchange on elevated rotunda with organic rose petal cannons.', assignedTo: 'Emcee & Coordinator', status: 'pending' },
      { id: 'ros-w7', time: '06:30 PM', title: 'Sacred Pheras & Wedding Vows', description: 'Vedic ceremony around the sacred fire with live shehnai and flute acoustics.', assignedTo: 'Pandit Ji & Family', status: 'pending' },
      { id: 'ros-w8', time: '08:00 PM', title: 'Royal Dinner Banquet & Sufi Night', description: 'Multi-course live banquet counters open alongside acoustic Sufi melodies.', assignedTo: 'Catering Lead', status: 'pending' },
      { id: 'ros-w9', time: '10:30 PM', title: 'Vidaai & Farewell Send-off', description: 'Emotional family blessings and decorated departure carriage send-off.', assignedTo: 'Immediate Family', status: 'pending' },
    ];
  }

  if (eventType === 'birthday') {
    return [
      { id: 'ros-b1', time: '03:00 PM', title: 'Venue Access, Balloon & Backdrop Rigging', description: 'Decorator sets up balloon garland, neon signage, and audio playback test.', assignedTo: 'Party Stylist', status: 'completed' },
      { id: 'ros-b2', time: '04:30 PM', title: 'Cake Delivery & Refreshment Station Inspection', description: 'Inspect custom cake display and verify mocktail and appetizer temperature.', assignedTo: 'Host / Cake Baker', status: 'in_progress' },
      { id: 'ros-b3', time: '05:00 PM', title: 'Guest Arrival & Welcome Activity Corner', description: 'Welcome drinks served; guests explore interactive arcade / DIY craft corner.', assignedTo: 'Welcome Host', status: 'pending' },
      { id: 'ros-b4', time: '05:30 PM', title: 'Game Master Challenges & Competitions', description: 'High-energy group games, trivia showdown, and kids obstacle relays.', assignedTo: 'Game Master', status: 'pending' },
      { id: 'ros-b5', time: '07:00 PM', title: 'Grand Cake Cutting & Toast', description: 'Birthday anthem, confetti pop, sparklers, and group celebration photo.', assignedTo: 'Lead Photographer', status: 'pending' },
      { id: 'ros-b6', time: '07:30 PM', title: 'Dinner Buffet & Dessert Bar Opens', description: 'Live slider, pasta, and pizza counters open for all guests.', assignedTo: 'Catering Crew', status: 'pending' },
      { id: 'ros-b7', time: '09:00 PM', title: 'Dance Floor Beat Drop & Return Gifts', description: 'High-energy DJ dance floor session followed by personalized return gift distribution.', assignedTo: 'DJ & Host', status: 'pending' },
    ];
  }

  // Community or general
  return [
    { id: 'ros-c1', time: '07:00 AM', title: 'Site Setup, Electrical & Audio Rigging', description: 'Canopies, stall allotment, stage backdrop, and power generator checks.', assignedTo: 'Logistics Volunteer', status: 'completed' },
    { id: 'ros-c2', time: '08:30 AM', title: 'Safety, Fire Extinguisher & First-Aid Check', description: 'Verify paramedic kit, clean drinking water kiosks, and emergency exit signs.', assignedTo: 'Safety Marshal', status: 'in_progress' },
    { id: 'ros-c3', time: '09:30 AM', title: 'Official Inauguration & Ribbon Cutting', description: 'Dignitary welcome address, ceremonial lamp lighting, and national anthem.', assignedTo: 'Organizing Committee', status: 'pending' },
    { id: 'ros-c4', time: '10:30 AM', title: 'Cultural Performances & Craft Fair Opens', description: 'Youth dance troupe, choir, and local artisan pottery/weaving stalls open.', assignedTo: 'Stage Lead', status: 'pending' },
    { id: 'ros-c5', time: '01:00 PM', title: 'Community Street Food Bazaar', description: 'Regional food stalls serve lunch with strict eco-friendly cutlery compliance.', assignedTo: 'Food & Health Lead', status: 'pending' },
    { id: 'ros-c6', time: '03:30 PM', title: 'Inter-Community Games & Friendly Contests', description: 'Rangoli competition, children painting contest, and tug-of-war championship.', assignedTo: 'Sports Committee', status: 'pending' },
    { id: 'ros-c7', time: '06:00 PM', title: 'Headline Musical Evening & Diya Display', description: 'Live fusion band performance followed by synchronized evening diya lighting.', assignedTo: 'Cultural Lead', status: 'pending' },
    { id: 'ros-c8', time: '08:30 PM', title: 'Awards Ceremony & Vote of Thanks', description: 'Trophy distribution for competition winners and recognition of volunteers.', assignedTo: 'Committee President', status: 'pending' },
  ];
}
