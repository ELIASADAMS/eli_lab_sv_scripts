# eli_lab Script Catalog

## Target

**Synthesizer V Studio Pro 1.11.0b1 / Synthesizer V Engine 2.8.1**

This document is the working map of the repository. It is intentionally more practical than the README: what each family is for, what is safe, what is destructive, and what should be built next.

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
    └── reset / bake / inspect / scale / offset / Japanese helpers
```

The menu family is defined by each script's `category` field. The physical `vocaloid_emulation` directory is currently the source directory for the VOCALOID Tuning Lab scripts; it can be renamed later if the SynthV script scanner is confirmed to recurse into the new folder name on the target installation.

---

# 2. Pitch Baker

## Contour Engine

**Purpose:** generate a complete artificial contour for selected notes.

Current behavior:

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
- “one gesture per phrase” mode

---

## Gesture Engine

**Purpose:** apply exactly one recognizable gesture to each selected note.

Current vocabulary:

- Scoop Up
- Scoop Down
- Overshoot Up
- Overshoot Down
- Fall
- Rise
- Crack
- Kink

Now supports:

- deterministic seed
- replacement mode
- sparse / normal / dense point density

### Future

- gesture selection based on melodic interval
- gesture selection based on lyric class
- “attack only” mode
- “phrase ending only” mode

---

## Vibrato Engine

**Purpose:** add vibrato selectively instead of putting oscillation on every note.

Current model:

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

It protects:

- particles
- weak morae
- short notes
- large melodic jumps

It supports:

- Smooth
- Asymmetric
- Broken
- Mechanical
- Long Notes Only
- deterministic seed
- replace-selected-note mode

### Important bug fixed

The previous `Long Notes Only` setting had zero probability because its coverage multiplier was `0`. It now behaves as a real forced coverage mode.

### Future

A separate **Vibrato Gate** utility is still desirable: remove vibrato-like regions without touching unrelated pitch accents.

---

## Decimation Engine

**Purpose:** convert dense Pitch Deviation into sparse, editable geometry.

Current pipeline:

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

### Important bug fixed

The previous version could remove automation from unselected notes located between the first and last selected notes. It now splits the selection into contiguous runs per NoteGroup and processes only those runs.

### Future

- event-aware decimation presets
- “preserve vibrato” mode
- “preserve attacks only” mode
- “VOCALOID point rhythm” mode
- visual point-count diagnostics

---

# 3. VOCALOID Tuning Lab

This is the main experimental identity of the repository.

## Master: VOCALOID Tuning Lab

Models:

- Classic
- V1
- V2
- 2008 Emotional
- **2008 Extreme**

The goal is not historical source-code reconstruction. The goal is a convincing **behavioral vocabulary** inspired by early VOCALOID tuning:

- conspicuous attacks
- angular overshoots
- phrase-final falls
- selective mathematical vibrato
- repeated-note instability
- accent asymmetry
- grammatical-particle suppression

### 2008 Extreme

This should remain the reference test preset.

The target is:

```text
NOT
"natural but slightly old"

BUT
"obviously hand-tuned by someone in 2008"
```

High intensity is therefore intentional.

### Important safety improvement

Clearing existing Pitch Deviation now operates on each selected note range instead of deleting the entire range between the first and last selected notes.

### Future

The master should eventually consume shared analysis functions from a common conceptual model:

```text
Mora / lyric analysis
        ↓
Phrase analysis
        ↓
Accent score
        ↓
Gesture score
        ↓
Vibrato score
        ↓
Era-specific renderer
```

---

## VOCALOID Accent Engine

**Purpose:** add accents without adding vibrato.

Current factors:

- duration
- melodic movement
- repeated pitch
- phrase beginning / ending
- particles
- weak morae
- long-note weighting

Supports:

- Rise-Fall
- Snap
- Overshoot
- Broken
- Fall-Then-Hit
- particle policy
- long-note policy
- deterministic seed
- replacement mode

### Future

The next major improvement should be **mora-level accent selection**, not more amplitude controls.

---

## VOCALOID Inter-Note Accent

**Purpose:** create expression **between** notes.

This is deliberately separate from the Accent Engine.

It can create:

- Scoop Into Next
- Dip Between
- Overshoot Next
- Double Accent
- Broken transition

It only acts on selected adjacent notes in the same NoteGroup.

This is useful when a phrase already has acceptable note interiors but lacks the characteristic exaggerated **transition gesture**.

---

# 4. VOCALOID Utilities

## Bake SynthV Pitch

Targeted specifically at Studio 1.x.

Workflow:

```text
Sing / Rap Auto pitch
        ↓
