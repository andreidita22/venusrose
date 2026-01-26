import { useAppStore } from '../state/store'
import { BODY_META } from '../astro/bodies'
import { formatSignedDegrees, formatZodiacPosition } from '../astro/format'
import { radToDeg } from '../astro/math/angles'
import { formatUTCDateTimeLocal, parseUTCDateTimeLocal } from './datetime'

export function ControlBar() {
  const t0 = useAppStore((s) => s.t0)
  const setT0 = useAppStore((s) => s.setT0)
  const tiltDeg = useAppStore((s) => s.tiltDeg)
  const setTiltDeg = useAppStore((s) => s.setTiltDeg)
  const toggles = useAppStore((s) => s.toggles)
  const toggle = useAppStore((s) => s.toggle)
  const selectedBody = useAppStore((s) => s.selectedBody)
  const setSelectedBody = useAppStore((s) => s.setSelectedBody)
  const bodyStates = useAppStore((s) => s.bodyStates)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  const selectedState = selectedBody ? bodyStates[selectedBody] : null
  const selectedMeta = selectedBody ? BODY_META[selectedBody] : null

  return (
    <div className="controlBar">
      <div className="controlRow">
        <label className="controlLabel">
          UTC
          <input
            className="controlInput"
            type="datetime-local"
            value={formatUTCDateTimeLocal(t0)}
            onChange={(e) => {
              const next = parseUTCDateTimeLocal(e.target.value)
              if (next) setT0(next)
            }}
          />
        </label>
        <button type="button" className="controlButton" onClick={() => setT0(new Date())}>
          Now
        </button>
        <div className="spacer" />
        <label className="controlLabel">
          Tilt {Math.round(tiltDeg)}°
          <input
            className="controlRange"
            type="range"
            min={0}
            max={75}
            step={1}
            value={tiltDeg}
            onChange={(e) => setTiltDeg(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="controlRow">
        <label className="controlToggle">
          <input
            type="checkbox"
            checked={theme === 'light'}
            onChange={() => toggleTheme()}
          />
          Light theme
        </label>
        <label className="controlToggle">
          <input
            type="checkbox"
            checked={toggles.showZodiac}
            onChange={() => toggle('showZodiac')}
          />
          Zodiac wedges
        </label>
        <label className="controlToggle">
          <input
            type="checkbox"
            checked={toggles.showZoneRings}
            onChange={() => toggle('showZoneRings')}
          />
          Zone rings
        </label>
        <div className="spacer" />
        {selectedBody && selectedMeta ? (
          <div className="selectedBody">
            <span className="selectedGlyph">{selectedMeta.glyph}</span>
            <span className="selectedLabel">{selectedMeta.label}</span>
            {selectedState ? (
              <span className="selectedStats">
                {formatZodiacPosition(selectedState.lonRad)} · β{' '}
                {formatSignedDegrees(radToDeg(selectedState.latRad), 1)} · r{' '}
                {selectedState.distAu.toFixed(4)} AU
              </span>
            ) : (
              <span className="selectedStats">…</span>
            )}
            <button
              type="button"
              className="controlButton"
              onClick={() => setSelectedBody(null)}
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="selectedBodyHint">Click a planet to inspect</div>
        )}
      </div>
    </div>
  )
}
