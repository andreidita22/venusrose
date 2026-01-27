import { useMemo, useRef, useState } from 'react'
import { BODY_META } from '../astro/bodies'
import { computeSynodicEvents } from '../astro/events/synodicEvents'
import { DISTANCE_RANGE_AU, distanceCloseness } from '../astro/distanceRanges'
import { TRAIL_STEP_HOURS, TRAIL_WINDOW_DAYS } from '../astro/config'
import { astronomyEngineProvider } from '../astro/ephemeris/providerAstronomyEngine'
import { formatSignedDegrees, formatZodiacPosition } from '../astro/format'
import { radToDeg } from '../astro/math/angles'
import { MS_PER_HOUR } from '../astro/math/time'
import { trailCenterMsFor } from '../astro/trails/cache'
import { resolveTrailWindow } from '../astro/trails/window'
import type { FocusMode, TimeStep } from '../state/store'
import { useAppStore } from '../state/store'
import { formatUTCDateTimeLocal, parseUTCDateTimeLocal } from './datetime'
import { SynodicDial } from './SynodicDial'

function formatStep(step: TimeStep): string {
  if (step % 24 === 0) {
    const days = step / 24
    if (days === 30) return '1mo'
    return `${days}d`
  }
  return `${step}h`
}

function scrubRangeStepsForStep(step: TimeStep): number {
  if (step === 1) return 48 // ±2 days
  if (step === 6) return 56 // ±14 days
  if (step === 24) return 90 // ±90 days
  if (step === 168) return 52 // ±52 weeks
  return 24 // ±24 months
}

function formatOffset(step: TimeStep, steps: number): string {
  const hours = steps * step
  if (hours === 0) return '0'

  const sign = hours > 0 ? '+' : '−'
  const absHours = Math.abs(hours)
  const hoursPerMonth = 24 * 30
  if (absHours % hoursPerMonth === 0) return `${sign}${absHours / hoursPerMonth}mo`
  if (absHours % 24 === 0) return `${sign}${absHours / 24}d`
  return `${sign}${absHours}h`
}

