var SCRIPT_TITLE = "Split Note into N Pieces";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - Basic",
        author: "eli_lab",
        versionNumber: 2,
        minEditorVersion: 67840
    };
}

function getTranslations(langCode) {
    if (langCode == "ja-jp") return [["Split Note into N Pieces", "ノートをN等分に分割"], ["Please select one note.", "1つのノートを選択してください。"], ["Enter number between 2-100.", "2-100の数を入力してください。"]];
    if (langCode == "zh-cn") return [["Split Note into N Pieces", "将音符分割为N份"], ["Please select one note.", "请选择一个音符。"], ["Enter number between 2-100.", "输入2-100之间的数字。"]];
    return [];
}

function main() {
    var selection = SV.getMainEditor().getSelection();
    var selectedNotes = selection.getSelectedNotes();
    if (selectedNotes.length !== 1) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select one note."));
        return;
    }

    var note = selectedNotes[0];
    var group = note.getParent();
    var originalOnset = note.getOnset();
    var fullDuration = note.getDuration();

    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Split the note into equal pieces while preserving the exact total duration.",
        buttons: "OkCancel",
        widgets: [{ name: "pieces", type: "TextBox", label: "Number of pieces", default: "7" }]
    };
    var results = SV.showCustomDialog(form);
    if (!results.status) return;

    var pieces = parseInt(results.answers.pieces, 10);
    if (isNaN(pieces) || pieces < 2 || pieces > 100) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Enter number between 2-100."));
        return;
    }

    var baseDuration = Math.floor(fullDuration / pieces);
    if (baseDuration < SV.QUARTER / 64) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Note is too short for that many pieces."));
        return;
    }

    note.setDuration(baseDuration);
    var current = originalOnset + baseDuration;

    for (var i = 1; i < pieces; i++) {
        var clone = note.clone ? note.clone() : SV.create("Note");
        var remainingPieces = pieces - i;
        var remaining = (originalOnset + fullDuration) - current;
        var duration = i === pieces - 1 ? remaining : Math.floor(remaining / remainingPieces);
        clone.setTimeRange(current, duration);
        group.addNote(clone);
        selection.selectNote(clone);
        current += duration;
    }

    SV.finish();
}
