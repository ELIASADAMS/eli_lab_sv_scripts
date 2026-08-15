var SCRIPT_TITLE = "Offset Pitch Deviation";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Utilities",
        author: "eli_lab",
        versionNumber: 1,
        minEditorVersion: 65537
    };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function main() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    var r = SV.showCustomDialog({
        title: SV.T(SCRIPT_TITLE),
        message: "Add or subtract a constant amount from existing Pitch Deviation.",
        buttons: "OkCancel",
        widgets: [
            { name: "amount", type: "TextBox", label: "Offset (cents)", default: "10" },
            { name: "scope", type: "ComboBox", label: "Scope", choices: ["Selected note ranges", "Entire selected groups"], default: 0 }
        ]
    });
    if (!r.status) return;

    var amount = parseFloat(r.answers.amount);
    if (isNaN(amount)) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Enter a numeric cent value."));
        return;
    }

    var scope = parseInt(r.answers.scope);
    var groups = [];
    for (var i = 0; i < notes.length; i++) {
        var g = notes[i].getParent();
        if (groups.indexOf(g) < 0) groups.push(g);
    }

    for (var gi = 0; gi < groups.length; gi++) {
        var group = groups[gi];
        var auto = group.getParameter("pitchDelta");
        var ranges = [];
        if (scope === 1) {
            ranges.push([group.getNote(0).getOnset(), group.getNote(group.getNumNotes() - 1).getEnd()]);
        } else {
            for (var n = 0; n < notes.length; n++) {
                if (notes[n].getParent() === group) ranges.push([notes[n].getOnset(), notes[n].getEnd()]);
            }
        }
        for (var ri = 0; ri < ranges.length; ri++) {
            var points = auto.getPoints(ranges[ri][0], ranges[ri][1]);
            for (var p = 0; p < points.length; p++) auto.add(points[p][0], clamp(points[p][1] + amount, -1200, 1200));
        }
    }

    SV.finish();
}
