import { routes } from './app.routes';

describe('application routes', () => {
  it('redirects the root route to Home', () => {
    const rootRoute = routes.find((route) => route.path === '');

    expect(rootRoute?.redirectTo).toBe('app/home');
  });

  it('exposes every primary menu destination', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const destinations = appRoute?.children
      ?.filter((route) => route.path !== '')
      .map((route) => route.path);

    expect(destinations).toEqual([
      'home',
      'dashboard/activity',
      'dashboard',
      'shipments',
      'fulfillment',
      'surveys',
      'invoices',
      'support',
    ]);
  });
});
