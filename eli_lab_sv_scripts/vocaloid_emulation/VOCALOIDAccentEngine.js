var SCRIPT_TITLE = "VOCALOID Accent Engine";

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

function particle(s) { return ["は","が","を","に","へ","と","で","も","の","ね","よ","さ","ぞ","な","や"].indexOf(s) >= 0; }
function weak(s) { return ["っ","ー","ん","る","れ","ろ","す","つ","く","き"].indexOf(s) >= 0; }

function score(note, prev, next, index, count) {
    var q = SV.QUARTER;
    var d = note.getDuration();
    var s = 0.25 + clamp(d / (q * 2.0), 0, 1) * 0.30;
    if (prev) s += clamp(Math.abs(note.getPitch() - prev.getPitch()) / 7, 0, 1) * 0.22;
    if (next) s += clamp(Math.abs(next.getPitch() - note.getPitch()) / 7, 0, 1) * 0.24;
    if (index === 0) s += 0.12;
    if (index === count - 1) s += 0.18;
    if (next && next.getPitch() === note.getPitch()) s += 0.08;
    if (particle(note.getLyrics())) s -= 0.34;
    if (weak(note.getLyrics())) s -= 0.12;
    return clamp(s, 0, 1.5);
}

function main() {
    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Place old-school pitch accents only where the phrase gives them a reason to exist",
        buttons: "OkCancel",
        widgets: [
            { name: "strength", type: "ComboBox", label: "Accent strength", choices: ["Light", "Classic", "Hard", "Extreme"], default: 2 },
            { name: "style", type: "ComboBox", label: "Accent shape", choices: ["Rise-Fall", "Snap", "Overshoot", "Broken"], default: 1 },
            { name: "particles", type: "ComboBox", label: "Particle accents", choices: ["Avoid", "Subtle", "Allow"], default: 0 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) { SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes.")); return; }
    notes.sort(function(a,b){ return a.getOnset() - b.getOnset(); });

    var strength = [7, 12, 20, 31][parseInt(r.answers.strength)];
    var style = parseInt(r.answers.style);
    var particleMode = parseInt(r.answers.particles);

    for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        var prev = i ? notes[i - 1] : null;
        var next = i + 1 < notes.length ? notes[i + 1] : null;
        var s = score(n, prev, next, i, notes.length);
        if (particle(n.getLyrics())) {
            if (particleMode === 0) continue;
            s *= particleMode === 1 ? 0.28 : 0.62;
        }
        if (s <= 0.08) continue;
        var amount = strength * s;
        var start = n.getOnset();
        var d = n.getDuration();
        var direction = next && next.getPitch() > n.getPitch() ? 1 : next && next.getPitch() < n.getPitch() ? -1 : (prev && n.getPitch() > prev.getPitch() ? 1 : -1);
        var auto = n.getParent().getParameter("pitchDelta");

        if (style === 0) {
            auto.add(Math.round(start + d * 0.24), direction * amount * 0.55);
            auto.add(Math.round(start + d * 0.48), direction * amount);
            auto.add(Math.round(start + d * 0.70), direction * amount * 0.12);
        } else if (style === 1) {
            auto.add(Math.round(start + d * 0.12), direction * amount);
            auto.add(Math.round(start + d * 0.22), -direction * amount * 0.20);
            auto.add(Math.round(start + d * 0.40), 0);
        } else if (style === 2) {
            auto.add(Math.round(start + d * 0.18), direction * amount * 0.65);
            auto.add(Math.round(start + d * 0.32), direction * amount * 1.20);
            auto.add(Math.round(start + d * 0.55), 0);
        } else {
            auto.add(Math.round(start + d * 0.12), direction * amount);
            auto.add(Math.round(start + d * 0.24), -direction * amount * 0.55);
            auto.add(Math.round(start + d * 0.38), direction * amount * 0.38);
            auto.add(Math.round(start + d * 0.56), rand(-amount * 0.18, amount * 0.18));
        }
    }
    SV.finish();
}
