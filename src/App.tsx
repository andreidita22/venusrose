import './App.css'
import { SceneRoot } from './scene/SceneRoot'
import { ControlBar } from './ui/ControlBar'
import { useEffect } from 'react'
import { useAppStore } from './state/store'
import { usePlayback } from './ui/usePlayback'

function App() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  usePlayback()

  useEffect(() => {
    const saved = window.localStorage.getItem('venusrose.theme')
    if (saved === 'dark' || saved === 'light') setTheme(saved)
  }, [setTheme])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('venusrose.theme', theme)
  }, [theme])

  return (
    <div className="app">
      <SceneRoot />
      <ControlBar />
    </div>
  )
}

export default App
