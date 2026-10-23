# Apple StandBy Music

A mobile-first web app that emulates Apple's iOS StandBy music screen for YouTube and YouTube Music without requiring the phone to be charging or docked.

## Features
- **Apple StandBy Experience**: Full-screen landscape UI with large rounded artwork, Apple typography, and progress scrubber.
- **Dynamic Fluid Ambient Mesh**: Real-time canvas sampler extracts dominant colors from the album art and paints an animated fluid gradient background.
- **Live Synced Karaoke Lyrics**: Powered by LRCLIB with line-by-line glowing highlights, auto-centering, and tap-to-seek.
- **Bedside Night Mode**: Deep crimson-red monochrome night stand display for dark environments.
- **Screen Wake Lock**: Automatically prevents display sleep during active playback.
- **Zero API Keys**: Plays any song or playlist directly via the YouTube IFrame API.

## Running Locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.
