# Tolong Frontend Backend Contract

**Status:** Draft for review  
**Backend owner:** Member 4  
**Frontend reviewer:** Member 3  
**Date:** 2026-10-13

## Purpose

This document defines how the Tolong frontend communicates with the Supabase backend. Member 3 and Member 4 should review and approve it before the interface is connected to live data.

The contract covers:

- Data sent by the frontend.
- Data returned by the backend.
- Protected operations and access rules.
- Expected error codes.
- Database-to-TypeScript field naming.

## General conventions

- The TypeScript application uses `camelCase` field names.
- Supabase tables use `snake_case` column names.
- Dates are returned as ISO 8601 strings.
- IDs are UUID strings.
- All content is simulated demo data.
- Public marketplace screens must not display names, unit numbers, email addresses, or other personal details.
- The frontend must not directly modify task confirmations, points, redemptions, or reward stock.

## Shared TypeScript types

```ts
export type ListingType = "request" | "offer" | "lend";

export type ListingStatus =
  | "open"
  | "accepted"
  | "awaiting_confirmation"
  | "completed"
  | "cancelled";

export interface Listing {
  id: string;
  listingType: ListingType;
  category: string;
  title: string;
  description: string;
  pointsReward: number;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingInput {
  listingType: ListingType;
  category: string;
  title: string;
  description: string;
}

export interface TaskAssignment {
  id: string;
  listingId: string;
  acceptedAt: string;
  completedAt: string | null;
}

export interface TaskDetails {
  assignment: TaskAssignment;
  listing: Listing;
  viewerRole: "requester" | "helper" | "operator";
}

export interface ConfirmationResult {
  qrToken: string;
  expiresAt: string;
}

export interface CompletionResult {
  assignmentId: string;
  status: "completed";
  pointsAwarded: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  isDemo: true;
}

export interface Redemption {
  id: string;
  rewardId: string;
  pointsSpent: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
}
```

## Result and error format

All application operations should return the same result shape.

```ts
export type BackendErrorCode =
  | "AUTH_REQUIRED"
  | "VALIDATION_ERROR"
  | "LISTING_NOT_FOUND"
  | "LISTING_NOT_OPEN"
  | "CANNOT_ACCEPT_OWN_LISTING"
  | "NOT_TASK_PARTICIPANT"
  | "INVALID_OR_EXPIRED_QR"
  | "QR_ALREADY_USED"
  | "INSUFFICIENT_POINTS"
  | "REWARD_OUT_OF_STOCK"
  | "UNKNOWN_ERROR";

export interface BackendError {
  code: BackendErrorCode;
  message: string;
}

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: BackendError };
```

The interface should show friendly messages based on `error.code`. It should not display raw database errors to residents.

## Operations

### Get open listings

```ts
getOpenListings(): Promise<ApiResult<Listing[]>>
```

- Returns listings whose status is `open`.
- Does not return resident names, email addresses, or unit numbers.
- Used by the marketplace feed.

### Create a listing

```ts
createListing(input: CreateListingInput): Promise<ApiResult<Listing>>
```

- Requires an authenticated resident.
- The backend obtains `creatorId` from the session.
- The initial status is always `open`.
- The initial points reward is 50.
- The frontend cannot provide its own creator ID, points value, or status.

### Cancel a listing

```ts
cancelListing(listingId: string): Promise<ApiResult<Listing>>
```

- Only the creator can cancel the listing.
- Only an `open` listing can be cancelled through the ordinary resident interface.

### Accept a listing

```ts
acceptListing(listingId: string): Promise<ApiResult<TaskAssignment>>
```

- Calls the protected Supabase function `accept_listing`.
- The backend obtains the helper ID from the authenticated session.
- A resident cannot accept their own listing.
- A listing can only be accepted once.
- The listing changes from `open` to `accepted`.

### Get accepted task details

```ts
getTask(assignmentId: string): Promise<ApiResult<TaskDetails>>
```

