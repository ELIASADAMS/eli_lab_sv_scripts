var SCRIPT_TITLE = "Split Note into N Pieces";

function getClientInfo() {
  return {
    "name": SV.T(SCRIPT_TITLE),
    "category": "eli_lab - Basic",
    "author": "eli_lab",
    "versionNumber": 1,
    "minEditorVersion": 65537
  }
}

function getTranslations(langCode) {
  if (langCode == "ja-jp") {
    return [
      ["Split Note into N Pieces", "ノートをN等分に分割"],
      ["Please select one note.", "1つのノートを選択してください。"],
      ["Enter number between 2-100.", "2-100の数を入力してください。"]
    ];
  }
  if (langCode == "zh-cn") {
    return [
      ["Split Note into N Pieces", "将音符分割为N份"],
      ["Please select one note.", "请选择一个音符。"],
      ["Enter number between 2-100.", "输入2-100之间的数字。"]
    ];
  }
  return [];
}

function main() {
  var selection = SV.getMainEditor().getSelection();
  var selectedNotes = selection.getSelectedNotes();
  var scope = SV.getMainEditor().getCurrentGroup();
  var group = scope.getTarget();

  if (selectedNotes.length !== 1) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select one note."));
    return;
  }

  var note = selectedNotes[0];
  var originalOnset = note.getOnset();
  var originalEnd = note.getEnd();
  var fullDuration = note.getDuration();

  if (fullDuration < SV.QUARTER / 16) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), "Note too short.");
    return;
  }

  var form = {
    "title": SV.T(SCRIPT_TITLE),
    "message": "How many equal pieces?",
    "buttons": "OkCancel",
    "widgets": [
      {
        "name": "pieces",
        "type": "TextBox",
        "label": "Number of pieces",
        "default": "7"
      }
    ]
  };

  var results = SV.showCustomDialog(form);
  if (!results.status) return;

  var pieces = parseInt(results.answers.pieces, 10);
  if (isNaN(pieces) || pieces < 2 || pieces > 100) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Enter number between 2-100."));
    return;
  }

  var pieceDuration = Math.round(fullDuration / pieces);

  // Keep first piece, create rest
  note.setDuration(pieceDuration);
  note.setLyrics(note.getLyrics());

  var currentEnd = note.getEnd();
  for (var i = 1; i < pieces; i++) {
    var splitted = SV.create("Note");
    splitted.setPitch(note.getPitch());
    splitted.setTimeRange(currentEnd, pieceDuration);
    splitted.setLyrics(note.getLyrics());
    group.addNote(splitted);
    selection.selectNote(splitted);
    currentEnd += pieceDuration;
  }

  SV.finish();
}
