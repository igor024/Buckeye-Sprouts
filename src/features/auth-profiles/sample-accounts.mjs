// Public, synthetic judge accounts. These credentials confer no university verification.
// The setup script and every sample-login control share this single source of truth.
export const SAMPLE_ACCOUNT_PASSWORD = "buckeye2026";

export const SAMPLE_ACCOUNTS = [
  {
    email: "alex.morgan@osu.edu",
    name: "Alex Morgan",
    major: "Computer Science & Engineering",
    currentCourses: ["CSE 2221", "MATH 1151"],
    bio: "Working through software components, one coffee at a time.",
  },
  {
    email: "jordan.lee@osu.edu",
    name: "Jordan Lee",
    major: "Mathematics",
    currentCourses: ["MATH 1151", "STAT 3470"],
    bio: "Happy to trade calculus explanations for a fresh perspective.",
  },
  {
    email: "sam.patel@osu.edu",
    name: "Sam Patel",
    major: "Computer Science & Engineering",
    currentCourses: ["CSE 2221", "CSE 2321"],
    bio: "Looking for a small group to review recursion together.",
  },
];
