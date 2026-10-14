import { expect, test, type Page } from "@playwright/test";

const residentA = {
  email: process.env.E2E_RESIDENT_A_EMAIL ?? "",
  password: process.env.E2E_RESIDENT_A_PASSWORD ?? "",
};
const residentB = {
  email: process.env.E2E_RESIDENT_B_EMAIL ?? "",
  password: process.env.E2E_RESIDENT_B_PASSWORD ?? "",
};
const hasLiveTestConfiguration = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    residentA.email &&
    residentA.password &&
    residentB.email &&
    residentB.password,
);

async function signIn(
  page: Page,
  resident: { email: string; password: string },
) {
  await page.goto("/");
  await page.getByLabel("Email").fill(resident.email);
  await page.getByLabel("Password").fill(resident.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Around the neighbourhood" }),
  ).toBeVisible();
}

test.describe("live Supabase resident flow", () => {
  test.skip(
    !hasLiveTestConfiguration,
    "Set public Supabase variables and two E2E demo resident accounts.",
  );

  test("two residents can post, accept, and generate handover QR", async ({
    page,
    browser,
  }) => {
    const title = `Neighbour help ${Date.now()}`;
    await signIn(page, residentA);
    await page
      .getByRole("button", { name: "Post to your neighbourhood" })
      .click();
    await page.getByRole("button", { name: "Pick up groceries" }).click();
    await page.getByLabel("Give it a clear title").fill(title);
    await page
      .getByRole("button", { name: "Review needs a hand listing" })
      .click();
    await page
      .getByRole("button", { name: "Post to neighbourhood", exact: true })
      .click();
    await expect(page.getByText("This is your listing.")).toBeVisible();

    const helperContext = await browser.newContext();
    const helper = await helperContext.newPage();
    await signIn(helper, residentB);
    await helper.getByRole("button", { name: title, exact: true }).click();
    await helper.getByRole("button", { name: "I can lend a hand" }).click();
    await helper
      .getByRole("button", { name: "Confirm acceptance" })
      .click();
    await expect(
      helper.getByRole("heading", { name: "You’re connected" }),
    ).toBeVisible();
    await helper.getByRole("button", { name: "Generate QR" }).click();
    await expect(helper.locator(".generated-qr svg")).toBeVisible();
    await helperContext.close();
  });

  test("authenticated mobile feed does not overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, residentA);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeVisible();
  });
});
