var SCRIPT_TITLE = "VOCALOID Tuning Lab";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Tuning Lab",
        author: "eli_lab",
        versionNumber: 1,
        minEditorVersion: 0x020101
    };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

function isParticle(s) {
    return ["は", "が", "を", "に", "へ", "と", "で", "も", "の", "ね", "よ", "さ", "ぞ", "な", "や"].indexOf(s) >= 0;
}

function isWeakMora(s) {
    return ["っ", "ー", "ん", "る", "れ", "ろ", "す", "つ", "く", "き"].indexOf(s) >= 0;
}

function importance(note, prev, next, i, count) {
    var q = SV.QUARTER;
    var d = note.getDuration();
    var prevLeap = prev ? Math.abs(note.getPitch() - prev.getPitch()) : 0;
    var nextLeap = next ? Math.abs(next.getPitch() - note.getPitch()) : 0;
    var score = 0.28 + clamp(d / (q * 2.0), 0, 1) * 0.30;
    score += clamp(Math.max(prevLeap, nextLeap) / 7, 0, 1) * 0.28;
    if (i === 0 || i === count - 1) score += 0.10;
    if (prev && prev.getPitch() === note.getPitch()) score -= 0.08;
    if (isParticle(note.getLyrics())) score -= 0.22;
    if (isWeakMora(note.getLyrics())) score -= 0.08;
    return clamp(score, 0.05, 1.25);
}

function accentScore(note, prev, next, i, count) {
    var d = note.getDuration();
    var q = SV.QUARTER;
    var score = importance(note, prev, next, i, count);
    if (d < q * 0.75) score += 0.16;
    if (next && Math.abs(next.getPitch() - note.getPitch()) >= 5) score += 0.18;
    if (prev && Math.abs(note.getPitch() - prev.getPitch()) >= 5) score += 0.16;
    if (i === count - 1) score += 0.18;
    if (isParticle(note.getLyrics())) score -= 0.35;
    return clamp(score, 0, 1.5);
}

function shouldVibrate(note, prev, next, i, count, mode) {
    var q = SV.QUARTER;
    var d = note.getDuration();
    if (isParticle(note.getLyrics()) || isWeakMora(note.getLyrics())) return false;
    if (d < q * 1.15) return false;
    var p = d >= q * 3.0 ? 0.94 : d >= q * 2.0 ? 0.72 : d >= q * 1.5 ? 0.42 : 0.16;
    p *= 0.55 + importance(note, prev, next, i, count) * 0.55;
    if (next && Math.abs(next.getPitch() - note.getPitch()) >= 5) p *= 0.72;
    if (next && next.getPitch() === note.getPitch()) p *= 1.15;
    if (mode === 0) p *= 0.75;
    if (mode === 2) p *= 1.22;
    return Math.random() < clamp(p, 0, 0.98);
}

function addPoint(auto, t, v) {
    auto.add(Math.round(t), clamp(v, -1200, 1200));
}

function attack(auto, note, prev, next, score, strength, extreme) {
    var start = note.getOnset();
    var d = note.getDuration();
    var interval = prev ? note.getPitch() - prev.getPitch() : 0;
    var direction = interval > 0 ? 1 : interval < 0 ? -1 : pick([-1, 1]);
    var jump = clamp(Math.abs(interval) / 7, 0, 1);
    var amount = strength * (0.35 + score * 0.75) * (0.55 + jump * 0.65);
    if (extreme) amount *= 1.28;
    if (isParticle(note.getLyrics())) amount *= 0.35;
    if (prev && prev.getPitch() === note.getPitch()) amount *= 0.72;

    var pre = amount * direction * rand(0.45, 0.95);
    var over = amount * direction * rand(0.35, extreme ? 1.05 : 0.72);
    var t1 = d * rand(0.018, 0.055);
    var t2 = d * rand(0.07, 0.15);
    var t3 = d * rand(0.16, 0.26);
    if (Math.random() < (extreme ? 0.22 : 0.12)) pre *= -1;

    addPoint(auto, start, 0);
    addPoint(auto, start + t1, pre);
    addPoint(auto, start + t2, over);
    addPoint(auto, start + t3, rand(-2, 2));
}