setPitchAutoMode(false)
        ↓
SynthV moves generated pitch into Pitch Deviation
        ↓
Manual frozen curve
```

This is the correct 1.x workflow and avoids Studio 2-only computed-pitch APIs.

---

## Pitch Reset Utility

Modes:

- Pitch Deviation only
- Pitch Deviation + Auto Mode
- Auto Mode only

The reset is note-range based so non-contiguous selections are safe.

---

## Japanese Mora Utility

Purpose:

- understand Japanese mora structure
- support old VOCALOID-style syllabic treatment
- split long notes according to mora units

The parser should understand:

```text
きゃ  きゅ  きょ
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

### Future

Expose a reusable conceptual analyzer for the VOCALOID Tuning Lab rather than maintaining particle/weak-mora lists independently in every script.

---

## Scale Pitch Deviation

Workflow utility.

Examples:

```text
50%   → tame an extreme result
100%  → unchanged
150%  → push an acceptable result
200%  → exaggerated
300%  → destructive laboratory mode
```

This is particularly useful because it lets the user explore intensity without regenerating a new random curve.

---

## Offset Pitch Deviation

Adds or subtracts a constant number of cents from selected Pitch Deviation.

Useful for:

- shifting an entire stylized phrase
- compensating for a voice change
- pushing a curve above/below center
- destructive robotic tuning experiments

---

# 5. Music Creation / workflow cleanup

## Note Duplicator

Now operates in the selected note's actual NoteGroup rather than assuming the current editor group.

### Future

- duplicate before / after
- stack / arpeggiate mode
- avoid-overlap mode
- copy selected pitch automation with the clone

## Randomize Note Lengths

Now respects the actual next note in each NoteGroup and avoids the old `max(unit/2)` overlap mistake.

### Future

- deterministic seed
- bias toward short / long
- preserve legato
- preserve phrase-final notes

## Randomize Pitch in Key

Current major-scale randomizer.

### Future

- minor modes
- Japanese pentatonic scales
- chromatic probability
- stay-near-original weighting
- deterministic seed

## Split Note into N Pieces

Now:

- uses the selected note's actual parent group
- preserves exact total duration
- clones the source note where available
- gives the final piece the remainder instead of losing rounded ticks

## Make Selected Notes Legato

Closes selected-note gaps without moving note onsets.

## Quantize Selected Note Lengths

Quantizes duration while protecting the next note onset.

---

# 6. Next utilities worth building

## High priority

### `VOCALOID Vibrato Gate`

Remove vibrato-like oscillation while leaving large accents and attacks alone.

### `VOCALOID Phrase Boundary Accent`

Accents only:

- first note
- last note
- long phrase-final note
- large interval entry

### `Japanese Mora Accent Map`

Show / classify:

```text
CONTENT
PARTICLE
WEAK
LONG VOWEL
NASAL
GEMINATE
```

and optionally use that classification to weight pitch gestures.

### `Pitch Deviation Copy / Paste`

A production utility for moving a successful curve from one phrase to another.

### `Pitch Deviation Normalize`

Normalize selected curves to a chosen peak range without changing their shape.

---

# 7. Quality rules for future scripts

Before adding a script, check:

1. Does it operate only on the intended selection?
2. Does it accidentally touch unselected notes?
3. Does it use the note's own NoteGroup for neighbors?
4. Does repeated execution produce destructive stacking unintentionally?
5. Should it have a `Replace` option?
6. If randomized, does it have a seed?
7. Does it work on Studio 1.11.0b1?
8. Does the visible menu category match the repository architecture?
9. Does the script have a useful name rather than an implementation name?
10. Is the destructive behavior obvious from the dialog?

---

# 8. Current development priority

```text
1. VOCALOID 2008 Extreme
2. Accent / Inter-Note Accent intelligence
3. Japanese Mora Analyzer
4. Vibrato Gate
5. Pitch Deviation Copy/Paste
6. Pitch Deviation Normalize
7. Pitch Baker event-preserving presets
8. More workflow utilities
9. Historical preset refinement
```

The guiding principle is:

> **Make the algorithm smarter about where to be unnatural, not smarter about how to hide the unnaturalness.**
