import { Data } from '@angular/router';

export interface PageRouteData extends Data {
  headerTitleKey: string;
}

export function pageRouteData(data: PageRouteData): PageRouteData {
  return data;
}
