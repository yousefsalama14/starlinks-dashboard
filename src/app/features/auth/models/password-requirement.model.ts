export interface PasswordRequirement {
  readonly id: string;
  readonly translationKey: string;
  readonly passed: boolean;
}

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';
