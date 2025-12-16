var SCRIPT_TITLE = "Randomize Note Lengths";

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
            ["Randomize Note Lengths", "ノート長をランダム化"],
            ["Please select notes.", "ノートを選択してください。"]
        ];
    }
    if (langCode == "zh-cn") {
        return [
            ["Randomize Note Lengths", "随机化音符长度"],
            ["Please select notes.", "请选择音符。"]
        ];
    }
    return [];
}

function main() {
    var form = {
        "title": SV.T(SCRIPT_TITLE),
        "message": "Randomize note lengths (no overlaps, quantized)",
        "buttons": "OkCancel",
        "widgets": [
            {
                "name": "minPercent",
                "type": "ComboBox",
                "label": "Min length (%)",
                "choices": ["20%", "40%", "50%", "60%", "70%", "80%"],
                "default": 2
            },
            {
                "name": "maxPercent",
                "type": "ComboBox",
                "label": "Max length (%)",
                "choices": ["90%", "100%", "110%", "120%", "150%", "200%"],
                "default": 1
            },
            {
                "name": "quantize",
                "type": "ComboBox",
                "label": "Quantize to",
                "choices": ["1/16", "1/8", "1/4", "1/2"],
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

    var minPct = [0.2, 0.4, 0.5, 0.6, 0.7, 0.8][parseInt(results.answers.minPercent)];
    var maxPct = [0.9, 1.0, 1.1, 1.2, 1.5, 2][parseInt(results.answers.maxPercent)];
    var quantizeDiv = [1 / 16, 1 / 8, 1 / 4, 1 / 2][parseInt(results.answers.quantize)];
    var quantizeUnit = SV.QUARTER * quantizeDiv;

    // Sort notes by onset
    selectedNotes.sort(function (a, b) { return a.getOnset() - b.getOnset(); });

    for (var i = 0; i < selectedNotes.length; i++) {
        var note = selectedNotes[i];
        var originalDuration = note.getDuration();

        // Random factor within range
        var randFactor = minPct + Math.random() * (maxPct - minPct);
        var targetDuration = originalDuration * randFactor;

        // Quantize duration
        var quantizedDuration = Math.round(targetDuration / quantizeUnit) * quantizeUnit;

        // Enforce minimum duration
        if (quantizedDuration < quantizeUnit / 4) {
            quantizedDuration = quantizeUnit / 4;
        }

        note.setDuration(quantizedDuration);
    }

    SV.finish();
}
