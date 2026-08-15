var SCRIPT_TITLE = "Scale Pitch Deviation";

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

    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Multiply existing Pitch Deviation without changing the note pitches.",
        buttons: "OkCancel",
        widgets: [
            { name: "amount", type: "ComboBox", label: "Scale", choices: ["0%", "25%", "50%", "75%", "100%", "125%", "150%", "200%", "300%"], default: 4 },
            { name: "scope", type: "ComboBox", label: "Scope", choices: ["Selected note ranges", "Entire selected groups"], default: 0 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;

    var scale = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3][parseInt(r.answers.amount)];
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
            var allStart = group.getNote(0).getOnset();
            var allEnd = group.getNote(group.getNumNotes() - 1).getEnd();
            ranges.push([allStart, allEnd]);
        } else {
            for (var n = 0; n < notes.length; n++) {
                if (notes[n].getParent() === group) ranges.push([notes[n].getOnset(), notes[n].getEnd()]);
            }
        }

        for (var ri = 0; ri < ranges.length; ri++) {
            var begin = ranges[ri][0], end = ranges[ri][1];
            var points = auto.getPoints(begin, end);
            for (var p = 0; p < points.length; p++) {
                auto.add(points[p][0], clamp(points[p][1] * scale, -1200, 1200));
            }
        }
    }

    SV.finish();
}
