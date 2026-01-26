# Venusrose

Interactive “zoned geocentric ecliptic” astrology wheel (3D-ish) built with React + TypeScript + `react-three-fiber`.

## Dev

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test:run
```

## Build

```bash
npm run build
```

## v0 defaults (locked)

- Zodiac: tropical (target: ecliptic-of-date; ephemeris provider comes next).
- Latitude: stems hidden at 0° tilt; token cue planned.
- Height: distance-independent (`z = sinβ * Z_SCALE`).
- Trails: “wheel trail” default; optional 3D trail planned.
