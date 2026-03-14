import seedrandom from "seedrandom";

export const isMobileQuery = "(max-width: 56rem)";

export function humanTime(date: Date): string {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  let result = "";

  if (hours > 0) result += `${hours}:`;

  if (hours > 0) result += `${minutes.toString().padStart(2, "0")}:`;
  else result += `${minutes}:`;

  result += seconds.toString().padStart(2, "0");

  return result;
}

export function randomItem<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

export function shuffleArray<T>(array: T[], seed?: string): T[] {
  const rng = seed ? seedrandom(seed) : Math.random;

  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
export function formatDate(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "Unknown";

  const date =
    typeof value === "number"
      ? new Date(value < 1000000000000 ? value * 1000 : value)
      : new Date(value.includes("T") ? value : value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
