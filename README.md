# foo

A minimal predator-prey simulation without physics.

## Situation

- The world is a 2D wraparound field.
- Green agents are prey. They flee predators and reproduce probabilistically.
- Red agents are predators. They chase prey and gain energy by eating them.
- Predators die if they go too long without enough energy.
- Predators reproduce when they build up enough energy.

This version intentionally excludes grass, genetics, individual traits, and flocking. It is the smallest useful agent model for observing population changes and predation pressure.

## Run

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds the app and deploys `dist/` to GitHub Pages using GitHub Actions.

The Vite base path is configured as `/foo/` for the `tamiroh/foo` repository.
