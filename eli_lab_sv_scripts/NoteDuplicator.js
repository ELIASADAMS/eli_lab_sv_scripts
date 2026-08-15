var SCRIPT_TITLE = "Note Duplicator";

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
        message: "Duplicate selected notes with controlled pitch and duration variation.",
        buttons: "OkCancel",
        widgets: [
            { name: "copies", type: "ComboBox", label: "Number of copies", choices: ["3", "5", "7", "9"], default: 1 },
            { name: "pitchVar", type: "ComboBox", label: "Pitch variation", choices: ["None", "±3 semitones", "±7 semitones", "±12 semitones"], default: 1 },
            { name: "durationVar", type: "ComboBox", label: "Duration variation", choices: ["None", "±20%", "±50%", "±80%"], default: 1 },
            { name: "spacing", type: "ComboBox", label: "Spacing", choices: ["Tight", "Normal", "Wide"], default: 1 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    var copies = [3,5,7,9][parseInt(r.answers.copies)];
    var pitchVar = [0,3,7,12][parseInt(r.answers.pitchVar)];
    var durationVar = [0,0.2,0.5,0.8][parseInt(r.answers.durationVar)];
    var spacing = [SV.QUARTER/8, SV.QUARTER/4, SV.QUARTER/2][parseInt(r.answers.spacing)];

    for (var n = 0; n < notes.length; n++) {
        var original = notes[n];
        var group = original.getParent();
        var onset = original.getEnd() + spacing;
        for (var i = 0; i < copies; i++) {
            var clone = original.clone ? original.clone() : SV.create("Note");
            var pitch = original.getPitch();
            if (pitchVar) pitch += Math.floor(Math.random() * (pitchVar * 2 + 1)) - pitchVar;
            var factor = durationVar ? 1 + (Math.random() * 2 - 1) * durationVar : 1;
            var duration = Math.max(SV.QUARTER / 32, original.getDuration() * factor);
            clone.setPitch(pitch);
            clone.setTimeRange(onset, duration);
            group.addNote(clone);
            onset += duration + spacing;
        }
    }
    SV.finish();
}
