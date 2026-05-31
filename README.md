# preyground

A minimal predator-prey simulation without physics.

## Situation

- The world is a 2D wraparound field.
- Grass regrows across the field.
- Green agents are prey. They flee predators, recover energy by grazing, starve without food, and reproduce probabilistically.
- Red agents are predators. They chase prey and gain energy by eating them.
- Predators die if they go too long without enough energy.
- Predators reproduce when they build up enough energy.

## Run

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds the app and deploys `dist/` to GitHub Pages using GitHub Actions.

The Vite base path is configured as `/preyground/` for the `tamiroh/preyground` repository.
