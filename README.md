# eli_lab SynthV Custom Scripts

Experimental and practical scripts for **Synthesizer V Studio Pro 1.11.x**.

The collection is intentionally split into workflow utilities, Pitch Baker tools and a dedicated **VOCALOID Tuning Lab**. The goal is not maximum naturalness: many tools are designed to create sparse, mechanical, exaggerated or deliberately artificial vocal curves.

## Target environment

Primary development target:

```text
Synthesizer V Studio Pro 1.11.0b1
Synthesizer V Engine 2.8.1
```

The scripts use the Studio 1.x scripting model available to this environment. The VOCALOID workflow relies on `pitchDelta`, `getPitchAutoMode()` / `setPitchAutoMode()` and note `scriptData` rather than Studio 2-only pitch-control APIs.

## Menu structure

### `eli_lab - Basic`

Small editing operations that should be safe to use repeatedly.

- **Split Note into N Pieces**
- **Replace + with - in Lyrics**

### `eli_lab - Music Creation`

Note generation and workflow helpers.

- **Note Duplicator**
- **Randomize Note Lengths**
- **Randomize Pitch in Key**
- **Make Selected Notes Legato**
- **Quantize Selected Note Lengths**

### `eli_lab - Pitch Baker`

Destructive pitch-processing laboratory.

- **Contour Engine**
- **Decimation Engine**
- **Gesture Engine**
- **Vibrato Engine**

### `eli_lab - VOCALOID Tuning Lab`

A shared behavioral laboratory for deliberately artificial old-school VOCALOID-style tuning.

#### Shared analysis layer

- **VOCALOID Mora Classifier** — caches Japanese lyric/mora classification on notes.
- **VOCALOID Phrase Analyzer** — computes phrase-aware importance, accent, vibrato and transition scores.
- **VOCALOID Analysis Cache Reset** — removes only the Lab's own analysis metadata.

Because SynthV Studio 1.x scripts are isolated JavaScript programs, the shared layer uses **note scriptData as a project-local protocol**. Engines can consume the same analysis without depending on Studio 2.x modules or APIs.

#### Tuning engines

- **VOCALOID Tuning Lab** — master multi-era engine.
- **VOCALOID Accent Engine** — contextual accents without vibrato.
- **VOCALOID Inter-Note Accent** — expression placed between adjacent notes.
- **VOCALOID Classic Tuning Emulator**
- **VOCALOID V1 Tuning**
- **VOCALOID V2 Tuning**
- **VOCALOID 2008 Emotional Tuning**
- **VOCALOID 2008 Extreme** — reference extreme laboratory preset.

The reference workflow is now:

```text
Pitch Reset / Bake SynthV Pitch
          ↓
Japanese Mora Classifier
          ↓
VOCALOID Phrase Analyzer
          ↓
Accent / Transition / Vibrato decisions
          ↓
VOCALOID Tuning Model
          ↓
Pitch Deviation
```

### `eli_lab - VOCALOID Utilities`

Preparation and adjustment tools for the tuning lab.

- **Bake SynthV Pitch**
- **Pitch Reset Utility**
- **Japanese Mora Utility**
- **Scale Pitch Deviation**
- **Offset Pitch Deviation**

## Recommended VOCALOID workflow

1. Reset Pitch Deviation if starting from flat notes, or use **Bake SynthV Pitch** if SynthV's generated pitch is the starting material.
2. Run **VOCALOID Mora Classifier** for Japanese material when lyric classification has changed.
3. Run **VOCALOID Phrase Analyzer** over the phrase.
4. Run **VOCALOID Tuning Lab** or **VOCALOID 2008 Extreme**.
5. Use **VOCALOID Accent Engine** for an additional expressive layer.
6. Use **VOCALOID Inter-Note Accent** when the character belongs at note boundaries.
7. Use Pitch Baker → Decimation when the resulting curve is too dense.
8. Use Scale/Offset Pitch Deviation for controlled post-processing.

### Why Extreme is useful

The desired aesthetic is **controlled artificiality**:

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

The algorithm should become smarter about **where** to be extreme, not about hiding the artificiality.

## Design principles

1. Selected means selected.
2. NoteGroup-local neighbors are preferred over selection-local neighbors.
3. Randomized tools should expose deterministic seeds.
4. Pitch processing should preserve musical boundaries.
5. Scripts must remain compatible with Studio 1.11.0b1.
6. The VOCALOID Lab shares decisions through note scriptData rather than unsupported module imports.
7. Extreme is a feature.

## Documentation

See **[SCRIPT_CATALOG.md](SCRIPT_CATALOG.md)** for the complete inventory and **[eli_lab_sv_scripts/vocaloid_tuning_lab/README.md](eli_lab_sv_scripts/vocaloid_tuning_lab/README.md)** for the VOCALOID Lab architecture.

## Installation

Synthesizer V scans its scripts folder at startup and provides **Scripts → Rescan**. Keep the repository's directory structure when copying the scripts.

## License

MIT License. Free to use, modify and share. Credit appreciated for forks and ports.
