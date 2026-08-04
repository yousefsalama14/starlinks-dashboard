import { AUTH_ROUTES } from './auth.routes';

describe('AUTH_ROUTES', () => {
  function children() {
    const wrapper = AUTH_ROUTES[0];
    expect(wrapper.children).toBeDefined();
    return wrapper.children ?? [];
  }

  it('scopes the Formly registration to this route so it stays out of the eager bundle', () => {
    expect(AUTH_ROUTES).toHaveLength(1);
    expect(AUTH_ROUTES[0].providers).toBeDefined();
    expect(AUTH_ROUTES[0].providers?.length).toBeGreaterThan(0);
  });

  it('registers login, forgot-password, and reset-password, each guest-guarded', () => {
    const routes = children();
    const paths = routes.filter((route) => route.path !== '').map((route) => route.path);
    expect(paths).toEqual(['login', 'forgot-password', 'reset-password']);

    for (const route of routes) {
      if (route.path === '') {
        continue;
      }
      expect(route.canActivate).toBeDefined();
      expect(route.loadComponent).toBeDefined();
    }
  });

  it('redirects the empty path to login', () => {
    const emptyRoute = children().find((route) => route.path === '');
    expect(emptyRoute?.redirectTo).toBe('login');
    expect(emptyRoute?.pathMatch).toBe('full');
  });
});
