My webapp skeleton project. At present, a simple postgresql backed Todo list app is provided.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## What are included

### Coding styles 
* Prettier working with [typescript-eslint](https://typescript-eslint.io/)
* Airbnb coding style [base](https://github.com/airbnb/javascript) and [typescript](https://github.com/iamturns/eslint-config-airbnb-typescript) eslint plugins
* Prettier plugin to [sorting imports](https://github.com/IanVS/prettier-plugin-sort-imports) and [tailwind classes](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
* Typescript directory alias configured (@/)

### Common dependencies
* [Next.js 14](https://nextjs.org/docs) (with app router)
* Logging with [Pino](https://getpino.io/), together with [pino-pretty](https://github.com/pinojs/pino-pretty) for output readable
* Version can be fetched from package.json by next/config
* [Zod](https://github.com/colinhacks/zod) for runtime type safety

### Frontend side
* [Tailwindcss](https://tailwindcss.com/) and [ShadUI](https://ui.shadcn.com/) (based on [Radix UI Primitives](https://www.radix-ui.com/primitives)) for UI components
* A reusable component <ThemeSwitcher> for control the dark mode while respecting RSC and cypress testing
* Helper function based on [TwMerge](https://github.com/dcastil/tailwind-merge) and [clsx](https://github.com/lukeed/clsx) for combining and splitting extra long tailwind classes.

### Backend side
* Nextjs [server actions](https://nextjs.org/docs/app/api-reference/functions/server-actions) to replace traditional API definitions.
* [Kysely](https://kysely.dev/) for type-safe SQL query building and database migration.
* [Tsx](https://github.com/privatenumber/tsx) for executing typescript node scripts (such as database migrator) while respecting the project structure.
* Dotenv for executing scripts while loading env vars.
* PostgreSQL database driver.

### Testing
* Unit testing with [Jest](https://jestjs.io/).
* Component testing with Jest & [React Testing Library](https://testing-library.com/).
* End to end testing with [Cypress](https://www.cypress.io/) (with [official docker image](https://github.com/cypress-io/cypress-docker-images)).
* Eslint plugins and related project & typescript configurations for Jest & Cypress.

## What's next?
* Different branches for minimal, without-db, without-e2e-testing
