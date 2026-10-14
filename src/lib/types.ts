export const listingTypes = ["request", "offer", "lend"] as const;
export type ListingType = (typeof listingTypes)[number];
export const categories = [
  "Errands",
  "Food & groceries",
  "Skills & tech",
  "Home & garden",
  "Borrow & lend",
] as const;
export type Category = string;
export const areas = [
  "Community hub",
  "Garden precinct",
  "Lakeside precinct",
] as const;
export type Area = string;
export type ListingStatus =
  | "open"
  | "accepted"
  | "awaiting_confirmation"
  | "completed"
  | "cancelled";

// Retained only for the isolated preview tests; production identity comes from Supabase Auth.
export const residentIds = ["resident-a", "resident-b", "resident-c"] as const;
export type ResidentId = (typeof residentIds)[number];

export type ListingInput = {
  type: ListingType;
  category: Category;
  title: string;
  description: string;
  area: Area;
  timing: string;
};

export type Listing = ListingInput & {
  id: string;
  createdAt: string;
  status: ListingStatus;
  pointsReward: number;
  isOwner: boolean;
  isParticipant: boolean;
};

export type ListingDetail = Listing & {
  assignmentId?: string;
  viewerRole: "requester" | "helper" | "viewer";
  contact?: { name: string; meetingNote: string };
};

export type FeedResponse = {
  listings: Listing[];
  resident: {
    id: string;
    label: string;
    area: string;
  };
  demo: true;
};

export type ConfirmationResult = {
  qrToken: string;
  expiresAt: string;
};

export type CompletionResult = {
  assignmentId: string;
  status: "completed";
  pointsAwarded: number;
};

export type Reward = {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  isDemo: true;
};

export type Redemption = {
  id: string;
  rewardId: string;
  pointsSpent: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

export type RewardsResponse = {
  balance: number;
  rewards: Reward[];
};

export const typeLabels: Record<ListingType, string> = {
  request: "Needs a hand",
  offer: "Offering help",
  lend: "To borrow",
};

export const templates: (ListingInput & { label: string })[] = [
  {
    label: "Pick up groceries",
    type: "request",
    category: "Food & groceries",
    title: "A few groceries on your way home?",
    description:
      "Could a neighbour help collect a small bag of groceries? We can arrange a handover at the community hub.",
    area: "Community hub",
    timing: "Today, after 5 pm",
  },
  {
    label: "A little tech help",
    type: "request",
    category: "Skills & tech",
    title: "A hand with my phone settings",
    description:
      "I would appreciate some help making the text on my phone easier to read. A short session at the community hub would be lovely.",
    area: "Community hub",
    timing: "This weekend",
  },
  {
    label: "Share a skill",
    type: "offer",
    category: "Skills & tech",
    title: "Happy to help with basic computer skills",
    description:
      "I have some time to help a neighbour practise simple computer tasks. Let us meet at the community hub.",
    area: "Community hub",
    timing: "Saturday afternoon",
  },
  {
    label: "Help with an errand",
    type: "offer",
    category: "Errands",
    title: "Heading to the shops — can I help?",
    description:
      "I can collect a small grocery order for a neighbour while I am out. Collection and handover can be arranged after accepting.",
    area: "Garden precinct",
    timing: "Tomorrow morning",
  },
  {
    label: "Lend a tool",
    type: "lend",
    category: "Borrow & lend",
    title: "A cordless drill to lend",
    description:
      "A drill and basic bit set are available for a small home project. Please return them clean; we can agree on the return time together.",
    area: "Garden precinct",
    timing: "Available this weekend",
  },
  {
    label: "Lend garden gear",
    type: "lend",
    category: "Home & garden",
    title: "Garden tools for a little weekend project",
    description:
      "A small set of hand tools is available to borrow. Happy to arrange collection and return at the community hub.",
    area: "Lakeside precinct",
    timing: "Saturday or Sunday",
  },
];
