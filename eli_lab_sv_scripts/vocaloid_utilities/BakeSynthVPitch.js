var SCRIPT_TITLE = "Bake SynthV Pitch";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Utilities",
        author: "eli_lab",
        versionNumber: 3,
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

    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "SynthV 1.11 can bake the generated Sing/Rap pitch by switching notes to Manual Mode. The generated curve is moved into Pitch Deviation and becomes editable/stable.",
        buttons: "OkCancel",
        widgets: [
            { name: "scope", type: "ComboBox", label: "Notes", choices: ["Selected notes", "Selected notes that are Auto"], default: 1 },
            { name: "mode", type: "ComboBox", label: "After baking", choices: ["Keep Manual", "Force Manual"], default: 1 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;

    var autoCount = 0;
    var bakedCount = 0;
    var onlyAuto = parseInt(r.answers.scope) === 1;

    for (var i = 0; i < notes.length; i++) {
        var note = notes[i];
        var isAuto = note.getPitchAutoMode();
        if (isAuto) autoCount++;
        if (onlyAuto && !isAuto) continue;

        // Synthesizer V Studio 1.11's supported bake operation:
        // switching Auto -> Manual moves the generated pitch curve into
        // Pitch Deviation and stops future pitch regeneration.
        note.setPitchAutoMode(false);
        bakedCount++;
    }

    SV.showMessageBox(
        SV.T(SCRIPT_TITLE),
        "Baked " + bakedCount + " note(s) into Manual Mode / Pitch Deviation.\n\n" +
        "Auto notes found: " + autoCount + "\n\n" +
        "The resulting curve is now safe to process with the Pitch Baker or VOCALOID Tuning Lab."
    );

    SV.finish();
}