export function ControlBar() {
  const t0 = useAppStore((s) => s.t0)
  const setT0 = useAppStore((s) => s.setT0)
  const advanceTimeByHours = useAppStore((s) => s.advanceTimeByHours)
  const tiltDeg = useAppStore((s) => s.tiltDeg)
  const setTiltDeg = useAppStore((s) => s.setTiltDeg)
  const toggles = useAppStore((s) => s.toggles)
  const toggle = useAppStore((s) => s.toggle)
  const selectedBody = useAppStore((s) => s.selectedBody)
  const setSelectedBody = useAppStore((s) => s.setSelectedBody)
  const bodyStates = useAppStore((s) => s.bodyStates)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const isPlaying = useAppStore((s) => s.isPlaying)
  const setIsPlaying = useAppStore((s) => s.setIsPlaying)
  const togglePlaying = useAppStore((s) => s.togglePlaying)
  const timeStep = useAppStore((s) => s.timeStep)
  const setTimeStep = useAppStore((s) => s.setTimeStep)
  const showMoonExtras = useAppStore((s) => s.showMoonExtras)
  const setShowMoonExtras = useAppStore((s) => s.setShowMoonExtras)
  const showDistanceBands = useAppStore((s) => s.showDistanceBands)
  const setShowDistanceBands = useAppStore((s) => s.setShowDistanceBands)
  const showSynodic = useAppStore((s) => s.showSynodic)
  const setShowSynodic = useAppStore((s) => s.setShowSynodic)
  const showEvents = useAppStore((s) => s.showEvents)
  const setShowEvents = useAppStore((s) => s.setShowEvents)
  const showTrails = useAppStore((s) => s.showTrails)
  const setShowTrails = useAppStore((s) => s.setShowTrails)
  const trailMode = useAppStore((s) => s.trailMode)
  const setTrailMode = useAppStore((s) => s.setTrailMode)
  const focusMode = useAppStore((s) => s.focusMode)
  const setFocusMode = useAppStore((s) => s.setFocusMode)

  const selectedState = selectedBody ? bodyStates[selectedBody] : null
  const selectedMeta = selectedBody ? BODY_META[selectedBody] : null
  const selectedRange = selectedBody ? DISTANCE_RANGE_AU[selectedBody] : undefined
  const closeness = selectedRange && selectedState ? distanceCloseness(selectedRange, selectedState.distAu) : null
  const sunState = bodyStates.sun

  const t0Ms = t0.getTime()
  const baseEventsWindowDays = selectedBody ? TRAIL_WINDOW_DAYS[selectedBody] : 0
  const eventsBaseCenterMs = useMemo(() => {
    if (!showEvents || !selectedBody) return t0Ms
    return trailCenterMsFor(t0Ms, baseEventsWindowDays)
  }, [baseEventsWindowDays, selectedBody, showEvents, t0Ms])

  const eventsSpec = useMemo(() => {
    if (!showEvents || !selectedBody) return null
    return resolveTrailWindow(
      astronomyEngineProvider,
      selectedBody,
      eventsBaseCenterMs,
      baseEventsWindowDays,
      TRAIL_STEP_HOURS[selectedBody],
      { ensureConjunctions: true },
    )
  }, [baseEventsWindowDays, eventsBaseCenterMs, selectedBody, showEvents])

  const synodicEvents = useMemo(() => {
    if (!showEvents || !selectedBody || !eventsSpec) return null
    return computeSynodicEvents(
      astronomyEngineProvider,
      selectedBody,
      new Date(eventsSpec.centerMs),
      eventsSpec.windowDays,
      TRAIL_STEP_HOURS[selectedBody],
    )
  }, [eventsSpec, selectedBody, showEvents])

  const [scrubSteps, setScrubSteps] = useState(0)
  const scrubAnchorMsRef = useRef<number | null>(null)

  const scrubMax = useMemo(() => scrubRangeStepsForStep(timeStep), [timeStep])

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 720
  })

  if (collapsed) {
    return (
      <div className="controlBar collapsed">
        <div className="controlRow">
          <button
            type="button"
            className="controlButton"
            onClick={() => setCollapsed(false)}
            title="Show controls"
          >
            Controls
          </button>
          <button
            type="button"
            className="controlButton"
            onClick={() => {
              setIsPlaying(false)
              advanceTimeByHours(-timeStep)
            }}
            title={`Step −${formatStep(timeStep)}`}
          >
            −
          </button>
          <button
            type="button"
            className="controlButton primary"
            onClick={() => togglePlaying()}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="controlButton"
            onClick={() => {
              setIsPlaying(false)
              advanceTimeByHours(timeStep)
            }}
            title={`Step +${formatStep(timeStep)}`}
          >
            +
          </button>
          <div className="compactMeta" title="UTC">
            {formatUTCDateTimeLocal(t0)}
            {selectedMeta ? ` · ${selectedMeta.glyph}` : ''}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="controlBar">
      <div className="controlRow">
        <button
          type="button"
          className="controlButton"
          onClick={() => setCollapsed(true)}
          title="Collapse controls"
        >
          Hide
        </button>
        <label className="controlLabel">
          UTC
          <input
            className="controlInput"
            type="datetime-local"
            value={formatUTCDateTimeLocal(t0)}
            onChange={(e) => {
              setIsPlaying(false)
              const next = parseUTCDateTimeLocal(e.target.value)
              if (next) setT0(next)
            }}
          />
        </label>
        <button
          type="button"
          className="controlButton"
          onClick={() => {
            setIsPlaying(false)
            setT0(new Date())
          }}
        >
          Now
        </button>
        <button
          type="button"
          className="controlButton"
          onClick={() => {
            setIsPlaying(false)
            advanceTimeByHours(-timeStep)
          }}
        >
          −{formatStep(timeStep)}
        </button>
        <button
          type="button"
          className="controlButton primary"
          onClick={() => togglePlaying()}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="controlButton"
          onClick={() => {
            setIsPlaying(false)
            advanceTimeByHours(timeStep)
          }}
        >
          +{formatStep(timeStep)}
        </button>

        <label className="controlLabel">
          Speed
          <select
            className="controlSelect"
            value={timeStep}
            onChange={(e) => {
              const next = Number(e.target.value) as TimeStep
              setTimeStep(next)
              setScrubSteps(0)
              scrubAnchorMsRef.current = null
            }}
          >
            <option value={1}>1h/s</option>
            <option value={6}>6h/s</option>
            <option value={24}>1d/s</option>
            <option value={168}>7d/s</option>
            <option value={720}>1mo/s</option>
          </select>
        </label>

        <label className="controlLabel">
          Focus
          <select
            className="controlSelect"
            value={focusMode}
            onChange={(e) => setFocusMode(e.target.value as FocusMode)}
            title="Dim or solo the selection"
          >
            <option value="off">Off</option>
            <option value="fade">Fade</option>
            <option value="solo">Solo</option>
          </select>
        </label>

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

      <div className="controlRow scrubRow">
        <label className="controlLabel">
          Scrub {formatOffset(timeStep, scrubSteps)}
          <input
            className="controlRange scrubRange"
            type="range"
            min={-scrubMax}
            max={scrubMax}
            step={1}
            value={scrubSteps}
            onPointerDown={() => {
              setIsPlaying(false)
              scrubAnchorMsRef.current = t0.getTime()
            }}
            onPointerUp={() => {
              scrubAnchorMsRef.current = null
              setScrubSteps(0)
            }}
            onPointerCancel={() => {
              scrubAnchorMsRef.current = null
              setScrubSteps(0)
            }}
            onChange={(e) => {
              setIsPlaying(false)
              const nextSteps = Number(e.target.value)
              setScrubSteps(nextSteps)

              if (scrubAnchorMsRef.current === null) scrubAnchorMsRef.current = t0.getTime()
              const next = scrubAnchorMsRef.current + nextSteps * timeStep * MS_PER_HOUR
              setT0(new Date(next))
            }}
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
            checked={showTrails}
            onChange={(e) => setShowTrails(e.target.checked)}
          />
          Trails
        </label>
        <label className="controlToggle">
          <input
            type="checkbox"
            checked={showMoonExtras}
            onChange={(e) => setShowMoonExtras(e.target.checked)}
          />
          Moon nodes
        </label>
        <label className="controlToggle">
          <input
            type="checkbox"
            checked={showDistanceBands}
            onChange={(e) => setShowDistanceBands(e.target.checked)}
          />
          Distance band
        </label>
        <label className="controlToggle">
          <input
            type="checkbox"
            checked={showSynodic}
            onChange={(e) => setShowSynodic(e.target.checked)}
          />
          Synodic
        </label>
        <label className="controlToggle">
          <input
            type="checkbox"
            checked={showEvents}
            onChange={(e) => setShowEvents(e.target.checked)}
          />
          Events
        </label>
        <label className="controlToggle">
          <input
            type="checkbox"
            checked={trailMode === '3d'}
            disabled={!showTrails}
            onChange={(e) => setTrailMode(e.target.checked ? '3d' : 'wheel')}
          />
          3D trail
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
              <>
                <span className="selectedStats">
                  {formatZodiacPosition(selectedState.lonRad)} · β{' '}
                  {formatSignedDegrees(radToDeg(selectedState.latRad), 1)} · r{' '}
                  {selectedState.distAu.toFixed(4)} AU
                </span>
                {closeness !== null && selectedMeta && selectedRange ? (
                  <span className="distanceStats">
                    <span className="distanceStatsLabel">
                      Close {Math.round(closeness * 100)}%
                    </span>
                    <span className="distanceGauge" aria-hidden>
                      <span
                        className="distanceGaugeFill"
                        style={{
                          width: `${Math.round(closeness * 100)}%`,
                          background: selectedMeta.color,
                        }}
                      />
                    </span>
                    <span className="distanceStatsRange">
                      {selectedRange.minAu.toFixed(2)}–{selectedRange.maxAu.toFixed(2)} AU
                    </span>
                  </span>
                ) : null}
                {showSynodic && selectedBody !== 'sun' && sunState ? (
                  <SynodicDial body={selectedBody} bodyState={selectedState} sunState={sunState} t0={t0} theme={theme} />
                ) : null}
                {showEvents && synodicEvents && synodicEvents.length > 0 ? (
                  <div className="eventChips" aria-label="Synodic events">
                    {(() => {
                      const nextIndex = synodicEvents.findIndex((ev) => ev.timeMs >= t0Ms)
                      return synodicEvents.map((ev, idx) => {
                        const isNext = nextIndex >= 0 && idx === nextIndex
                        const isPast = ev.timeMs < t0Ms
                        const timeLabel = formatUTCDateTimeLocal(new Date(ev.timeMs)).replace('T', ' ')
                        const title = [ev.details ?? ev.kind, `${timeLabel} UTC`].filter(Boolean).join(' · ')
                        return (
                          <button
                            key={`${ev.kind}-${Math.round(ev.timeMs)}`}
                            type="button"
                            className={`eventChip${isPast ? ' past' : ''}${isNext ? ' next' : ''}`}
                            title={title}
                            onClick={() => {
                              setIsPlaying(false)
                              setT0(new Date(ev.timeMs))
                            }}
                          >
                            <span className="eventChipLabel">{ev.label}</span>
                            <span className="eventChipTime">{timeLabel}</span>
                          </button>
                        )
                      })
                    })()}
                  </div>
                ) : null}
              </>
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
