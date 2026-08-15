# VOCALOID Tuning Lab

The VOCALOID Tuning Lab is a **shared behavioral system**, not just a collection of historical presets.

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
              ┌─────────────────────┐
              │ Japanese Mora       │
              │ Classifier          │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Phrase Analyzer      │
              │                      │
              │ duration             │
              │ melodic intervals    │
              │ repeated pitch       │
              │ phrase boundaries    │
              │ mora class           │
              │ accent score         │
              │ vibrato score        │
              │ transition scores    │
              └──────────┬──────────┘
                         │
                  note scriptData
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Accent      Vibrato     Transition
          Engine      Engine       Engine
             │           │           │
             └───────────┼───────────┘
                         ▼
                Tuning Model
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Classic       V1 / V2       2008 Extreme
```

SynthV Studio 1.x scripts are isolated JavaScript programs; they do not provide a normal shared-module/import system. The Lab therefore uses **note scriptData as its shared state**. The analyzer scripts write JSON-serializable metadata onto notes, and pitch engines read it when available, falling back to their local analysis when it is absent. This keeps the system compatible with Studio 1.11 while allowing separate scripts to share decisions through the project itself.

## Shared metadata

Keys:

```text
eli_lab.vocaloid.mora.v1
eli_lab.vocaloid.analysis.v1
```

The phrase record contains:

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

## Workflow

### 1. Prepare

Use **VOCALOID Mora Classifier** when Japanese lyric classification needs to be refreshed.

### 2. Analyze

Run **VOCALOID Phrase Analyzer** once over the phrase. It analyzes each selected note using its actual parent `NoteGroup`, including neighbors outside the current selection.

### 3. Generate

Use one of:

- VOCALOID Tuning Lab
- VOCALOID Accent Engine
- VOCALOID Inter-Note Accent
- VOCALOID 2008 Extreme

The master engine, Accent Engine and 2008 Extreme consume cached analysis when it matches the current lyric.

### 4. Reset

**VOCALOID Analysis Cache Reset** removes only the Lab's own metadata keys. It does not touch pitch data or other scripts' data.

## Design philosophy

The Lab does not try to make VOCALOID-like tuning random everywhere. It tries to make the **right notes unnaturally expressive**.

The strongest signals are:

- phrase boundaries
- large melodic jumps
- long sustained notes
- repeated notes
- lexical/content morae
- transitions between notes

The strongest suppressors are:

- grammatical particles
- weak/special morae
- short notes
- large transitions where vibrato would fight the gesture

## Important limitation

The shared layer is a **project-data protocol**, not a JavaScript module. This is intentional: SynthV 1.x scripts run in isolation, so a conventional imported core library would not be portable to the target host.
