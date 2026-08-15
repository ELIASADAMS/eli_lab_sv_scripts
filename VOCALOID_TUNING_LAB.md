# VOCALOID Tuning Lab — Architecture

This is the design document for the VOCALOID-style tuning system in `eli_lab_sv_scripts`.

**Runtime target:** Synthesizer V Studio Pro 1.11.0b1 / Synthesizer V Engine 2.8.1.

## Current architecture

The Lab is a **shared conceptual system**, but deliberately has **no runtime analysis cache**.

Synthesizer V Studio 1.11 scripts are isolated JavaScript programs. The Lab therefore does not depend on `getScriptData()` / `setScriptData()` or on Studio 2.x APIs.

Instead, every expressive engine uses the same analysis rules directly on the current `NoteGroup`:

```text
                    SELECTED NOTES
                         │
                         ▼
               ┌───────────────────┐
               │ JAPANESE MORA     │
               │ CLASSIFICATION    │
               └─────────┬─────────┘
                         │
                         ▼
               ┌───────────────────┐
               │ PHRASE / NOTE     │
               │ ANALYSIS RULES    │
               └─────────┬─────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       ACCENT         VIBRATO       TRANSITION
       SCORE           SCORE           SCORE
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  MODEL / GESTURE
                         │
                         ▼
                  PITCH DEVIATION
```

The **Phrase Analyzer** and **Mora Classifier** are diagnostic tools. They display the same analysis but do not write anything into the project.

## Shared analysis contract

Every Lab engine should reason about the same concepts:

```text
moraClass
 durationQ
prevInterval
nextInterval
sameAsPrev
sameAsNext
phraseStart
phraseEnd
importance
accent
vibrato
transitionIn
transitionOut
```

The values are calculated from the note and its actual parent `NoteGroup`, so a selected note can see its real musical neighbors even when those neighbors are not selected.

### Mora classes

```text
content
contracted
particle
weak
special
unknown
```

This is intentionally a lightweight Japanese singing heuristic, not a full morphological parser.

## Why there is no cache

Earlier versions attempted to use note script-data as a communication layer. That is not compatible with the user's actual Studio 1.11 scripting environment: `getScriptData()` is not callable there.

The cache also isn't necessary for this project.

The correct approach is:

```text
one shared DESIGN
        ↓
small pure analysis functions
        ↓
each engine calculates what it needs
```

This keeps the scripts independent, portable and compatible with the target application.

## Expression philosophy

The Lab is not trying to make SynthV more natural.

It deliberately creates controlled artificiality:

- hard pitch attacks
- angular scoops
- conspicuous overshoots
- asymmetric falls
- phrase-final drops
- sparse mathematical vibrato
- repeated-note instability
- selective exaggeration
- grammatical-particle suppression
- strong contrast between ordinary and important notes

**2008 Extreme** is intentionally allowed to look excessive. The important intelligence is deciding *where* the excess happens.

## Engines

### VOCALOID Tuning Lab

The master model selector. It combines the common analysis rules with historical-style behavioral profiles:

- Classic
- V1
- V2
- 2008 Emotional
- 2008 Extreme

The models differ in attack strength, vibrato behavior, ending behavior and instability rather than using unrelated scoring systems.

### VOCALOID Accent Engine

Creates isolated pitch accents on individual notes.

It uses duration, melodic movement, phrase boundaries, repeated pitches and Japanese mora class to decide how strongly a note should be decorated.

### VOCALOID Inter-Note Accent

Creates deliberate events around the boundary between neighboring notes:

- Scoop Into Next
- Dip Between
- Overshoot Next
- Double Accent
- Broken

It calculates the transition context directly from the neighboring notes.

### VOCALOID 2008 Extreme

The intentionally exaggerated laboratory preset:

- very strong attacks
- strong note-to-note accents
- high vibrato density on suitable long notes
- mechanical vibrato option
- repeated-note emphasis
- large phrase-final falls
- deterministic seed

## Menu organization

```text
eli_lab - VOCALOID Tuning Lab
│
├── VOCALOID Mora Classifier
├── VOCALOID Phrase Analyzer
│
├── VOCALOID Tuning Lab
├── VOCALOID Accent Engine
├── VOCALOID Inter-Note Accent
│
├── VOCALOID Classic Tuning Emulator
├── VOCALOID V1 Tuning
├── VOCALOID V2 Tuning
├── VOCALOID 2008 Emotional Tuning
└── VOCALOID 2008 Extreme
```

The obsolete **VOCALOID Analysis Cache Reset** utility has been removed.

## Recommended workflow

### Flat notes

```text
Pitch Reset Utility
        ↓
VOCALOID Tuning Lab / 2008 Extreme
        ↓
VOCALOID Accent Engine
        ↓
VOCALOID Inter-Note Accent
        ↓
Pitch Baker Decimation (optional)
```

There is **no required analyzer step**.

Use the diagnostic tools only when you want to inspect why the Lab considers a note important.

### SynthV-generated pitch

```text
Bake SynthV Pitch
        ↓
VOCALOID Tuning Lab
        ↓
Accent / Inter-Note Accent
        ↓
Decimation (optional)
```

## Compatibility rule

The Lab targets **Synthesizer V Studio Pro 1.11.0b1**.

Do not introduce Studio 2.x-only APIs such as newer Pitch Control objects, computed-pitch helpers or Retake APIs.

The Lab should operate using the stable 1.x scripting primitives: `Note`, `NoteGroup`, `Automation`, `pitchDelta`, selection APIs and standard dialogs.

## Future work

The next useful shared concepts are not another cache layer. They are reusable **rules** that can be replicated consistently across engines:

1. stronger Japanese mora/phoneme classification
2. phrase-boundary weighting
3. transition gesture vocabulary
4. vibrato eligibility / gate rules
5. deterministic model profiles
6. Pitch Deviation copy / paste / normalize workflow tools

The goal is a coherent **tuning language**, not a collection of unrelated randomizers.
