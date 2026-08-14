var SCRIPT_TITLE = "Pitch Baker - Gesture Engine";

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
function choose(a) { return a[Math.floor(Math.random() * a.length)]; }

function gesture(type, amp) {
  if (type === "Scoop Up") return [[0, -amp], [0.16, amp * 0.35], [0.45, 0], [1, 0]];
  if (type === "Scoop Down") return [[0, amp], [0.16, -amp * 0.35], [0.45, 0], [1, 0]];
  if (type === "Overshoot Up") return [[0, 0], [0.22, amp], [0.48, amp * 0.15], [1, 0]];
  if (type === "Overshoot Down") return [[0, 0], [0.22, -amp], [0.48, -amp * 0.15], [1, 0]];
  if (type === "Fall") return [[0, 0], [0.42, -amp * 0.35], [0.82, -amp], [1, -amp * 0.2]];
  if (type === "Rise") return [[0, 0], [0.42, amp * 0.35], [0.82, amp], [1, amp * 0.2]];
  if (type === "Crack") return [[0, 0], [0.2, amp], [0.36, -amp * 0.75], [0.62, amp * 0.25], [1, 0]];
  if (type === "Kink") return [[0, 0], [rand(0.25, 0.45), amp], [rand(0.48, 0.7), -amp * 0.35], [1, 0]];
  return [[0, 0], [1, 0]];
}

function addGesture(auto, note, type, amount, density) {
  var start = note.getOnset();
  var end = note.getEnd();
  var duration = end - start;
  if (duration <= 0) return;

  var amp = amount * rand(8, 34);
  var shape = gesture(type, amp);
  var keep = 0.75 + density * 0.25;

  for (var i = 0; i < shape.length; i++) {
    if (i !== 0 && i !== shape.length - 1 && Math.random() > keep) continue;
    auto.add(Math.round(start + shape[i][0] * duration), clamp(shape[i][1], -1200, 1200));
  }
}

function main() {
  var form = {
    title: SV.T(SCRIPT_TITLE),
    message: "Apply one deliberate pitch gesture to each selected note",
    buttons: "OkCancel",
    widgets: [
      { name: "gesture", type: "ComboBox", label: "Gesture", choices: ["Auto", "Scoop Up", "Scoop Down", "Overshoot Up", "Overshoot Down", "Fall", "Rise", "Crack", "Kink"], default: 0 },
      { name: "amount", type: "ComboBox", label: "Amplitude", choices: ["Tiny", "Small", "Medium", "Large"], default: 2 },
      { name: "density", type: "ComboBox", label: "Point density", choices: ["Sparse", "Normal", "Dense"], default: 1 }
    ]
  };

  var results = SV.showCustomDialog(form);
  if (!results.status) return;

  var notes = SV.getMainEditor().getSelection().getSelectedNotes();
  if (notes.length === 0) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
    return;
  }

  var amplitudes = [0.35, 0.65, 1.0, 1.5];
  var densities = [0.35, 0.7, 1.0];
  var types = ["Scoop Up", "Scoop Down", "Overshoot Up", "Overshoot Down", "Fall", "Rise", "Crack", "Kink"];
  var selectedGesture = parseInt(results.answers.gesture);

  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var type = selectedGesture === 0 ? choose(types) : types[selectedGesture - 1];
    addGesture(note.getParent().getParameter("pitchDelta"), note, type, amplitudes[parseInt(results.answers.amount)], densities[parseInt(results.answers.density)]);
  }

  SV.finish();
}
