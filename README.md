# eli_lab SynthV Custom Scripts

A collection of experimental utility and music-creation scripts for **Synthesizer V Studio**. The repository is intentionally split between practical tools and destructive/expressive pitch experiments.

## Main menu families

### eli_lab - Pitch Baker

Tools for turning SynthV's dense, modern pitch behavior into editable, sparse or deliberately artificial curves.

- **Pitch Baker - Contour Engine** — generate/shape contour movement.
- **Pitch Baker - Decimation Engine** — curvature-aware curve simplification with Angular, VOCALOID and Extreme modes.
- **Pitch Baker - Gesture Engine** — pitch gestures and attacks.
- **Pitch Baker - Vibrato Engine** — phrase-aware vibrato with eligibility gating instead of vibrating every long-ish note.

### eli_lab - VOCALOID Tuning Lab

A separate experimental family for deliberately old-school VOCALOID-like tuning. These scripts are designed to start from flat or reset Pitch Deviation and create conspicuous, mathematical pitch gestures.

- **VOCALOID Tuning Lab** — master multi-era emulator with Classic, V1, V2, 2008 Emotional and 2008 Extreme behavior.
- **VOCALOID Accent Engine** — analyzes duration, melodic movement, phrase position and Japanese grammatical particles before adding accents.
- **VOCALOID V1 Tuning** — restrained early-era model.
- **VOCALOID V2 Tuning** — sharper attacks and stronger long-note behavior.
- **VOCALOID 2008 Emotional Tuning** — exaggerated late-2000s phrasing.
- **VOCALOID Classic Tuning** — earlier classic-style experimental model.

**2008 Extreme is intentionally not naturalistic.** It is the reference laboratory mode for testing large attacks, conspicuous accents, mathematical vibrato and unstable pitch movement.

### eli_lab - VOCALOID Utilities

Tools for preparing, freezing and analyzing pitch before/after an emulation pass.

- **Pitch Reset Utility** — clear Pitch Deviation, Pitch Controls, or both; selected-note or whole-group scope.
- **Bake SynthV Pitch** — uses SynthV 2.1.1+ computed pitch sampling to capture the actual generated pitch and freeze it into editable Pitch Deviation.
- **Japanese Mora Utility** — analyze Japanese lyrics as morae or split notes into mora-sized notes with equal/weighted timing.

## Recommended VOCALOID workflow

For the strongest old-school effect:

1. Select the phrase.
2. Run **VOCALOID Utilities → Pitch Reset Utility → Both**.
3. Run **VOCALOID Tuning Lab → VOCALOID Tuning Lab**.
4. Start with **2008 Extreme** if the goal is visibly artificial, expressive tuning.
5. If you want SynthV's modern generated pitch first, use **Bake SynthV Pitch**, then run a Pitch Baker or VOCALOID transformation on the baked result.
6. Use **Pitch Baker - Decimation Engine → VOCALOID/Extreme** when the curve is too dense.

## Japanese mora workflow

**Japanese Mora Utility** understands small kana combinations such as `きゃ`, `しゅ`, `ちょ`, while treating `ん`, `っ` and `ー` as independent mora units. This is intentionally useful for old VOCALOID-style syllabic accent experiments.

## Basic / Music Creation cleanup

The repository also contains general scripts for note duplication, randomization, splitting and other experimental music creation. The misspelled `NoteDublicator.js` was replaced by `NoteDuplicator.js`, and the note-length randomizer now respects the next note boundary rather than claiming to avoid overlaps while extending into neighboring notes.

## Compatibility

The new **Bake SynthV Pitch** and pitch-control functionality require Synthesizer V Studio **2.1.1+**. Other scripts remain compatible with older scripting APIs where possible.

Synthesizer V's current scripting API exposes computed pitch sampling through `SV.getComputedPitchForGroup()`, plus editable `pitchDelta` automation and pitch-control objects. The VOCALOID tools use these capabilities rather than attempting to imitate SynthV's internal pitch generator.

## Installation

1. Clone or download this repo.
2. Open Synthesizer V Studio and choose **File > Open Script Folder**.
3. Copy the `.js` scripts into the script folder, preserving the directory structure if desired.
4. Restart/reload scripts.
5. The `category` returned by each script controls which submenu it appears under.

## License

MIT License. Free to use, modify, and share. Credit appreciated for forks/ports.
