var SCRIPT_TITLE = "Pitch Reset Utility";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Utilities",
        author: "eli_lab",
        versionNumber: 2,
        minEditorVersion: 67840
    };
}

function collectGroups(notes) {
    var groups = [];
    for (var i = 0; i < notes.length; i++) {
        var group = notes[i].getParent();
        var found = false;
        for (var j = 0; j < groups.length; j++) if (groups[j] === group) found = true;
        if (!found) groups.push(group);
    }
    return groups;
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
        message: "Prepare notes for a flat-curve VOCALOID tuning pass.",
        buttons: "OkCancel",
        widgets: [
            { name: "mode", type: "ComboBox", label: "Reset", choices: ["Pitch Deviation only", "Pitch Deviation + Auto Mode", "Auto Mode only"], default: 1 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;

    var mode = parseInt(r.answers.mode);
    var groups = collectGroups(notes);

    for (var g = 0; g < groups.length; g++) {
        var groupNotes = [];
        for (var n = 0; n < notes.length; n++) if (notes[n].getParent() === groups[g]) groupNotes.push(notes[n]);
        if (!groupNotes.length) continue;
        groupNotes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

        if (mode === 0 || mode === 1) {
            groups[g].getParameter("pitchDelta").remove(groupNotes[0].getOnset(), groupNotes[groupNotes.length - 1].getEnd());
        }

        if (mode === 1 || mode === 2) {
            for (var x = 0; x < groupNotes.length; x++) groupNotes[x].setPitchAutoMode(true);
        }
    }

    SV.finish();
}
