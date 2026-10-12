import { test, expect } from "@playwright/test";

test("resident A posts, resident B accepts, and only participants see contact details", async ({
  page,
  browser,
}) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  const title = `Weekend garden help ${Date.now()}`;
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Around the neighbourhood" }),
  ).toBeVisible();
  await expect(page.locator(".listing-card").first()).toBeVisible();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await page
    .getByRole("button", { name: "Post to your neighbourhood" })
    .click();
  await page.getByRole("button", { name: "Pick up groceries" }).click();
  await page.getByLabel("Give it a clear title").fill(title);
  await page
    .getByRole("button", { name: "Review needs a hand listing" })
    .click();
  await expect(
    page.getByRole("heading", { name: "One last look" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Post to neighbourhood", exact: true })
    .click();
  await expect(
    page.getByText("This is your listing.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();

  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  await second.goto("/");
  await second
    .getByLabel("Demo resident", { exact: true })
    .selectOption("resident-b");
  await expect(
    second.getByLabel("Demo resident", { exact: true }),
  ).toBeEnabled();
  await second.getByRole("button", { name: title, exact: true }).click();
  await expect(second.getByText("Aina (fictional resident A)")).toHaveCount(0);
  await second.getByRole("button", { name: "I can lend a hand" }).click();
  await second.getByRole("button", { name: "Confirm acceptance" }).click();
  await expect(
    second.getByRole("heading", { name: "You’re connected" }),
  ).toBeVisible();
  await expect(second.getByText("Aina (fictional resident A)")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "My activity" }).first().click();
  await page.getByRole("button", { name: title, exact: true }).click();
  await expect(page.getByText("Ben (fictional resident B)")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByLabel("Demo resident", { exact: true })
    .selectOption("resident-c");
  await expect(page.getByLabel("Demo resident", { exact: true })).toBeEnabled();
  await page
    .getByRole("button", { name: "Neighbourhood", exact: true })
    .first()
    .click();
  await page.getByLabel("Include accepted").check();
  await page.getByRole("button", { name: title, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A neighbour has stepped in" }),
  ).toBeVisible();
  await expect(page.getByText("Ben (fictional resident B)")).toHaveCount(0);
  await expect(page.getByText("Aina (fictional resident A)")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "I can lend a hand" }),
  ).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
  await secondContext.close();
});

test("mobile feed, filtering, empty state, and form keyboard dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".listing-card").first()).toBeVisible();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "To borrow", exact: true }).click();
  await expect(page.locator(".listing-card")).toHaveCount(2);
  await page.getByLabel("Search listings").fill("no-match-for-this-query");
  await expect(
    page.getByRole("heading", { name: "A little quiet in this corner" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".listing-card").first()).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Post", exact: true })
    .click();
  await page.getByText("Lend an item", { exact: true }).click();
  await page.getByRole("button", { name: "Lend a tool" }).click();
  await expect(page.getByLabel("Give it a clear title")).toHaveValue(
    "A cordless drill to lend",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("failed feed shows recovery and can reload successfully", async ({
  page,
}) => {
  await page.route("**/api/listings", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Demo is temporarily unavailable." }),
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Demo is temporarily unavailable.",
  );
  await page.unroute("**/api/listings");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".listing-card").first()).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("API enforces identity, status transitions, privacy, validation, and origin", async ({
  request,
  playwright,
}) => {
  const input = {
    type: "offer",
    title: "A short computer lesson",
    description:
      "Happy to help with basic computer skills at the community hub.",
    category: "Skills & tech",
    area: "Community hub",
    timing: "Saturday morning",
    ownerId: "resident-c",
    status: "accepted",
  };
  const created = await request.post("/api/listings", { data: input });
  expect(created.status()).toBe(201);
  const listing = await created.json();
  expect(listing.status).toBe("open");
  expect(
    (
      await request.post(`/api/listings/${listing.id}/accept`, { data: {} })
    ).status(),
  ).toBe(403);
  const b = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3000",
  });
  const c = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3000",
  });
  await b.post("/api/demo-session", { data: { resident: "resident-b" } });
  await c.post("/api/demo-session", { data: { resident: "resident-c" } });
  const results = await Promise.all([
    b.post(`/api/listings/${listing.id}/accept`, { data: {} }),
    c.post(`/api/listings/${listing.id}/accept`, { data: {} }),
  ]);
  expect(results.map((result) => result.status()).sort()).toEqual([200, 409]);
  const loser = results[0].status() === 409 ? b : c;
  expect(
    (await (await loser.get(`/api/listings/${listing.id}`)).json()).contact,
  ).toBeUndefined();
  expect(
    JSON.stringify(await (await c.get("/api/listings")).json()),
  ).not.toMatch(/ownerId|acceptedBy|meetingNote|fictional resident/);
  expect(
    (
      await request.post("/api/listings", {
        data: {
          ...input,
          description: "Please collect prescription medication today.",
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/listings", {
        headers: { Origin: "https://unrelated.example" },
        data: input,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/listings", {
        headers: { "Content-Type": "application/json" },
        data: "{",
      })
    ).status(),
  ).toBe(400);
  expect((await request.get("/api/listings/missing-listing")).status()).toBe(
    404,
  );
  expect(
    (
      await request.post("/api/demo-session", { data: { resident: "admin" } })
    ).status(),
  ).toBe(400);
  await b.dispose();
  await c.dispose();
});
