import { Directive } from '@angular/core';

@Directive({
  selector: '[pageSectionHeaderLeading]',
})
export class PageSectionHeaderLeadingDirective {}

@Directive({
  selector: '[pageSectionHeaderActions]',
})
export class PageSectionHeaderActionsDirective {}

@Directive({
  selector: '[pageSectionHeaderSupporting]',
})
export class PageSectionHeaderSupportingDirective {}
