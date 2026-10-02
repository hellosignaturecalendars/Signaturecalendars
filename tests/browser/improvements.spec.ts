import { test, expect } from "@playwright/test";
const png = {
  name: "calendar.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jPyoAAAAASUVORK5CYII=",
    "base64",
  ),
};
test("five-section studio: mocked uploads persist, draft preview, publish and unpublish", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.screenshot({ path: "test-results/login-desktop.png" });
  await page
    .getByRole("button", { name: "Enter local preview studio" })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  const nav = page.getByRole("navigation", { name: "Dashboard sections" });
  await expect(nav.getByRole("button")).toHaveCount(5);
  await page.screenshot({ path: "test-results/admin-overview.png" });
  await page.getByRole("button", { name: /^Add Design/ }).click();
  await page
    .getByLabel("Design name", { exact: true })
    .fill("Workflow Test Calendar");
  await page
    .getByLabel("Short description")
    .fill("A test design for the complete owner workflow.");
  // The real upload service is not configured. Stub only its response to test UI attachment/persistence.
  let count = 0;
  await page.route("**/api/media", async (route) => {
    count++;
    const pdf = route
      .request()
      .postDataBuffer()
      ?.includes(Buffer.from("application/pdf"));
    await route.fulfill({
      json: {
        id: `test-media-${count}`,
        url: pdf
          ? "https://res.cloudinary.com/test/raw/upload/test-catalogue.pdf"
          : "/art/month.svg",
        publicId: `test-${count}`,
        alt: "Test artwork",
        label: pdf ? "Test catalogue" : "Test monthly artwork",
        kind: pdf ? "PDF" : "Artwork",
        deliveryVerified: true,
      },
    });
  });
  await page
    .getByLabel("Upload Cover Image", { exact: true })
    .setInputFiles(png);
  await expect(page.getByRole("status")).toContainText("uploaded and saved");
  await page
    .getByLabel("Add Gallery Images", { exact: true })
    .setInputFiles([png, { ...png, name: "second.png" }]);
  await expect(page.getByRole("status")).toContainText("2 files uploaded");
  await page
    .getByLabel("Upload PDF", { exact: true })
    .setInputFiles({
      name: "catalogue.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nfixture"),
    });
  await expect(page.getByRole("status")).toContainText("1 file uploaded");
  expect((await request.get("/designs/workflow-test-calendar")).status()).toBe(
    404,
  );
  expect(
    (await request.get("/api/designs/workflow-test-calendar/pdf")).status(),
  ).toBe(404);
  await page.reload();
  await page
    .getByRole("navigation", { name: "Dashboard sections" })
    .getByRole("button", { name: "Designs", exact: true })
    .click();
  await page
    .locator(".design-tile")
    .filter({ hasText: "Workflow Test Calendar" })
    .click();
  await expect(page.locator(".editor-image")).toHaveCount(2);
  await expect(page.getByRole("link", { name: "View PDF" })).toHaveAttribute(
    "href",
    /test-catalogue.pdf/,
  );
  await page.getByRole("button", { name: "Move image 2 up" }).click();
  await page
    .getByRole("button", { name: "Preview design", exact: true })
    .click();
  await expect(page.locator("dialog")).toBeVisible();
  await expect(page.locator("dialog")).toContainText("Workflow Test Calendar");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Publish design", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Published.");
  const publicPage = await page.context().newPage();
  await publicPage.goto("/designs/workflow-test-calendar");
  await expect(publicPage.locator("main h1")).toHaveText(
    "Workflow Test Calendar",
  );
  await expect(
    publicPage.getByRole("link", { name: "View PDF", exact: false }),
  ).toHaveAttribute("href", "/api/designs/workflow-test-calendar/pdf");
  await expect(
    publicPage.getByRole("link", { name: "Download PDF", exact: false }),
  ).toHaveAttribute(
    "href",
    "/api/designs/workflow-test-calendar/pdf?download=1",
  );
  await publicPage.close();
  await page
    .getByRole("button", { name: "Unpublish design", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Published.");
  expect((await request.get("/designs/workflow-test-calendar")).status()).toBe(
    404,
  );
  await page.unroute("**/api/media");
  await page
    .getByLabel("Upload Cover Image", { exact: true })
    .setInputFiles(png);
  await expect(page.locator('.save-feedback [role="alert"]')).toContainText("CLOUDINARY_CLOUD_NAME");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
test("business links, packaging pricing, readable controls and mobile owner pages", async ({
  page,
  request,
}) => {
  await page.goto("/admin/login");
  await page
    .getByRole("button", { name: "Enter local preview studio" })
    .click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  const original = await page.evaluate(() =>
    fetch("/api/content").then((r) => r.json()),
  );
  try {
    await page
      .getByRole("button", { name: "Website Settings", exact: true })
      .click();
    await page
      .getByLabel("Facebook", { exact: true })
      .fill("https://www.facebook.com/signature-test");
    await page
      .getByLabel("Email address", { exact: true })
      .fill("test@example.com");
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText("Published.");
    const publicPage = await page.context().newPage();
    await publicPage.goto("/contact");
    await expect(
      publicPage
        .locator("main")
        .getByRole("link", { name: "Facebook", exact: true }),
    ).toHaveAttribute("href", "https://www.facebook.com/signature-test");
    await expect(
      publicPage
        .locator("footer")
        .getByRole("link", { name: "test@example.com", exact: true }),
    ).toHaveAttribute("href", "mailto:test@example.com");
    await publicPage.close();
    await page
      .getByRole("navigation", { name: "Dashboard sections" })
      .getByRole("button", { name: "Pricing", exact: true })
      .click();
    await page.getByLabel("Optional packaging charge per calendar").fill("12");
    await page.getByLabel("Price per piece (₹)").first().fill("250");
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText("Published.");
    const pricePage = await page.context().newPage();
    await pricePage.goto("/pricing");
    await expect(pricePage.locator(".estimate-total")).toContainText("25,000");
    await pricePage.getByLabel("Include optional packaging").check();
    await expect(pricePage.locator(".estimate-total")).toContainText("26,200");
    await pricePage.close();
    await page
      .getByLabel("Minimum quantity", { exact: true })
      .nth(1)
      .fill("100");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator('.save-feedback [role="alert"]')).toContainText("unique minimum");
    await page
      .getByLabel("Minimum quantity", { exact: true })
      .nth(1)
      .fill("200");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Draft saved");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const sizes = await page
        .locator("select:visible, input:visible, textarea:visible, option")
        .evaluateAll((els) =>
          els.map((e) => parseFloat(getComputedStyle(e).fontSize)),
        );
      expect(sizes.every((n) => n >= 16)).toBe(true);
      await page.screenshot({
        path: `test-results/pricing-admin-${width}.png`,
        fullPage: true,
      });
    }
    await page
      .getByRole("navigation", { name: "Dashboard sections" })
      .getByRole("button", { name: "Designs", exact: true })
      .click();
    await page.locator(".design-tile").first().click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/design-editor-mobile.png",
      fullPage: true,
    });
  } finally {
    await page.evaluate(async (content) => {
      await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, publish: true }),
      });
    }, original);
  }
  expect((await request.get("/api/inquiries")).status()).toBe(401);
  expect(
    (
      await request.put("/api/content", {
        headers: { origin: "http://127.0.0.1:3000" },
        data: {},
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/media", {
        headers: { origin: "http://127.0.0.1:3000" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.get("/api/designs/workflow-test-calendar/pdf?draft=1")
    ).status(),
  ).toBe(401);
});

