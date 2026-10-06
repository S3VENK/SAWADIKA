# 77 Mysteries of Thailand

A polished, mobile-first hackathon MVP for an AI × Solana Thai-speaking adventure game. This prototype contains one complete playable episode: **Case #001 — Chiang Rai: The Mystery of the Golden Ashes**.

## What is included

- Three-scene, sub-60-second Thai survival training sequence
- Five cinematic mystery scenes with working navigation
- Five animated Thai tone contours with browser speech-synthesis examples
- Interactive phrase builder with explicit polite-particle choice
- Real browser microphone recording for phrase repetition
- Real Thai speech-to-text through the browser Web Speech Recognition API when available
- Intent-based phrase matching and polite-particle detection
- In-memory playback with no upload or permanent voice storage
- Simulated calibration and clearly labelled prototype pronunciation estimates
- Graceful microphone permission, unsupported-browser, and recording-error states
- Simulated Thai speech recognition
- Two-attempt voice-key challenge with tone feedback
- Animated ancient gate and atmospheric forest effects
- Responsive mobile and desktop layouts
- Final speaking and tone scores
- Locked Solana proof action (visual placeholder only)

This version intentionally has no backend, authentication, real AI, real speech recognition, or Solana transactions.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Demo flow

1. Complete the three short training scenes: Thai basics, tone calibration, and the first phrase.
2. Begin Case #001 and start the investigation.
3. Hold **Hold to Repeat** while speaking, release to stop, then play back your real in-browser recording.
4. Recall the learned phrase on the witness screen, then press **Hold to Speak**.
5. Hear Yai Kham's clue and follow the tracks.
6. At the gate, the first speaking attempt returns tone feedback; the second succeeds.
7. Enter the shrine to see the solved-case screen and scores.

## Stack

- React
- TypeScript
- Vite
- Dependency-free CSS animation and inline SVG artwork

## Voice behavior

The first-phrase repetition uses `getUserMedia()` and `MediaRecorder`. Audio is held only as an in-memory browser object URL, can be played back by the learner, and is never uploaded or saved permanently.

`src/voice.ts` contains the reusable recorder, Thai speech-synthesis, and Thai Web Speech Recognition helpers. Recognition uses `lang = "th-TH"`, `continuous = false`, and `interimResults = true`. Browsers without Speech Recognition retain recording and expose a clearly labelled Demo Mode so the story cannot get stuck.

`src/thaiLanguage.ts` contains the **Prototype semantic evaluator** and polite-particle detector. The current evaluator transparently checks for the Thai concepts `เห็น` and `อะไร`; it is not presented as AI. `ครับ`, `ค่ะ`, and `คะ` are detected separately and do not determine whether the core meaning passes.

TODO: Replace keyword matching with a production AI semantic evaluation service, and replace prototype pronunciation/tone estimates with real acoustic analysis.
