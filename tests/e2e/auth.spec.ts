import { expect, test } from "@playwright/test";

test("login screen loads without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back, neighbour." })).toBeVisible();
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("login fits mobile and preserves signup and password controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/login-mobile.png", fullPage: true });
  const signIn = page.getByRole("button", { name: "Sign in", exact: true });
  if (await signIn.isDisabled()) {
    await expect(page.getByRole("status")).toContainText("not configured");
    return;
  }
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Need a demo account?" }).click();
  await expect(page.getByLabel("Anonymous display label")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByRole("button", { name: "Create demo account" })).toBeVisible();
});

test("invalid credentials show a useful error (mocked Auth response)", async ({ page }) => {
  await page.goto("/login");
  const signIn = page.getByRole("button", { name: "Sign in", exact: true });
  test.skip(await signIn.isDisabled(), "Public Supabase configuration is absent.");
  // No passwords or accounts are sent to the live service.
  await page.route("**/auth/v1/token?grant_type=password", route => route.fulfill({
    status: 400, contentType: "application/json",
    headers: {
      "X-Supabase-Api-Version": "2024-01-01",
      "Access-Control-Expose-Headers": "X-Supabase-Api-Version",
    },
    body: JSON.stringify({ code: "invalid_credentials", msg: "Invalid login credentials" }),
  }));
  await page.getByLabel("Email address", { exact: true }).fill("fictional@tolong-demo.test");
  await page.getByLabel("Password", { exact: true }).fill("fictional-test-input");
  await signIn.click();
  await expect(page.getByRole("region", { name: "Welcome back, neighbour." }).getByRole("alert")).toContainText("don’t match");
  await expect(signIn).toBeEnabled();
});

test("callback rejects missing code and ignores external redirect destinations", async ({ request }) => {
  const response = await request.get("/auth/callback?next=https://example.com", { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toMatch(/^\/login\?error=(oauth_failed|not_configured)$/);
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("marketplace and rewards APIs reject missing identities", async ({ request }) => {
  for (const path of ["/api/listings", "/api/rewards"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toContain("sign in");
  }
});
