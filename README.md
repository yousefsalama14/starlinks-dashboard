# Starlinks

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.18.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## UI integrations

- **Iconsax:** Free Iconsax assets are generated from the installed package into
  `public/iconsax/` after installation and before starting, building, or testing. Do not edit those
  generated assets directly. In a component that renders an `<iconsax-icon>` custom element, add
  `CUSTOM_ELEMENTS_SCHEMA` to that component's `schemas`. Free icons need no account or API key.
- **Formly + PrimeNG:** The app config registers the Formly core and PrimeNG field types. Import
  `FormlyModule` and `ReactiveFormsModule` in each standalone feature component that defines a
  dynamic form.

## Formatting

Run `npm run format` to apply the workspace Prettier rules, or `npm run format:check` in checks
that must not modify files. VS Code is configured to use Prettier when saving supported files.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
