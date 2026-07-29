import { routes } from './app.routes';

describe('application routes', () => {
  it('redirects the root route to the dashboard', () => {
    const rootRoute = routes.find((route) => route.path === '');

    expect(rootRoute?.redirectTo).toBe('app/dashboard');
  });

  it('exposes Dashboard as the only app child destination', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const destinations = appRoute?.children
      ?.filter((route) => route.path !== '')
      .map((route) => route.path);

    expect(destinations).toEqual(['dashboard']);
  });
});
