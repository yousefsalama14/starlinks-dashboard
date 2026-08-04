import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TranslatedText } from '../dynamic-table/dynamic-table.types';

const DEFAULT_LABEL: TranslatedText = { key: 'STARLINKS.TABLE.TOOLBAR.LABEL' };

@Component({
  selector: 'app-table-toolbar',
  imports: [TranslatePipe],
  templateUrl: './table-toolbar.component.html',
  styleUrl: './table-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableToolbarComponent {
  readonly label = input<TranslatedText>(DEFAULT_LABEL);
}
