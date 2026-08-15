var SCRIPT_TITLE = "VOCALOID Accent Engine";

function getClientInfo() {
    return { name: SV.T(SCRIPT_TITLE), category: "eli_lab - VOCALOID Tuning Lab", author: "eli_lab", versionNumber: 5, minEditorVersion: 67840 };
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
var PARTICLES = ["は","が","を","に","へ","と","で","も","の","ね","よ","さ","ぞ","な","や"];
var WEAK = ["っ","ッ","ー","ん","ン","る","れ","ろ","す","つ","く","き"];
var SPECIAL = ["っ","ッ","ー","ん","ン"];
var SMALL = "ゃゅょぁぇぃぉぅゎャュョァェィォゥヮ";
var RNG = Math.random;
function seedRandom(seed) { var s = (parseInt(seed, 10) || 1) >>> 0; if (!s) s = 1; RNG = function() { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
function rand(a, b) { return a + RNG() * (b - a); }
function moraClass(s) { s = s || ""; if (!s) return "unknown"; if (PARTICLES.indexOf(s) >= 0) return "particle"; if (SPECIAL.indexOf(s) >= 0) return "special"; if (WEAK.indexOf(s) >= 0) return "weak"; for (var i = 0; i < s.length; i++) if (SMALL.indexOf(s.charAt(i)) >= 0) return "contracted"; return "content"; }
function neighbor(note, off) { var g = note.getParent(), i = note.getIndexInParent() + off; return i < 0 || i >= g.getNumNotes() ? null : g.getNote(i); }
function analyze(n) {
    var g = n.getParent(), i = n.getIndexInParent(), p = neighbor(n, -1), x = neighbor(n, 1), q = SV.QUARTER, d = n.getDuration(), kind = moraClass(n.getLyrics());
    var pi = p ? n.getPitch() - p.getPitch() : 0, ni = x ? x.getPitch() - n.getPitch() : 0;
    var start = !p || n.getOnset() - p.getEnd() > q * 0.20, end = !x || x.getOnset() - n.getEnd() > q * 0.20;
    var s = 0.20 + clamp(d / (q * 2), 0, 1) * 0.30 + clamp(Math.max(Math.abs(pi), Math.abs(ni)) / 7, 0, 1) * 0.30;
    if (start) s += 0.08; if (end) s += 0.12; if (p && p.getPitch() === n.getPitch()) s -= 0.08; if (x && x.getPitch() === n.getPitch()) s += 0.06;
    if (kind === "particle") s -= 0.26; if (kind === "weak" || kind === "special") s -= 0.10;
    if (d < q * 0.70) s += 0.12; if (Math.abs(pi) >= 5) s += 0.16; if (Math.abs(ni) >= 5) s += 0.20; if (end) s += 0.14; if (kind === "particle") s -= 0.30;
    return { score: clamp(s, 0, 1.5), kind: kind, nextInterval: ni, phraseStart: start, phraseEnd: end };
}
function addCurve(auto, note, points) {
    var start = note.getOnset(), end = note.getEnd(), last = null;
    for (var i = 0; i < points.length; i++) {
        var t = Math.round(start + clamp(points[i][0], 0, 1) * (end - start));
        if (last !== null && t <= last) t = last + 1;
        if (t > end) t = end;
        auto.add(t, clamp(points[i][1], -1200, 1200));
        last = t;
    }
}
function main() {
    var r = SV.showCustomDialog({ title: SV.T(SCRIPT_TITLE), message: "Context-aware old-school pitch accents. No cache or pre-analysis step is required.", buttons: "OkCancel", widgets: [
        { name: "strength", type: "ComboBox", label: "Accent strength", choices: ["Light", "Classic", "Hard", "Extreme"], default: 2 },
        { name: "style", type: "ComboBox", label: "Accent shape", choices: ["Rise-Fall", "Snap", "Overshoot", "Broken", "Fall-Then-Hit"], default: 1 },
        { name: "particles", type: "ComboBox", label: "Particle accents", choices: ["Avoid", "Subtle", "Allow"], default: 0 },
        { name: "longNotes", type: "ComboBox", label: "Long-note behavior", choices: ["Ignore", "Small", "Strong"], default: 1 },
        { name: "replace", type: "ComboBox", label: "Replace selected note pitch data", choices: ["Yes", "No"], default: 0 },
        { name: "seed", type: "TextBox", label: "Seed", default: "2008" }
    ] });
    if (!r.status) return; seedRandom(r.answers.seed);
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) { SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes.")); return; }
    notes.sort(function(a,b){ return a.getOnset()-b.getOnset(); });
    var strength = [7,12,20,31][parseInt(r.answers.strength)], style = parseInt(r.answers.style), pm = parseInt(r.answers.particles), lm = parseInt(r.answers.longNotes), replace = parseInt(r.answers.replace) === 0;
    if (replace) for (var c=0;c<notes.length;c++) notes[c].getParent().getParameter("pitchDelta").remove(notes[c].getOnset(), notes[c].getEnd());
    for (var i=0;i<notes.length;i++) {
        var n=notes[i], a=analyze(n), p=neighbor(n,-1), x=neighbor(n,1);
        if (a.kind === "particle" && pm === 0) continue;
        var score=a.score * (a.kind === "particle" ? (pm===1?0.25:0.60) : 1);
        if (n.getDuration() >= SV.QUARTER*2) score *= [1,1.10,1.30][lm];
        if (score <= 0.06) continue;
        var amount=strength*score, dir=a.nextInterval>0?1:a.nextInterval<0?-1:(x&&x.getPitch()>n.getPitch()?1:x&&x.getPitch()<n.getPitch()?-1:p&&n.getPitch()>p.getPitch()?1:-1), d=n.getDuration();
        var shapes = [
            [[0.00,0],[0.22,dir*amount*0.45],[0.43,dir*amount],[0.68,dir*amount*0.10],[1,0]],
            [[0.00,0],[0.10,dir*amount],[0.20,-dir*amount*0.18],[0.40,0],[1,0]],
            [[0.00,0],[0.16,dir*amount*0.65],[0.30,dir*amount*1.25],[0.54,0],[1,0]],
            [[0.00,0],[0.10,dir*amount],[0.22,-dir*amount*0.55],[0.36,dir*amount*0.38],[0.55,rand(-amount*.2,amount*.2)],[1,0]],
            [[0.00,0],[0.16,-dir*amount*.55],[0.28,dir*amount*1.10],[0.52,0],[1,0]]
        ];
        addCurve(n.getParent().getParameter("pitchDelta"), n, shapes[style]);
    }
    SV.finish();
}
