function getClientInfo() {
  return {
    "name": SV.T("Replace + with - in Lyrics"),
    "category": "eli_lab - Basic",
    "author": "eli_lab",
    "versionNumber": 1,
    "minEditorVersion": 65537
  };
}

function getTranslations(langCode) {
  if (langCode == "ja-jp") {
    return [
      ["Replace + with - in Lyrics", "歌詞の+を-に置き換え"]
    ];
  }
  if (langCode == "zh-cn") {
    return [
      ["Replace + with - in Lyrics", "将歌词中的+替换为-"]
    ];
  }
  return [];
}

function main() {
  // Get the current selection, scope (group reference) and its target group.
  var selection = SV.getMainEditor().getSelection();
  var selectedNotes = selection.getSelectedNotes();
  var scope = SV.getMainEditor().getCurrentGroup();
  var group = scope.getTarget();

  var changesCount = 0;

  for (var i = 0; i < selectedNotes.length; i++) {
    var note = selectedNotes[i];
    var originalLyric = note.getLyrics();

    // Skip notes without lyrics or without +
    if (originalLyric === "" || originalLyric.indexOf("+") === -1)
      continue;

    // Replace all + with - in the lyrics
    var newLyric = originalLyric.replace(/\+/g, "-");
    note.setLyrics(newLyric);
    changesCount++;
  }

  SV.finish();
}
