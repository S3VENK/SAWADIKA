import type { CSSProperties, ReactNode } from 'react'

type CinematicSceneProps = {
  asset?: string
  variant: 'village' | 'forest' | 'gate' | 'shrine'
  children: ReactNode
}

export function CinematicScene({ asset, variant, children }: CinematicSceneProps) {
  const style = asset ? ({ '--scene-image': `url("${asset}")` } as CSSProperties) : undefined
  return (
    <div className={`cinematic-scene cinematic-${variant}`} style={style}>
      <div className="cinematic-backdrop" />
      <AtmosphereLayer />
      {children}
    </div>
  )
}

export function AtmosphereLayer() {
  return (
    <div className="atmosphere-layer" aria-hidden="true">
      <div className="mist mist-a" />
      <div className="mist mist-b" />
      <div className="dust-field" />
      <div className="distant-shadow" />
      <div className="watching-eyes"><i /><i /><i /><i /><i /></div>
      <div className="light-leak" />
      <div className="scene-vignette" />
    </div>
  )
}

export function FilmGrain() {
  return <div className="cinematic-grain" aria-hidden="true" />
}

export function CaseHUD({ step }: { step: number }) {
  return (
    <header className="case-hud">
      <div className="hud-brand"><b>๗๗</b><span>77 MYSTERIES<br />OF THAILAND</span></div>
      <div className="hud-progress"><span>CASE 001</span><i>{String(step).padStart(2, '0')} / 04</i></div>
    </header>
  )
}

export function DialogueOverlay({
  name,
  thaiName,
  thai,
  english,
  children,
}: {
  name: string
  thaiName: string
  thai: string
  english: string
  children?: ReactNode
}) {
  return (
    <div className="dialogue-overlay">
      <span className="dialogue-meta">WITNESS 01</span>
      <h2>{name} <i lang="th">{thaiName}</i></h2>
      <blockquote lang="th">“{thai}”</blockquote>
      <p>“{english}”</p>
      {children}
    </div>
  )
}

export function VoiceTalisman({
  listening,
  label,
  onPointerDown,
  onPointerUp,
}: {
  listening: boolean
  label: string
  onPointerDown: () => void
  onPointerUp: () => void
}) {
  return (
    <button
      className={`voice-talisman ${listening ? 'is-listening' : ''}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="talisman-rings"><i /><i /><i /></span>
      <span className="talisman-mic" aria-hidden="true" />
      <b>{label}</b>
    </button>
  )
}

export type TransitionKind = 'arrival' | 'witness' | 'case-file'

export function ChapterTransition({ kind }: { kind: TransitionKind }) {
  const copy = kind === 'arrival'
    ? ['เชียงราย', 'CHIANG RAI', '11:47 PM']
    : kind === 'witness'
      ? ['DAY 1', 'THE FIRST WITNESS', 'SILENCE AFTER THE RAIN']
      : ['CASE FILE UPDATED', 'EVIDENCE 01', '4 EARS · 5 EYES']

  return (
    <div className={`chapter-transition transition-${kind}`} role="status" aria-live="polite">
      <div className="transition-smoke" />
      <div className="transition-flame" />
      <span>{copy[0]}</span>
      <strong>{copy[1]}</strong>
      <i>{copy[2]}</i>
    </div>
  )
}

export function CaseFileUpdate() {
  return (
    <div className="case-file-strip" aria-label="Case file evidence updated">
      <span>EVIDENCE 01</span>
      <i>4 EARS</i>
      <i>5 EYES</i>
      <b>FILE UPDATED</b>
    </div>
  )
}
