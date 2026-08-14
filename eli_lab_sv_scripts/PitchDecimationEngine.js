var SCRIPT_TITLE = "Pitch Baker - Decimation Engine";

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
    message: "Turn smooth pitch movement into sparse, uneven control-point shapes",
    buttons: "OkCancel",
    widgets: [
      { name: "density", type: "ComboBox", label: "Point density", choices: ["Very Sparse", "Sparse", "Normal", "Dense"], default: 1 },
      { name: "damage", type: "ComboBox", label: "Damage", choices: ["Low", "Medium", "High", "Extreme"], default: 1 },
      { name: "micro", type: "ComboBox", label: "Micro deviation", choices: ["None", "Tiny", "Medium", "Large"], default: 1 }
    ]
  };

  var results = SV.showCustomDialog(form);
  if (!results.status) return;

  var notes = SV.getMainEditor().getSelection().getSelectedNotes();
  if (notes.length === 0) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
    return;
  }

  var densityValues = [0.18, 0.3, 0.48, 0.7];
  var damageValues = [0.15, 0.35, 0.65, 1.0];
  var microValues = [0, 3, 8, 16];
  var density = densityValues[parseInt(results.answers.density)];
  var damage = damageValues[parseInt(results.answers.damage)];
  var micro = microValues[parseInt(results.answers.micro)];

  for (var n = 0; n < notes.length; n++) {
    var note = notes[n];
    var auto = note.getParent().getParameter("pitchDelta");
    var start = note.getOnset();
    var end = note.getEnd();
    var duration = end - start;
    if (duration <= 0) continue;

    // Preserve the existing automation shape by sampling it, then replace it
    // with a smaller number of intentionally irregular points.
    var sampleCount = Math.max(6, Math.round(duration / SV.QUARTER * 12));
    var samples = [];
    for (var i = 0; i <= sampleCount; i++) {
      var x = i / sampleCount;
      var t = start + x * duration;
      samples.push([t, auto.get(t)]);
    }

    auto.remove(start, end - 1);

    // Always retain endpoints. Interior points are selected probabilistically,
    // with a stronger chance of survival near large curvature changes.
    addPoint(auto, start, samples[0][1]);

    for (var j = 1; j < samples.length - 1; j++) {
      var prev = samples[j - 1][1];
      var cur = samples[j][1];
      var next = samples[j + 1][1];
      var curvature = Math.abs(next - 2 * cur + prev);
      var probability = density + Math.min(0.55, curvature / 80) * damage;

      if (Math.random() < probability) {
        var jitter = rand(-micro, micro) * damage;
        addPoint(auto, samples[j][0], clamp(cur + jitter, -1200, 1200));
      }
    }

    addPoint(auto, end - 1, samples[samples.length - 1][1]);
  }

  SV.finish();
}

function addPoint(auto, time, value) {
  auto.add(Math.round(time), clamp(value, -1200, 1200));
}
