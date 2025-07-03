export interface UserProfile {
  id: string;
  name: string;
  role: "student" | "tutor" | "admin";
}
