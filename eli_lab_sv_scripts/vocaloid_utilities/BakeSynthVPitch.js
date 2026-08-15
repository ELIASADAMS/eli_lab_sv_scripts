var SCRIPT_TITLE = "Bake SynthV Pitch";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Utilities",
        author: "eli_lab",
        versionNumber: 4,
        minEditorVersion: 67840
    };
}

function main() {
    var editor = SV.getMainEditor();
    var notes = editor.getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var r = SV.showCustomDialog({
        title: SV.T(SCRIPT_TITLE),
        message: "In SynthV Studio 1.x, switching Sing/Rap notes to Manual Mode moves their generated pitch into Pitch Deviation and freezes it.",
        buttons: "OkCancel",
        widgets: [
            { name: "scope", type: "ComboBox", label: "Bake", choices: ["Selected notes", "Selected Auto notes only"], default: 1 },
            { name: "confirm", type: "ComboBox", label: "Manual Mode", choices: ["Set selected Auto notes to Manual", "Do not change already Manual notes"], default: 0 }
        ]
    });
    if (!r.status) return;

    var onlyAuto = parseInt(r.answers.scope) === 1;
    var baked = 0;
    var skippedManual = 0;

    for (var i = 0; i < notes.length; i++) {
        var note = notes[i];
        var isAuto = note.getPitchAutoMode();
        if (!isAuto) {
            skippedManual++;
            continue;
        }
        if (!onlyAuto || isAuto) {
            note.setPitchAutoMode(false);
            baked++;
        }
    }

    SV.showMessageBox(
        SV.T(SCRIPT_TITLE),
        "Baked " + baked + " note(s) into Manual Mode / Pitch Deviation.\n\n" +
        "Already Manual: " + skippedManual + "\n\n" +
        "The frozen curve can now be processed by Pitch Baker or VOCALOID Tuning Lab."
    );
    SV.finish();
}
