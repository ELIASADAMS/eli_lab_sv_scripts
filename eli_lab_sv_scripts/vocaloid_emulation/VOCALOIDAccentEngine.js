var SCRIPT_TITLE = "VOCALOID Accent Engine";
var ANALYSIS_KEY = "eli_lab.vocaloid.analysis.v1";
var MORA_KEY = "eli_lab.vocaloid.mora.v1";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Tuning Lab",
        author: "eli_lab",
        versionNumber: 4,
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

function getAnalysis(note) {
    var data = note.getScriptData(ANALYSIS_KEY);
    if (data && data.lyric === note.getLyrics() && data.version === 1) return data;
    return null;
}
function getMoraClass(note) {
    var m = note.getScriptData(MORA_KEY);
    if (m && m.lyric === note.getLyrics()) return m.className;
    return null;
}
function particle(s) { return ["は","が","を","に","へ","と","で","も","の","ね","よ","さ","ぞ","な","や"].indexOf(s) >= 0; }
function weak(s) { return ["っ","ッ","ー","ん","ン","る","れ","ろ","す","つ","く","き"].indexOf(s) >= 0; }

function neighbor(note, offset) {
    var group = note.getParent();
    var index = note.getIndexInParent();
    var target = index + offset;
    if (target < 0 || target >= group.getNumNotes()) return null;
    return group.getNote(target);
}

function fallbackPhraseScore(note, prev, next, isFirst, isLast) {
    var q = SV.QUARTER;
    var d = note.getDuration();
    var s = 0.20 + clamp(d / (q * 2), 0, 1) * 0.28;
    var up = prev ? note.getPitch() - prev.getPitch() : 0;
    var down = next ? next.getPitch() - note.getPitch() : 0;
    if (Math.abs(up) >= 3) s += 0.10;
    if (Math.abs(down) >= 3) s += 0.12;
    if (Math.abs(up) >= 5 || Math.abs(down) >= 5) s += 0.15;
    if (isFirst) s += 0.10;
    if (isLast) s += 0.16;
    if (prev && prev.getPitch() === note.getPitch()) s -= 0.06;
    if (next && next.getPitch() === note.getPitch()) s += 0.08;
    if (particle(note.getLyrics())) s -= 0.34;
    if (weak(note.getLyrics())) s -= 0.12;
    return clamp(s, 0, 1.5);
}

function add(auto, t, value) { auto.add(Math.round(t), clamp(value, -1200, 1200)); }

function main() {
    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Generate isolated old-school pitch accents from phrase context. This does not add vibrato.",
        buttons: "OkCancel",
        widgets: [
            { name: "strength", type: "ComboBox", label: "Accent strength", choices: ["Light", "Classic", "Hard", "Extreme"], default: 2 },
            { name: "style", type: "ComboBox", label: "Accent shape", choices: ["Rise-Fall", "Snap", "Overshoot", "Broken", "Fall-Then-Hit"], default: 1 },
            { name: "particles", type: "ComboBox", label: "Particle accents", choices: ["Avoid", "Subtle", "Allow"], default: 0 },
            { name: "longNotes", type: "ComboBox", label: "Long-note behavior", choices: ["Ignore", "Small", "Strong"], default: 1 },
            { name: "replace", type: "ComboBox", label: "Replace selected note pitch data", choices: ["Yes", "No"], default: 0 },
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

    var strength = [7, 12, 20, 31][parseInt(r.answers.strength)];
    var style = parseInt(r.answers.style);
    var particleMode = parseInt(r.answers.particles);
    var longMode = parseInt(r.answers.longNotes);
    var replace = parseInt(r.answers.replace) === 0;

    if (replace) {
        for (var c = 0; c < notes.length; c++) notes[c].getParent().getParameter("pitchDelta").remove(notes[c].getOnset(), notes[c].getEnd());
    }

    for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        var prev = neighbor(n, -1);
        var next = neighbor(n, 1);
        var data = getAnalysis(n);
        var isP = data ? data.moraClass === "particle" : particle(n.getLyrics());
        if (isP && particleMode === 0) continue;

        var s = data ? data.accent : fallbackPhraseScore(n, prev, next, i === 0, i === notes.length - 1);
        if (isP) s *= particleMode === 1 ? 0.25 : 0.60;
        if (n.getDuration() >= SV.QUARTER * 2.0) s *= [1, 1.10, 1.30][longMode];
        if (s <= 0.06) continue;

        var amount = strength * s;
        var start = n.getOnset();
        var d = n.getDuration();
        var direction = data && data.nextInterval !== 0 ? (data.nextInterval > 0 ? 1 : -1) : (next && next.getPitch() > n.getPitch() ? 1 : next && next.getPitch() < n.getPitch() ? -1 : prev && n.getPitch() > prev.getPitch() ? 1 : -1);
        var auto = n.getParent().getParameter("pitchDelta");

        if (style === 0) {
            add(auto, start + d * 0.22, direction * amount * 0.45);
            add(auto, start + d * 0.42, direction * amount);
            add(auto, start + d * 0.66, direction * amount * 0.10);
        } else if (style === 1) {
            add(auto, start + d * 0.10, direction * amount);
            add(auto, start + d * 0.20, -direction * amount * 0.18);
            add(auto, start + d * 0.38, 0);
        } else if (style === 2) {
            add(auto, start + d * 0.16, direction * amount * 0.65);
            add(auto, start + d * 0.30, direction * amount * 1.25);
            add(auto, start + d * 0.54, 0);
        } else if (style === 3) {
            add(auto, start + d * 0.10, direction * amount);
            add(auto, start + d * 0.22, -direction * amount * 0.55);
            add(auto, start + d * 0.36, direction * amount * 0.38);
            add(auto, start + d * 0.54, rand(-amount * 0.20, amount * 0.20));
        } else {
            add(auto, start + d * 0.16, -direction * amount * 0.55);
            add(auto, start + d * 0.28, direction * amount * 1.10);
            add(auto, start + d * 0.52, 0);
        }
    }

    SV.finish();
}
