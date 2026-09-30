/** The student's own view of their profile (GET/PUT /profiles/me). */
export interface MyStudentProfile {
  slug: string;
  headline: string | null;
  bio: string | null;
  interests: string[];
  careerGoals: string[];
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  avatarObjectId: string | null;
  avatarUrl: string | null;
  publishConsentAt: string | null;
  updatedAt: string;
}

export interface MyStudentProfileResponse {
  profile: MyStudentProfile | null;
  /** Consented AND at least one approved public project — only then is /students/<slug> live. */
  isPublished: boolean;
  approvedProjectCount: number;
}

export interface SaveStudentProfileRequest {
  slug: string;
  headline: string | null;
  bio: string | null;
  interests: string[];
  careerGoals: string[];
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  avatarObjectId: string | null;
  publishConsent: true;
}

/** A published profile, exactly as the public sees it (GET /profiles/public/:slug). */
export interface PublicStudentProfile {
  slug: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  interests: string[];
  careerGoals: string[];
  links: { linkedin: string | null; github: string | null; portfolio: string | null };
  learningSince: string;
  projects: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    technologies: string[];
    githubUrl: string | null;
    demoUrl: string | null;
    projectUrl: string | null;
    courseTitle: string | null;
  }[];
  /** Certificates today; course badges will join this list later. */
  achievements: { type: "CERTIFICATE"; title: string; issuedAt: string; verificationCode: string }[];
}
