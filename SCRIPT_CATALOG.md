# eli_lab Script Catalog

## Target

**Synthesizer V Studio Pro 1.11.0b1 / Synthesizer V Engine 2.8.1**

This document is the working map of the repository: what each family is for, what is destructive, and what should be built next.

---

## 1. Architecture

```text
eli_lab
│
├── Basic
│   └── small repeatable editing operations
│
├── Music Creation
│   └── note generation / variation / workflow helpers
│
├── Pitch Baker
│   └── modern SynthV pitch → sparse / damaged / stylized pitch
│
├── VOCALOID Tuning Lab
│   └── flat notes → deliberate old-school VOCALOID grammar
│
└── VOCALOID Utilities
    └── reset / bake / scale / offset / Japanese helpers
```

The menu family is defined by each script's `category` field. The physical `vocaloid_emulation` directory is retained for compatibility with the existing script setup; its visible menu family is **eli_lab - VOCALOID Tuning Lab**.

---

# 2. Pitch Baker

## Contour Engine

Generates a complete artificial contour for selected notes.

- phrase-aware attacks
- repeated-note instability
- large-interval gestures
- scoop / fall / rise / crack / overshoot vocabulary
- deterministic seed
- optional replacement of selected Pitch Deviation

### Future

- explicit phrase-boundary mode
- direction-aware gesture library
- intensity envelope across a phrase
- one-gesture-per-phrase mode

## Gesture Engine

Applies one recognizable gesture to each selected note.

- Scoop Up / Down
- Overshoot Up / Down
- Fall / Rise
- Crack
- Kink

Supports deterministic seed, replacement mode and sparse/normal/dense point density.

### Future

- gesture selection based on melodic interval
- gesture selection based on lyric class
- attack-only and phrase-ending-only modes

## Vibrato Engine

Adds vibrato selectively instead of vibrating every note.

```text
note
 ↓
eligibility gate
 ↓
phrase / duration / interval analysis
 ↓
probability
 ↓
vibrato shape
```

Protects particles, weak morae, short notes and large melodic jumps.

Supports Smooth, Asymmetric, Broken and Mechanical shapes, Long Notes Only, deterministic seed and replacement mode.

### Important fix

The old Long Notes Only mode had zero probability because its coverage multiplier was `0`. It is now a real long-note-only mode.

### Future

A separate **Vibrato Gate** utility should remove vibrato-like regions without destroying large accents and attacks.

## Decimation Engine

Converts dense Pitch Deviation into sparse editable geometry.

```text
sample pitchDelta
      ↓
RDP simplification
      ↓
reinsert note boundaries
      ↓
reinsert strong extrema
      ↓
optional angular / VOCALOID instability
      ↓
write sparse curve
```

### Important fix

The previous implementation could erase automation belonging to unselected notes between the first and last selected note. It now splits the selection into contiguous runs per NoteGroup and processes only those runs.

### Future

- preserve-vibrato mode
- preserve-attacks-only mode
- VOCALOID point-rhythm mode
- point-count diagnostics

---

# 3. VOCALOID Tuning Lab

The central experimental family. It is not an attempt to reconstruct proprietary historical source code; it is a behavioral model inspired by early VOCALOID tuning.

## Master: VOCALOID Tuning Lab

Models:

- Classic
- V1
- V2
- 2008 Emotional
- **2008 Extreme**

The vocabulary is intentionally artificial:

- conspicuous attacks
- angular overshoots
- phrase-final falls
- selective mathematical vibrato
- repeated-note instability
- accent asymmetry
- grammatical-particle suppression

### 2008 Extreme

The reference laboratory mode. It should sound like a deliberately hand-tuned late-2000s vocal, not like a modern singer with a vintage filter.

### Safety fix

Clearing existing Pitch Deviation now operates on each selected note range instead of deleting the entire range between the first and last selected notes.

## VOCALOID Accent Engine

Adds accents without vibrato.

Factors:

- duration
- melodic movement
- repeated pitch
- phrase beginning / ending
- particles
- weak morae
- long-note weighting

Shapes:

- Rise-Fall
- Snap
- Overshoot
- Broken
- Fall-Then-Hit

Supports particle policy, long-note policy, deterministic seed and replacement mode.

## VOCALOID Inter-Note Accent

Creates expression **between** notes rather than decorating every note interior.

Styles:

- Scoop Into Next
- Dip Between
- Overshoot Next
- Double Accent
- Broken

Only selected adjacent notes in the same NoteGroup are paired.

## VOCALOID 2008 Extreme

