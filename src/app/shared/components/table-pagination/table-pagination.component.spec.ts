import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TablePageChange } from '../dynamic-table/dynamic-table.types';
import { TablePaginationComponent, TablePaginationLabelKeys } from './table-pagination.component';

const LABEL_KEYS: TablePaginationLabelKeys = {
  previous: 'TEST.PREVIOUS',
  next: 'TEST.NEXT',
  navigation: 'TEST.NAVIGATION',
  page: 'TEST.PAGE',
  currentPage: 'TEST.CURRENT_PAGE',
};

describe('TablePaginationComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TablePaginationComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      TEST: {
        PREVIOUS: 'Previous',
        NEXT: 'Next',
        NAVIGATION: 'Table pagination',
        PAGE: 'Go to page {{page}}',
        CURRENT_PAGE: 'Page {{page}} of {{totalPages}}',
      },
    });
  });

  it('renders an accessible page range and non-interactive ellipses', () => {
    const fixture = createFixture({ page: 10, pageSize: 10, totalItems: 200 });
    const element = fixture.nativeElement as HTMLElement;
    const nav = element.querySelector('nav') as HTMLElement;
    const currentPage = element.querySelector('[aria-current="page"]') as HTMLButtonElement;

    expect(nav.getAttribute('aria-label')).toBe('Table pagination');
    expect(currentPage.textContent?.trim()).toBe('10');
    expect(currentPage.getAttribute('aria-label')).toBe('Go to page 10');
    expect(element.querySelectorAll('.table-pagination__ellipsis')).toHaveLength(2);
    expect(element.querySelector('.table-pagination__ellipsis button')).toBeNull();
  });

  it('uses rich generic defaults for the first page of ten', () => {
    const fixture = createFixture({ page: 1, pageSize: 10, totalItems: 100 });
    const pageNumbers = Array.from(
      fixture.nativeElement.querySelectorAll('.table-pagination__page') as NodeListOf<HTMLElement>,
    ).map((button) => Number(button.textContent?.trim()));

    expect(pageNumbers).toEqual([1, 2, 3, 8, 9, 10]);
    expect(fixture.nativeElement.querySelectorAll('.table-pagination__ellipsis')).toHaveLength(1);
  });

  it('emits a one-based page change and preserves page size', () => {
    const fixture = createFixture({ page: 2, pageSize: 25, totalItems: 100 });
    const changes: TablePageChange[] = [];
    fixture.componentInstance.pageChange.subscribe((change) => changes.push(change));

    (
      fixture.nativeElement.querySelector('.table-pagination__control--next') as HTMLButtonElement
    ).click();

    expect(changes).toEqual([{ page: 3, pageSize: 25 }]);
  });

  it('does not emit for the current page or unavailable controls', () => {
    const fixture = createFixture({ page: 1, pageSize: 10, totalItems: 20 });
    const changes: TablePageChange[] = [];
    fixture.componentInstance.pageChange.subscribe((change) => changes.push(change));
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('[aria-current="page"]') as HTMLButtonElement).click();
    (element.querySelector('.table-pagination__control--previous') as HTMLButtonElement).click();

    expect(changes).toEqual([]);
    expect(
      (element.querySelector('.table-pagination__control--previous') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('disables every interaction when disabled', () => {
    const fixture = createFixture({ page: 2, pageSize: 10, totalItems: 40 }, { disabled: true });
    const changes: TablePageChange[] = [];
    fixture.componentInstance.pageChange.subscribe((change) => changes.push(change));
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    );

    buttons.forEach((button) => button.click());

    expect(buttons.every((button) => button.disabled)).toBe(true);
    expect(changes).toEqual([]);
  });

  it('renders zero pages and disables navigation when there are no items', () => {
    const fixture = createFixture({ page: 1, pageSize: 10, totalItems: 0 });
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.table-pagination__page')).toHaveLength(0);
    expect(
      (element.querySelector('.table-pagination__control--previous') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (element.querySelector('.table-pagination__control--next') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('does not correct or emit from an invalid controlled page', () => {
    const fixture = createFixture({ page: 12, pageSize: 10, totalItems: 100 });
    const changes: TablePageChange[] = [];
    fixture.componentInstance.pageChange.subscribe((change) => changes.push(change));
    const element = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();

    expect(element.querySelector('[aria-current="page"]')).toBeNull();
    expect(
      (element.querySelector('.table-pagination__control--previous') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (element.querySelector('.table-pagination__control--next') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(changes).toEqual([]);
  });

  it('supports compact and RTL presentation hooks without changing event semantics', () => {
    document.documentElement.dir = 'rtl';
    const fixture = createFixture({ page: 2, pageSize: 10, totalItems: 40 }, { compact: true });
    const changes: TablePageChange[] = [];
    fixture.componentInstance.pageChange.subscribe((change) => changes.push(change));
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('nav')?.classList).toContain('table-pagination--compact');
    expect(element.querySelector('.table-pagination__summary')?.textContent).toContain('2 / 4');
    expect(element.querySelector('.table-pagination__summary')?.textContent).toContain(
      'Page 2 of 4',
    );
    expect(element.querySelectorAll('.table-pagination__direction-icon')).toHaveLength(2);
    const directionIcons = Array.from(
      element.querySelectorAll('iconsax-icon.table-pagination__direction-icon'),
    );
    expect(directionIcons.map((icon) => icon.getAttribute('name'))).toEqual([
      'arrow-left-01',
      'arrow-right-01',
    ]);
    expect(directionIcons.every((icon) => icon.getAttribute('type') === 'linear')).toBe(true);
    expect(directionIcons.every((icon) => icon.getAttribute('size') === '14')).toBe(true);
    expect(directionIcons.every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(element.querySelector('.pi')).toBeNull();
    expect(element.textContent).not.toMatch(/[←→↑↓]/u);

    (element.querySelector('.table-pagination__control--next') as HTMLButtonElement).click();
    expect(changes).toEqual([{ page: 3, pageSize: 10 }]);

    document.documentElement.dir = 'ltr';
  });
});

function createFixture(
  pagination: { readonly page: number; readonly pageSize: number; readonly totalItems: number },
  options: { readonly disabled?: boolean; readonly compact?: boolean } = {},
) {
  const fixture = TestBed.createComponent(TablePaginationComponent);
  fixture.componentRef.setInput('pagination', pagination);
  fixture.componentRef.setInput('labelKeys', LABEL_KEYS);
  fixture.componentRef.setInput('disabled', options.disabled ?? false);
  fixture.componentRef.setInput('compact', options.compact ?? false);
  fixture.detectChanges();
  return fixture;
}
