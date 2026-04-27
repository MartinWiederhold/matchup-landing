# Matchup — Landing

Static landing page for [matchup-app.com](https://matchup-app.com).

## Stack

- React 18 + Vite
- React Router (Home, Privacy, Impressum)
- Tailwind CSS v3

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs to dist/
```

## Deploy

Connect this repo to Netlify and point it at the `dist/` folder. The
`_redirects` file (added on first deploy) should contain:

```
/*  /index.html  200
```

so client-side routes (`/privacy`, `/impressum`) work on direct visits.
