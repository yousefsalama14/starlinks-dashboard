import { Routes } from '@angular/router';

import { pageRouteData } from '../../core/layout/page-route-data';

export const SHIPMENTS_ROUTES: Routes = [
  {
    path: '',
    data: pageRouteData({
      headerTitleKey: 'STARLINKS.SHIPMENTS.PAGE_TITLE',
      headerMode: 'root',
      headerSupportingTextKey: 'STARLINKS.SHIPMENTS.PAGE_SUPPORTING_TEXT',
    }),
    loadComponent: () =>
      import('./pages/shipments/shipments.component').then(
        (component) => component.ShipmentsComponent,
      ),
  },
];
