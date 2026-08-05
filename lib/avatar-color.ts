const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-green-600",
  "bg-amber-500",
  "bg-purple-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-orange-600",
  "bg-indigo-600",
];

export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
