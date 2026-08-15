var SCRIPT_TITLE = "Scale Pitch Deviation";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Utilities",
        author: "eli_lab",
        versionNumber: 2,
        minEditorVersion: 65537
    };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function scaleRange(auto, begin, end, scale) {
    if (end <= begin) return;
    var points = auto.getPoints(begin, end);
    var hasBegin = false;
    var hasEnd = false;
    for (var i = 0; i < points.length; i++) {
        if (Math.abs(points[i][0] - begin) < 0.5) hasBegin = true;
        if (Math.abs(points[i][0] - end) < 0.5) hasEnd = true;
    }
    if (!hasBegin) points.unshift([begin, auto.get(begin)]);
    if (!hasEnd) points.push([end, auto.get(end)]);
    for (var p = 0; p < points.length; p++) auto.add(points[p][0], clamp(points[p][1] * scale, -1200, 1200));
}

function main() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    var r = SV.showCustomDialog({
        title: SV.T(SCRIPT_TITLE),
        message: "Multiply existing Pitch Deviation without changing the note pitches.",
        buttons: "OkCancel",
        widgets: [
            { name: "amount", type: "ComboBox", label: "Scale", choices: ["0%", "25%", "50%", "75%", "100%", "125%", "150%", "200%", "300%"], default: 4 },
            { name: "scope", type: "ComboBox", label: "Scope", choices: ["Selected note ranges", "Entire selected groups"], default: 0 }
        ]
    });
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
        if (scope === 1) {
            scaleRange(auto, group.getNote(0).getOnset(), group.getNote(group.getNumNotes() - 1).getEnd(), scale);
        } else {
            for (var n = 0; n < notes.length; n++) {
                if (notes[n].getParent() === group) scaleRange(auto, notes[n].getOnset(), notes[n].getEnd(), scale);
            }
        }
    }
    SV.finish();
}
