var SCRIPT_TITLE = "VOCALOID Inter-Note Accent";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Tuning Lab",
        author: "eli_lab",
        versionNumber: 1,
        minEditorVersion: 67840
    };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function add(auto, t, v) { auto.add(Math.round(t), clamp(v, -1200, 1200)); }

function main() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (notes.length < 2) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Select at least two notes."));
        return;
    }
    notes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });

    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Create deliberate pitch events at selected note boundaries instead of decorating every note.",
        buttons: "OkCancel",
        widgets: [
            { name: "style", type: "ComboBox", label: "Transition", choices: ["Scoop Into Next", "Dip Between", "Overshoot Next", "Double Accent", "Broken"], default: 0 },
            { name: "strength", type: "ComboBox", label: "Strength", choices: ["Light", "Classic", "Hard", "Extreme"], default: 1 },
            { name: "timing", type: "ComboBox", label: "Timing", choices: ["Tight", "Normal", "Wide"], default: 1 },
            { name: "largeJumps", type: "ComboBox", label: "Large intervals", choices: ["Normal", "Reduce", "Emphasize"], default: 2 }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;

    var style = parseInt(r.answers.style);
    var strength = [8, 15, 25, 40][parseInt(r.answers.strength)];
    var window = [0.035, 0.065, 0.11][parseInt(r.answers.timing)];
    var jumpMode = parseInt(r.answers.largeJumps);

    for (var i = 0; i < notes.length - 1; i++) {
        var left = notes[i];
        var right = notes[i + 1];
        if (left.getParent() !== right.getParent()) continue;
        if (left.getEnd() > right.getOnset()) continue;

        var interval = right.getPitch() - left.getPitch();
        if (interval === 0) interval = 0.5;
        var direction = interval > 0 ? 1 : -1;
        var jump = Math.abs(interval);
        var amount = strength * (0.65 + Math.min(jump, 12) / 12 * 0.65);
        if (jumpMode === 1) amount *= jump >= 5 ? 0.65 : 1;
        if (jumpMode === 2) amount *= jump >= 5 ? 1.35 : 1;

        var boundary = right.getOnset();
        var pre = Math.min(window * SV.QUARTER, right.getDuration() * 0.18, left.getDuration() * 0.18);
        var post = Math.min(window * SV.QUARTER, right.getDuration() * 0.22);
        var auto = right.getParent().getParameter("pitchDelta");

        if (style === 0) {
            add(auto, boundary - pre, -direction * amount * 0.35);
            add(auto, boundary - pre * 0.35, direction * amount * 0.35);
            add(auto, boundary + post * 0.45, direction * amount * 0.75);
            add(auto, boundary + post, 0);
        } else if (style === 1) {
            add(auto, boundary - pre, direction * amount * 0.45);
            add(auto, boundary, -direction * amount);
            add(auto, boundary + post * 0.55, direction * amount * 0.18);
            add(auto, boundary + post, 0);
        } else if (style === 2) {
            add(auto, boundary - pre, direction * amount * 0.25);
            add(auto, boundary + post * 0.25, direction * amount);
            add(auto, boundary + post * 0.70, -direction * amount * 0.18);
            add(auto, boundary + post, 0);
        } else if (style === 3) {
            add(auto, boundary - pre, -direction * amount * 0.55);
            add(auto, boundary - pre * 0.30, direction * amount);
            add(auto, boundary + post * 0.25, -direction * amount * 0.45);
            add(auto, boundary + post * 0.55, direction * amount * 0.65);
            add(auto, boundary + post, 0);
        } else {
            add(auto, boundary - pre, direction * amount);
            add(auto, boundary - pre * 0.45, -direction * amount * 0.55);
            add(auto, boundary + post * 0.15, direction * amount * 0.35);
            add(auto, boundary + post * 0.50, -direction * amount * 0.22);
            add(auto, boundary + post, 0);
        }
    }

    SV.finish();
}
