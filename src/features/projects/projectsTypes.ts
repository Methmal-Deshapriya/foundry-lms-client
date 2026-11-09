import type { StoredObjectSummary } from "@/features/storage/storageApi";

export type ProjectStatus = "PENDING" | "APPROVED" | "REJECTED";

export type StudentProject = {
  id: string;
  userId: string;
  intakeId: string;
  enrollmentId: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  thumbnailObjectId?: string | null;
  thumbnailObject?: StoredObjectSummary | null;
  projectUrl?: string | null;
  githubUrl?: string | null;
  demoUrl?: string | null;
  technologies: string[];
  status: ProjectStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  adminFeedback?: string | null;
  isPublic: boolean;
  displayOrder: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  // Included fields
  user?: {
    id?: string;
    firstName: string;
    lastName: string;
    /** Owner and admin views only. */
    email?: string;
    /** Set when the student has a published public profile (/students/<slug>). */
    profileSlug?: string | null;
  };
  intake?: {
    id: string;
    code: string;
    course?: { id: string; title: string };
  };
  course?: {
    id?: string;
    title: string;
  };
};

export type SubmitProjectRequest = {
  intakeId: string;
  enrollmentId: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  thumbnailObjectId?: string | null;
  projectUrl?: string | null;
  githubUrl?: string | null;
  demoUrl?: string | null;
  technologies?: string[];
  isPublic?: boolean;
};

export type UpdateProjectRequest = Partial<Omit<SubmitProjectRequest, "intakeId" | "enrollmentId">>;

export type ReviewProjectRequest = {
  status: ProjectStatus;
  adminFeedback?: string | null;
};
