var SCRIPT_TITLE = "Pitch Baker - Contour Engine";

function getClientInfo() {
  return {
    name: SV.T(SCRIPT_TITLE),
    category: "eli_lab - Pitch Baker",
    author: "eli_lab",
    versionNumber: 1,
    minEditorVersion: 65537
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function rand(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

function choose(a) {
  return a[Math.floor(Math.random() * a.length)];
}

function addPoint(auto, t, value) {
  auto.add(Math.round(t), clamp(value, -1200, 1200));
}

function analyze(notes, i) {
  var note = notes[i];
  var prev = i > 0 ? notes[i - 1] : undefined;
  var next = i + 1 < notes.length ? notes[i + 1] : undefined;
  var prevInterval = prev ? note.getPitch() - prev.getPitch() : 0;
  var nextInterval = next ? next.getPitch() - note.getPitch() : 0;
  return {
    note: note,
    duration: note.getDuration(),
    prevInterval: prevInterval,
    nextInterval: nextInterval,
    first: i === 0,
    last: i === notes.length - 1,
    repeatedFromPrev: !!prev && prev.getPitch() === note.getPitch(),
    repeatedToNext: !!next && next.getPitch() === note.getPitch()
  };
}

function bakeNote(auto, info, amount, damage) {
  var start = info.note.getOnset();
  var end = info.note.getEnd();
  var d = end - start;
  if (d <= 0) return;

  var amp = amount * (12 + rand(4, 20));
  amp *= (0.75 + damage * 0.65);

  var ni = info.nextInterval;
  var pi = info.prevInterval;
  var points;

  // Phrase-aware gestures. Large intervals get stronger attacks; repeated notes get instability.
  if (Math.abs(ni) >= 5) {
    if (ni > 0) {
      points = [[0, rand(-0.15, 0.02)], [0.14, amp * rand(0.45, 0.8)], [0.32, amp * rand(0.05, 0.35)], [1, 0]];
    } else {
      points = [[0, rand(0, 0.15)], [0.13, -amp * rand(0.45, 0.8)], [0.31, -amp * rand(0.05, 0.35)], [1, 0]];
    }
  } else if (info.repeatedFromPrev || info.repeatedToNext) {
    var sign = Math.random() < 0.5 ? -1 : 1;
    points = [[0, 0], [rand(0.18, 0.32), sign * amp], [rand(0.42, 0.62), -sign * amp * rand(0.25, 0.65)], [1, rand(-amp * 0.15, amp * 0.15)]];
  } else {
    var mode = choose(["scoop", "fall", "overshoot", "rise", "crack"]);
    if (mode === "scoop") {
      points = [[0, rand(-amp * 0.75, -amp * 0.2)], [rand(0.12, 0.24), amp * rand(0.15, 0.45)], [rand(0.35, 0.55), 0], [1, 0]];
    } else if (mode === "fall") {
      points = [[0, 0], [rand(0.35, 0.55), -amp * rand(0.35, 0.8)], [rand(0.72, 0.9), -amp], [1, rand(-amp * 0.25, amp * 0.05)]];
    } else if (mode === "rise") {
      points = [[0, 0], [rand(0.35, 0.55), amp * rand(0.35, 0.8)], [rand(0.72, 0.9), amp], [1, rand(-amp * 0.05, amp * 0.25)]];
    } else if (mode === "crack") {
      points = [[0, 0], [rand(0.18, 0.32), amp], [rand(0.32, 0.48), -amp * rand(0.45, 0.85)], [rand(0.58, 0.78), amp * rand(0.05, 0.35)], [1, 0]];
    } else {
      points = [[0, 0], [rand(0.18, 0.32), amp * rand(0.35, 0.75)], [rand(0.38, 0.55), amp * rand(0.05, 0.25)], [1, 0]];
    }
  }

  for (var i = 0; i < points.length; i++) {
    addPoint(auto, start + points[i][0] * d, points[i][1]);
  }
}

function main() {
  var form = {
    title: SV.T(SCRIPT_TITLE),
    message: "Phrase-aware, deliberately decimated pitch gestures",
    buttons: "OkCancel",
    widgets: [
      { name: "amount", type: "ComboBox", label: "Contour amount", choices: ["Subtle", "Medium", "Strong", "Broken"], default: 1 },
      { name: "damage", type: "ComboBox", label: "Damage", choices: ["Low", "Medium", "High", "Extreme"], default: 1 },
      { name: "replace", type: "ComboBox", label: "Replace selected pitch data", choices: ["Yes", "No"], default: 0 }
    ]
  };

  var results = SV.showCustomDialog(form);
  if (!results.status) return;

  var notes = SV.getMainEditor().getSelection().getSelectedNotes();
  if (notes.length === 0) {
    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
    return;
  }

  notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

  var amounts = [0.45, 0.8, 1.25, 1.8];
  var damages = [0.15, 0.45, 0.75, 1.0];
  var replace = parseInt(results.answers.replace) === 0;
  var groups = [];

  for (var i = 0; i < notes.length; i++) {
    var group = notes[i].getParent();
    var found = false;
    for (var g = 0; g < groups.length; g++) if (groups[g] === group) found = true;
    if (!found) groups.push(group);
  }

  for (var g = 0; g < groups.length; g++) {
    var auto = groups[g].getParameter("pitchDelta");
    if (replace) {
      for (var n = 0; n < notes.length; n++) if (notes[n].getParent() === groups[g]) auto.remove(notes[n].getOnset(), notes[n].getEnd());
    }
  }

  for (var j = 0; j < notes.length; j++) {
    var info = analyze(notes, j);
    bakeNote(info.note.getParent().getParameter("pitchDelta"), info, amounts[parseInt(results.answers.amount)], damages[parseInt(results.answers.damage)]);
  }

  SV.finish();
}
