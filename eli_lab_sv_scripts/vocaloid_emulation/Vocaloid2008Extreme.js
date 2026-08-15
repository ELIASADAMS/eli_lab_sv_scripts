var SCRIPT_TITLE = "VOCALOID 2008 Extreme";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Tuning Lab",
        author: "eli_lab",
        versionNumber: 1,
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
function particle(s) { return ["は","が","を","に","へ","と","で","も","の","ね","よ","さ","ぞ","な","や"].indexOf(s) >= 0; }
function weak(s) { return ["っ","ッ","ー","ん","ン","る","れ","ろ","す","つ","く","き"].indexOf(s) >= 0; }
function neighbor(note, offset) {
    var group = note.getParent();
    var index = note.getIndexInParent();
    var target = index + offset;
    if (target < 0 || target >= group.getNumNotes()) return null;
    return group.getNote(target);
}
function add(auto, t, v) { auto.add(Math.round(t), clamp(v, -1200, 1200)); }

function main() {
    var r = SV.showCustomDialog({
        title: SV.T(SCRIPT_TITLE),
        message: "Extreme 2008-style laboratory preset: hard attacks, conspicuous accents, mathematical vibrato and unstable repeated notes.",
        buttons: "OkCancel",
        widgets: [
            { name: "amount", type: "ComboBox", label: "Intensity", choices: ["Strong", "Extreme", "Maximum"], default: 1 },
            { name: "vibrato", type: "ComboBox", label: "Vibrato", choices: ["Sparse", "Classic", "Aggressive", "Mechanical"], default: 2 },
            { name: "clear", type: "ComboBox", label: "Clear selected Pitch Deviation", choices: ["Yes", "No"], default: 0 },
            { name: "seed", type: "TextBox", label: "Seed", default: "2008" }
        ]
    });
    if (!r.status) return;
    seedRandom(r.answers.seed);

    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var scale = [1.25, 1.65, 2.05][parseInt(r.answers.amount)];
    var vibDepth = [9, 13, 18, 22][parseInt(r.answers.vibrato)];
    var mechanical = parseInt(r.answers.vibrato) === 3;

    if (parseInt(r.answers.clear) === 0) {
        for (var c = 0; c < notes.length; c++) notes[c].getParent().getParameter("pitchDelta").remove(notes[c].getOnset(), notes[c].getEnd());
    }

    for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        var prev = neighbor(n, -1);
        var next = neighbor(n, 1);
        var d = n.getDuration();
        var start = n.getOnset();
        var jump = prev ? Math.min(1.5, Math.abs(n.getPitch() - prev.getPitch()) / 5) : 0.5;
        var amount = 26 * scale * (0.65 + jump * 0.55);
        if (prev && prev.getPitch() === n.getPitch()) amount *= 1.22;
        if (particle(n.getLyrics())) amount *= 0.22;
        if (weak(n.getLyrics())) amount *= 0.45;

        var direction = next && next.getPitch() > n.getPitch() ? 1 : next && next.getPitch() < n.getPitch() ? -1 : prev && n.getPitch() > prev.getPitch() ? 1 : -1;
        var auto = n.getParent().getParameter("pitchDelta");
        add(auto, start, 0);
        add(auto, start + d * rand(0.018, 0.05), direction * amount * rand(0.55, 1.0));
        add(auto, start + d * rand(0.07, 0.14), direction * amount * rand(0.30, 0.95));
        add(auto, start + d * rand(0.16, 0.25), rand(-4, 4));

        if (!particle(n.getLyrics()) && !weak(n.getLyrics()) && d >= SV.QUARTER * 1.25) {
            var probability = d >= SV.QUARTER * 3 ? 0.98 : d >= SV.QUARTER * 2 ? 0.86 : 0.55;
            if (next && Math.abs(next.getPitch() - n.getPitch()) >= 5) probability *= 0.65;
            if (RNG() < probability) {
                var vibStart = start + d * (mechanical ? 0.22 : 0.27);
                var vibEnd = n.getEnd();
                var cycles = Math.min(8, Math.max(2, Math.round(d / SV.QUARTER * (mechanical ? 2.0 : 1.55))));
                var points = cycles * 2 + 1;
                for (var p = 0; p <= points; p++) {
                    var x = p / points;
                    var wave = mechanical ? (p % 2 ? -1 : 1) : Math.sin(x * cycles * Math.PI * 2 + rand(-0.25, 0.25));
                    var env = clamp(x / 0.15, 0, 1) * (1 - Math.max(0, x - 0.82) * 0.9);
                    add(auto, vibStart + (vibEnd - vibStart) * x, wave * vibDepth * scale * env * rand(0.82, 1.18));
                }
                add(auto, n.getEnd(), 0);
            }
        }

        if (i === notes.length - 1 && d > SV.QUARTER) {
            add(auto, n.getEnd() - d * 0.16, -22 * scale);
            add(auto, n.getEnd() - d * 0.05, -28 * scale);
            add(auto, n.getEnd(), 0);
        }
    }

    SV.finish();
}
