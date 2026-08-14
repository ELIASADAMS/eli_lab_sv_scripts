var SCRIPT_TITLE = "VOCALOID Classic Tuning Emulator";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - Pitch Baker",
        author: "eli_lab",
        versionNumber: 2,
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

function isParticle(lyric) {
    // Common Japanese particles / grammatical morae. These should usually
    // receive less pitch decoration than lexical/content syllables.
    return ["は", "が", "を", "に", "へ", "と", "で", "も", "の", "ね", "よ", "さ", "ぞ", "な", "や"].indexOf(lyric) >= 0;
}

function isWeakMora(lyric) {
    return ["っ", "ー", "ん", "る", "れ", "ろ", "す", "つ", "く", "き"].indexOf(lyric) >= 0;
}

function noteInfo(notes, i) {
    var note = notes[i];
    var prev = i > 0 ? notes[i - 1] : undefined;
    var next = i + 1 < notes.length ? notes[i + 1] : undefined;
    var lyric = note.getLyrics ? note.getLyrics() : "";
    var phonemes = note.getPhonemes ? note.getPhonemes() : "";

    return {
        note: note,
        duration: note.getDuration(),
        prevInterval: prev ? note.getPitch() - prev.getPitch() : 0,
        nextInterval: next ? next.getPitch() - note.getPitch() : 0,
        samePrev: !!prev && prev.getPitch() === note.getPitch(),
        sameNext: !!next && next.getPitch() === note.getPitch(),
        first: i === 0,
        last: i === notes.length - 1,
        lyric: lyric,
        phonemes: phonemes,
        particle: isParticle(lyric),
        weakMora: isWeakMora(lyric)
    };
}

// Estimate how important a note is in the phrase. This is intentionally a
// heuristic rather than linguistic analysis: old VOCALOID tuning often feels
// "smart" because strong notes get obvious gestures while connective syllables
// stay comparatively flat.
function expressionWeight(info) {
    var q = SV.QUARTER;
    var durationScore = clamp(info.duration / (q * 2.0), 0, 1);
    var intervalScore = clamp(Math.max(Math.abs(info.prevInterval), Math.abs(info.nextInterval)) / 7, 0, 1);
    var weight = 0.38 + durationScore * 0.28 + intervalScore * 0.24;

    if (info.first || info.last) weight += 0.08;
    if (info.samePrev) weight -= 0.08;
    if (info.particle) weight -= 0.22;
    if (info.weakMora) weight -= 0.10;

    // A note with a vowel-heavy custom phoneme string is a better candidate
    // for sustained expression than a consonant-heavy syllable.
    if (info.phonemes) {
        var vowelCount = (info.phonemes.match(/(?:a|i|u|e|o)/gi) || []).length;
        if (vowelCount > 0) weight += 0.05;
    }

    return clamp(weight, 0.08, 1.25);
}

