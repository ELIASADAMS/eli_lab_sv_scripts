# VOCALOID Tuning Lab — Architecture

This is the design document for the VOCALOID-style tuning system in `eli_lab_sv_scripts`.

**Runtime target:** Synthesizer V Studio Pro 1.11.0b1 / Synthesizer V Engine 2.8.1.

## The important architectural change

The Lab is no longer treated as a set of unrelated pitch generators.

It is now a pipeline:

```text
                    NOTE SELECTION
                         │
                         ▼
               ┌───────────────────┐
               │ MORA CLASSIFIER   │
               └─────────┬─────────┘
                         │
                         ▼
               ┌───────────────────┐
               │ PHRASE ANALYZER   │
               └─────────┬─────────┘
                         │
                         ▼
              NOTE SCRIPT-DATA CACHE
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
    ACCENT            VIBRATO          TRANSITION
    ENGINE             ENGINE             ENGINE
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                 VOCALOID MODEL
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       CLASSIC        V1 / V2       2008 EXTREME
                         │
                         ▼
                   PITCH DELTA
```

## Why note scriptData?

Synthesizer V Studio 1.x scripts are isolated JavaScript programs. A normal imported JavaScript core module is therefore not a dependable architecture for this target.

Studio exposes scriptData on notes/groups, and that data is JSON-serializable. The Lab uses that capability as a small project-local protocol.

### Keys

```text
eli_lab.vocaloid.mora.v1
eli_lab.vocaloid.analysis.v1
```

The data travels with the project and can be consumed by another Lab script later in the workflow.

## Mora layer

`VOCALOID Mora Classifier` classifies selected lyrics into:

```text
content
contracted
particle
weak
special
unknown
```

The classifier deliberately stays conservative. It is not trying to perform full Japanese morphological analysis; it provides exactly the information needed for expressive pitch decisions.

## Phrase layer

`VOCALOID Phrase Analyzer` looks beyond the current selection and uses the selected note's actual parent `NoteGroup`.

For every selected note it calculates:

```text
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

This solves an important problem in the previous architecture: a selected note should know about its musical neighbors even when those neighbors were not selected.

## Consumer behavior

The master `VOCALOID Tuning Lab`, `VOCALOID Accent Engine`, `VOCALOID Inter-Note Accent` and `VOCALOID 2008 Extreme` now consume cached analysis when it exists.

They also contain fallback analysis, so the workflow does not break if the user runs an engine directly without running the analyzer first.

## Model philosophy

The model is not a claim to reproduce proprietary historical VOCALOID algorithms.

It is a behavioral tuning language inspired by the characteristics we are targeting:

- hard pitch attacks
- conspicuous overshoots
- phrase-final falls
- sparse mathematical vibrato
- repeated-note instability
- accent asymmetry
- selective exaggeration
- suppression of grammatical particles

The **2008 Extreme** model is intentionally allowed to be ridiculous. Its purpose is to determine *where* an artificial performance should become conspicuous.

## Visible menu organization

```text
eli_lab - VOCALOID Tuning Lab
│
├── VOCALOID Mora Classifier
├── VOCALOID Phrase Analyzer
├── VOCALOID Analysis Cache Reset
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

The visible category is the important part for SynthV; physical source directories are implementation organization.

## Recommended workflow

### From flat notes

```text
Pitch Reset Utility
        ↓
Mora Classifier
        ↓
Phrase Analyzer
        ↓
VOCALOID 2008 Extreme
        ↓
Accent Engine / Inter-Note Accent
        ↓
Decimation if necessary
```

### From SynthV AI pitch

```text
Bake SynthV Pitch
        ↓
Mora Classifier
        ↓
Phrase Analyzer
        ↓
VOCALOID model
```

## Future shared-layer additions

The next engines should consume the same analysis contract rather than creating their own independent scoring systems.

### Vibrato Gate

Use `vibrato` and `accent` scores to remove oscillation while protecting important attacks.

### Phrase Boundary Accent

Use `phraseStart`, `phraseEnd`, `importance` and `transitionIn` to create explicit phrase-level events.

### Pitch Deviation Copy / Paste

A workflow utility, independent of the analysis layer, for reusing successful curves.

### Pitch Deviation Normalize

Normalize the shape of a selected curve while retaining its geometry.

### Model profiles

Eventually the historical models should differ primarily through model profiles and gesture rules, not duplicated scoring code.

## Compatibility rule

Do not introduce Studio 2-only APIs into this system. In particular, the shared Lab must remain independent of newer Pitch Control, Retake, computed-pitch and side-panel APIs.
