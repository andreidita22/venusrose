# Venusrose

Interactive “zoned geocentric ecliptic” astrology wheel (3D-ish) built with React + TypeScript + `react-three-fiber`.

## What it does (v0)

- **Wheel-readable**: ecliptic longitude mapped to the zodiac like a classic chart.
- **3D-ish cues**:
  - Ecliptic latitude via stems (fade in with tilt) + ↑/↓ cue in flat mode.
  - Geocentric distance via a **monotone zoned radial mapping** (keeps inferior/superior ordering truthful).
- **Retrograde**: select a planet to show a trail with retrograde segments highlighted + station markers.
- **Distance band**: for selected body, show min/max distance rings + “closeness” gauge.
- **Synodic cycle**: synodic dial (Δλ) + in-scene elongation arc relative to the Sun.
- **Synodic events**: aspects + stations + (inner planets) max elongation, shown as click-to-jump chips and in-scene markers.
- **Moon extras**: mean node axis (☊/☋) + a short Moon ribbon.

## Controls

- **Time**: UTC date-time picker, `Now`, step back/forward, scrub slider.
- **Playback**: `Play/Pause` with speed steps (`1h/s`, `6h/s`, `1d/s`, `7d/s`, `1mo/s` where `1mo = 30d`).
- **View**: tilt slider (keeps the “wheel” readable; stems fade in after ~10°).
- **Toggles**:
  - theme (light/dark)
  - focus (off/fade/solo)
  - trails (wheel/3D)
  - Moon nodes, distance band, synodic
  - events (aspects/stations/max elongation) + `Prev/Next` jump buttons
  - zodiac wedges, zone rings

Notes:
- When **Events** are enabled, the selected body’s trail window can auto-expand to include at least one conjunction before/after (so you don’t end up with “no events” in view).

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

## GitHub Pages

This repo includes a GitHub Actions workflow that builds the app and deploys `dist/` to GitHub Pages on pushes to `main`.

1. In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push to `main` (or re-run the workflow) and wait for “Deploy to GitHub Pages”
3. Your site should be available at `https://<username>.github.io/<repo>/`

Custom domain:
- If you use a custom domain (e.g. `venusrose.eu`), update `public/CNAME`.

## Computation notes

- **Zodiac**: tropical.
- **Frame**: ecliptic-of-date via `astronomy-engine` (geocentric lon/lat/dist).
- **Height**: distance-independent (`z = sinβ * Z_SCALE`) to keep latitude comparable across bodies.
- **Trails**:
  - default “wheel trail” projects onto the ecliptic plane at constant radius (readability-first)
  - optional “3D trail” uses full sampled position
- **Events**: computed from the same cached samples used for trails/dial (aspect crossings on elongation, station points from dλ/dt, plus inner-planet max elongation peaks).

## Limitations / TODO

- Distance “min/max” ranges are **approximate constants** (v0) for visualization.
- Mean lunar node is a **Meeus-style approximation** (not queried from the ephemeris library).
- No houses / sidereal / ayanamsa yet.
- v1 ideas: compute distance min/max from sampled windows (cached), add mean/true node toggle if provider supports it.

## Milestones

- **M0** scene skeleton: done
- **M1** bodies + labels + latitude cues: done
- **M2** Moon nodes + ribbon: done
- **M3** retrograde trails + station markers: done
- **M4** distance bands + closeness gauge: done
- **M5** synodic dial + elongation arc: done
- **M6** polish/perf: mobile UX, caching, and events navigation: done
