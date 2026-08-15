# VOCALOID Tuning Lab

A shared **behavioral tuning language** for deliberately artificial VOCALOID-style pitch inside Synthesizer V.

Target runtime:

```text
Synthesizer V Studio Pro 1.11.0b1
Synthesizer V Engine 2.8.1
```

## Architecture

```text
                    SELECTED NOTES
                         │
                         ▼
              Japanese Mora Rules
                         │
                         ▼
              Phrase / Note Analysis
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Accent         Vibrato       Transition
       Score           Score           Score
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                   Tuning Model
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Classic       V1 / V2       2008 Extreme
```

### Important: no analysis cache

The Lab intentionally does **not** use `getScriptData()` / `setScriptData()`.

Those calls are not available in the user's actual SynthV Studio 1.11 scripting environment, and a cache is unnecessary here.

Instead, each engine contains the same small analysis rules and calculates context directly from the current note and its real parent `NoteGroup`.

The result is a **shared conceptual layer**, not a runtime shared-state layer.

## Common analysis

Every engine should reason about:

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

The analysis considers notes outside the current selection when they are neighbors in the same `NoteGroup`.

### Mora classes

```text
content
contracted
particle
weak
special
unknown
```

This is a lightweight singing-oriented Japanese heuristic, not a full morphological parser.

## Scripts

### VOCALOID Mora Classifier

Diagnostic only. Shows the classification of selected lyrics.

It writes **nothing** to notes or automation.

### VOCALOID Phrase Analyzer

Diagnostic only. Shows the live phrase scores for selected notes.

It writes **nothing** to notes or automation.

### VOCALOID Tuning Lab

The main model selector:

- Classic
- V1
- V2
- 2008 Emotional
- 2008 Extreme

### VOCALOID Accent Engine

Creates isolated, context-sensitive pitch accents.

### VOCALOID Inter-Note Accent

Creates expressive events around transitions between neighboring notes.

### VOCALOID 2008 Extreme

The deliberately excessive laboratory preset:

- hard attacks
- exaggerated accents
- mathematical vibrato
- mechanical vibrato option
- repeated-note emphasis
- strong phrase endings

## Workflow

You do **not** need to run an analyzer first.

For flat notes:

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

For SynthV-generated pitch:

```text
Bake SynthV Pitch
        ↓
VOCALOID Tuning Lab
        ↓
Accent / Inter-Note Accent
        ↓
Decimation (optional)
```

The diagnostic analyzer/classifier are optional inspection tools.

## Compatibility

Do not introduce Studio 2.x-only APIs into this Lab.

The target is strictly:

**Synthesizer V Studio Pro 1.11.0b1 / Engine 2.8.1**

The Lab should stay within the Studio 1.x scripting primitives used by this repository.
