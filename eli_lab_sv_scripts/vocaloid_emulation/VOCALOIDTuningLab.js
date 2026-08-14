var SCRIPT_TITLE = "VOCALOID Tuning Lab";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Tuning Lab",
        author: "eli_lab",
        versionNumber: 2,
        minEditorVersion: 67840
    };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

var RNG = Math.random;
function seedRandom(seed) {
    var state = (parseInt(seed, 10) || 1) >>> 0;
    if (state === 0) state = 1;
    RNG = function() {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
    };
}
function rand(lo, hi) { return lo + RNG() * (hi - lo); }
function pick(a) { return a[Math.floor(RNG() * a.length)]; }

function isParticle(s) {
    return ["は", "が", "を", "に", "へ", "と", "で", "も", "の", "ね", "よ", "さ", "ぞ", "な", "や"].indexOf(s) >= 0;
}
function isWeakMora(s) {
    return ["っ", "ッ", "ー", "ん", "ン", "る", "れ", "ろ", "す", "つ", "く", "き"].indexOf(s) >= 0;
}
function moraClass(s) {
    if (!s) return "unknown";
    if (isParticle(s)) return "particle";
    if (isWeakMora(s)) return "weak";
    return "content";
}

function importance(note, prev, next, i, count) {
    var q = SV.QUARTER;
    var d = note.getDuration();
    var prevLeap = prev ? Math.abs(note.getPitch() - prev.getPitch()) : 0;
    var nextLeap = next ? Math.abs(next.getPitch() - note.getPitch()) : 0;
    var score = 0.24 + clamp(d / (q * 2.0), 0, 1) * 0.30;
    score += clamp(Math.max(prevLeap, nextLeap) / 7, 0, 1) * 0.30;
    if (i === 0) score += 0.08;
    if (i === count - 1) score += 0.12;
    if (prev && prev.getPitch() === note.getPitch()) score -= 0.08;
    if (next && next.getPitch() === note.getPitch()) score += 0.06;
    if (moraClass(note.getLyrics()) === "particle") score -= 0.26;
    if (moraClass(note.getLyrics()) === "weak") score -= 0.10;
    return clamp(score, 0.04, 1.35);
}

function accentScore(note, prev, next, i, count) {
    var q = SV.QUARTER;
    var d = note.getDuration();
    var s = importance(note, prev, next, i, count);
    if (d < q * 0.70) s += 0.12;
    if (prev && Math.abs(note.getPitch() - prev.getPitch()) >= 5) s += 0.16;
    if (next && Math.abs(next.getPitch() - note.getPitch()) >= 5) s += 0.20;
    if (i === count - 1) s += 0.14;
    if (moraClass(note.getLyrics()) === "particle") s -= 0.30;
    return clamp(s, 0, 1.5);
}

function vibratoProbability(note, prev, next, i, count, coverage) {
    var q = SV.QUARTER;
    var d = note.getDuration();
    var kind = moraClass(note.getLyrics());
    if (kind !== "content") return 0;
    if (d < q * 1.25) return 0;

    var p;
    if (d >= q * 3.0) p = 0.94;
    else if (d >= q * 2.0) p = 0.64;
    else if (d >= q * 1.5) p = 0.28;
    else p = 0.08;

    p *= 0.62 + importance(note, prev, next, i, count) * 0.50;
    if (next && Math.abs(next.getPitch() - note.getPitch()) >= 5) p *= 0.68;
    if (prev && Math.abs(note.getPitch() - prev.getPitch()) >= 5) p *= 0.82;
    if (next && next.getPitch() === note.getPitch()) p *= 1.20;
    return clamp(p * coverage, 0, 0.98);
}

function addPoint(auto, t, v) {
    auto.add(Math.round(t), clamp(v, -1200, 1200));
}

function addAttack(auto, note, prev, score, strength, extreme) {
    var start = note.getOnset();
    var d = note.getDuration();
    var interval = prev ? note.getPitch() - prev.getPitch() : 0;
    var direction = interval > 0 ? 1 : interval < 0 ? -1 : pick([-1, 1]);
    var jump = clamp(Math.abs(interval) / 7, 0, 1);
    var amount = strength * (0.30 + score * 0.78) * (0.55 + jump * 0.65);
    if (extreme) amount *= 1.22;
    if (moraClass(note.getLyrics()) === "particle") amount *= 0.28;
    if (prev && prev.getPitch() === note.getPitch()) amount *= 0.72;

    var pre = amount * direction * rand(0.45, 0.95);
    var over = amount * direction * rand(0.35, extreme ? 1.10 : 0.72);
    if (RNG() < (extreme ? 0.24 : 0.10)) pre *= -1;

    addPoint(auto, start, 0);
    addPoint(auto, start + d * rand(0.018, 0.055), pre);
    addPoint(auto, start + d * rand(0.07, 0.15), over);
    addPoint(auto, start + d * rand(0.16, 0.26), rand(-2, 2));
}

