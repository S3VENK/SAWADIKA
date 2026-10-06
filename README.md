# 77 Mysteries of Thailand

A polished, mobile-first hackathon MVP for an AI × Solana Thai-speaking adventure game. This prototype contains one complete playable episode: **Case #001 — Chiang Rai: The Mystery of the Golden Ashes**.

## What is included

- Three-scene, sub-60-second Thai survival training sequence
- Five cinematic mystery scenes with working navigation
- Five animated Thai tone contours with browser speech-synthesis examples
- Optional pre-generated synthetic Thai voice lines with automatic browser Thai TTS fallback
- Interactive phrase builder with explicit polite-particle choice
- Real browser microphone recording for phrase repetition
- Real Thai speech-to-text through the browser Web Speech Recognition API when available
- Intent-based phrase matching and polite-particle detection
- In-memory playback with no upload or permanent voice storage
- Simulated calibration and clearly labelled prototype pronunciation estimates
- Graceful microphone permission, unsupported-browser, and recording-error states
- Real browser Thai speech recognition when Web Speech Recognition is supported, with Demo Mode fallback
- Two-attempt voice-key challenge with tone feedback
- Animated ancient gate and atmospheric forest effects
- Responsive mobile and desktop layouts
- Final speaking and tone scores
- Locked Solana proof action (visual placeholder only)

This version intentionally has no backend, authentication, production AI semantic service, real acoustic pronunciation analysis, or Solana transactions. Browser microphone recording and Thai speech recognition are real when the visitor's browser supports the required Web APIs; intent evaluation and pronunciation/tone scores remain prototype implementations.

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

Five key story moments support pre-generated synthetic Thai voice audio. Place the real MP3 assets at these exact paths:

| Voice line | Asset path |
| --- | --- |
| Narrator opening | `public/audio/th/narrator-opening.mp3` |
| Yai Kham greeting | `public/audio/th/yai-kham-greeting.mp3` |
| Yai Kham clue | `public/audio/th/yai-kham-clue.mp3` |
| Gate warning | `public/audio/th/gate-warning.mp3` |
| Case-solved message | `public/audio/th/case-solved.mp3` |

Pre-generated synthetic voice playback is used only when the corresponding asset is present and playable. This repository does not include placeholder, silent, or generated MP3 files. If an asset is missing or playback fails, `playThaiVoice()` falls back to the existing browser Thai speech synthesis and the UI displays **Prototype browser voice**. If the browser has no Thai speech-synthesis voice, the existing graceful unavailable message is shown. The app does not claim human voice acting.

The first-phrase repetition uses `getUserMedia()` and `MediaRecorder`. Audio is held only as an in-memory browser object URL, can be played back by the learner, and is never uploaded or saved permanently.

Microphone recording and permission behavior must be tested manually in the target browser because permission prompts and device availability cannot be validated by the production build.

`src/voice.ts` contains the reusable recorder, Thai speech-synthesis, and Thai Web Speech Recognition helpers. Recognition uses `lang = "th-TH"`, `continuous = false`, and `interimResults = true`. Browsers without Speech Recognition retain recording and expose a clearly labelled Demo Mode so the story cannot get stuck.

`src/thaiLanguage.ts` contains the **Prototype semantic evaluator** and polite-particle detector. The current keyword-based evaluator transparently checks for the Thai concepts `เห็น` and `อะไร`; it is not a production AI semantic service. `ครับ`, `ค่ะ`, and `คะ` are detected separately and do not determine whether the core meaning passes.

Pronunciation and tone scores are prototype estimates. TODO: Replace keyword matching with a production AI semantic evaluation service, replace prototype pronunciation/tone estimates with real acoustic analysis, and add real Solana transactions only in a future integration phase.

## Case 001 cinematic assets

The Case 001 scenes use replaceable art slots defined in `src/case001.ts`. Until final artwork is supplied, layered color, mist, light, grain, vignette, dust, and shadow treatments keep the scenes playable without inserting fake image files.

Place final WebP artwork at these exact paths:

| Scene asset | Public path |
| --- | --- |
| Yai Kham at the village house | `public/cases/001/witness-yai-kham.webp` |
| Chiang Rai village at night | `public/cases/001/village-night.webp` |
| Forest investigation | `public/cases/001/forest-night.webp` |
| Ancient voice gate | `public/cases/001/voice-gate.webp` |

Artwork should contain no UI text. The interface supplies dialogue, case metadata, transitions, and responsive overlays separately so images can be replaced without editing scene components.

## Game state architecture

`src/game/gameMachine.ts` is the single source of truth for progression and persistent gameplay state. Its typed reducer rejects out-of-order progression events, so locked scenes cannot be reached by dispatching later events early. `src/game/GameProvider.tsx` exposes the reducer state and dispatch through React Context.

Thai intent evaluation remains in `src/thaiLanguage.ts`; microphone recording, playback, speech synthesis, and browser speech recognition remain in `src/voice.ts`. Successful phrase and witness recognition results dispatch typed evaluator events into the game machine.

The Solana claim stage is represented in state, but it is explicitly marked unavailable. No wallet connection or transaction is currently implemented.
