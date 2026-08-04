import { PasswordStrengthLevel } from '../models/password-requirement.model';

export const PASSWORD_MIN_LENGTH = 8;

const NUMBER_PATTERN = /[0-9]/;
const UPPERCASE_PATTERN = /[A-Z]/;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

/** Extra length, beyond the minimum, treated as an additional strength signal once every rule already passes. */
const STRONG_LENGTH_THRESHOLD = 12;

export interface PasswordRequirementDefinition {
  readonly id: string;
  readonly translationKey: string;
  readonly test: (password: string) => boolean;
}

/**
 * Single source of truth for the password policy. The form validator, the
 * requirements list UI, and the strength meter all read from this array so
 * the rules can never drift out of sync between them.
 */
export const PASSWORD_REQUIREMENTS: readonly PasswordRequirementDefinition[] = [
  {
    id: 'minLength',
    translationKey: 'STARLINKS.AUTH.PASSWORD.MIN_LENGTH',
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'number',
    translationKey: 'STARLINKS.AUTH.PASSWORD.NUMBER',
    test: (password) => NUMBER_PATTERN.test(password),
  },
  {
    id: 'uppercase',
    translationKey: 'STARLINKS.AUTH.PASSWORD.UPPERCASE',
    test: (password) => UPPERCASE_PATTERN.test(password),
  },
  {
    id: 'specialCharacter',
    translationKey: 'STARLINKS.AUTH.PASSWORD.SPECIAL_CHARACTER',
    test: (password) => SPECIAL_CHARACTER_PATTERN.test(password),
  },
];

export function isPasswordPolicySatisfied(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
}

/**
 * Deterministic, rule-count-based scoring:
 * 0-1 rules passed -> weak, 2 -> fair, 3 -> good, all 4 -> good (or strong
 * once length also clears STRONG_LENGTH_THRESHOLD, rewarding extra length).
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthLevel {
  if (password.length === 0) {
    return 'empty';
  }

  const passedCount = PASSWORD_REQUIREMENTS.filter((requirement) =>
    requirement.test(password),
  ).length;

  if (passedCount === PASSWORD_REQUIREMENTS.length) {
    return password.length >= STRONG_LENGTH_THRESHOLD ? 'strong' : 'good';
  }
  if (passedCount === 3) {
    return 'good';
  }
  if (passedCount === 2) {
    return 'fair';
  }
  return 'weak';
}
