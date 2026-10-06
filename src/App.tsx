import { useEffect, useState } from 'react'
import { playThaiVoice, speakThai, useThaiSpeechRecognition, useVoiceRecorder, type ThaiVoiceSource } from './voice'
import { detectPoliteParticle, evaluateInvestigationIntent } from './thaiLanguage'
import type { ThaiVoiceLineId } from './voiceLines'
import { case001 } from './case001'
import { CaseFileUpdate, CaseHUD, ChapterTransition, CinematicScene, DialogueOverlay, FilmGrain, VoiceTalisman, type TransitionKind } from './cinematic'
import { useGame } from './game/GameProvider'
import type { GameEvent, GameScene } from './game/gameMachine'

const sceneProgress: Partial<Record<GameScene, number>> = {
  witness: 1,
  clue: 2,
  'voice-gate': 3,
  'creature-reveal': 4,
  'case-solved': 4,
  'solana-claim': 4,
}

const toneShapes = [
  { name: 'MID', path: 'M4 30 C32 30 58 30 96 30' },
  { name: 'LOW', path: 'M4 23 C34 24 61 35 96 39' },
  { name: 'FALLING', path: 'M4 14 C34 15 61 35 96 45' },
  { name: 'HIGH', path: 'M4 38 C35 36 64 20 96 15' },
  { name: 'RISING', path: 'M4 39 C29 44 62 27 96 12' },
]

function MountainLayers() {
  return (
    <div className="landscape" aria-hidden="true">
      <div className="moon" />
      <div className="stars" />
      <div className="mountain mountain-far" />
      <div className="mountain mountain-near" />
      <div className="tree-line tree-line-back" />
      <div className="tree-line tree-line-front" />
      <div className="fog fog-one" />
      <div className="fog fog-two" />
      <div className="fog fog-three" />
    </div>
  )
}

function CornerMarks() {
  return (
    <>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
    </>
  )
}

function Sigil() {
  return (
    <div className="sigil" aria-hidden="true">
      <span /><span /><span />
    </div>
  )
}

function AudioCurve({ target = false, active = false }: { target?: boolean; active?: boolean }) {
  const path = target
    ? 'M2 34 C13 34 14 18 25 18 S38 49 49 35 S63 9 75 24 S91 39 101 18 S116 28 126 28'
    : 'M2 34 C14 35 15 11 27 20 S38 51 51 36 S66 18 77 29 S91 45 102 26 S115 34 126 31'
  return (
    <svg className={`audio-curve ${active ? 'audio-active' : ''}`} viewBox="0 0 128 62" role="img" aria-label={target ? 'Target pitch curve' : 'Your pitch curve'}>
      <path className="curve-glow" d={path} />
      <path className="curve-line" d={path} />
      {[20, 50, 80, 110].map((x) => <line key={x} className="curve-guide" x1={x} y1="8" x2={x} y2="52" />)}
    </svg>
  )
}

function SinglePitchContour() {
  const path = 'M4 43 C29 46 61 30 96 13'
  return (
    <svg className="audio-curve single-contour audio-active" viewBox="0 0 100 56" role="img" aria-label="Single rising target pitch contour">
      <path className="curve-glow" d={path} />
      <path className="curve-line" d={path} />
      <circle cx="4" cy="43" r="2.5" />
      <circle cx="96" cy="13" r="2.5" />
    </svg>
  )
}

function ToneContour({ name, path, onSpeechResult }: { name: string; path: string; onSpeechResult: (message: string | null, source: ThaiVoiceSource) => void }) {
  const playExample = async () => {
    const result = await speakThai('กา')
    onSpeechResult(result.message, result.ok ? 'browser-tts' : 'unavailable')
  }
  return (
    <div className="tone-contour">
      <svg viewBox="0 0 100 58" aria-label={`${name} tone pitch contour`} role="img">
        <path className="tone-shadow" d={path} />
        <path className="tone-path" d={path} />
        <circle cx="4" cy={path.includes('14') ? 14 : path.includes('38') || path.includes('39') ? 39 : path.includes('23') ? 23 : 30} r="2.5" />
      </svg>
      <div><b>{name}</b><button className="speaker-button" onClick={playExample} aria-label={`Play ${name.toLowerCase()} tone prototype`}>▶</button></div>
    </div>
  )
}