function accent(auto, note, next, score, amount, extreme) {
    var start = note.getOnset();
    var d = note.getDuration();
    var lyric = note.getLyrics();
    var a = amount * score;
    if (isParticle(lyric)) a *= 0.18;
    if (isWeakMora(lyric)) a *= 0.48;
    if (extreme) a *= 1.30;
    var dir = next && next.getPitch() > note.getPitch() ? 1 : next && next.getPitch() < note.getPitch() ? -1 : pick([-1, 1]);
    var t1 = start + d * rand(0.22, 0.38);
    var t2 = start + d * rand(0.44, 0.62);
    addPoint(auto, t1, dir * a * rand(0.45, 1.0));
    addPoint(auto, t2, dir * a * rand(-0.18, 0.18));
}

function vibrato(auto, note, depth, cycles, onset, extreme) {
    var start = note.getOnset();
    var end = note.getEnd();
    var d = end - start;
    var vs = start + d * onset;
    var vd = end - vs;
    if (vd <= 0) return;
    var points = Math.max(5, cycles * 2 + 1);
    var phase = rand(-0.45, 0.45);
    for (var i = 0; i <= points; i++) {
        var x = i / points;
        var t = vs + vd * x;
        var wave = Math.sin(x * cycles * Math.PI * 2 + phase);
        var shape = extreme ? (wave * 0.82 + Math.sin(x * cycles * Math.PI * 4 + phase) * 0.18) : wave;
        var env = clamp(x / 0.18, 0, 1) * (1 - Math.max(0, x - 0.78) * 0.75);
        addPoint(auto, t, shape * depth * env * rand(0.88, 1.12));
    }
    addPoint(auto, end, 0);
}

function main() {
    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Generate deliberately artificial, old-school VOCALOID-style pitch from flat notes",
        buttons: "OkCancel",
        widgets: [
            { name: "era", type: "ComboBox", label: "Model", choices: ["Classic", "V1", "V2", "2008 Emotional", "2008 Extreme"], default: 4 },
            { name: "accent", type: "ComboBox", label: "Accent intelligence", choices: ["Low", "Medium", "High", "Extreme"], default: 2 },
            { name: "vibrato", type: "ComboBox", label: "Vibrato", choices: ["Sparse", "Classic", "Aggressive", "Off"], default: 1 },
            { name: "instability", type: "ComboBox", label: "Instability", choices: ["Low", "Medium", "High", "Extreme"], default: 2 },
            { name: "clear", type: "ComboBox", label: "Clear existing Pitch Deviation", choices: ["Yes", "No"], default: 0 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) { SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes.")); return; }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var era = parseInt(r.answers.era);
    var accentLevel = [0.55, 0.9, 1.35, 1.9][parseInt(r.answers.accent)];
    var vibMode = parseInt(r.answers.vibrato);
    var instability = [0.65, 1.0, 1.35, 1.8][parseInt(r.answers.instability)];
    var extreme = era === 4;
    var attackAmount = [14, 18, 23, 28, 38][era] * instability;
    var vibDepth = [5, 6, 8, 10, 14][era] * instability;
    var vibCycles = [2, 2, 3, 3, 4][era];
    var vibOnset = [0.48, 0.45, 0.40, 0.32, 0.25][era];

    var groups = [];
    for (var g = 0; g < notes.length; g++) {
        var p = notes[g].getParent();
        var found = false;
        for (var gi = 0; gi < groups.length; gi++) if (groups[gi] === p) found = true;
        if (!found) groups.push(p);
    }
    if (parseInt(r.answers.clear) === 0) {
        for (var c = 0; c < groups.length; c++) groups[c].getParameter("pitchDelta").remove(notes[0].getOnset(), notes[notes.length - 1].getEnd());
    }

    for (var i = 0; i < notes.length; i++) {
        var note = notes[i];
        var prev = i > 0 ? notes[i - 1] : null;
        var next = i + 1 < notes.length ? notes[i + 1] : null;
        var auto = note.getParent().getParameter("pitchDelta");
        var score = accentScore(note, prev, next, i, notes.length);
        attack(auto, note, prev, next, importance(note, prev, next, i, notes.length), attackAmount, extreme);
        accent(auto, note, next, score, accentLevel * 12, extreme);

        if (vibMode !== 3 && shouldVibrate(note, prev, next, i, notes.length, vibMode)) {
            var d = vibDepth * (vibMode === 0 ? 0.7 : vibMode === 2 ? 1.2 : 1.0);
            vibrato(auto, note, d, vibCycles, vibOnset, extreme);
        }

        if (i === notes.length - 1 && note.getDuration() > SV.QUARTER * 0.75) {
            var end = note.getEnd();
            addPoint(auto, end - note.getDuration() * 0.14, -[7, 9, 12, 15, 22][era] * instability);
            addPoint(auto, end, 0);
        }
    }
    SV.finish();
}
