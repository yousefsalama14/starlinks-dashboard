import { createFakeTranslateService } from '../testing/auth-test-providers';
import { ForgotPasswordFormModel } from './forgot-password-form.model';

describe('ForgotPasswordFormModel', () => {
  it('creates defaults with no undefined field values', () => {
    expect(ForgotPasswordFormModel.createDefault().email).toBe('');
  });

  it('creates from request data', () => {
    expect(ForgotPasswordFormModel.create({ email: 'a@b.com' }).email).toBe('a@b.com');
  });

  it('is not affected by later mutation of the source data object', () => {
    const source = { email: 'a@b.com' };
    const model = ForgotPasswordFormModel.create(source);
    source.email = 'mutated@b.com';
    expect(model.email).toBe('a@b.com');
  });

  describe('getFormlyConfig', () => {
    it('returns a single required email field', () => {
      const fields = ForgotPasswordFormModel.createDefault().getFormlyConfig(
        createFakeTranslateService(),
      );
      expect(fields).toHaveLength(1);
      expect(fields[0].key).toBe('email');
      expect(fields[0].type).toBe('email');
      expect(fields[0].props?.required).toBe(true);
      expect(fields[0].props?.label).toBe('STARLINKS.COMMON.EMAIL');
    });
  });
});
