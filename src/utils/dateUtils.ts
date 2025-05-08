/**
 * Checks if the given release date has passed.
 * @param releaseDate The configured release date.
 * @returns True if the release date has passed, false otherwise.
 */
export const isReleaseTimePassed = (releaseDate: Date): boolean => {
  const now = new Date();
  return now >= releaseDate;
};

/**
 * Calculates the time remaining until the given release date.
 * @param releaseDate The configured release date.
 * @returns Time remaining in milliseconds, or 0 if the release date has passed.
 */
export const getTimeRemainingUntilRelease = (releaseDate: Date): number => {
  const now = new Date();
  const diff = releaseDate.getTime() - now.getTime();
  return Math.max(0, diff); // Ensures it doesn't return negative if date is in the past
};

/**
 * Formats a duration (in milliseconds) into an object of days, hours, minutes, and seconds.
 * @param durationMs The duration in milliseconds.
 * @returns An object with d, h, m, s properties.
 */
export const formatDuration = (durationMs: number): { d: number; h: number; m: number; s: number } => {
  if (durationMs <= 0) {
    return { d: 0, h: 0, m: 0, s: 0 };
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const d = Math.floor(totalSeconds / (3600 * 24));
  const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  return { d, h, m, s };
}; 