Standalone version of the extreme preset for quick repeatable access without opening the master model selector.

Features:

- Strong / Extreme / Maximum intensity
- Sparse / Classic / Aggressive / Mechanical vibrato
- deterministic seed
- selected-range clearing
- group-local neighbor analysis

This is intended to be the first script to test when the goal is the screenshot aesthetic you have been developing.

---

# 4. VOCALOID Utilities

## Bake SynthV Pitch

Studio 1.x workflow:

```text
Sing / Rap Auto pitch
        ↓
setPitchAutoMode(false)
        ↓
SynthV moves generated pitch into Pitch Deviation
        ↓
Manual frozen curve
```

This deliberately avoids Studio 2-only computed-pitch and Pitch Control APIs.

## Pitch Reset Utility

Modes:

- Pitch Deviation only
- Pitch Deviation + Auto Mode
- Auto Mode only

Reset is note-range based, so non-contiguous selections do not destroy the automation between selected notes.

## Japanese Mora Utility

Understands small-kana combinations and special morae such as:

```text
きゃ きゅ きょ
しゃ しゅ しょ
ちゃ ちゅ ちょ
にゃ にゅ にょ
ひゃ ひゅ ひょ
みゃ みゅ みょ
りゃ りゅ りょ

ん
っ
ー
```

It can analyze selected lyrics or split selected notes into morae with equal, weighted or front-loaded timing.

### Fix

Splitting now uses each selected note's actual parent NoteGroup instead of assuming that every selected note belongs to the current editor group.

### Future

Expose the mora classification as a shared conceptual layer for Accent Engine and the master Tuning Lab.

## Scale Pitch Deviation

Multiplies existing Pitch Deviation without changing note pitch.

Useful values:

```text
50%   tame
100%  unchanged
150%  push
200%  exaggerated
300%  destructive laboratory
```

The utility explicitly samples the range endpoints so interpolated curve sections are also transformed.

## Offset Pitch Deviation

Adds/subtracts a constant number of cents. It also protects interpolated values at the range boundaries.

---

# 5. Music Creation / workflow cleanup

## Note Duplicator

Now operates in the selected note's actual NoteGroup instead of assuming the current editor group.

Future: duplicate before/after, stack/arpeggiate mode, avoid-overlap mode, optional pitch-data copying.

## Randomize Note Lengths

Now respects the actual next note in each NoteGroup and avoids the old minimum-duration overlap mistake.

Future: deterministic seed, short/long bias, preserve legato and phrase-final notes.

## Randomize Pitch in Key

Current major-scale randomizer.

Future: minor modes, Japanese pentatonic scales, chromatic probability, stay-near-original weighting and deterministic seed.

## Split Note into N Pieces

Now uses the source note's actual parent group, preserves exact total duration and uses clones where available.

## Make Selected Notes Legato

Closes selected-note gaps without moving note onsets.

## Quantize Selected Note Lengths

Quantizes duration while protecting the next note onset.

---

# 6. Next utilities worth building

### `VOCALOID Vibrato Gate`

Remove vibrato-like oscillation while leaving large accents and attacks alone.

### `VOCALOID Phrase Boundary Accent`

Accent only first/last/long-final/large-entry notes.

### `Japanese Mora Accent Map`

Classify:

```text
CONTENT
PARTICLE
WEAK
LONG VOWEL
NASAL
GEMINATE
```

### `Pitch Deviation Copy / Paste`

Move a successful curve from one phrase to another.

### `Pitch Deviation Normalize`

Normalize selected curves to a chosen peak range without changing their shape.

---

# 7. Quality rules for future scripts

1. Operate only on the intended selection.
2. Never erase unselected notes between selected notes.
3. Use NoteGroup-local neighbors.
4. Avoid accidental destructive stacking on repeated runs.
5. Expose a Replace option when appropriate.
6. Give randomized tools a seed.
7. Stay compatible with Studio 1.11.0b1.
8. Match the visible menu category to the architecture.
9. Use a user-facing name rather than an implementation name.
10. Make destructive behavior obvious in the dialog.

---

# 8. Current development priority

```text
1. VOCALOID 2008 Extreme
2. Accent / Inter-Note Accent intelligence
3. Japanese Mora Analyzer / shared classifier
4. Vibrato Gate
5. Pitch Deviation Copy/Paste
6. Pitch Deviation Normalize
7. Pitch Baker event-preserving presets
8. More workflow utilities
9. Historical preset refinement
```

The guiding principle:

> **Make the algorithm smarter about where to be unnatural, not smarter about how to hide the unnaturalness.**
