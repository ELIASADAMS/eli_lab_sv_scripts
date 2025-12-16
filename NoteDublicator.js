var SCRIPT_TITLE = "Note Duplicator";

function getClientInfo() {
    return {
        "name": SV.T(SCRIPT_TITLE),
        "category": "eli_lab - Music Creation",
        "author": "eli_lab",
        "versionNumber": 1,
        "minEditorVersion": 65537
    }
}

function getTranslations(langCode) {
    if (langCode == "ja-jp") {
        return [
            ["Note Duplicator", "ノートを複製"],
            ["Please select notes.", "ノートを選択してください。"]
        ];
    }
    if (langCode == "zh-cn") {
        return [
            ["Note Duplicator", "音符复制器"],
            ["Please select notes.", "请选择音符。"]
        ];
    }
    return [];
}

function main() {
    var form = {
        "title": SV.T(SCRIPT_TITLE),
        "message": "Duplicate selected notes with variation",
        "buttons": "OkCancel",
        "widgets": [
            {
                "name": "copies",
                "type": "ComboBox",
                "label": "Number of copies",
                "choices": ["3", "5", "7", "9"],
                "default": 1
            },
            {
                "name": "pitchVar",
                "type": "ComboBox",
                "label": "Pitch variation",
                "choices": ["None", "±3 semitones", "±7 semitones", "±12 semitones"],
                "default": 1
            },
            {
                "name": "durationVar",
                "type": "ComboBox",
                "label": "Duration variation",
                "choices": ["None", "±20%", "±50%", "±80%"],
                "default": 1
            },
            {
                "name": "spacing",
                "type": "ComboBox",
                "label": "Spacing",
                "choices": ["Tight", "Normal", "Wide"],
                "default": 1
            }
        ]
    };

    var results = SV.showCustomDialog(form);
    if (!results.status) return;

    var selection = SV.getMainEditor().getSelection();
    var selectedNotes = selection.getSelectedNotes();

    if (selectedNotes.length === 0) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    var scope = SV.getMainEditor().getCurrentGroup();
    var group = scope.getTarget();

    var numCopies = [3, 5, 7, 9][parseInt(results.answers.copies)];
    var pitchVar = [0, 3, 7, 12][parseInt(results.answers.pitchVar)];
    var durationVar = [0, 0.2, 0.5, 0.8][parseInt(results.answers.durationVar)];
    var spacing = [SV.QUARTER / 8, SV.QUARTER / 4, SV.QUARTER / 2][parseInt(results.answers.spacing)];

    // Process each selected note
    for (var n = 0; n < selectedNotes.length; n++) {
        var originalNote = selectedNotes[n];
        var originalOnset = originalNote.getOnset();
        var originalDuration = originalNote.getDuration();
        var originalPitch = originalNote.getPitch();
        var originalLyric = originalNote.getLyrics();

        // Create copies sequentially
        var currentOnset = originalOnset + spacing;

        for (var i = 0; i < numCopies; i++) {
            var newNote = SV.create("Note");

            // Copy basic properties
            newNote.setPitch(originalPitch);
            newNote.setLyrics(originalLyric);

            // Pitch variation
            if (pitchVar > 0) {
                var pitchOffset = Math.floor(Math.random() * (pitchVar * 2 + 1)) - pitchVar;
                newNote.setPitch(originalPitch + pitchOffset);
            }

            // Duration variation
            if (durationVar > 0) {
                var durationFactor = 1 + (Math.random() * 2 - 1) * durationVar;
                var newDuration = originalDuration * durationFactor;
                newNote.setDuration(newDuration);
            } else {
                newNote.setDuration(originalDuration);
            }

            // Position with spacing
            newNote.setTimeRange(currentOnset, newNote.getDuration());
            group.addNote(newNote);

            currentOnset += newNote.getDuration() + spacing;
        }
    }

    SV.finish();
}
