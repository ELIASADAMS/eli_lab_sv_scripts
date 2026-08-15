var SCRIPT_TITLE = "Pitch Reset Utility";

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
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var r = SV.showCustomDialog({
        title: SV.T(SCRIPT_TITLE),
        message: "Prepare selected notes for a flat-curve tuning pass without touching unselected notes between them.",
        buttons: "OkCancel",
        widgets: [
            { name: "mode", type: "ComboBox", label: "Reset", choices: ["Pitch Deviation only", "Pitch Deviation + Auto Mode", "Auto Mode only"], default: 1 }
        ]
    });
    if (!r.status) return;

    var mode = parseInt(r.answers.mode);
    for (var i = 0; i < notes.length; i++) {
        var note = notes[i];
        if (mode === 0 || mode === 1) {
            note.getParent().getParameter("pitchDelta").remove(note.getOnset(), note.getEnd());
        }
        if (mode === 1 || mode === 2) note.setPitchAutoMode(true);
    }

    SV.finish();
}
