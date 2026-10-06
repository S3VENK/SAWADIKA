import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'analyzing' | 'ready' | 'error'
export type RecognitionState = 'idle' | 'listening' | 'result' | 'uncertain' | 'error'

type SpeechRecognitionEventLike = Event & {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string; confidence: number }
  }>
}

type SpeechRecognitionErrorEventLike = Event & { error: string; message?: string }

type SpeechRecognitionLike = EventTarget & {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: ((event: Event) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  const recognitionWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition ?? null
}

export function useThaiSpeechRecognition() {
  const [state, setState] = useState<RecognitionState>('idle')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const transcriptRef = useRef('')
  const supported = typeof window !== 'undefined' && recognitionConstructor() !== null

  const reset = useCallback(() => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    transcriptRef.current = ''
    setTranscript('')
    setError(null)
    setState('idle')
  }, [])

  const start = useCallback(() => {
    const Constructor = recognitionConstructor()
    if (!Constructor) {
      setError('Thai speech recognition is not supported in this browser.')
      setState('error')
      return
    }

    recognitionRef.current?.abort()
    const recognition = new Constructor()
    recognitionRef.current = recognition
    transcriptRef.current = ''
    setTranscript('')
    setError(null)

    recognition.lang = 'th-TH'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setState('listening')
    recognition.onresult = (event) => {
      let combined = ''
      let hasFinal = false
      for (let index = 0; index < event.results.length; index += 1) {
        combined += event.results[index][0]?.transcript ?? ''
        if (event.results[index].isFinal) hasFinal = true
      }
      const heard = combined.trim()
      transcriptRef.current = heard
      setTranscript(heard)
      if (hasFinal) setState(heard ? 'result' : 'uncertain')
    }
    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        setState('uncertain')
        return
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Speech recognition permission was denied. You can retry or use Demo Mode.')
      } else if (event.error === 'network') {
        setError('Browser speech recognition is temporarily unavailable. You can retry or use Demo Mode.')
      } else {
        setError('Speech recognition could not understand that attempt. Please try again.')
      }
      setState('error')
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setState((current) => {
        if (current === 'error' || current === 'result') return current
        return transcriptRef.current ? 'result' : 'uncertain'
      })
    }

    try {
      recognition.start()
    } catch {
      setError('Speech recognition could not start. Please try again or use Demo Mode.')
      setState('error')
    }
  }, [])

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // Recognition may already have ended after producing a final result.
    }
  }, [])

  const simulateSuccess = useCallback((text = 'ยายเห็นอะไรครับ') => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    transcriptRef.current = text
    setTranscript(text)
    setError(null)
    setState('result')
  }, [])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  return { supported, state, transcript, error, start, stop, reset, simulateSuccess }
}

const supportedAudioTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
]

function preferredMimeType() {
  return supportedAudioTypes.find((type) => MediaRecorder.isTypeSupported(type))
}

function recordingErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Microphone permission was denied. Allow microphone access and try again.'
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No microphone was found on this device.'
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'The microphone is busy or unavailable. Close other recording apps and try again.'
    }
  }
  return 'Recording could not start. Please try again.'
}

export function useVoiceRecorder(analysisDelay = 1100) {
  const [state, setState] = useState<RecorderState>('idle')
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const releasedBeforeReadyRef = useRef(false)
  const analysisTimerRef = useRef<number | null>(null)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const clearRecording = useCallback(() => {
    setRecordingUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }, [])

  const stopRecording = useCallback(() => {
    releasedBeforeReadyRef.current = true
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
  }, [])

  const startRecording = useCallback(async () => {
    if (state === 'requesting' || state === 'recording' || state === 'analyzing') return

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setState('error')
      setError('This browser does not support microphone recording.')
      return
    }

    releasedBeforeReadyRef.current = false
    setError(null)
    clearRecording()
    setState('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mimeType = preferredMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      })

      recorder.addEventListener('error', () => {
        stopTracks()
        setState('error')
        setError('A recording error occurred. Please try again.')
      })

      recorder.addEventListener('stop', () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        stopTracks()
        recorderRef.current = null

        if (!blob.size) {
          setState('error')
          setError('No audio was captured. Hold the button a little longer and try again.')
          return
        }

        setRecordingUrl(URL.createObjectURL(blob))
        setState('analyzing')
        analysisTimerRef.current = window.setTimeout(() => setState('ready'), analysisDelay)
      })

      recorder.start(100)
      setState('recording')

      if (releasedBeforeReadyRef.current) {
        window.setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop()
        }, 250)
      }
    } catch (cause) {
      stopTracks()
      recorderRef.current = null
      setState('error')
      setError(recordingErrorMessage(cause))
    }
  }, [analysisDelay, clearRecording, state, stopTracks])

  const playRecording = useCallback(() => {
    if (!recordingUrl) return
    const audio = new Audio(recordingUrl)
    void audio.play()
  }, [recordingUrl])

  const reset = useCallback(() => {
    if (analysisTimerRef.current) window.clearTimeout(analysisTimerRef.current)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    stopTracks()
    clearRecording()
    recorderRef.current = null
    setError(null)
    setState('idle')
  }, [clearRecording, stopTracks])

  useEffect(() => () => {
    if (analysisTimerRef.current) window.clearTimeout(analysisTimerRef.current)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    stopTracks()
    if (recordingUrl) URL.revokeObjectURL(recordingUrl)
  }, [recordingUrl, stopTracks])

  return { state, recordingUrl, error, startRecording, stopRecording, playRecording, reset }
}

async function loadSpeechVoices() {
  const initial = window.speechSynthesis.getVoices()
  if (initial.length) return initial

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const timeout = window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 700)
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      window.clearTimeout(timeout)
      resolve(window.speechSynthesis.getVoices())
    }, { once: true })
  })
}

export async function speakThai(text: string) {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return { ok: false, message: 'Speech playback is not supported in this browser.' }
  }

  const voices = await loadSpeechVoices()
  const thaiVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('th'))
  if (!thaiVoice) {
    return { ok: false, message: 'No Thai speech voice is installed in this browser.' }
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'th-TH'
  utterance.voice = thaiVoice
  utterance.rate = 0.78
  window.speechSynthesis.speak(utterance)
  return { ok: true, message: null }
}