function Creature() {
  return (
    <div className="creature-wrap" aria-label="Silhouette of an unknown creature with four ears and five glowing eyes" role="img">
      <div className="creature-aura" />
      <svg className="creature" viewBox="0 0 240 190" aria-hidden="true">
        <path d="M53 52 30 4l49 30C91 26 103 22 120 22s29 4 41 12l49-30-23 48c18 17 29 41 29 69 0 40-35 60-96 60S24 161 24 121c0-28 11-52 29-69Z" />
        <path d="m78 37-2-35 31 24M162 37l2-35-31 24" />
        <g className="creature-eyes">
          <ellipse cx="72" cy="93" rx="7" ry="4" />
          <ellipse cx="96" cy="82" rx="7" ry="4" />
          <ellipse cx="120" cy="91" rx="7" ry="4" />
          <ellipse cx="144" cy="82" rx="7" ry="4" />
          <ellipse cx="168" cy="93" rx="7" ry="4" />
        </g>
      </svg>
    </div>
  )
}

function ForestGate({ open }: { open: boolean }) {
  return (
    <div className={`gate-stage ${open ? 'is-open' : ''}`} aria-label={open ? 'Ancient forest gate opening' : 'Closed ancient forest gate'} role="img">
      <div className="gate-light" />
      <div className="gate-pillar gate-left"><i /><b /></div>
      <div className="gate-pillar gate-right"><i /><b /></div>
      <div className="gate-crossbar"><span>๗๗</span></div>
      <div className="gate-door door-left"><i /></div>
      <div className="gate-door door-right"><i /></div>
      <div className="gate-ground" />
    </div>
  )
}

