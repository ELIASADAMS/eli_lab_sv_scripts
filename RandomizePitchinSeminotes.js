var SCRIPT_TITLE = "Randomize Pitch in Seminotes";

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
      ["Randomize Pitch in Key", "キー内でピッチをランダム化"],
      ["Please select notes.", "ノートを選択してください。"]
    ];
  }
  if (langCode == "zh-cn") {
    return [
      ["Randomize Pitch in Key", "在调内随机化音高"],
      ["Please select notes.", "请选择音符。"]
    ];
  }
  return [];
}

function isInScale(pitch, keyIndex) {
  var majorScale = [0, 2, 4, 5, 7, 9, 11];
  var scaleDegree = (pitch % 12 + 12) % 12;
  var keyRoot = keyIndex % 12;

  for (var i = 0; i < majorScale.length; i++) {
    if (scaleDegree === (majorScale[i] + keyRoot) % 12) {
      return true;
    }
  }
  return false;
}

function getRandomScaleNote(basePitch, keyIndex, halfOctave) {
  var notes = [];
  var baseOctave = Math.floor(basePitch / 12);

  // Half octave range (±6 semitones)
  for (var oct = baseOctave - 1; oct <= baseOctave; oct++) {
    var majorScale = [0, 2, 4, 5, 7, 9, 11];
    var keyRoot = keyIndex % 12;

    for (var i = 0; i < majorScale.length; i++) {
      var notePitch = oct * 12 + (majorScale[i] + keyRoot) % 12;

      // Only include notes within half octave range of base pitch
      if (Math.abs(notePitch - basePitch) <= halfOctave) {
        notes.push(notePitch);
      }
    }
  }

  return notes[Math.floor(Math.random() * notes.length)];
}

function main() {
  var form = {
    "title": SV.T(SCRIPT_TITLE),
    "message": "Randomize selected notes pitch within key (half octave range)",
    "buttons": "OkCancel",
    "widgets": [
      {
        "name": "key",
        "type": "ComboBox",
        "label": "Key",
        "choices": ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        "default": 0
      },
      {
        "name": "halfOctave",
        "type": "ComboBox",
        "label": "Half octave randomization",
        "choices": ["3 semitones", "4 semitones", "5 semitones", "6 semitones"],
        "default": 0
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

  var keyIndex = parseInt(results.answers.key);
  var halfOctaveSemitones = [3, 4, 5, 6][parseInt(results.answers.halfOctave)];

  for (var i = 0; i < selectedNotes.length; i++) {
    var note = selectedNotes[i];
    var newPitch = getRandomScaleNote(note.getPitch(), keyIndex, halfOctaveSemitones);
    note.setPitch(newPitch);
  }

  SV.finish();
}
