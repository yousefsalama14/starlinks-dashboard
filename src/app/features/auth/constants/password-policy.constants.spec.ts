import {
  evaluatePasswordStrength,
  isPasswordPolicySatisfied,
  PASSWORD_MIN_LENGTH,
} from './password-policy.constants';

describe('password-policy.constants', () => {
  it('requires at least 8 characters', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(isPasswordPolicySatisfied('Ab1!')).toBe(false);
    expect(isPasswordPolicySatisfied('Ab1!5678')).toBe(true);
  });

  it('requires at least one number', () => {
    expect(isPasswordPolicySatisfied('Abcdefg!')).toBe(false);
    expect(isPasswordPolicySatisfied('Abcdefg1!')).toBe(true);
  });

  it('requires at least one uppercase letter', () => {
    expect(isPasswordPolicySatisfied('abcdefg1!')).toBe(false);
    expect(isPasswordPolicySatisfied('Abcdefg1!')).toBe(true);
  });

  it('requires at least one special character', () => {
    expect(isPasswordPolicySatisfied('Abcdefg12')).toBe(false);
    expect(isPasswordPolicySatisfied('Abcdefg1!')).toBe(true);
  });

  it('passes when every rule is satisfied', () => {
    expect(isPasswordPolicySatisfied('Starlinks@123')).toBe(true);
  });

  it('rejects an empty password', () => {
    expect(isPasswordPolicySatisfied('')).toBe(false);
  });

  describe('evaluatePasswordStrength', () => {
    it('returns empty for an empty string', () => {
      expect(evaluatePasswordStrength('')).toBe('empty');
    });

    it('returns weak when at most one rule passes', () => {
      expect(evaluatePasswordStrength('a')).toBe('weak');
      expect(evaluatePasswordStrength('abcdefgh')).toBe('weak');
    });

    it('returns fair when exactly two rules pass', () => {
      expect(evaluatePasswordStrength('abcdefgh1')).toBe('fair');
    });

    it('returns good when exactly three rules pass', () => {
      expect(evaluatePasswordStrength('Abcdefgh1')).toBe('good');
    });

    it('returns good when all four rules pass but length is under 12', () => {
      expect(evaluatePasswordStrength('Abcdefg1!')).toBe('good');
    });

    it('returns strong when all four rules pass and length is 12 or more', () => {
      expect(evaluatePasswordStrength('Abcdefghij1!')).toBe('strong');
    });
  });
});