function addAccent(auto, note, next, score, amount, extreme) {
    var start = note.getOnset();
    var d = note.getDuration();
    var a = amount * score;
    var kind = moraClass(note.getLyrics());
    if (kind === "particle") a *= 0.16;
    if (kind === "weak") a *= 0.45;
    if (extreme) a *= 1.22;

    var direction = next && next.getPitch() > note.getPitch() ? 1 : next && next.getPitch() < note.getPitch() ? -1 : pick([-1, 1]);
    addPoint(auto, start + d * rand(0.20, 0.34), direction * a * rand(0.45, 1.0));
    addPoint(auto, start + d * rand(0.40, 0.58), direction * a * rand(-0.20, 0.18));
}

function addVibrato(auto, note, depth, cycles, onset, extreme, instability) {
    var start = note.getOnset();
    var end = note.getEnd();
    var d = end - start;
    var vibStart = start + d * onset;
    var vibDuration = end - vibStart;
    if (vibDuration < SV.QUARTER * 0.45) return;

    var points = Math.max(5, cycles * 2 + 1);
    var phase = rand(-0.35, 0.35);
    var previous = 0;
    for (var i = 0; i <= points; i++) {
        var x = i / points;
        var t = vibStart + vibDuration * x;
        var wave = Math.sin(x * cycles * Math.PI * 2 + phase);
        if (extreme) wave = wave * 0.80 + Math.sin(x * cycles * Math.PI * 4 + phase) * 0.20;
        var envelope = clamp(x / 0.18, 0, 1) * (1 - Math.max(0, x - 0.78) * 0.80);
        var value = wave * depth * envelope * rand(1 - instability, 1 + instability);
        value = previous * 0.15 + value * 0.85;
        previous = value;
        addPoint(auto, t, value);
    }
    addPoint(auto, end, 0);
}

function collectGroups(notes) {
    var groups = [];
    for (var i = 0; i < notes.length; i++) {
        var group = notes[i].getParent();
        var found = false;
        for (var j = 0; j < groups.length; j++) if (groups[j] === group) found = true;
        if (!found) groups.push(group);
    }
    return groups;
}

function main() {
    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Generate deliberately artificial old-school VOCALOID-style pitch from selected notes.",
        buttons: "OkCancel",
        widgets: [
            { name: "era", type: "ComboBox", label: "Model", choices: ["Classic", "V1", "V2", "2008 Emotional", "2008 Extreme"], default: 4 },
            { name: "accent", type: "ComboBox", label: "Accent intelligence", choices: ["Low", "Medium", "High", "Extreme"], default: 2 },
            { name: "vibrato", type: "ComboBox", label: "Vibrato coverage", choices: ["Sparse", "Classic", "Aggressive", "Off"], default: 1 },
            { name: "instability", type: "ComboBox", label: "Instability", choices: ["Low", "Medium", "High", "Extreme"], default: 2 },
            { name: "clear", type: "ComboBox", label: "Clear existing Pitch Deviation", choices: ["Yes", "No"], default: 0 },
            { name: "seed", type: "TextBox", label: "Seed", default: "2008" }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;

    seedRandom(r.answers.seed);

    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var era = parseInt(r.answers.era);
    var accentLevel = [0.55, 0.90, 1.35, 1.90][parseInt(r.answers.accent)];
    var vibMode = parseInt(r.answers.vibrato);
    var instability = [0.05, 0.12, 0.22, 0.34][parseInt(r.answers.instability)];
    var extreme = era === 4;
    var attackAmount = [14, 18, 23, 28, 38][era] * (0.75 + instability * 0.45);
    var vibDepth = [5, 6, 8, 10, 14][era] * (0.80 + instability * 0.55);
    var vibCycles = [2, 2, 3, 3, 4][era];
    var vibOnset = [0.48, 0.45, 0.40, 0.32, 0.25][era];
    var coverage = [0.55, 0.85, 1.15, 0][vibMode];
    var groups = collectGroups(notes);

    if (parseInt(r.answers.clear) === 0) {
        for (var g = 0; g < groups.length; g++) {
            var groupNotes = [];
            for (var gn = 0; gn < notes.length; gn++) if (notes[gn].getParent() === groups[g]) groupNotes.push(notes[gn]);
            if (groupNotes.length) {
                groupNotes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });
                groups[g].getParameter("pitchDelta").remove(groupNotes[0].getOnset(), groupNotes[groupNotes.length - 1].getEnd());
            }
        }
    }

    for (var i = 0; i < notes.length; i++) {
        var note = notes[i];
        var prev = i ? notes[i - 1] : null;
        var next = i + 1 < notes.length ? notes[i + 1] : null;
        var imp = importance(note, prev, next, i, notes.length);
        var acc = accentScore(note, prev, next, i, notes.length);
        var auto = note.getParent().getParameter("pitchDelta");

        addAttack(auto, note, prev, imp, attackAmount, extreme);
        addAccent(auto, note, next, acc, accentLevel * 12, extreme);

        if (vibMode !== 3 && RNG() < vibratoProbability(note, prev, next, i, notes.length, coverage)) {
            addVibrato(auto, note, vibDepth, vibCycles, vibOnset, extreme, instability);
        }

        if (i === notes.length - 1 && note.getDuration() > SV.QUARTER * 0.75) {
            addPoint(auto, note.getEnd() - note.getDuration() * 0.14, -[7, 9, 12, 15, 22][era] * (0.75 + instability * 0.5));
            addPoint(auto, note.getEnd(), 0);
        }
    }

    SV.finish();
}
