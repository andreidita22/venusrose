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
- **Moon extras**: mean node axis (☊/☋) + a short Moon ribbon.

## Controls

- **Time**: UTC date-time picker, `Now`, step back/forward, scrub slider.
- **Playback**: `Play/Pause` with speed steps (`1h/s`, `6h/s`, `1d/s`, `7d/s`, `1mo/s` where `1mo = 30d`).
- **View**: tilt slider (keeps the “wheel” readable; stems fade in after ~10°).
- **Toggles**: light theme, trails (and 3D trail), Moon nodes, distance band, synodic, zodiac wedges, zone rings.

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

## Computation notes

- **Zodiac**: tropical.
- **Frame**: ecliptic-of-date via `astronomy-engine` (geocentric lon/lat/dist).
- **Height**: distance-independent (`z = sinβ * Z_SCALE`) to keep latitude comparable across bodies.
- **Trails**:
  - default “wheel trail” projects onto the ecliptic plane at constant radius (readability-first)
  - optional “3D trail” uses full sampled position

## Limitations / TODO

- Distance “min/max” ranges are **approximate constants** (v0) for visualization.
- Mean lunar node is a **Meeus-style approximation** (not queried from the ephemeris library).
- No houses / sidereal / ayanamsa yet.

## Milestones

- **M0** scene skeleton: done
- **M1** bodies + labels + latitude cues: done
- **M2** Moon nodes + ribbon: done
- **M3** retrograde trails + station markers: done
- **M4** distance bands + closeness gauge: done
- **M5** synodic dial + elongation arc: done
- **M6** polish/perf (clutter mgmt, caching, mobile): next

- Zodiac: tropical (target: ecliptic-of-date; ephemeris provider comes next).
- Latitude: stems hidden at 0° tilt; token cue planned.
- Height: distance-independent (`z = sinβ * Z_SCALE`).
- Trails: “wheel trail” default; optional 3D trail planned.
