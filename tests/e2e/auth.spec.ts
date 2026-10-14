import { test, expect } from "@playwright/test";

test.describe("unconfigured account sign-in", () => {
  test.skip(
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    "These checks exercise the setup state without real auth credentials.",
  );

  test("login HTTP response disables credentials and links to the demo", async ({
    request,
  }) => {
    const response = await request.get("/login");
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("Account sign-in is coming soon.");
    expect(html).toContain("Continue with Google");
    expect(html).toContain("<fieldset disabled=");
    expect(html).toContain("Explore the demo");
  });

  test("OAuth callback fails safely without a configured provider", async ({
    request,
  }) => {
    const response = await request.get(
      "/auth/callback?code=untrusted&next=https://example.com",
      {
        maxRedirects: 0,
      },
    );
    expect(response.status()).toBe(303);
    const location = new URL(response.headers().location, response.url());
    expect(location.origin).toBe("http://127.0.0.1:3000");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("not_configured");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["set-cookie"]).toBeUndefined();
  });

  test("login is accessible on mobile and cannot simulate a successful sign-in", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back, neighbour." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeDisabled();
    await expect(page.getByLabel("Email address")).toBeDisabled();
    await expect(page.getByLabel("Password", { exact: true })).toBeDisabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/login-mobile.png",
      fullPage: true,
    });
    await page.getByRole("link", { name: "Explore the demo" }).click();
    await expect(
      page.getByRole("heading", { name: "Around the neighbourhood" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: "test-results/login-desktop.png",
      fullPage: true,
    });
  });
});
