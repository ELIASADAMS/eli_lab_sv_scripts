var SCRIPT_TITLE = "Pitch Baker - Vibrato Engine";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - Pitch Baker",
        author: "eli_lab",
        versionNumber: 4,
        minEditorVersion: 65537
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

function isParticle(s) { return ["は","が","を","に","へ","と","で","も","の","ね","よ","さ","ぞ","な","や"].indexOf(s) >= 0; }
function isWeak(s) { return ["っ","ッ","ー","ん","ン","る","れ","ろ","す","つ","く","き"].indexOf(s) >= 0; }

function eligibility(note, prev, next, index, count) {
    var q = SV.QUARTER;
    var d = note.getDuration();
    if (d < q * 1.15) return 0;
    if (isParticle(note.getLyrics()) || isWeak(note.getLyrics())) return 0;

    var score = 0.02 + clamp((d / q - 1.15) / 2.0, 0, 1) * 0.68;
    if (index === count - 1) score += 0.18;
    if (next && next.getPitch() === note.getPitch()) score += 0.14;
    if (prev && prev.getPitch() === note.getPitch()) score += 0.08;
    if (prev && Math.abs(note.getPitch() - prev.getPitch()) >= 5) score -= 0.20;
    if (next && Math.abs(next.getPitch() - note.getPitch()) >= 5) score -= 0.28;
    if (d >= q * 3.0) score += 0.18;
    return clamp(score, 0, 1);
}

function shapeValue(shape, x, cycles, phase) {
    var wave = Math.sin(x * cycles * Math.PI * 2 + phase);
    if (shape === 0) return wave;
    if (shape === 1) return wave * 0.78 + Math.sin(x * cycles * Math.PI * 4 + phase + 0.3) * 0.22;
    if (shape === 2) return wave * 0.72 + rand(-0.28, 0.28);
    return (wave >= 0 ? 1 : -1) + Math.sin(x * cycles * Math.PI * 4) * 0.10;
}

function main() {
    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Sparse phrase-aware vibrato. Long notes are favored; particles, weak morae and large melodic jumps are protected.",
        buttons: "OkCancel",
        widgets: [
            { name: "depth", type: "ComboBox", label: "Depth", choices: ["Tiny", "Light", "Classic", "Deep", "Extreme"], default: 2 },
            { name: "coverage", type: "ComboBox", label: "Coverage", choices: ["Very Sparse", "Sparse", "Balanced", "Frequent", "Long Notes Only"], default: 1 },
            { name: "onset", type: "ComboBox", label: "Onset", choices: ["Late", "Normal", "Early"], default: 1 },
            { name: "shape", type: "ComboBox", label: "Shape", choices: ["Smooth", "Asymmetric", "Broken", "Mechanical"], default: 1 },
            { name: "instability", type: "ComboBox", label: "Instability", choices: ["Low", "Medium", "High", "Extreme"], default: 1 },
            { name: "forceLong", type: "ComboBox", label: "Very long notes", choices: ["Allow", "Prefer", "Almost Always"], default: 1 },
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

    var depths = [2.5, 4.5, 7, 10, 15];
    var coverage = [0.38, 0.65, 0.90, 1.15, 0.0][parseInt(r.answers.coverage)];
    var onset = [0.52, 0.38, 0.25][parseInt(r.answers.onset)];
    var shape = parseInt(r.answers.shape);
    var instability = [0.04, 0.12, 0.22, 0.34][parseInt(r.answers.instability)];
    var force = parseInt(r.answers.forceLong);

    for (var i = 0; i < notes.length; i++) {
        var note = notes[i];
        var prev = i ? notes[i - 1] : null;
        var next = i + 1 < notes.length ? notes[i + 1] : null;
        var gate = eligibility(note, prev, next, i, notes.length);
        var durationQ = note.getDuration() / SV.QUARTER;

        if (durationQ >= 3.0 && force > 0) gate = force === 2 ? 0.98 : Math.max(gate, 0.78);
        if (parseInt(r.answers.coverage) === 4 && durationQ < 2.0) continue;
        if (RNG() > clamp(gate * coverage, 0, 0.98)) continue;

        var start = note.getOnset();
        var end = note.getEnd();
        var d = end - start;
        var vibStart = start + d * onset;
        var vibDuration = end - vibStart;
        if (vibDuration < SV.QUARTER * 0.45) continue;

        var cycles = Math.max(1, Math.min(7, Math.round(durationQ * 1.15)));
        var points = Math.max(5, cycles * 2 + 1);
        var depth = depths[parseInt(r.answers.depth)] * (0.65 + gate * 0.55);
        var phase = rand(-0.45, 0.45);
        var previous = 0;
        var auto = note.getParent().getParameter("pitchDelta");

        for (var p = 0; p <= points; p++) {
            var x = p / points;
            var t = vibStart + vibDuration * x;
            var value = shapeValue(shape, x, cycles, phase);
            value *= depth;
            value *= clamp(x / 0.18, 0, 1);
            value *= 1 - Math.max(0, x - 0.80) * 0.85;
            value *= rand(1 - instability, 1 + instability);
            value = previous * 0.18 + value * 0.82;
            previous = value;
            auto.add(Math.round(t), clamp(value, -1200, 1200));
        }
        auto.add(Math.round(end), 0);
    }

    SV.finish();
}
