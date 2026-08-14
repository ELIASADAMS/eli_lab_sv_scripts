var SCRIPT_TITLE = "VOCALOID Classic Tuning Emulator";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - Pitch Baker",
        author: "eli_lab",
        versionNumber: 1,
        minEditorVersion: 65537
    }
}

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function rand(lo, hi) {
    return lo + Math.random() * (hi - lo);
}

function choose(a) {
    return a[Math.floor(Math.random() * a.length)];
}

function addPoint(auto, time, value) {
    auto.add(Math.round(time), clamp(value, -1200, 1200));
}

function noteInfo(notes, i) {
    var note = notes[i];
    var prev = i > 0 ? notes[i - 1] : undefined;
    var next = i + 1 < notes.length ? notes[i + 1] : undefined;

    return {
        note: note,
        duration: note.getDuration(),
        prevInterval: prev ? note.getPitch() - prev.getPitch() : 0,
        nextInterval: next ? next.getPitch() - note.getPitch() : 0,
        samePrev: !!prev && prev.getPitch() === note.getPitch(),
        sameNext: !!next && next.getPitch() === note.getPitch(),
        first: i === 0,
        last: i === notes.length - 1
    };
}

// Classic VOCALOID-style pitch attack:
// arrive slightly below/above the target, hit the center, then settle.
function addAttack(auto, info, attackAmount, sharpness, phraseFactor) {
    var note = info.note;
    var start = note.getOnset();
    var d = info.duration;
    if (d <= 0) return;

    var interval = info.prevInterval;
    var direction = interval > 0 ? 1 : interval < 0 ? -1 : choose([-1, 1]);

    // Large melodic jumps get a stronger approach; repeated notes get a smaller wobble.
    var jump = Math.min(1, Math.abs(interval) / 7);
    var amount = attackAmount * (0.55 + jump * 0.75) * phraseFactor;
    if (info.samePrev) amount *= 0.65;

    var pre = amount * direction * rand(0.55, 1.0);
    var overshoot = amount * direction * rand(0.25, 0.75);
    var t1 = d * rand(0.025, 0.075) * sharpness;
    var t2 = d * rand(0.09, 0.18) * sharpness;
    var t3 = d * rand(0.18, 0.28);

    // Invert the first excursion sometimes: this is one of the deliberately
    // synthetic gestures that gives the old tuning a less natural character.
    if (Math.random() < 0.28) pre *= -1;

    addPoint(auto, start, 0);
    addPoint(auto, start + t1, pre);
    addPoint(auto, start + t2, overshoot);
    addPoint(auto, start + t3, rand(-2, 2));
}

function addAccent(auto, info, accentAmount, phraseFactor) {
    var note = info.note;
    var start = note.getOnset();
    var d = info.duration;
    if (d <= 0) return;

    // Short syllables receive sharper pitch emphasis; long notes receive a softer accent.
    var shortness = clamp(1 - d / (SV.QUARTER * 2), 0, 1);
    var amount = accentAmount * (0.45 + shortness * 0.65) * phraseFactor;
    var direction = info.nextInterval > 0 ? 1 : info.nextInterval < 0 ? -1 : choose([-1, 1]);

    var t1 = d * rand(0.20, 0.38);
    var t2 = d * rand(0.42, 0.62);
    var value = direction * amount * rand(0.45, 1.0);

    addPoint(auto, start + t1, value);
    addPoint(auto, start + t2, value * rand(-0.25, 0.25));
}

function addVibrato(auto, info, depth, rate, irregularity, onsetRatio, tailFall) {
    var note = info.note;
    var start = note.getOnset();
    var end = note.getEnd();
    var d = end - start;

    // Only long notes get the characteristic old-school visible vibrato.
    var minimum = SV.QUARTER * 0.85;
    if (d < minimum) return;

    var vibStart = start + d * onsetRatio;
    var vibDuration = end - vibStart;
    if (vibDuration <= 0) return;

    // Fewer points than a modern dense LFO. This is intentionally geometric.
    var cycles = Math.max(1, Math.round((d / SV.QUARTER) * rate));
    cycles = Math.min(cycles, 7);
    var points = cycles * 2 + 1;
    var phaseSign = choose([-1, 1]);
    var phaseSkew = rand(-0.35, 0.35);

    for (var i = 0; i <= points; i++) {
        var x = i / points;
        var t = vibStart + vibDuration * x;
        var sign = (i % 2 === 0 ? -1 : 1) * phaseSign;
        var wobble = depth * sign;

        // Slightly uneven peaks create the hand-drawn mathematical look.
        wobble *= rand(1 - irregularity, 1 + irregularity);
        wobble += Math.sin((x + phaseSkew) * Math.PI * 2) * depth * irregularity * 0.18;

        // Grow in, then optionally droop at the end of a sustained vowel.
        var attackEnv = clamp((x + 0.12) / 0.25, 0, 1);
        var endEnv = tailFall ? (1 - Math.max(0, x - 0.72) * 0.8) : 1;
        wobble *= attackEnv * endEnv;

        addPoint(auto, t, wobble);
    }

    // Classic long-note ending: a small downward relaxation rather than a clean cutoff.
    if (tailFall) {
        addPoint(auto, end - d * 0.06, -depth * rand(0.25, 0.55));
        addPoint(auto, end, 0);
    }
}

