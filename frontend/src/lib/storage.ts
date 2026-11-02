// localStorage can be unavailable (private windows, blocked storage), so
// every access is wrapped. These are only UI preferences: losing one is fine.

export function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore: the preference just will not be remembered.
  }
}
