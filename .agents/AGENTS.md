## Recent Codenames
1. **zenith-clean** (Commit `001a652`): Complete removal of intrusive InstallModal and disabling of iOS MediaSession metadata to permanently eradicate the Dynamic Island album art pill and popup nags.
2. **zenith-pure** (Commit `947bc74`): Complete removal of silent keep-alive audio loop, permanently eliminating the intrusive Dynamic Island pill and duplicate album art in StandBy mode.
3. **zenith-clarity** (Commit `ac77ac0`): Crystal-clear HD album art with automatic maxresdefault resolution and multi-tier fallback, ultra-minimal synced lyrics header with subtle floating close button.
4. **hyperion-library** (Commit `e904890`): Real YouTube Music library integration with server-side playlist browse parser, home sync banner, one-tap library import, auto-populated custom quick picks, and quick-pick song pinning.
5. **solaris-music** (Commit `4d116b7`): Comprehensive visual and UI elevation featuring animated equalizer waveforms across active tracks and docked mini-player, dynamic time-of-day greetings, ambient backdrops on playlist detail sheets, illuminated glowing Apple transport controls, and tabular-num jitter-free scrubbers.

## Rules
- **Commit & Push Workflow**: When instructed to save, commit, or back up code, you must ALWAYS run both `git commit` AND `git push` sequentially. Never leave a commit unpushed. Always explicitly mention the Git commit hash in your response after a successful push.
- **Global UI Desync Prevention**: When heavily modifying layouts, structural components, or core logic in `src/app/page.tsx`, you MUST explicitly check and synchronously update all parallel category pages (e.g. `/videos`, `/photos`, `/favorites`, `/trash`, `/tags`) that rely on the same structure to prevent UI desynchronization.
- **React Prop Verification**: When debugging UI state or rendering issues, ALWAYS verify that the component is receiving the correct props from its parent before investigating deep architectural flaws, data fetching, or internal state logic. Check the plumbing before ripping out the pipes.
