import { useEffect, useRef } from 'react'
import { useAppStore } from '../state/store'

const MS_PER_HOUR = 60 * 60 * 1000

export function usePlayback() {
  const isPlaying = useAppStore((s) => s.isPlaying)
  const timeStepHours = useAppStore((s) => s.timeStep)
  const advanceTimeByMs = useAppStore((s) => s.advanceTimeByMs)

  const lastNowRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPlaying) {
      lastNowRef.current = null
      return
    }

    let raf = 0

    const tick = (now: number) => {
      const last = lastNowRef.current ?? now
      lastNowRef.current = now

      const dtMs = Math.min(250, Math.max(0, now - last))
      const simDeltaMs = (dtMs / 1000) * timeStepHours * MS_PER_HOUR
      advanceTimeByMs(simDeltaMs)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [advanceTimeByMs, isPlaying, timeStepHours])
}

