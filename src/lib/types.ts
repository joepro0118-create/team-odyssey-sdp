export const listingTypes = ["request", "offer", "lend"] as const;
export type ListingType = (typeof listingTypes)[number];
export const categories = [
  "Food & groceries",
  "Errands",
  "Medicine (OTC)",
  "Skills & tech",
  "Carrying",
  "Home & garden",
  "Borrow & lend",
  "Company",
] as const;
export type Category = string;
export const areas = [
  "Precinct 3",
  "Precinct 2",
  "Precinct 4",
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
  pointsReward?: number;
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

export type TaskMessage = {
  id: string;
  senderId: string;
  isSelf: boolean;
  senderLabel: string;
  message: string;
  createdAt: string;
};

export type TaskChatResponse = {
  messages: TaskMessage[];
  isLocked: boolean;
};

export type OperatorDashboardSummary = {
  openListings: number;
  acceptedListings: number;
  completedListings: number;
  totalPointsAwarded: number;
  totalRedemptions: number;
  demo: true;
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
    title: "Need eggs and bread from shop",
    description:
      "A dozen eggs and a loaf of bread, please. I can pay you back when we meet.",
    area: "Precinct 3",
    timing: "Today, before 6 pm",
    pointsReward: 20,
  },
  {
    label: "Tech help",
    type: "offer",
    category: "Skills & tech",
    title: "Help set up phone or video call",
    description:
      "Happy to help set up phone or video call for any resident who wants a hand with digital settings.",
    area: "Precinct 3",
    timing: "Weekends",
    pointsReward: 0,
  },
  {
    label: "Lend tools",
    type: "lend",
    category: "Borrow & lend",
    title: "Cordless drill available for day",
    description:
      "Cordless drill with bit set available to borrow for your home project. Pick up nearby in Precinct 4.",
    area: "Precinct 4",
    timing: "Pick up nearby",
    pointsReward: 10,
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
