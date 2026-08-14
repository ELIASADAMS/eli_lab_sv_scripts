var SCRIPT_TITLE = "Pitch Baker - Vibrato Engine";

function getClientInfo() {
  return {
    name: SV.T(SCRIPT_TITLE),
    category: "eli_lab - Pitch Baker",
    author: "eli_lab",
    versionNumber: 2,
    minEditorVersion: 65537
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function choose(a) { return a[Math.floor(Math.random() * a.length)]; }

function main() {
  var form = {
    title: SV.T(SCRIPT_TITLE),
    message: "Sparse vibrato: preserve the existing pitch contour and add only a gentle modulation layer",
    buttons: "OkCancel",
    widgets: [
      { name: "depth", type: "ComboBox", label: "Depth", choices: ["Tiny", "Light", "Medium", "Deep"], default: 1 },
      { name: "cycles", type: "ComboBox", label: "Cycles", choices: ["1", "2", "3", "4"], default: 1 },
      { name: "onset", type: "ComboBox", label: "Onset", choices: ["Early", "Normal", "Late"], default: 1 },
      { name: "shape", type: "ComboBox", label: "Shape", choices: ["Smooth", "Asymmetric", "Broken"], default: 1 },
      { name: "density", type: "ComboBox", label: "Control points", choices: ["Sparse", "Normal"], default: 0 }
    ]
  };

  var results = SV.showCustomDialog(form);
  if (!results.status) return;

  var notes = SV.getMainEditor().getSelection().getSelectedNotes();
  if (notes.length === 0) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
    return;
  }

  var depths = [3, 5, 8, 12];
  var cycleOptions = [1, 2, 3, 4];
  var onsetOptions = [0.16, 0.32, 0.48];
  var depth = depths[parseInt(results.answers.depth)];
  var cycles = cycleOptions[parseInt(results.answers.cycles)];
  var onset = onsetOptions[parseInt(results.answers.onset)];
  var shape = parseInt(results.answers.shape);
  var sparse = parseInt(results.answers.density) === 0;

  for (var n = 0; n < notes.length; n++) {
    var note = notes[n];
    var auto = note.getParent().getParameter("pitchDelta");
    var start = note.getOnset();
    var end = note.getEnd();
    var duration = end - start;

    // Very short notes should not receive vibrato at all.
    if (duration < SV.QUARTER * 0.75) continue;

    var vibratoStart = start + duration * onset;
    var vibratoDuration = end - vibratoStart;
    if (vibratoDuration < SV.QUARTER * 0.5) continue;

    // Deliberately sparse: this is an expressive overlay, not a replacement
    // for SynthV's dense pitch generation.
    var pointCount = sparse ? Math.max(5, cycles * 2 + 1) : Math.max(7, cycles * 3 + 1);
    var phase = rand(-0.7, 0.7);
    var previous = 0;

    for (var i = 0; i <= pointCount; i++) {
      var x = i / pointCount;
      var t = vibratoStart + x * vibratoDuration;
      var waveX = x * cycles * Math.PI * 2 + phase;
      var value;

      if (shape === 0) {
        value = Math.sin(waveX) * depth;
      } else if (shape === 1) {
        var positive = Math.sin(waveX);
        var negative = Math.sin(waveX + 0.35);
        value = positive * depth * 0.78 + negative * depth * 0.22;
        value += Math.sin(waveX * 0.5) * depth * 0.08;
      } else {
        value = Math.sin(waveX) * depth;
        value += rand(-depth * 0.18, depth * 0.18);
      }

      // Gentle attack and tail. The center of the note remains untouched.
      var attack = Math.min(1, x / 0.22);
      var tail = 1 - Math.max(0, x - 0.82) * 0.7;
      value *= attack * tail;

      // Keep adjacent points from becoming destructive jumps.
      value = previous * 0.25 + value * 0.75;
      previous = value;

      auto.add(Math.round(t), clamp(value, -1200, 1200));
    }
  }

  SV.finish();
}
