var SCRIPT_TITLE = "VOCALOID Phrase Analyzer";

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
var PARTICLES = ["は","が","を","に","へ","と","で","も","の","ね","よ","さ","ぞ","な","や"];
var WEAK = ["っ","ッ","ー","ん","ン","る","れ","ろ","す","つ","く","き"];
var SPECIAL = ["っ","ッ","ー","ん","ン"];
var SMALL = "ゃゅょぁぇぃぉぅゎャュョァェィォゥヮ";

function moraClass(s) {
    s = s || "";
    if (!s) return "unknown";
    if (PARTICLES.indexOf(s) >= 0) return "particle";
    if (SPECIAL.indexOf(s) >= 0) return "special";
    if (WEAK.indexOf(s) >= 0) return "weak";
    for (var i = 0; i < s.length; i++) if (SMALL.indexOf(s.charAt(i)) >= 0) return "contracted";
    return "content";
}

function neighbor(group, index) {
    if (index < 0 || index >= group.getNumNotes()) return null;
    return group.getNote(index);
}

function analyze(note, group) {
    var index = note.getIndexInParent();
    var prev = neighbor(group, index - 1);
    var next = neighbor(group, index + 1);
    var q = SV.QUARTER;
    var d = note.getDuration();
    var prevInterval = prev ? note.getPitch() - prev.getPitch() : 0;
    var nextInterval = next ? next.getPitch() - note.getPitch() : 0;
    var gapBefore = prev ? note.getOnset() - prev.getEnd() : q;
    var gapAfter = next ? next.getOnset() - note.getEnd() : q;
    var start = !prev || gapBefore > q * 0.20;
    var end = !next || gapAfter > q * 0.20;
    var kind = moraClass(note.getLyrics());

    var importance = 0.20 + clamp(d / (q * 2.0), 0, 1) * 0.30;
    importance += clamp(Math.max(Math.abs(prevInterval), Math.abs(nextInterval)) / 7.0, 0, 1) * 0.30;
    if (start) importance += 0.08;
    if (end) importance += 0.12;
    if (prev && prev.getPitch() === note.getPitch()) importance -= 0.08;
    if (next && next.getPitch() === note.getPitch()) importance += 0.06;
    if (kind === "particle") importance -= 0.26;
    if (kind === "weak" || kind === "special") importance -= 0.10;
    importance = clamp(importance, 0.04, 1.35);

    var accent = importance;
    if (d < q * 0.70) accent += 0.12;
    if (Math.abs(prevInterval) >= 5) accent += 0.16;
    if (Math.abs(nextInterval) >= 5) accent += 0.20;
    if (end) accent += 0.14;
    if (kind === "particle") accent -= 0.30;
    accent = clamp(accent, 0, 1.50);

    var vibrato = 0;
    if (kind === "content" || kind === "contracted") {
        if (d >= q * 3.0) vibrato = 0.94;
        else if (d >= q * 2.0) vibrato = 0.64;
        else if (d >= q * 1.5) vibrato = 0.28;
        else if (d >= q * 1.25) vibrato = 0.08;
        vibrato *= 0.62 + importance * 0.50;
        if (Math.abs(nextInterval) >= 5) vibrato *= 0.68;
        if (Math.abs(prevInterval) >= 5) vibrato *= 0.82;
        if (next && next.getPitch() === note.getPitch()) vibrato *= 1.20;
        if (end) vibrato *= 1.15;
        vibrato = clamp(vibrato, 0, 0.98);
    }

    return {
        lyric: note.getLyrics(),
        moraClass: kind,
        durationQ: d / q,
        prevInterval: prevInterval,
        nextInterval: nextInterval,
        sameAsPrev: !!prev && prev.getPitch() === note.getPitch(),
        sameAsNext: !!next && next.getPitch() === note.getPitch(),
        phraseStart: start,
        phraseEnd: end,
        importance: importance,
        accent: accent,
        vibrato: vibrato,
        transitionIn: clamp(Math.abs(prevInterval) / 7, 0, 1),
        transitionOut: clamp(Math.abs(nextInterval) / 7, 0, 1)
    };
}

function main() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });
    var lines = [];
    var limit = Math.min(notes.length, 32);
    for (var i = 0; i < limit; i++) {
        var n = notes[i];
        var d = analyze(n, n.getParent());
        lines.push((i + 1) + ". " + n.getLyrics() + "  " + d.moraClass +
            "  A:" + Math.round(d.accent * 100) / 100 +
            "  V:" + Math.round(d.vibrato * 100) / 100 +
            "  In:" + Math.round(d.transitionIn * 100) / 100 +
            "  Out:" + Math.round(d.transitionOut * 100) / 100 +
            (d.phraseStart ? "  [START]" : "") + (d.phraseEnd ? "  [END]" : ""));
    }
    if (notes.length > limit) lines.push("..." + (notes.length - limit) + " more notes");
    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Live phrase analysis. Nothing is written to notes or automation.\n\n" + lines.join("\n")));
    SV.finish();
}
