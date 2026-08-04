import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeAr);

function loadIconsax(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/iconsax/index.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load the Iconsax runtime.'));
    document.head.append(script);
  });
}

loadIconsax()
  .then(() => bootstrapApplication(App, appConfig))
  .catch((err) => console.error(err));
