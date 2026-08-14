var SCRIPT_TITLE = "Bake SynthV Pitch";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Utilities",
        author: "eli_lab",
        versionNumber: 1,
        minEditorVersion: 0x020101
    };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function findNote(notes, t) {
    for (var i = 0; i < notes.length; i++) {
        if (t >= notes[i].getOnset() && t <= notes[i].getEnd()) return notes[i];
    }
    for (var j = 0; j < notes.length; j++) {
        if (notes[j].getOnset() > t) return j > 0 ? notes[j - 1] : notes[j];
    }
    return notes[notes.length - 1];
}

function clearPitchDelta(group, start, end) {
    group.getParameter("pitchDelta").remove(start, end);
}

function removePitchControls(group) {
    if (!group.getNumPitchControls) return;
    for (var i = group.getNumPitchControls() - 1; i >= 0; i--) group.removePitchControl(i);
}

function capture(groupRef, group, notes, startLocal, endLocal, interval, retries, includeExisting, removeControls) {
    var offset = groupRef.getTimeOffset ? groupRef.getTimeOffset() : 0;
    var startAbsolute = startLocal + offset;
    var frames = Math.max(2, Math.ceil((endLocal - startLocal) / interval) + 1);
    var values = SV.getComputedPitchForGroup(groupRef, startAbsolute, interval, frames);

    if (!values || values.length < 2) {
        if (retries < 12) {
            SV.setTimeout(180, function() {
                capture(groupRef, group, notes, startLocal, endLocal, interval, retries + 1, includeExisting, removeControls);
            });
            return;
        }
        SV.showMessageBox(SV.T(SCRIPT_TITLE), "SynthV pitch data is not ready. Try again after playback or a moment of processing.");
        SV.finish();
        return;
    }

    // Capture first. Only after capture do we remove the source automation,
    // preventing the newly baked pitch from being counted twice.
    clearPitchDelta(group, startLocal, endLocal);
    if (removeControls) removePitchControls(group);

    var auto = group.getParameter("pitchDelta");
    for (var i = 0; i < values.length; i++) {
        var absolute = startAbsolute + i * interval;
        var local = absolute - offset;
        if (local < startLocal || local > endLocal) continue;
        var note = findNote(notes, local);
        if (!note) continue;
        var basePitch = note.getPitch() + (note.getDetune ? note.getDetune() / 100.0 : 0);
        var cents = (values[i] - basePitch) * 100.0;
        auto.add(Math.round(local), clamp(cents, -1200, 1200));
    }

    SV.showMessageBox(SV.T(SCRIPT_TITLE), "Baked " + values.length + " computed SynthV pitch samples into Pitch Deviation.");
    SV.finish();
}

function main() {
    var editor = SV.getMainEditor();
    var selection = editor.getSelection();
    var notes = selection.getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    notes.sort(function(a,b){ return a.getOnset() - b.getOnset(); });
    var groupRef = editor.getCurrentGroup();
    var group = groupRef.getTarget();
    if (!group) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), "Open a note group before baking.");
        return;
    }

    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Capture SynthV's computed pitch, then freeze it as editable Pitch Deviation.",
        buttons: "OkCancel",
        widgets: [
            { name: "source", type: "ComboBox", label: "Source", choices: ["Current generated pitch", "Current pitch including Pitch Deviation"], default: 0 },
            { name: "resolution", type: "ComboBox", label: "Resolution", choices: ["1/32", "1/24", "1/16", "1/12"], default: 2 },
            { name: "controls", type: "ComboBox", label: "After baking", choices: ["Keep pitch controls", "Remove pitch controls"], default: 1 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;

    var interval = [SV.QUARTER / 32, SV.QUARTER / 24, SV.QUARTER / 16, SV.QUARTER / 12][parseInt(r.answers.resolution)];
    var includeExisting = parseInt(r.answers.source) === 1;
    var removeControlsAfter = parseInt(r.answers.controls) === 1;
    var start = notes[0].getOnset();
    var end = notes[notes.length - 1].getEnd();

    // To capture clean generated pitch, clear Pitch Deviation before the async
    // computation. If the user explicitly wants the current result, capture it
    // first and clear only after sampling.
    if (!includeExisting) clearPitchDelta(group, start, end);

    SV.setTimeout(250, function() {
        capture(groupRef, group, notes, start, end, interval, 0, includeExisting, removeControlsAfter);
    });
}
