var SCRIPT_TITLE = "VOCALOID Mora Classifier";
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

var PARTICLES = ["は","が","を","に","へ","と","で","も","の","ね","よ","さ","ぞ","な","や"];
var WEAK = ["っ","ッ","ー","ん","ン","る","れ","ろ","す","つ","く","き"];
var SPECIAL = ["っ","ッ","ー","ん","ン"];
var SMALL = "ゃゅょぁぇぃぉぅゎャュョァェィォゥヮ";

function contains(a, s) { return a.indexOf(s) >= 0; }

function classify(lyric) {
    var s = lyric || "";
    if (!s) return "unknown";
    if (contains(PARTICLES, s)) return "particle";
    if (contains(SPECIAL, s)) return "special";
    if (contains(WEAK, s)) return "weak";
    for (var i = 0; i < s.length; i++) {
        if (SMALL.indexOf(s.charAt(i)) >= 0) return "contracted";
    }
    return "content";
}

function write(note) {
    var value = {
        lyric: note.getLyrics(),
        className: classify(note.getLyrics()),
        isParticle: classify(note.getLyrics()) === "particle",
        isWeak: classify(note.getLyrics()) === "weak",
        isSpecial: classify(note.getLyrics()) === "special",
        isContent: classify(note.getLyrics()) === "content" || classify(note.getLyrics()) === "contracted"
    };
    note.setScriptData(MORA_KEY, value);
    return value;
}

function main() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    var counts = { content: 0, particle: 0, weak: 0, special: 0, contracted: 0, unknown: 0 };
    for (var i = 0; i < notes.length; i++) {
        var c = write(notes[i]);
        counts[c.className] = (counts[c.className] || 0) + 1;
    }

    SV.showMessageBox(
        SV.T(SCRIPT_TITLE),
        SV.T("Cached mora classes for " + notes.length + " selected notes.\n\n" +
            "Content: " + counts.content + "\n" +
            "Contracted: " + counts.contracted + "\n" +
            "Particles: " + counts.particle + "\n" +
            "Weak: " + counts.weak + "\n" +
            "Special: " + counts.special)
    );
    SV.finish();
}
