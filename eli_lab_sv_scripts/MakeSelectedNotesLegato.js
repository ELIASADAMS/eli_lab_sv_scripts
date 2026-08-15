var SCRIPT_TITLE = "Make Selected Notes Legato";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - Music Creation",
        author: "eli_lab",
        versionNumber: 1,
        minEditorVersion: 65537
    };
}

function main() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (notes.length < 2) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Select at least two notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var r = SV.showCustomDialog({
        title: SV.T(SCRIPT_TITLE),
        message: "Close gaps between selected notes without moving their onsets.",
        buttons: "OkCancel",
        widgets: [
            { name: "mode", type: "ComboBox", label: "Boundary", choices: ["End at next onset", "Leave 1/64 gap", "Leave 1/32 gap"], default: 0 }
        ]
    });
    if (!r.status) return;

    var gap = [0, SV.QUARTER / 64, SV.QUARTER / 32][parseInt(r.answers.mode)];
    for (var i = 0; i < notes.length - 1; i++) {
        var left = notes[i];
        var right = notes[i + 1];
        if (left.getParent() !== right.getParent()) continue;
        var targetEnd = Math.max(left.getOnset() + SV.QUARTER / 64, right.getOnset() - gap);
        left.setDuration(Math.max(SV.QUARTER / 64, targetEnd - left.getOnset()));
    }

    SV.finish();
}
