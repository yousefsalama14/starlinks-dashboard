import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  input,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import {
  PASSWORD_REQUIREMENTS,
  evaluatePasswordStrength,
} from '../../constants/password-policy.constants';
import {
  PasswordRequirement,
  PasswordStrengthLevel,
} from '../../models/password-requirement.model';

const STRENGTH_ORDER: readonly PasswordStrengthLevel[] = [
  'empty',
  'weak',
  'fair',
  'good',
  'strong',
];

@Component({
  selector: 'app-password-requirements',
  imports: [TranslatePipe],
  templateUrl: './password-requirements.component.html',
  styleUrl: './password-requirements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PasswordRequirementsComponent {
  readonly password = input('');

  protected readonly strengthSegments = [1, 2, 3, 4] as const;

  protected readonly requirements = computed<PasswordRequirement[]>(() => {
    const value = this.password();
    return PASSWORD_REQUIREMENTS.map((requirement) => ({
      id: requirement.id,
      translationKey: requirement.translationKey,
      passed: requirement.test(value),
    }));
  });

  protected readonly strength = computed<PasswordStrengthLevel>(() =>
    evaluatePasswordStrength(this.password()),
  );

  protected readonly strengthLevelIndex = computed(() => STRENGTH_ORDER.indexOf(this.strength()));

  protected readonly strengthTranslationKey = computed(
    () => `STARLINKS.AUTH.PASSWORD.STRENGTH.${this.strength().toUpperCase()}`,
  );
}
