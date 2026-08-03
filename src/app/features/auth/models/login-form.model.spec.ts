import { createFakeTranslateService } from '../testing/auth-test-providers';
import { LoginFormModel } from './login-form.model';

describe('LoginFormModel', () => {
  it('creates defaults with no undefined field values', () => {
    const model = LoginFormModel.createDefault();
    expect(model.email).toBe('');
    expect(model.password).toBe('');
    expect(model.rememberMe).toBe(false);
  });

  it('creates from request data', () => {
    const model = LoginFormModel.create({ email: 'a@b.com', password: 'secret', rememberMe: true });
    expect(model).toEqual({ email: 'a@b.com', password: 'secret', rememberMe: true });
  });

  it('is not affected by later mutation of the source data object', () => {
    const source = { email: 'a@b.com', password: 'secret', rememberMe: true };
    const model = LoginFormModel.create(source);
    source.email = 'mutated@b.com';
    expect(model.email).toBe('a@b.com');
  });

  describe('getFormlyConfig', () => {
    it('returns email, password, and rememberMe fields with the right types', () => {
      const fields = LoginFormModel.createDefault().getFormlyConfig(createFakeTranslateService());
      expect(fields.map((field) => field.key)).toEqual(['email', 'password', 'rememberMe']);
      expect(fields.map((field) => field.type)).toEqual(['email', 'password', 'checkbox']);
    });

    it('marks email and password as required and resolves labels through translate', () => {
      const [emailField, passwordField] = LoginFormModel.createDefault().getFormlyConfig(
        createFakeTranslateService(),
      );
      expect(emailField.props?.required).toBe(true);
      expect(emailField.props?.label).toBe('STARLINKS.COMMON.EMAIL');
      expect(passwordField.props?.required).toBe(true);
      expect(passwordField.props?.label).toBe('STARLINKS.COMMON.PASSWORD');
    });

    it('sets autocomplete attributes matching each field purpose', () => {
      const [emailField, passwordField] = LoginFormModel.createDefault().getFormlyConfig(
        createFakeTranslateService(),
      );
      expect(emailField.props?.attributes?.['autocomplete']).toBe('username');
      expect(passwordField.props?.attributes?.['autocomplete']).toBe('current-password');
    });

    it('defaults rememberMe to false', () => {
      const [, , rememberMeField] = LoginFormModel.createDefault().getFormlyConfig(
        createFakeTranslateService(),
      );
      expect(rememberMeField.defaultValue).toBe(false);
    });
  });
});