export default function App() {
  const { state: game, dispatch } = useGame()
  const [calibrating, setCalibrating] = useState(false)
  const [calibrated, setCalibrated] = useState(false)
  const [speechFallback, setSpeechFallback] = useState<string | null>(null)
  const [voiceSource, setVoiceSource] = useState<ThaiVoiceSource | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [chapterTransition, setChapterTransition] = useState<TransitionKind | null>(null)
  const phraseRecorder = useVoiceRecorder()
  const phraseRecognition = useThaiSpeechRecognition()
  const witnessRecognition = useThaiSpeechRecognition()
  const scene = game.currentScene
  const sceneClass = scene === 'training-1' ? 'training-a'
    : scene === 'training-2' ? 'training-b'
      : scene === 'training-3' ? 'training-c'
        : scene === 'case-intro' ? 'title'
          : scene === 'voice-gate' ? 'gate'
            : scene === 'case-solved' ? 'solved'
              : scene

  const moveTo = (event: GameEvent) => {
    if (transitioning) return
    setTransitioning(true)
    window.setTimeout(() => {
      dispatch(event)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTransitioning(false)
    }, 420)
  }

  const moveThroughChapter = (event: GameEvent, kind: TransitionKind) => {
    if (transitioning || chapterTransition) return
    setChapterTransition(kind)
    window.setTimeout(() => {
      dispatch(event)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 1450)
    window.setTimeout(() => setChapterTransition(null), 2800)
  }

  const runCalibration = () => {
    if (calibrating || calibrated) return
    setCalibrating(true)
    window.setTimeout(() => {
      setCalibrating(false)
      setCalibrated(true)
    }, 1350)
  }

  const speakAtGate = () => {
    dispatch({ type: 'GATE_ATTEMPT' })
  }

  useEffect(() => {
    if (scene === 'start') dispatch({ type: 'START' })
  }, [dispatch, scene])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && scene === 'case-intro') moveThroughChapter({ type: 'BEGIN_INVESTIGATION' }, 'arrival')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scene])

  const sceneNumber = sceneProgress[scene] ?? 1
  const particle = game.selectedSpeechStyle
  const chosenPhrase = particle === 'simple' ? 'เห็นอะไร?' : `ยายเห็นอะไร${particle}?`
  const phraseIntent = evaluateInvestigationIntent(phraseRecognition.transcript)
  const phrasePoliteness = detectPoliteParticle(phraseRecognition.transcript)
  const phrasePassed = game.phraseUnlocked
  const phraseMissed = phraseRecognition.state === 'result' && !phraseIntent.passes
  const witnessIntent = evaluateInvestigationIntent(witnessRecognition.transcript)
  const witnessPassed = game.witnessIntentPassed
  const witnessMissed = witnessRecognition.state === 'result' && !witnessIntent.passes

  useEffect(() => {
    if (scene === 'training-3' && phraseRecognition.state === 'result' && phraseIntent.passes && !game.phraseUnlocked) {
      dispatch({ type: 'PHRASE_EVALUATED', passed: true })
    }
  }, [dispatch, game.phraseUnlocked, phraseIntent.passes, phraseRecognition.state, scene])

  useEffect(() => {
    if (scene === 'witness' && witnessRecognition.state === 'result' && witnessRecognition.transcript) {
      dispatch({ type: 'WITNESS_EVALUATED', transcript: witnessRecognition.transcript, passed: witnessIntent.passes })
    }
  }, [dispatch, scene, witnessIntent.passes, witnessRecognition.state, witnessRecognition.transcript])
  const startPhraseVoice = () => {
    phraseRecognition.reset()
    void phraseRecorder.startRecording()
    phraseRecognition.start()
  }
  const stopPhraseVoice = () => {
    phraseRecorder.stopRecording()
    phraseRecognition.stop()
  }
  const playThai = async (text: string) => {
    const result = await speakThai(text)
    setSpeechFallback(result.message)
    setVoiceSource(result.ok ? 'browser-tts' : 'unavailable')
  }
  const playStoryVoice = async (lineId: ThaiVoiceLineId) => {
    const result = await playThaiVoice(lineId)
    setSpeechFallback(result.message)
    setVoiceSource(result.source)
  }

  const resetGame = () => {
    phraseRecorder.reset()
    phraseRecognition.reset()
    witnessRecognition.reset()
    setCalibrating(false)
    setCalibrated(false)
    setSpeechFallback(null)
    setVoiceSource(null)
    dispatch({ type: 'RESET_GAME' })
  }

  return (
    <main className={`game scene-${sceneClass} ${transitioning ? 'is-transitioning' : ''}`}>
      <MountainLayers />
      <div className="grain" aria-hidden="true" />
      <FilmGrain />
      {scene.startsWith('training') || scene === 'case-intro' || scene === 'start' ? (
        <header className="topbar">
          <div className="brand-mini"><b>๗๗</b><span>MYSTERIES<br />OF THAILAND</span></div>
          {scene.startsWith('training') && <div className="case-progress training-progress"><span>TRAINING</span><i>{scene.slice(-1)}/3</i></div>}
        </header>
      ) : <CaseHUD step={Math.max(sceneNumber, 1)} />}

      {voiceSource === 'browser-tts' && <div className="voice-source-label" role="status">PROTOTYPE BROWSER VOICE</div>}
      {chapterTransition && <ChapterTransition kind={chapterTransition} />}

      <div className="scene-shell">
        {scene === 'training-1' && (
          <section className="panel training-panel basics-panel" aria-labelledby="training-a-heading">
            <CornerMarks />
            <div className="scene-label">FIELD ORIENTATION · 01</div>
            <Sigil />
            <div className="eyebrow"><span />INVESTIGATOR TRAINING<span /></div>
            <h1 id="training-a-heading">HOW THAI WORKS</h1>
            <p className="lesson-number">Thai Survival Lesson 01</p>
            <div className="tone-truth"><i className="sound-rings" /><p>Thai is a <strong>tonal language.</strong></p></div>
            <div className="language-concepts">
              <div><b>44</b><span>CONSONANT<br />LETTERS</span></div>
              <div><b className="thai-glyphs">◌ะ</b><span>VOWEL<br />FORMS</span></div>
              <div><b>5</b><span>TONES</span></div>
            </div>
            <div className="training-message"><p>You don’t need to memorize them.</p><strong>Tonight, you only need to listen — and speak.</strong></div>
            <button className="primary-button" onClick={() => moveTo({ type: 'COMPLETE_TRAINING_1' })}><span>LEARN TO LISTEN</span><b>→</b></button>
            <p className="microcopy">LESS THAN 60 SECONDS · SOUND ON</p>
          </section>
        )}

        {scene === 'training-2' && (
          <section className="panel training-panel tones-panel" aria-labelledby="training-b-heading">
            <CornerMarks />
            <div className="scene-label">FIELD ORIENTATION · 02</div>
            <div className="eyebrow"><span />LISTEN TO THE TONE<span /></div>
            <h1 id="training-b-heading">YOUR VOICE MATTERS</h1>
            <p className="training-intro">Thai has five tones.<br /><strong>The shape of your voice can change meaning.</strong></p>
            <p className="tone-shape-label">SIMPLIFIED TONE SHAPES FOR LEARNING</p>
            <div className="tone-grid">
              {toneShapes.map((tone) => <ToneContour key={tone.name} {...tone} onSpeechResult={(message, source) => { setSpeechFallback(message); setVoiceSource(source) }} />)}
            </div>
            <p className="prototype-audio">▶ Prototype audio uses your browser’s Thai speech voice.</p>
            {speechFallback && <p className="voice-fallback" role="status">{speechFallback}</p>}
            <div className={`calibration-card ${calibrated ? 'is-calibrated' : ''}`}>
              <span className="mission-kicker">VOICE CALIBRATION</span>
              <div className="calibration-curves">
                <div><small>TARGET TONE</small><SinglePitchContour /></div>
                <div><small>YOUR VOICE</small><AudioCurve active={calibrating || calibrated} /></div>
              </div>
              {!calibrated ? (
                <button className={`voice-button ${calibrating ? 'is-listening' : ''}`} onClick={runCalibration} disabled={calibrating}><span className="mic-icon">●</span><b>{calibrating ? 'ANALYZING…' : 'TRY IT'}</b><i /></button>
              ) : (
                <><div className="calibration-result"><b>VOICE MATCH <em>89%</em></b><span>VOICE CALIBRATED ✓</span></div><small className="estimate-note">Prototype tone estimate</small></>
              )}
            </div>
            {calibrated && <button className="primary-button" onClick={() => moveTo({ type: 'COMPLETE_TRAINING_2' })}><span>LEARN YOUR FIRST PHRASE</span><b>→</b></button>}
          </section>
        )}

        {scene === 'training-3' && (
          <section className="panel training-panel phrase-panel" aria-labelledby="training-c-heading">
            <CornerMarks />
            <div className="scene-label">FIELD ORIENTATION · 03</div>
            <div className="eyebrow"><span />SPEAK TO INVESTIGATE<span /></div>
            <h1 id="training-c-heading">YOUR FIRST<br />INVESTIGATION PHRASE</h1>
            <div className="hero-phrase"><strong lang="th">เห็นอะไร?</strong><span>WHAT DID YOU SEE?</span></div>
            <div className="word-cards">
              <button onClick={() => void playThai('เห็น')}><b lang="th">เห็น</b><span>SEE</span><i>▶</i></button>
              <button onClick={() => void playThai('อะไร')}><b lang="th">อะไร</b><span>WHAT</span><i>▶</i></button>
            </div>
            {speechFallback && <p className="voice-fallback compact-fallback" role="status">{speechFallback}</p>}
            <div className="grammar-note"><span>LEARNING NOTE</span><p>Thai verbs don’t change for past tense.<br />Context words can tell you when something happened.</p></div>
            <div className="polite-guide">
              <p>Choose how you want to speak. <strong>We never infer gender from your voice.</strong></p>
              <div className="particle-notes"><span><b lang="th">ครับ</b> polite particle — commonly used by male speakers</span><span><b lang="th">คะ</b> polite question particle — commonly used by female speakers</span></div>
              <div className="particle-choices" role="group" aria-label="Choose a Thai speaking style">
                <button className={particle === 'ครับ' ? 'selected' : ''} onClick={() => dispatch({ type: 'SELECT_SPEECH_STYLE', style: 'ครับ' })} lang="th">ครับ</button>
                <button className={particle === 'คะ' ? 'selected' : ''} onClick={() => dispatch({ type: 'SELECT_SPEECH_STYLE', style: 'คะ' })} lang="th">คะ</button>
                <button className={particle === 'simple' ? 'selected' : ''} onClick={() => dispatch({ type: 'SELECT_SPEECH_STYLE', style: 'simple' })}>SIMPLE THAI</button>
              </div>
            </div>
            <div className="phrase-builder">
              <span>YOUR PHRASE</span><strong lang="th">{chosenPhrase}</strong>
              <button className="listen-button" onClick={() => void playThai(chosenPhrase)}>▶ &nbsp; LISTEN</button>
            </div>
            {!phrasePassed && (
              <button
                className={`voice-button real-recorder ${phraseRecorder.state === 'recording' || phraseRecorder.state === 'requesting' ? 'is-listening' : ''}`}
                onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startPhraseVoice() }}
                onPointerUp={stopPhraseVoice}
                onPointerCancel={stopPhraseVoice}
                onKeyDown={(event) => { if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) startPhraseVoice() }}
                onKeyUp={(event) => { if (event.key === ' ' || event.key === 'Enter') stopPhraseVoice() }}
                disabled={phraseRecorder.state === 'analyzing'}
              >
                <span className="mic-icon">●</span>
                <b>{phraseRecorder.state === 'requesting' ? 'ALLOW MICROPHONE…' : phraseRecognition.state === 'listening' || phraseRecorder.state === 'recording' ? 'LISTENING… RELEASE TO STOP' : phraseRecorder.state === 'analyzing' ? 'ANALYZING VOICE…' : phraseRecorder.state === 'error' ? 'TRY MICROPHONE AGAIN' : 'HOLD TO REPEAT'}</b>
                <i />
              </button>
            )}
            {phraseRecorder.error && <div className="recording-error" role="alert"><b>MICROPHONE UNAVAILABLE</b><span>{phraseRecorder.error}</span></div>}
            {phraseRecorder.recordingUrl && phraseRecorder.state !== 'recording' && phraseRecorder.state !== 'requesting' && (
              <button className="play-recording" onClick={phraseRecorder.playRecording}>▶ &nbsp; PLAY MY VOICE</button>
            )}
            {phraseRecognition.transcript && <div className="heard-card"><small>I HEARD</small><strong lang="th">“{phraseRecognition.transcript}”</strong></div>}
            {phraseMissed && <div className="intent-retry"><b>NOT QUITE</b><span>“I heard: {phraseRecognition.transcript}”</span><small>Try asking what she saw.</small></div>}
            {(phraseRecognition.state === 'uncertain' || phraseRecognition.state === 'error') && <div className="intent-retry"><b>I’M NOT SURE I HEARD THAT</b><span>{phraseRecognition.error ?? 'Try saying it again.'}</span></div>}
            {!phraseRecognition.supported && <button className="demo-mode" onClick={() => phraseRecognition.simulateSuccess(chosenPhrase)}>DEMO MODE · SIMULATE RECOGNITION</button>}
            {phrasePassed && (
              <>
                <div className="estimate-label">PROTOTYPE SEMANTIC EVALUATOR</div>
                <div className="phrase-feedback"><span>MEANING <b>✓</b></span><span>POLITENESS <b>{phrasePoliteness ? '✓' : 'SIMPLE'}</b></span><span>TONE <b>82%</b></span></div>
              </>
            )}
            <p className="local-audio-note">Recording stays in this browser session and is never uploaded.</p>
            {phrasePassed && (
              <div className="phrase-unlocked"><small>PHRASE UNLOCKED</small><strong lang="th">เห็นอะไร?</strong><span>WHAT DID YOU SEE?</span></div>
            )}
            {phrasePassed && <button className="primary-button" onClick={() => moveTo({ type: 'BEGIN_CASE' })}><span>BEGIN CASE #001</span><b>→</b></button>}
          </section>
        )}

        {scene === 'case-intro' && (
          <section className="panel title-panel" aria-labelledby="title-heading">
            <CornerMarks />
            <div className="eyebrow"><span />A THAI LANGUAGE ADVENTURE<span /></div>
            <Sigil />
            <h1 id="title-heading"><small>77</small>MYSTERIES<br /><em>OF THAILAND</em></h1>
            <p className="tagline">Speak Thai. <i>•</i> Solve Mysteries. <i>•</i> Discover Thailand.</p>
            <button className="story-voice-button" onClick={() => void playStoryVoice('narratorOpening')}>▶ &nbsp; LISTEN TO NARRATOR</button>
            <div className="case-file">
              <span>CASE #001</span>
              <strong>CHIANG RAI</strong>
              <div className="gold-rule" />
              <h2>THE MYSTERY OF<br />THE GOLDEN ASHES</h2>
            </div>
            <button className="primary-button" onClick={() => moveThroughChapter({ type: 'BEGIN_INVESTIGATION' }, 'arrival')}>
              <span>START INVESTIGATION</span><b>→</b>
            </button>
            <p className="microcopy">HEADPHONES RECOMMENDED&nbsp; · &nbsp;8 MINUTES</p>
          </section>
        )}

        {scene === 'witness' && (
          <CinematicScene asset={case001.assets.witness} variant="village">
            <section className={`panel story-panel witness-panel ${witnessPassed ? 'voice-succeeded' : ''}`} aria-labelledby="witness-heading">
              <div className="location-stamp"><span>{case001.location}</span><i>{case001.time}</i></div>
              <div className="witness-portrait-area" role="img" aria-label="Yai Kham seated outside a Northern Thai wooden house by lantern light">
                <div className="lantern-glow" />
              </div>
              <div className="witness-interface">
                <DialogueOverlay
                  name={case001.witness.name}
                  thaiName={case001.witness.thaiName}
                  thai={case001.witness.dialogue}
                  english={case001.witness.translation}
                >
                  <button className="story-voice-button" onClick={() => void playStoryVoice('yaiKhamGreeting')}>▶ &nbsp; LISTEN</button>
                </DialogueOverlay>
                <div className="mission-overlay">
                  <span className="mission-kicker">YOUR MISSION</span>
                  <h3>ASK THE WITNESS IN THAI</h3>
                  <p>“What did you see?”</p>
                  {!witnessPassed ? (
                    <VoiceTalisman
                      listening={witnessRecognition.state === 'listening'}
                      label={witnessRecognition.state === 'listening' ? 'LISTENING…' : 'HOLD TO SPEAK'}
                      onPointerDown={() => { witnessRecognition.reset(); witnessRecognition.start() }}
                      onPointerUp={witnessRecognition.stop}
                    />
                  ) : (
                    <div className="voice-unlocked">
                      <strong lang="th">ยายเห็นอะไรครับ?</strong>
                      <span>VOICE RECOGNIZED</span>
                      <b>CLUE UNLOCKED</b>
                    </div>
                  )}
                  {game.witnessTranscript && !witnessPassed && <div className="heard-card compact-heard"><small>I HEARD</small><strong lang="th">“{game.witnessTranscript}”</strong></div>}
                  {witnessMissed && <div className="intent-retry compact-intent"><b>NOT QUITE</b><span>Try asking what she saw.</span></div>}
                  {(witnessRecognition.state === 'uncertain' || witnessRecognition.state === 'error') && <div className="intent-retry compact-intent"><b>I’M NOT SURE I HEARD THAT</b><span>Try saying it again.</span></div>}
                  {!witnessRecognition.supported && <button className="demo-mode" onClick={() => witnessRecognition.simulateSuccess('ยายเห็นอะไรครับ')}>DEMO MODE · SIMULATE RECOGNITION</button>}
                  <small className="simulation-note">Prototype semantic evaluator · Thai speech recognition</small>
                </div>
              </div>
              {witnessPassed && <button className="text-button cinematic-continue" onClick={() => moveThroughChapter({ type: 'OPEN_CLUE' }, 'case-file')}>OPEN UPDATED CASE FILE <span>→</span></button>}
            </section>
          </CinematicScene>
        )}

        {scene === 'clue' && (
          <CinematicScene asset={case001.assets.forest} variant="forest">
          <section className="panel story-panel clue-panel" aria-labelledby="clue-heading">
            <CornerMarks />
            <div className="scene-label">FOREST EDGE · 11:47 PM</div>
            <div className="clue-layout">
              <Creature />
              <div className="clue-copy">
                <div className="speaker">YAI KHAM <span>ยายคำ</span></div>
                <blockquote lang="th">“มันมีสี่หู...<br />ห้าตา”</blockquote>
                <p>“It had four ears... and five eyes.”</p>
                <button className="story-voice-button" onClick={() => void playStoryVoice('yaiKhamClue')}>▶ &nbsp; LISTEN</button>
              </div>
            </div>
            <div className="discovery-card">
              <span className="discovery-kicker">✦ &nbsp; NEW CLUE DISCOVERED &nbsp; ✦</span>
              <h2 id="clue-heading">THE FOREST CREATURE</h2>
              <div className="clue-facts"><div><b>4</b><span>EARS</span></div><i /><div><b>5</b><span>EYES</span></div></div>
            </div>
            <CaseFileUpdate />
            <button className="primary-button" onClick={() => moveTo({ type: 'FOLLOW_TRACKS' })}><span>FOLLOW THE TRACKS</span><b>→</b></button>
          </section>
          </CinematicScene>
        )}

        {scene === 'voice-gate' && (
          <CinematicScene asset={case001.assets.gate} variant="gate">
          <section className="panel story-panel gate-panel" aria-labelledby="gate-heading">
            <CornerMarks />
            <div className="scene-label">DEEP FOREST · ANCIENT GATE</div>
            <ForestGate open={game.gateUnlocked} />
            <div className={`gate-console ${game.gateUnlocked ? 'accepted' : ''}`}>
              <span className="gate-kicker">{game.gateUnlocked ? 'GATE UNSEALED' : 'VOICE KEY REQUIRED'}</span>
              <h2 id="gate-heading">{game.gateUnlocked ? 'THE FOREST REMEMBERS' : 'Speak the passphrase'}</h2>
              <p>{game.gateUnlocked ? 'Your voice has opened the path.' : 'Only the correct Thai voice can open the gate.'}</p>
              {!game.gateUnlocked && <button className="story-voice-button" onClick={() => void playStoryVoice('gateWarning')}>▶ &nbsp; HEAR WARNING</button>}
              {!game.gateUnlocked && (
                <>
                  <div className="curves">
                    <div><small>YOUR VOICE</small><AudioCurve active={game.gateAttempts > 0} /></div>
                    <div><small>TARGET</small><AudioCurve target /></div>
                  </div>
                  {game.gateAttempts === 1 && <div className="tone-feedback"><b>ALMOST…</b><span>Try lowering your tone.</span></div>}
                  <button className="voice-button compact" onClick={speakAtGate}><span className="mic-icon">●</span><b>{game.gateAttempts === 1 ? 'TRY AGAIN' : 'SPEAK'}</b><i /></button>
                  <small className="simulation-note">Attempt {game.gateAttempts === 0 ? '1' : '2'} of 2 · Prototype simulation</small>
                </>
              )}
              {game.gateUnlocked && <button className="primary-button" onClick={() => moveTo({ type: 'REVEAL_CREATURE' })}><span>ENTER THE SHRINE</span><b>→</b></button>}
            </div>
          </section>
          </CinematicScene>
        )}

        {scene === 'creature-reveal' && (
          <CinematicScene asset={case001.assets.forest} variant="forest">
            <section className="panel story-panel creature-reveal-panel" aria-labelledby="creature-reveal-heading">
              <CornerMarks />
              <div className="scene-label">THE SHRINE · FINAL REVEAL</div>
              <div className="reveal-creature"><Creature /></div>
              <div className="discovery-card reveal-card">
                <span className="discovery-kicker">✦ &nbsp; THE LEGEND AWAKENS &nbsp; ✦</span>
                <h2 id="creature-reveal-heading">SI HU HA TA</h2>
                <p>THE FOUR-EARED, FIVE-EYED GUARDIAN</p>
              </div>
              <button className="primary-button" onClick={() => moveTo({ type: 'SOLVE_CASE', speakingScore: 87, toneScore: 91 })}><span>COMPLETE CASE #001</span><b>→</b></button>
            </section>
          </CinematicScene>
        )}

        {scene === 'case-solved' && (
          <CinematicScene variant="shrine">
          <section className="panel solved-panel" aria-labelledby="solved-heading">
            <CornerMarks />
            <div className="sunburst" aria-hidden="true" />
            <Sigil />
            <div className="eyebrow"><span />MYSTERY REVEALED<span /></div>
            <h1 id="solved-heading"><small>CASE #001</small>SOLVED</h1>
            <p className="thai-solved" lang="th">ไขปริศนาแล้ว</p>
            <button className="story-voice-button" onClick={() => void playStoryVoice('caseSolved')}>▶ &nbsp; HEAR CASE RESULT</button>
            <div className="solution-copy">
              <span>THE CREATURE WAS</span>
              <strong>SI HU HA TA</strong>
              <p>A guardian spirit from the legends of Lanna.</p>
            </div>
            <div className="score-grid">
              <div><span>THAI SPEAKING</span><b>{game.speakingScore}</b><small>/ 100</small></div>
              <div><span>TONE ACCURACY</span><b>{game.toneScore}</b><small>/ 100</small></div>
            </div>
            <p className="score-disclaimer">Prototype pronunciation estimate</p>
            <div className="rank"><span>INVESTIGATOR RANK</span><b>GOLD</b></div>
            <button className="solana-button" onClick={() => moveTo({ type: 'OPEN_SOLANA_CLAIM' })}><span className="solana-mark">S</span><b>VIEW SOLANA CLAIM</b><i>NEXT</i></button>
          </section>
          </CinematicScene>
        )}

        {scene === 'solana-claim' && (
          <CinematicScene variant="shrine">
            <section className="panel solved-panel solana-claim-panel" aria-labelledby="solana-claim-heading">
              <CornerMarks />
              <Sigil />
              <div className="eyebrow"><span />CASE PROOF<span /></div>
              <h1 id="solana-claim-heading"><small>SOLANA CLAIM</small>COMING SOON</h1>
              <p className="thai-solved">No transaction has been created.</p>
              <div className="solution-copy">
                <span>CLAIM STATUS</span>
                <strong>{game.solanaClaimStatus.toUpperCase()}</strong>
                <p>Real Solana integration is intentionally not implemented in this prototype.</p>
              </div>
              <button className="solana-button" disabled><span className="solana-mark">S</span><b>CREATE PROOF ON SOLANA</b><i>LOCKED</i></button>
              <button className="restart-button" onClick={resetGame}>RESTART INVESTIGATION</button>
            </section>
          </CinematicScene>
        )}
      </div>

      <footer><span>77 MYSTERIES</span><i />AI × SOLANA HACKATHON PROTOTYPE</footer>
    </main>
  )
}
