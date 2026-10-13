import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const apiOrigin = new URL(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1",
).origin;

const student = {
  id: "90000000-0000-4000-8000-000000000001",
  firstName: "Browser",
  lastName: "Student",
  email: "browser@example.test",
  role: "STUDENT",
  emailVerified: true,
  permissions: [
    "COURSES_SELF_ENROLL",
    "PROJECTS_SUBMIT",
    "PROJECTS_VIEW_OWN",
    "PROJECTS_EDIT_OWN",
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
};

async function authenticateStudent(context: BrowserContext, page: Page) {
  await context.addCookies([
    {
      name: "token",
      value: "browser-test-session",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: student }),
    }),
  );
}

function classroomResponse({
  enrollmentId,
  deliveryMode,
  courseTitle,
  sessionTitle,
}: {
  enrollmentId: string;
  deliveryMode: "PAID" | "FREE";
  courseTitle: string;
  sessionTitle: string;
}) {
  const isPaid = deliveryMode === "PAID";

  return {
    success: true,
    data: {
      enrollment: {
        id: enrollmentId,
        status: "ACTIVE",
        source: isPaid ? "ADMIN" : "SELF",
        deliveryMode,
        enrolledAt: "2026-08-15T00:00:00.000Z",
        paymentStatus: isPaid ? "COMPLETED" : "NOT_REQUIRED",
        paymentCompletedAt: isPaid ? "2026-08-14T00:00:00.000Z" : null,
        certificate: null,
        course: {
          id: `${enrollmentId}-course`,
          slug: "browser-course",
          title: courseTitle,
          summary: "Browser release-gate fixture",
          description: "A deterministic classroom fixture for the browser release gate.",
          highlights: [],
          skills: [],
          prerequisites: [],
          level: "BEGINNER",
          levelLabel: "Beginner",
          durationValue: 4,
          durationUnit: "WEEKS",
          durationLabel: "4 weeks",
          accessType: deliveryMode,
          instanceKind: isPaid ? "SEASONAL" : "EVERGREEN",
          enrollmentStatus: "OPEN",
          price: isPaid ? 1000 : 0,
          currency: "LKR",
          certificateEnabled: false,
          thumbnailUrl: null,
          serviceTitle: isPaid ? "Bootcamps" : "Free Sessions",
          intakeKey: isPaid ? "2026-B1" : "EVERGREEN",
          code: isPaid ? "BROWSER-2026-B1" : "BROWSER-EVERGREEN",
          startDate: isPaid ? "2026-08-01" : null,
          expectedEndDate: isPaid ? "2026-12-01" : null,
          timezone: "Asia/Colombo",
        },
      },
      sessions: [
        {
          courseSessionId: `${enrollmentId}-session`,
          orderIndex: 0,
          title: sessionTitle,
          description: "Available only through this enrollment fixture.",
          recordingUrl: "https://recordings.example.test/session",
          materialUrl: null,
          quizUrl: null,
          feedbackUrl: null,
          durationMinutes: 60,
          sessionStatus: "READY",
          deliveryStatus: "RELEASED",
          availableAt: "2026-08-15T00:00:00.000Z",
          retired: false,
          completed: false,
          completedAt: null,
        },
      ],
      progress: {
        enrollmentId,
        courseId: `${enrollmentId}-course`,
        intakeId: `${enrollmentId}-intake`,
        completedCount: 0,
        availableSessionCount: 1,
        progressPercent: 0,
      },
    },
  };
}

async function mockEmptyClassroomSupportingData(page: Page) {
  await page.route("**/projects/my**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { projects: [], nextCursor: null },
      }),
    }),
  );
  await page.route("**/profiles/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { profile: null, isPublished: false, approvedProjectCount: 0 },
      }),
    }),
  );
}

test("a stale HttpOnly cookie cannot trap public recovery routes", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "token",
      value: "expired-or-invalid",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ success: false, code: "UNAUTHORIZED" }),
    }),
  );

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/reset-password?token=sample");
  await expect(page).toHaveURL(/\/reset-password\?token=sample$/);
});

test("production CSP permits the configured API origin", async ({ page }) => {
  const response = await page.goto("/");
  const csp = response?.headers()["content-security-policy"] ?? "";
  expect(csp).toContain(`connect-src 'self' ${apiOrigin}`);
});

test("an unavailable API does not block the public site", async ({ page }) => {
  await page.route("**/auth/me", (route) => route.abort("connectionrefused"));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Welcome to/i })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("student sessions are denied by the admin route layout", async ({
  context,
  page,
}) => {
  await authenticateStudent(context, page);

  await page.goto("/admin/services");
  await expect(
    page.getByRole("heading", { name: "Administration access required" }),
  ).toBeVisible();
});

test("free enrollment return intent opens the intake classroom after confirmation", async ({
  context,
  page,
}) => {
  await authenticateStudent(context, page);
  await mockEmptyClassroomSupportingData(page);
  await page.route("**/intakes/free-intake/enroll", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { id: "free-enrollment" } }),
    }),
  );
  await page.route("**/enrollments/free-enrollment/classroom", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        classroomResponse({
          enrollmentId: "free-enrollment",
          deliveryMode: "FREE",
          courseTitle: "Free Browser Learning",
          sessionTitle: "Free session available immediately",
        }),
      ),
    }),
  );

  await page.goto("/dashboard?enrollCourse=free-intake");
  await expect(
    page.getByRole("heading", { name: "Add this course to My Courses?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add course" }).click();
  await expect(page).toHaveURL(/\/my-courses\/free-enrollment$/);
  await expect(
    page.getByRole("heading", { name: "Free Browser Learning" }),
  ).toBeVisible();
  await expect(page.getByText("Free session available immediately")).toBeVisible();
});

test("paid classroom renders only the sessions returned for its enrollment", async ({
  context,
  page,
}) => {
  await authenticateStudent(context, page);
  await mockEmptyClassroomSupportingData(page);
  await page.route("**/enrollments/paid-enrollment/classroom", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        classroomResponse({
          enrollmentId: "paid-enrollment",
          deliveryMode: "PAID",
          courseTitle: "Paid Browser Bootcamp",
          sessionTitle: "Released intake session",
        }),
      ),
    }),
  );

  await page.goto("/my-courses/paid-enrollment");
  await expect(
    page.getByRole("heading", { name: "Paid Browser Bootcamp" }),
  ).toBeVisible();
  await expect(page.getByText("Released intake session")).toBeVisible();
  await expect(page.getByText("Another intake private session")).toHaveCount(0);
});
