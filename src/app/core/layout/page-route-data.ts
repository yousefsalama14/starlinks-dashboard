import { Data } from '@angular/router';

export interface PageBreadcrumb {
  readonly labelKey: string;
  readonly route?: string;
}

export type PageHeaderMode = 'root' | 'nested';

export interface PageRouteData extends Data {
  readonly headerTitleKey: string;
  readonly headerMode?: PageHeaderMode;
  readonly headerSupportingTextKey?: string;
  readonly breadcrumbs?: readonly PageBreadcrumb[];
  readonly backRoute?: string;
  readonly backLabelKey?: string;
  readonly contentOwnsHeading?: boolean;
}

export function pageRouteData(data: PageRouteData): PageRouteData {
  return data;
}
