import { createFakeTranslateService } from '../testing/auth-test-providers';
import { ResetPasswordFormModel } from './reset-password-form.model';

describe('ResetPasswordFormModel', () => {
  it('creates defaults with no undefined field values', () => {
    const model = ResetPasswordFormModel.createDefault();
    expect(model.newPassword).toBe('');
    expect(model.confirmPassword).toBe('');
  });

  it('creates from request data', () => {
    const model = ResetPasswordFormModel.create({
      newPassword: 'NewPass@123',
      confirmPassword: 'NewPass@123',
    });
    expect(model).toEqual({ newPassword: 'NewPass@123', confirmPassword: 'NewPass@123' });
  });

  it('is not affected by later mutation of the source data object', () => {
    const source = { newPassword: 'NewPass@123', confirmPassword: 'NewPass@123' };
    const model = ResetPasswordFormModel.create(source);
    source.newPassword = 'Mutated@123';
    expect(model.newPassword).toBe('NewPass@123');
  });

  describe('getFormlyConfig', () => {
    it('returns newPassword and confirmPassword fields using the password type', () => {
      const fields = ResetPasswordFormModel.createDefault().getFormlyConfig(
        createFakeTranslateService(),
      );
      expect(fields.map((field) => field.key)).toEqual(['newPassword', 'confirmPassword']);
      expect(fields.every((field) => field.type === 'password')).toBe(true);
    });

    it('sets new-password autocomplete on both fields', () => {
      const [newPasswordField, confirmPasswordField] =
        ResetPasswordFormModel.createDefault().getFormlyConfig(createFakeTranslateService());
      expect(newPasswordField.props?.attributes?.['autocomplete']).toBe('new-password');
      expect(confirmPasswordField.props?.attributes?.['autocomplete']).toBe('new-password');
    });

    it('attaches the password strength validator to newPassword and the match validator to confirmPassword', () => {
      const [newPasswordField, confirmPasswordField] =
        ResetPasswordFormModel.createDefault().getFormlyConfig(createFakeTranslateService());
      expect(newPasswordField.validators?.validation).toHaveLength(1);
      expect(confirmPasswordField.validators?.validation).toHaveLength(1);
    });

    it('re-triggers confirmPassword validation via a hook when newPassword changes', () => {
      const [newPasswordField] = ResetPasswordFormModel.createDefault().getFormlyConfig(
        createFakeTranslateService(),
      );
      expect(newPasswordField.hooks?.onInit).toBeInstanceOf(Function);
    });

    it('registers a passwordMismatch message on confirmPassword', () => {
      const [, confirmPasswordField] = ResetPasswordFormModel.createDefault().getFormlyConfig(
        createFakeTranslateService(),
      );
      expect(confirmPasswordField.validation?.messages).toHaveProperty('passwordMismatch');
    });

    it('does not represent the reset token as a field', () => {
      const fields = ResetPasswordFormModel.createDefault().getFormlyConfig(
        createFakeTranslateService(),
      );
      expect(fields.some((field) => field.key === 'token')).toBe(false);
    });
  });
});
