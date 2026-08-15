var SCRIPT_TITLE = "Quantize Selected Note Lengths";

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
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var r = SV.showCustomDialog({
        title: SV.T(SCRIPT_TITLE),
        message: "Quantize note durations while never crossing the next note onset.",
        buttons: "OkCancel",
        widgets: [
            { name: "unit", type: "ComboBox", label: "Length unit", choices: ["1/64", "1/32", "1/16", "1/8", "1/4"], default: 2 },
            { name: "round", type: "ComboBox", label: "Rounding", choices: ["Nearest", "Down", "Up"], default: 0 }
        ]
    });
    if (!r.status) return;

    var unit = [SV.QUARTER / 64, SV.QUARTER / 32, SV.QUARTER / 16, SV.QUARTER / 8, SV.QUARTER / 4][parseInt(r.answers.unit)];
    var mode = parseInt(r.answers.round);

    for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        var q = n.getDuration() / unit;
        var value = mode === 1 ? Math.floor(q) : mode === 2 ? Math.ceil(q) : Math.round(q);
        var duration = Math.max(unit, value * unit);

        var group = n.getParent();
        var index = n.getIndexInParent();
        var next = index + 1 < group.getNumNotes() ? group.getNote(index + 1) : null;
        if (next && next.getOnset() > n.getOnset()) duration = Math.min(duration, next.getOnset() - n.getOnset());
        n.setDuration(Math.max(SV.QUARTER / 64, duration));
    }

    SV.finish();
}
