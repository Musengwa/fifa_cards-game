// A "main" award (e.g. Ballon d'Or) is marked purely by a "(main)" suffix on
// its stored name, so no backend/schema change is needed. Creation appends
// the suffix; every display spot strips it back off via formatAwardName.
const MAIN_AWARD_PATTERN = /\s*\(main\)\s*$/i;

export function isMainAward(name: string): boolean {
  return MAIN_AWARD_PATTERN.test(name.trim());
}

export function formatAwardName(name: string): string {
  return name.replace(MAIN_AWARD_PATTERN, '').trim();
}
