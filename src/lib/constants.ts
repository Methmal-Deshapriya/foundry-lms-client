export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export const ROLES = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// The 25 administrative districts of Sri Lanka
export const DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
] as const;

// Standard G.C.E. Advanced Level subject streams
export const AL_STREAMS = [
  "Science",
  "Mathematics",
  "Commerce",
  "Arts",
  "Technology",
] as const;