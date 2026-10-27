## Recent Codenames
1. **zenith-stream** (Commit `2dcc85d`, v1.0.2): Dual-engine native HTML5 audio stream engine with server-side range requests (`/api/stream`), real iOS background audio playback via hardware AAC (`audio/mp4`), native lock screen controls, in-viewport fallback player, and PWA auto-updater (`/api/version`).
2. **zenith-zero** (Commit `c902071`, v1.0.1): Complete eradication of `useMediaSession` to permanently prevent any parent-page media session publishing, unblocked native Picture-in-Picture controls in Cinema Mode for genuine iOS background play, and version bump to v1.0.1.
3. **zenith-clean** (Commit `001a652`): Complete removal of intrusive InstallModal and disabling of iOS MediaSession metadata to permanently eradicate the Dynamic Island album art pill and popup nags.
4. **zenith-pure** (Commit `947bc74`): Complete removal of silent keep-alive audio loop, permanently eliminating the intrusive Dynamic Island pill and duplicate album art in StandBy mode.
5. **zenith-clarity** (Commit `ac77ac0`): Crystal-clear HD album art with automatic maxresdefault resolution and multi-tier fallback, ultra-minimal synced lyrics header with subtle floating close button.

## Rules
- **Commit & Push Workflow**: When instructed to save, commit, or back up code, you must ALWAYS run both `git commit` AND `git push` sequentially. Never leave a commit unpushed. Always explicitly mention the Git commit hash in your response after a successful push.
- **Global UI Desync Prevention**: When heavily modifying layouts, structural components, or core logic in `src/app/page.tsx`, you MUST explicitly check and synchronously update all parallel category pages (e.g. `/videos`, `/photos`, `/favorites`, `/trash`, `/tags`) that rely on the same structure to prevent UI desynchronization.
- **React Prop Verification**: When debugging UI state or rendering issues, ALWAYS verify that the component is receiving the correct props from its parent before investigating deep architectural flaws, data fetching, or internal state logic. Check the plumbing before ripping out the pipes.