- Available only to the requester, helper, and operator.
- Returns the listing and assignment state required by the accepted-task screen.
- No additional personal contact information is currently stored.

### Create a QR confirmation

```ts
createConfirmation(
  assignmentId: string,
): Promise<ApiResult<ConfirmationResult>>
```

- Calls the protected Supabase function `create_confirmation`.
- Only the assigned helper can generate the QR token.
- The raw token is returned to the helper for QR rendering.
- The database stores only a hash of the token.
- The token expires after 15 minutes.
- Generating the token changes the listing to `awaiting_confirmation`.

### Confirm task completion

```ts
confirmCompletion(
  qrToken: string,
): Promise<ApiResult<CompletionResult>>
```

- Calls the protected Supabase function `confirm_completion`.
- Only the requester can confirm the task.
- The token must be valid, unexpired, and unused.
- Completion and the 50-point award happen in one database transaction.
- A task can award points only once.

### Get the current points balance

```ts
getPointsBalance(): Promise<ApiResult<number>>
```

- Calls the protected Supabase function `get_my_points_balance`.
- Returns the sum of the signed-in resident's point transactions.

### Get active rewards

```ts
getRewards(): Promise<ApiResult<Reward[]>>
```

- Returns active demo rewards.
- Rewards should show a visible demo-data indicator.

### Redeem a reward

```ts
redeemReward(rewardId: string): Promise<ApiResult<Redemption>>
```

- Calls the protected Supabase function `redeem_reward`.
- The backend checks the resident's point balance.
- The backend checks and locks reward stock.
- The redemption, points deduction, and stock reduction happen together.

### Get operator dashboard totals

```ts
getOperatorDashboardSummary(): Promise<
  ApiResult<{
    openListings: number;
    acceptedListings: number;
    completedListings: number;
    totalPointsAwarded: number;
    totalRedemptions: number;
  }>
>
```

- Calls the protected Supabase function `operator_dashboard_summary`.
- Available only to an authenticated operator.
- Returns aggregate demo information rather than a public resident directory.

## Database field mapping

| Database field | TypeScript field |
| --- | --- |
| `listing_type` | `listingType` |
| `points_reward` | `pointsReward` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `listing_id` | `listingId` |
| `accepted_at` | `acceptedAt` |
| `completed_at` | `completedAt` |
| `qr_token` | `qrToken` |
| `expires_at` | `expiresAt` |
| `points_awarded` | `pointsAwarded` |
| `points_cost` | `pointsCost` |
| `reward_id` | `rewardId` |
| `points_spent` | `pointsSpent` |
| `is_demo` | `isDemo` |

## Frontend responsibilities

- Validate required fields before submission.
- Show loading, empty, success, and error states.
- Disable repeated submissions while an operation is running.
- Treat the QR token as temporary data and do not store it permanently.
- Show a visible demo-data indicator on simulated listings and rewards.
- Display friendly messages based on the agreed error codes.
- Refresh relevant screens after acceptance, confirmation, or redemption.

## Backend responsibilities

- Validate the authenticated user for every operation.
- Enforce allowed task-status transitions.
- Prevent self-acceptance and duplicate acceptance.
- Restrict accepted-task details to participants and operators.
- Prevent expired or reused QR tokens.
- Award points exactly once.
- Prevent direct browser writes to points and redemptions.
- Check point balance and reward stock during redemption.
- Return safe, predictable application errors.

## Decisions required from Member 3

- Confirm that the listing fields support the planned create-listing form.
- Agree on the initial listing categories.
- Confirm whether points should appear on marketplace cards.
- Confirm what the accepted-task screen needs to display.
- Confirm the loading, empty, success, and error states for each screen.
- Confirm that the QR scanner sends only the raw token.
- Confirm that camelCase TypeScript fields are acceptable.

## Approval

This contract remains a draft until Member 3 and Member 4 agree on the open decisions. Any database changes requested during review must be implemented through a new migration rather than by editing an already applied migration.
