var SCRIPT_TITLE = "Pitch Baker - Vibrato Engine";

function getClientInfo() {
  return {
    name: SV.T(SCRIPT_TITLE),
    category: "eli_lab - Pitch Baker",
    author: "eli_lab",
    versionNumber: 1,
    minEditorVersion: 65537
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

function main() {
  var form = {
    title: SV.T(SCRIPT_TITLE),
    message: "Irregular, asymmetric vibrato made from decimated control points",
    buttons: "OkCancel",
    widgets: [
      { name: "depth", type: "ComboBox", label: "Depth", choices: ["Tiny", "Light", "Medium", "Deep", "Broken"], default: 2 },
      { name: "rate", type: "ComboBox", label: "Rate", choices: ["Slow", "Medium", "Fast", "Unstable"], default: 1 },
      { name: "onset", type: "ComboBox", label: "Onset", choices: ["Early", "Normal", "Late"], default: 1 },
      { name: "irregularity", type: "ComboBox", label: "Irregularity", choices: ["Low", "Medium", "High", "Extreme"], default: 2 }
    ]
  };

  var results = SV.showCustomDialog(form);
  if (!results.status) return;

  var notes = SV.getMainEditor().getSelection().getSelectedNotes();
  if (notes.length === 0) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
    return;
  }

  var depths = [5, 9, 16, 25, 38];
  var rates = [5.0, 6.5, 8.0, 9.5];
  var onset = [0.12, 0.28, 0.48];
  var irregularity = [0.08, 0.22, 0.4, 0.65];
  var depth = depths[parseInt(results.answers.depth)];
  var rate = rates[parseInt(results.answers.rate)];
  var onsetRatio = onset[parseInt(results.answers.onset)];
  var chaos = irregularity[parseInt(results.answers.irregularity)];

  for (var n = 0; n < notes.length; n++) {
    var note = notes[n];
    var auto = note.getParent().getParameter("pitchDelta");
    var start = note.getOnset();
    var end = note.getEnd();
    var duration = end - start;
    var startTime = start + duration * onsetRatio;
    var vibratoDuration = end - startTime;
    if (vibratoDuration <= 0) continue;

    // Convert cycles/second into a period in SynthV's tick-like time units.
    // 480 ticks/quarter and BPM are not required here: use a musical-ish period
    // relative to note duration, then perturb it to avoid machine-perfect LFOs.
    var cycles = Math.max(1, Math.round((duration / 480.0) * rate));
    var points = Math.max(4, cycles * 2 + 1);
    var phase = rand(0, Math.PI * 2);

    for (var i = 0; i <= points; i++) {
      var x = i / points;
      var t = startTime + x * vibratoDuration;
      var localPhase = phase + x * cycles * Math.PI * 2;
      var wobble = Math.sin(localPhase);
      var wobble2 = Math.sin(localPhase * 0.47 + rand(-chaos, chaos));
      var value = depth * (wobble * (1 - chaos * 0.45) + wobble2 * chaos * 0.35);

      // Asymmetric attack/decay: vibrato grows in and becomes slightly less stable.
      var envelope = Math.min(1, x / 0.18);
      var tail = 1 - Math.max(0, x - 0.8) * 0.5;
      value *= envelope * tail;
      value += rand(-depth * chaos, depth * chaos);

      auto.add(Math.round(t), clamp(value, -1200, 1200));
    }
  }

  SV.finish();
}
