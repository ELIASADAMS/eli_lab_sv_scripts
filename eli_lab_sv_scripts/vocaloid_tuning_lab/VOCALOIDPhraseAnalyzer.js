var SCRIPT_TITLE = "VOCALOID Phrase Analyzer";
var ANALYSIS_KEY = "eli_lab.vocaloid.analysis.v1";
var MORA_KEY = "eli_lab.vocaloid.mora.v1";

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

function cachedMora(note) {
    var m = note.getScriptData(MORA_KEY);
    if (m && m.lyric === note.getLyrics()) return m.className;
    return moraClass(note.getLyrics());
}

function noteAt(group, index) {
    if (index < 0 || index >= group.getNumNotes()) return null;
    return group.getNote(index);
}

function phraseBoundary(note, prev, next) {
    var q = SV.QUARTER;
    var gapBefore = prev ? note.getOnset() - prev.getEnd() : q;
    var gapAfter = next ? next.getOnset() - note.getEnd() : q;
    return {
        start: !prev || gapBefore > q * 0.20,
        end: !next || gapAfter > q * 0.20
    };
}

function analyze(note, group) {
    var index = note.getIndexInParent();
    var prev = noteAt(group, index - 1);
    var next = noteAt(group, index + 1);
    var boundary = phraseBoundary(note, prev, next);
    var q = SV.QUARTER;
    var d = note.getDuration();
    var prevInterval = prev ? note.getPitch() - prev.getPitch() : 0;
    var nextInterval = next ? next.getPitch() - note.getPitch() : 0;
    var kind = cachedMora(note);

    var importance = 0.20 + clamp(d / (q * 2.0), 0, 1) * 0.30;
    importance += clamp(Math.max(Math.abs(prevInterval), Math.abs(nextInterval)) / 7.0, 0, 1) * 0.30;
    if (boundary.start) importance += 0.08;
    if (boundary.end) importance += 0.12;
    if (prev && prev.getPitch() === note.getPitch()) importance -= 0.08;
    if (next && next.getPitch() === note.getPitch()) importance += 0.06;
    if (kind === "particle") importance -= 0.26;
    if (kind === "weak" || kind === "special") importance -= 0.10;
    importance = clamp(importance, 0.04, 1.35);

    var accent = importance;
    if (d < q * 0.70) accent += 0.12;
    if (Math.abs(prevInterval) >= 5) accent += 0.16;
    if (Math.abs(nextInterval) >= 5) accent += 0.20;
    if (boundary.end) accent += 0.14;
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
        if (boundary.end) vibrato *= 1.15;
        vibrato = clamp(vibrato, 0, 0.98);
    }

    var transitionIn = prev ? clamp(Math.abs(prevInterval) / 7, 0, 1) : 0;
    var transitionOut = next ? clamp(Math.abs(nextInterval) / 7, 0, 1) : 0;

    return {
        version: 1,
        lyric: note.getLyrics(),
        moraClass: kind,
        durationQ: d / q,
        prevInterval: prevInterval,
        nextInterval: nextInterval,
        sameAsPrev: !!prev && prev.getPitch() === note.getPitch(),
        sameAsNext: !!next && next.getPitch() === note.getPitch(),
        phraseStart: boundary.start,
        phraseEnd: boundary.end,
        importance: importance,
        accent: accent,
        vibrato: vibrato,
        transitionIn: transitionIn,
        transitionOut: transitionOut
    };
}

function formatScore(v) { return Math.round(v * 100) / 100; }

function main() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    var groups = [];
    for (var i = 0; i < notes.length; i++) {
        var g = notes[i].getParent();
        if (groups.indexOf(g) < 0) groups.push(g);
    }

    var summary = "";
    for (var j = 0; j < notes.length; j++) {
        var n = notes[j];
        var data = analyze(n, n.getParent());
        n.setScriptData(ANALYSIS_KEY, data);
        summary += (j + 1) + ". " + n.getLyrics() +
            "  " + data.moraClass +
            "  A:" + formatScore(data.accent) +
            "  V:" + formatScore(data.vibrato) +
            "  In:" + formatScore(data.transitionIn) +
            "  Out:" + formatScore(data.transitionOut) +
            (data.phraseEnd ? "  [END]" : "") + "\n";
        if (j >= 31 && notes.length > 32) {
            summary += "..." + (notes.length - 32) + " more notes\n";
            break;
        }
    }

    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Cached phrase intelligence for " + notes.length + " selected notes.\n\n" + summary));
    SV.finish();
}
