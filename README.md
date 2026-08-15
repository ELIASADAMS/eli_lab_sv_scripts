# eli_lab SynthV Custom Scripts

Experimental and practical scripts for **Synthesizer V Studio Pro 1.11.x**.

The collection is intentionally split into workflow utilities and destructive/expressive pitch tools. The main goal is not maximum naturalness: many Pitch Baker and VOCALOID Tuning Lab scripts are designed to create sparse, mechanical, exaggerated or deliberately artificial vocal curves.

## Target environment

Primary development target:

```text
Synthesizer V Studio Pro 1.11.0b1
Synthesizer V Engine 2.8.1
```

The scripts use the Studio 1.x scripting model available to this environment. In particular, the VOCALOID workflow relies on `pitchDelta` and the 1.9.0b2+ `getPitchAutoMode()` / `setPitchAutoMode()` APIs.

**Do not assume Studio 2.x pitch-control APIs are required.** The repository intentionally avoids Studio 2-only `PitchControlCurve`, `PitchControlPoint`, retake, phoneme-timing and computed-pitch APIs in its core 1.11 workflow.

SynthV 1.x supports freezing AI-generated pitch by switching Sing/Rap notes to Manual Mode; the generated pitch is moved into Pitch Deviation and stops regenerating. That is the basis of **Bake SynthV Pitch**.

## Menu structure

### `eli_lab - Basic`

Small editing operations that should be safe to use repeatedly.

- **Split Note into N Pieces** — exact-duration note splitting.
- **Replace + with - in Lyrics** — lyric cleanup.

### `eli_lab - Music Creation`

Generative and workflow-oriented note tools.

- **Note Duplicator** — duplicate notes with pitch/duration variation.
- **Randomize Note Lengths** — bounded duration randomization.
- **Randomize Pitch in Key** — pitch randomization within a selected major scale.
- **Make Selected Notes Legato** — close gaps without moving note onsets.
- **Quantize Selected Note Lengths** — duration quantization with next-note protection.

### `eli_lab - Pitch Baker`

The destructive pitch-processing laboratory.

- **Contour Engine** — deliberately generated pitch gestures.
- **Decimation Engine** — turn dense automation into sparse geometry while preserving selected-note boundaries.
- **Gesture Engine** — explicit scoops, overshoots, falls, rises, cracks and kinks.
- **Vibrato Engine** — selective phrase-aware vibrato rather than vibrating every note.

### `eli_lab - VOCALOID Tuning Lab`

The old-school VOCALOID laboratory. These tools assume that the source pitch is flat or deliberately reset, then create conspicuous mathematical pitch behavior.

- **VOCALOID Tuning Lab** — master multi-era engine.
- **VOCALOID Accent Engine** — contextual accent generation.
- **VOCALOID Inter-Note Accent** — puts pitch events at the boundary between two selected notes.
- **VOCALOID Classic Tuning Emulator**
- **VOCALOID V1 Tuning**
- **VOCALOID V2 Tuning**
- **VOCALOID 2008 Emotional Tuning**
- **VOCALOID 2008 Extreme** — standalone extreme laboratory preset.

The master engine's **2008 Extreme** mode and the standalone **VOCALOID 2008 Extreme** script are the reference experimental styles. They intentionally favor exaggerated attacks, selective vibrato, phrase endings, repeated-note instability and conspicuous accents.

### `eli_lab - VOCALOID Utilities`

Preparation and adjustment tools for the tuning lab.

- **Bake SynthV Pitch** — freeze selected AI-generated pitch into Pitch Deviation using Studio 1.x Manual Mode.
- **Pitch Reset Utility** — remove Pitch Deviation from selected note ranges and optionally return notes to Auto Mode.
- **Japanese Mora Utility** — Japanese mora analysis/splitting support.
- **Scale Pitch Deviation** — multiply existing Pitch Deviation without changing note pitch.
- **Offset Pitch Deviation** — add/subtract a constant number of cents.

## Recommended VOCALOID workflow

For the deliberately artificial late-2000s sound:

1. Select the phrase.
2. Run **VOCALOID Utilities → Pitch Reset Utility → Pitch Deviation + Auto Mode**.
3. If you want SynthV's AI performance as a starting point, instead run **Bake SynthV Pitch** first.
4. Run **VOCALOID Tuning Lab → VOCALOID Tuning Lab** or the standalone **VOCALOID 2008 Extreme** preset.
5. Start with **2008 Extreme** and reduce the settings only if the result is too aggressive.
6. Use **VOCALOID Accent Engine** for a second accent pass.
7. Use **VOCALOID Inter-Note Accent** when the missing character is in the transitions rather than inside the notes.
8. If the curve is too dense, use **Pitch Baker → Decimation Engine → VOCALOID/Extreme**.
9. Use **Scale Pitch Deviation** to quickly push a successful result to 150–300% rather than regenerating it.

### Why Extreme is useful

The desired aesthetic is not simply “random pitch”. It is **controlled artificiality**:

```text
flat note
   ↓
phrase analysis
   ↓
accent / attack / transition decisions
   ↓
mathematical gestures
   ↓
sparse editable Pitch Deviation
```

The algorithm should therefore become more intelligent about **where** to be extreme, not merely more conservative.

## Design principles

### 1. Selected means selected

Scripts that modify automation should not erase or rewrite unselected notes between two selected notes. This is especially important for decimation and reset tools.

### 2. NoteGroup-local context

Pitch decisions should use neighbors from the note's own `NoteGroup`, not simply the previous/next item in the current selection.

### 3. Deterministic experiments

Randomized pitch tools increasingly expose a seed so that a successful result can be reproduced exactly.

### 4. Preserve musical boundaries

Pitch automation is stored as `pitchDelta` in cents. The Pitch Baker tools operate directly on that automation rather than maintaining a separate curve representation.

### 5. Extreme is a feature

The project is deliberately interested in robotic, angular, mathematical and historically-inspired VOCALOID-like tuning. “More natural” is not automatically “better”.

## Documentation

See **[SCRIPT_CATALOG.md](SCRIPT_CATALOG.md)** for the current inventory, known limitations and development roadmap.

## Installation

Synthesizer V Pro scans its scripts folder at startup and also provides **Scripts → Rescan**.

Keep the directory structure from this repository when copying the scripts so the source remains organized. The `category` returned by each script determines the visible menu family.

## License

MIT License. Free to use, modify and share. Credit appreciated for forks and ports.
