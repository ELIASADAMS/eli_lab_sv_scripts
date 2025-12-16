var SCRIPT_TITLE = "Split Note by Characters";

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
      ["Split Note by Characters", "ノートを文字数で分割"],
      ["Please select one note.", "1つのノートを選択してください。"],
      ["Split into how many characters?", "何文字に分割しますか？"]
    ];
  }
  return [];
}

function isYouon(char) {
  const youon = ['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', 'ゅ', 'ょ'];
  return youon.indexOf(char) !== -1;
}

function splitLyricIntoParts(lyric, numParts) {
  var parts = [];
  var currentPart = "";

  for (var i = 0; i < lyric.length; i++) {
    currentPart += lyric.charAt(i);

    // Smart mora detection for Japanese
    if (isYouon(lyric.charAt(i)) || lyric.charAt(i) === "'") {
      continue; // Keep combining with previous mora
    }

    parts.push(currentPart);
    currentPart = "";

    if (parts.length >= numParts) break;
  }

  // Handle remainder
  if (currentPart !== "") {
    parts.push(currentPart);
  }

  // Pad or truncate to exact number
  while (parts.length < numParts) {
    parts.push("-");
  }
  if (parts.length > numParts) {
    parts = parts.slice(0, numParts);
  }

  return parts;
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
  var fullDuration = note.getDuration();

  if (fullDuration < SV.QUARTER / 8) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), "Note too short.");
    return;
  }

  var form = {
    "title": SV.T(SCRIPT_TITLE),
    "message": SV.T("Split into how many characters?"),
    "buttons": "OkCancel",
    "widgets": [
      {
        "name": "numChars",
        "type": "TextBox",
        "label": "Number of characters",
        "default": "12"
      }
    ]
  };

  var results = SV.showCustomDialog(form);
  if (!results.status) return;

  var numParts = parseInt(results.answers.numChars);
  if (isNaN(numParts) || numParts < 2 || numParts > 50) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), "Enter number 2-50.");
    return;
  }

  var lyric = note.getLyrics();
  var parts = splitLyricIntoParts(lyric, numParts);
  var partDuration = Math.round(fullDuration / numParts);

  // Keep first part in original note
  note.setDuration(partDuration);
  note.setLyrics(parts[0]);

  // Create remaining parts
  var currentOnset = note.getEnd();
  for (var i = 1; i < parts.length; i++) {
    var splitted = SV.create("Note");
    splitted.setPitch(note.getPitch());
    splitted.setTimeRange(currentOnset, partDuration);
    splitted.setLyrics(parts[i]);
    group.addNote(splitted);
    selection.selectNote(splitted);
    currentOnset += partDuration;
  }

  SV.finish();
}
