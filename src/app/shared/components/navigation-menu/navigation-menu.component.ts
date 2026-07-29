import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export interface NavigationMenuItem {
  id: string;
  labelKey: string;
  icon: string;
  route?: string;
  exact?: boolean;
  hasNotification?: boolean;
  iconTone?: 'default' | 'danger';
  children?: readonly NavigationMenuItem[];
}

@Component({
  selector: 'app-navigation-menu',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './navigation-menu.component.html',
  styleUrl: './navigation-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NavigationMenuComponent {
  readonly items = input.required<readonly NavigationMenuItem[]>();
  readonly expanded = input(false);
  readonly itemSelected = output<NavigationMenuItem>();
}
