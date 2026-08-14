var SCRIPT_TITLE = "Pitch Reset Utility";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Utilities",
        author: "eli_lab",
        versionNumber: 1,
        minEditorVersion: 0x020102
    };
}

function main() {
    var editor = SV.getMainEditor();
    var selection = editor.getSelection();
    var notes = selection.getSelectedNotes();
    var groupRef = editor.getCurrentGroup();
    var group = groupRef.getTarget();

    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }
    if (!group) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), "Open a note group first.");
        return;
    }

    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Remove pitch material before running a VOCALOID tuning pass.",
        buttons: "OkCancel",
        widgets: [
            { name: "scope", type: "ComboBox", label: "Reset", choices: ["Pitch Deviation only", "Pitch Controls only", "Both"], default: 2 },
            { name: "range", type: "ComboBox", label: "Range", choices: ["Selected notes", "Entire current group"], default: 0 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;

    var scope = parseInt(r.answers.scope);
    var wholeGroup = parseInt(r.answers.range) === 1;
    var start = notes[0].getOnset();
    var end = notes[notes.length - 1].getEnd();
    if (wholeGroup) {
        if (group.getNumNotes() > 0) {
            start = group.getNote(0).getOnset();
            end = group.getNote(group.getNumNotes() - 1).getEnd();
        }
    }

    if (scope === 0 || scope === 2) {
        group.getParameter("pitchDelta").remove(start, end);
    }
    if (scope === 1 || scope === 2) {
        if (group.getNumPitchControls) {
            for (var i = group.getNumPitchControls() - 1; i >= 0; i--) group.removePitchControl(i);
        }
    }

    SV.finish();
}
