var SCRIPT_TITLE = "Japanese Mora Utility";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Utilities",
        author: "eli_lab",
        versionNumber: 2,
        minEditorVersion: 65537
    };
}

var SMALL = ["ぁ","ぃ","ぅ","ぇ","ぉ","ゃ","ゅ","ょ","ゎ","ァ","ィ","ゥ","ェ","ォ","ャ","ュ","ョ","ヮ"];
var PROLONGED = ["ー","ｰ"];
var NASAL = ["ん","ン"];
var GEMINATE = ["っ","ッ"];

function isSmall(ch) { return SMALL.indexOf(ch) >= 0; }
function isProlonged(ch) { return PROLONGED.indexOf(ch) >= 0; }
function isNasal(ch) { return NASAL.indexOf(ch) >= 0; }
function isGeminative(ch) { return GEMINATE.indexOf(ch) >= 0; }

function moraize(text) {
    var out = [];
    var current = "";
    for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);

        if (ch === " " || ch === "　" || ch === "'" || ch === "’" || ch === "_") {
            if (current !== "") {
                out.push(current);
                current = "";
            }
            continue;
        }

        if (isSmall(ch)) {
            if (current !== "") current += ch;
            else out.push(ch);
            continue;
        }

        if (isProlonged(ch) || isNasal(ch) || isGeminative(ch)) {
            if (current !== "") {
                out.push(current);
                current = "";
            }
            out.push(ch);
            continue;
        }

        if (current !== "") out.push(current);
        current = ch;
    }
    if (current !== "") out.push(current);
    return out;
}

function weight(mora) {
    if (isGeminative(mora)) return 0.82;
    if (isNasal(mora)) return 0.90;
    if (isProlonged(mora)) return 1.05;
    return 1.0;
}

function timingWeights(morae, mode) {
    var result = [];
    var total = 0;
    for (var i = 0; i < morae.length; i++) {
        var w = weight(morae[i]);
        if (mode === 2) w *= 1 + (morae.length - i) * 0.10;
        result.push(w);
        total += w;
    }
    return { values: result, total: total };
}

function splitDurations(full, morae, mode) {
    var durations = [];
    var consumed = 0;
    var weights = timingWeights(morae, mode);

    for (var i = 0; i < morae.length; i++) {
        var d = mode === 0 ? full / morae.length : full * weights.values[i] / weights.total;
        d = Math.max(1, Math.round(d));
        durations.push(d);
        consumed += d;
    }

    durations[durations.length - 1] += full - consumed;
    if (durations[durations.length - 1] < 1) durations[durations.length - 1] = 1;
    return durations;
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
        message: "Japanese-aware mora parsing for VOCALOID-style accent and timing work.",
        buttons: "OkCancel",
        widgets: [
            { name: "mode", type: "ComboBox", label: "Operation", choices: ["Analyze selected notes", "Split selected notes into morae"], default: 0 },
            { name: "timing", type: "ComboBox", label: "Split timing", choices: ["Equal", "Weighted", "Front-loaded"], default: 1 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;

    var operation = parseInt(r.answers.mode);
    var timing = parseInt(r.answers.timing);

    if (operation === 0) {
        var lines = [];
        var total = 0;
        for (var i = 0; i < notes.length; i++) {
            var morae = moraize(notes[i].getLyrics());
            total += morae.length;
            lines.push(notes[i].getLyrics() + "  →  " + morae.join(" | "));
        }
        lines.push("");
        lines.push("Total notes: " + notes.length);
        lines.push("Total morae: " + total);
        SV.showMessageBox(SV.T(SCRIPT_TITLE), lines.join("\n"));
        return;
    }

    var currentGroup = editor.getCurrentGroup();
    if (!currentGroup) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), "Open a note group first.");
        return;
    }
    var group = currentGroup.getTarget();
    if (!group) return;

    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    // Backward processing keeps note references stable while new notes are inserted.
    for (var n = notes.length - 1; n >= 0; n--) {
        var original = notes[n];
        var morae = moraize(original.getLyrics());
        if (morae.length < 2) continue;

        var originalOnset = original.getOnset();
        var full = original.getDuration();
        var durations = splitDurations(full, morae, timing);
        var clones = [];

        // Clone BEFORE modifying the original so all original note properties
        // (pitch mode, attributes, phonemes, etc.) are retained by the new notes.
        for (var c = 1; c < morae.length; c++) {
            clones.push(original.clone());
        }

        original.setLyrics(morae[0]);
        original.setTimeRange(originalOnset, durations[0]);

        var onset = originalOnset + durations[0];
        for (var m = 1; m < morae.length; m++) {
            var clone = clones[m - 1];
            clone.setLyrics(morae[m]);
            clone.setTimeRange(onset, durations[m]);
            group.addNote(clone);
            onset += durations[m];
        }
    }

    SV.finish();
}
