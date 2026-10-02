import { test, expect } from "@playwright/test";
test("public routes, filter, estimate, detail gallery and mobile navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Personalized calendars.",
  );
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.goto("/designs");
  await page.getByRole("button", { name: "Vertical", exact: true }).click();
  await expect(page.locator(".design-card")).toHaveCount(1);
  await expect(page.locator(".design-card")).toContainText(
    "Architectural notes",
  );
  await page.getByRole("button", { name: "All designs" }).click();
  await page.getByRole("textbox", { name: "Search designs" }).fill("SC-001");
  await expect(page.locator(".design-card")).toHaveCount(1);
  await page.goto("/pricing");
  await page.locator(".estimator input").fill("600");
  await expect(page.locator(".estimate-total")).toContainText("1,13,400");
  await page.goto("/designs/botanical-studies");
  await page.getByRole("button", { name: "Open image preview" }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".light-controls")).toContainText("2 / 3");
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("link", { name: "Discuss on WhatsApp" }),
  ).toHaveAttribute("href", /SC-001/);
  for (const route of ["/products", "/about", "/contact", "/faq"]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Calendar Designs" })
    .click();
  await expect(page).toHaveURL(/designs/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Personalized calendars.",
  );
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("admin protection, inquiry handling, draft isolation and publishing", async ({
  page,
  request,
}) => {
  expect((await request.get("/api/content")).status()).toBe(401);
  expect((await request.get("/api/inquiries")).status()).toBe(401);
  await page.goto(
    "/contact?design=Botanical%20studies%20(SC-001)&path=/designs/botanical-studies",
  );
  await page.getByLabel("Your name").fill("Browser test inquiry");
  await page.getByLabel("Email address").fill("browser-test@example.com");
  await page
    .getByLabel("Your ideas, our starting point")
    .fill("Please quote for our corporate calendar.");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved in the local preview",
  );
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Enter local preview studio" })
    .click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.getByRole("button", { name: "Inquiries", exact: true }).click();
  await expect(page.locator(".inquiry-card").first()).toContainText(
    "Browser test inquiry",
  );
  await expect(page.locator(".inquiry-card").first()).toContainText(
    "/designs/botanical-studies",
  );
  const original = await page.evaluate(async () =>
    fetch("/api/content").then((r) => r.json()),
  );
  try {
    await page
      .getByRole("button", { name: "Website Settings", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Business details", exact: true })
      .click();
    await page.getByLabel("Phone", { exact: true }).fill("+91 9000000123");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Draft saved");
    let publicText = await request.get("/contact").then((r) => r.text());
    expect(publicText).not.toContain("+91 9000000123");
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText("Published.");
    publicText = await request.get("/contact").then((r) => r.text());
    expect(publicText).toContain("+91 9000000123");
    const draft = structuredClone(original);
    draft.designs[0].published = false;
    draft.designs[0].description = "PRIVATE_UNPUBLISHED_TEST";
    draft.pricing[0].tiers[0].price = 250;
    const status = await page.evaluate(async (content) => {
      const r = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, publish: true }),
      });
      return r.status;
    }, draft);
    expect(status).toBe(200);
    expect((await request.get("/designs/botanical-studies")).status()).toBe(
      404,
    );
    expect(await request.get("/designs").then((r) => r.text())).not.toContain(
      "PRIVATE_UNPUBLISHED_TEST",
    );
    await page.goto("/pricing");
    await expect(page.locator(".estimate-unit")).toContainText("₹250");
  } finally {
    await page.evaluate(
      async (content) =>
        fetch("/api/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, publish: true }),
        }),
      original,
    );
  }
});
