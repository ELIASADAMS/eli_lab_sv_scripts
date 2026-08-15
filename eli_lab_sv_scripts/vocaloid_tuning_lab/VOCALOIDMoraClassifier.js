var SCRIPT_TITLE = "VOCALOID Mora Classifier";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Tuning Lab",
        author: "eli_lab",
        versionNumber: 2,
        minEditorVersion: 67840
    };
}

var PARTICLES = ["は","が","を","に","へ","と","で","も","の","ね","よ","さ","ぞ","な","や"];
var WEAK = ["っ","ッ","ー","ん","ン","る","れ","ろ","す","つ","く","き"];
var SPECIAL = ["っ","ッ","ー","ん","ン"];
var SMALL = "ゃゅょぁぇぃぉぅゎャュョァェィォゥヮ";

function classify(s) {
    s = s || "";
    if (!s) return "unknown";
    if (PARTICLES.indexOf(s) >= 0) return "particle";
    if (SPECIAL.indexOf(s) >= 0) return "special";
    if (WEAK.indexOf(s) >= 0) return "weak";
    for (var i = 0; i < s.length; i++) {
        if (SMALL.indexOf(s.charAt(i)) >= 0) return "contracted";
    }
    return "content";
}

function main() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var counts = { content: 0, contracted: 0, particle: 0, weak: 0, special: 0, unknown: 0 };
    var lines = [];
    for (var i = 0; i < notes.length; i++) {
        var c = classify(notes[i].getLyrics());
        counts[c]++;
        if (i < 32) lines.push((i + 1) + ". " + notes[i].getLyrics() + "  " + c);
    }
    if (notes.length > 32) lines.push("..." + (notes.length - 32) + " more notes");

    SV.showMessageBox(
        SV.T(SCRIPT_TITLE),
        SV.T("Live mora classification. Nothing is stored in notes.\n\n" +
            "Content: " + counts.content + "\n" +
            "Contracted: " + counts.contracted + "\n" +
            "Particles: " + counts.particle + "\n" +
            "Weak: " + counts.weak + "\n" +
            "Special: " + counts.special + "\n\n" +
            lines.join("\n"))
    );
    SV.finish();
}
