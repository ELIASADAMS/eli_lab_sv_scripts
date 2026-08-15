var SCRIPT_TITLE = "Randomize Note Lengths";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - Music Creation",
        author: "eli_lab",
        versionNumber: 3,
        minEditorVersion: 65537
    };
}

function main() {
    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Randomize note lengths while respecting the next note boundary in each NoteGroup.",
        buttons: "OkCancel",
        widgets: [
            { name: "minPercent", type: "ComboBox", label: "Min length (%)", choices: ["20%","40%","50%","60%","70%","80%"], default: 2 },
            { name: "maxPercent", type: "ComboBox", label: "Max length (%)", choices: ["90%","100%","110%","120%","150%","200%"], default: 1 },
            { name: "quantize", type: "ComboBox", label: "Quantize to", choices: ["1/16","1/8","1/4","1/2"], default: 1 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var minPct = [0.2,0.4,0.5,0.6,0.7,0.8][parseInt(r.answers.minPercent)];
    var maxPct = [0.9,1.0,1.1,1.2,1.5,2.0][parseInt(r.answers.maxPercent)];
    if (maxPct < minPct) { var swap = minPct; minPct = maxPct; maxPct = swap; }
    var unit = [SV.QUARTER/16,SV.QUARTER/8,SV.QUARTER/4,SV.QUARTER/2][parseInt(r.answers.quantize)];

    for (var n = 0; n < notes.length; n++) {
        var note = notes[n];
        var factor = minPct + Math.random() * (maxPct - minPct);
        var target = Math.max(SV.QUARTER / 64, Math.round((note.getDuration() * factor) / unit) * unit);
        var group = note.getParent();
        var index = note.getIndexInParent();
        var next = index + 1 < group.getNumNotes() ? group.getNote(index + 1) : null;

        if (next && next.getOnset() > note.getOnset()) {
            target = Math.min(target, next.getOnset() - note.getOnset());
        }
        note.setDuration(Math.max(SV.QUARTER / 64, target));
    }

    SV.finish();
}