// Decide whether this note deserves a conspicuous vibrato. The old version
// used only a duration threshold, which made almost every medium-length note
// vibrate. Now vibrato is a phrase-level event with a strong duration bias.
function shouldVibrate(info, style) {
    var q = SV.QUARTER;
    var d = info.duration;
    var weight = expressionWeight(info);

    if (info.particle || info.weakMora) return false;
    if (d < q * 1.15) return false;

    var probability;
    if (d >= q * 3.0) probability = 0.92;
    else if (d >= q * 2.0) probability = 0.72;
    else if (d >= q * 1.5) probability = 0.42;
    else probability = 0.16;

    probability *= (0.55 + weight * 0.55);
    if (Math.abs(info.nextInterval) >= 5) probability *= 0.78;
    if (info.sameNext) probability *= 1.12;

    // Keep the behavior deterministic enough to feel intentional while still
    // preventing every eligible note from becoming identical.
    return Math.random() < clamp(probability, 0, 0.96);
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
    var jump = Math.min(1, Math.abs(interval) / 7);
    var importance = expressionWeight(info);
    var amount = attackAmount * (0.42 + jump * 0.62) * phraseFactor;
    amount *= (0.65 + importance * 0.5);

    if (info.samePrev) amount *= 0.62;
    if (info.particle) amount *= 0.55;

    var pre = amount * direction * rand(0.55, 1.0);
    var overshoot = amount * direction * rand(0.25, 0.75);
    var t1 = d * rand(0.025, 0.075) * sharpness;
    var t2 = d * rand(0.09, 0.18) * sharpness;
    var t3 = d * rand(0.18, 0.28);

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

    var importance = expressionWeight(info);
    var shortness = clamp(1 - d / (SV.QUARTER * 2), 0, 1);
    var amount = accentAmount * (0.28 + shortness * 0.48 + importance * 0.55) * phraseFactor;

    // Grammatical particles are deliberately de-emphasized. Content-like
    // syllables, long vowels, large melodic turns and phrase edges win.
    if (info.particle) amount *= 0.22;
    if (info.weakMora) amount *= 0.45;
    if (info.first || info.last) amount *= 1.12;
    if (Math.abs(info.nextInterval) >= 5) amount *= 1.12;

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

    var q = SV.QUARTER;
    if (d < q * 1.15) return;

    var vibStart = start + d * onsetRatio;
    var vibDuration = end - vibStart;
    if (vibDuration <= 0) return;

    // Longer notes get more cycles; short sustained notes may receive only one
    // unmistakable old-school wobble.
    var cycles = Math.max(1, Math.round((d / q) * rate));
    cycles = Math.min(cycles, 7);
    var points = cycles * 2 + 1;
    var phaseSign = choose([-1, 1]);
    var phaseSkew = rand(-0.35, 0.35);
    var weight = expressionWeight(info);

    // Don't let a medium note suddenly become a huge vibrato event.
    depth *= (0.62 + weight * 0.38);

    for (var i = 0; i <= points; i++) {
        var x = i / points;
        var t = vibStart + vibDuration * x;
        var sign = (i % 2 === 0 ? -1 : 1) * phaseSign;
        var wobble = depth * sign;

        wobble *= rand(1 - irregularity, 1 + irregularity);
        wobble += Math.sin((x + phaseSkew) * Math.PI * 2) * depth * irregularity * 0.18;

        var attackEnv = clamp((x + 0.12) / 0.25, 0, 1);
        var endEnv = tailFall ? (1 - Math.max(0, x - 0.72) * 0.8) : 1;
        wobble *= attackEnv * endEnv;

        addPoint(auto, t, wobble);
    }

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
            { "name": "style", "type": "ComboBox", "label": "Style", "choices": ["Classic V1", "Classic V2", "2008 Emotional", "Hard Robotic"], "default": 1 },
            { "name": "intensity", "type": "ComboBox", "label": "Intensity", "choices": ["Light", "Medium", "Strong", "Extreme"], "default": 1 },
            { "name": "vibrato", "type": "ComboBox", "label": "Long-note vibrato", "choices": ["Off", "Light", "Classic", "Heavy"], "default": 2 },
            { "name": "accent", "type": "ComboBox", "label": "Syllable accents", "choices": ["Low", "Medium", "High", "Very High"], "default": 2 },
            { "name": "randomness", "type": "ComboBox", "label": "Humanization / instability", "choices": ["Low", "Medium", "High"], "default": 1 },
            { "name": "clear", "type": "ComboBox", "label": "Clear existing pitchDelta", "choices": ["Yes", "No"], "default": 0 }
        ]
    };

    var results = SV.showCustomDialog(form);
    if (!results.status) return;

    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (notes.length === 0) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var styles = [
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

    var groups = [];
    for (var g = 0; g < notes.length; g++) {
        var parent = notes[g].getParent();
        var exists = false;
        for (var q = 0; q < groups.length; q++) if (groups[q] === parent) exists = true;
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

        addAttack(auto, info, style.attack * intensity, 0.85 + intensity * 0.12, phraseFactor);
        addAccent(auto, info, accent * intensity, phraseFactor);

        if (vibSetting > 0 && shouldVibrate(info, style)) {
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

        addFinalFall(auto, info, style.fall * intensity);
    }

    SV.finish();
}