function addFinalFall(auto, info, amount) {
    if (!info.last || info.duration < SV.QUARTER * 0.75) return;

    var end = info.note.getEnd();
    var d = info.duration;
    addPoint(auto, end - d * 0.16, -amount * rand(0.45, 0.8));
    addPoint(auto, end - d * 0.05, -amount);
    addPoint(auto, end, 0);
}

function main() {
    var form = {
        "title": SV.T(SCRIPT_TITLE),
        "message": "Generate sparse, exaggerated classic VOCALOID-style pitch from flat notes",
        "buttons": "OkCancel",
        "widgets": [
            {
                "name": "style",
                "type": "ComboBox",
                "label": "Style",
                "choices": ["Classic V1", "Classic V2", "2008 Emotional", "Hard Robotic"],
                "default": 1
            },
            {
                "name": "intensity",
                "type": "ComboBox",
                "label": "Intensity",
                "choices": ["Light", "Medium", "Strong", "Extreme"],
                "default": 1
            },
            {
                "name": "vibrato",
                "type": "ComboBox",
                "label": "Long-note vibrato",
                "choices": ["Off", "Light", "Classic", "Heavy"],
                "default": 2
            },
            {
                "name": "accent",
                "type": "ComboBox",
                "label": "Syllable accents",
                "choices": ["Low", "Medium", "High", "Very High"],
                "default": 2
            },
            {
                "name": "randomness",
                "type": "ComboBox",
                "label": "Humanization / instability",
                "choices": ["Low", "Medium", "High"],
                "default": 1
            },
            {
                "name": "clear",
                "type": "ComboBox",
                "label": "Clear existing pitchDelta",
                "choices": ["Yes", "No"],
                "default": 0
            }
        ]
    };

    var results = SV.showCustomDialog(form);
    if (!results.status) return;

    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (notes.length === 0) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    notes.sort(function(a, b) {
        return a.getOnset() - b.getOnset();
    });

    var styles = [
        // attack, vibrato rate, vibrato depth multiplier, onset, irregularity, phrase factor, final fall
        { attack: 14, rate: 2.0, vib: 1.0, onset: 0.48, irr: 0.10, phrase: 0.85, fall: 10 },
        { attack: 20, rate: 2.4, vib: 1.15, onset: 0.38, irr: 0.16, phrase: 1.00, fall: 13 },
        { attack: 27, rate: 2.8, vib: 1.35, onset: 0.30, irr: 0.22, phrase: 1.15, fall: 17 },
        { attack: 35, rate: 3.1, vib: 1.55, onset: 0.24, irr: 0.32, phrase: 1.30, fall: 23 }
    ];

    var style = styles[parseInt(results.answers.style)];
    var intensity = [0.65, 1.0, 1.45, 2.0][parseInt(results.answers.intensity)];
    var vibSetting = [0, 0.55, 1.0, 1.45][parseInt(results.answers.vibrato)];
    var accent = [5, 10, 17, 25][parseInt(results.answers.accent)];
    var random = [0.08, 0.18, 0.32][parseInt(results.answers.randomness)];
    var clear = parseInt(results.answers.clear) === 0;

    // Work group-by-group because pitchDelta belongs to the NoteGroup parameter set.
    var groups = [];
    for (var g = 0; g < notes.length; g++) {
        var parent = notes[g].getParent();
        var exists = false;
        for (var q = 0; q < groups.length; q++) {
            if (groups[q] === parent) exists = true;
        }
        if (!exists) groups.push(parent);
    }

    if (clear) {
        for (var c = 0; c < groups.length; c++) {
            var clearAuto = groups[c].getParameter("pitchDelta");
            for (var cn = 0; cn < notes.length; cn++) {
                if (notes[cn].getParent() === groups[c]) {
                    clearAuto.remove(notes[cn].getOnset(), notes[cn].getEnd());
                }
            }
        }
    }

    for (var i = 0; i < notes.length; i++) {
        var info = noteInfo(notes, i);
        var auto = info.note.getParent().getParameter("pitchDelta");

        var phraseFactor = style.phrase;
        if (info.first || info.last) phraseFactor *= 1.08;
        if (info.samePrev || info.sameNext) phraseFactor *= 0.9;

        // Layer 1: attack/arrival gesture.
        addAttack(auto, info, style.attack * intensity, 0.85 + intensity * 0.12, phraseFactor);

        // Layer 2: mid-note accent. This is what makes individual syllables feel "tuned".
        addAccent(auto, info, accent * intensity, phraseFactor);

        // Layer 3: sparse geometric vibrato on sustained notes.
        if (vibSetting > 0) {
            addVibrato(
                auto,
                info,
                7.0 * style.vib * vibSetting * intensity,
                style.rate,
                style.irr + random * 0.45,
                style.onset,
                true
            );
        }

        // Layer 4: phrase-ending fall.
        addFinalFall(auto, info, style.fall * intensity);
    }

    SV.finish();
}
