var SCRIPT_TITLE = "Japanese Mora Utility";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Utilities",
        author: "eli_lab",
        versionNumber: 1,
        minEditorVersion: 65537
    };
}

var SMALL = ["ぁ","ぃ","ぅ","ぇ","ぉ","ゃ","ゅ","ょ","ゎ","ァ","ィ","ゥ","ェ","ォ","ャ","ュ","ョ","ヮ"];

function isSmall(s) { return SMALL.indexOf(s) >= 0; }

function moraize(text) {
    var out = [];
    var current = "";
    for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (isSmall(ch) || ch === "'" || ch === "’") {
            if (current !== "") current += ch;
            else out.push(ch);
        } else {
            if (current !== "") out.push(current);
            current = ch;
        }
    }
    if (current !== "") out.push(current);
    return out;
}

function weight(mora) {
    if (mora === "っ" || mora === "ッ") return 0.85;
    if (mora === "ん" || mora === "ン") return 0.90;
    if (mora === "ー") return 1.05;
    if (mora.length > 1) return 1.0;
    return 1.0;
}

function main() {
    var editor = SV.getMainEditor();
    var selection = editor.getSelection();
    var notes = selection.getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Japanese-aware mora parsing for VOCALOID-style timing and accent work",
        buttons: "OkCancel",
        widgets: [
            { name: "mode", type: "ComboBox", label: "Operation", choices: ["Analyze selected notes", "Split selected notes into morae"], default: 0 },
            { name: "timing", type: "ComboBox", label: "Split timing", choices: ["Equal", "Weighted", "Front-loaded"], default: 1 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;

    if (parseInt(r.answers.mode) === 0) {
        var lines = [];
        var total = 0;
        for (var i = 0; i < notes.length; i++) {
            var ms = moraize(notes[i].getLyrics());
            total += ms.length;
            lines.push(notes[i].getLyrics() + "  →  " + ms.join(" | "));
        }
        lines.push("\nTotal morae: " + total);
        SV.showMessageBox(SV.T(SCRIPT_TITLE), lines.join("\n"));
        return;
    }

    var group = editor.getCurrentGroup().getTarget();
    if (!group) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), "Open a note group first.");
        return;
    }

    notes.sort(function(a,b){ return a.getOnset() - b.getOnset(); });
    // Work backwards so inserting cloned notes never changes the original
    // note references still needed by the loop.
    for (var n = notes.length - 1; n >= 0; n--) {
        var original = notes[n];
        var morae = moraize(original.getLyrics());
        if (morae.length < 2) continue;

        var full = original.getDuration();
        var weights = [];
        var totalWeight = 0;
        for (var w = 0; w < morae.length; w++) {
            var ww = weight(morae[w]);
            if (parseInt(r.answers.timing) === 2) ww *= (1 + (morae.length - w) * 0.10);
            weights.push(ww);
            totalWeight += ww;
        }

        var durations = [];
        var consumed = 0;
        for (var d = 0; d < morae.length; d++) {
            var dur;
            if (parseInt(r.answers.timing) === 0) dur = full / morae.length;
            else dur = full * weights[d] / totalWeight;
            dur = Math.round(dur);
            durations.push(dur);
            consumed += dur;
        }
        durations[durations.length - 1] += full - consumed;

        var onset = original.getOnset();
        original.setLyrics(morae[0]);
        original.setDuration(durations[0]);
        onset += durations[0];

        for (var m = 1; m < morae.length; m++) {
            var clone = original.clone ? original.clone() : SV.create("Note");
            clone.setLyrics(morae[m]);
            clone.setTimeRange(onset, durations[m]);
            group.addNote(clone);
            onset += durations[m];
        }
    }
    SV.finish();
}
