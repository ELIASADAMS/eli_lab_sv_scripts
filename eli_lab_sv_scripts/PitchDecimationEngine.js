var SCRIPT_TITLE = "Pitch Baker - Decimation Engine";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - Pitch Baker",
        author: "eli_lab",
        versionNumber: 3,
        minEditorVersion: 65537
    };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
var RNG = Math.random;
function seedRandom(seed) {
    var state = (parseInt(seed, 10) || 1) >>> 0;
    if (state === 0) state = 1;
    RNG = function() {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
    };
}
function rand(lo, hi) { return lo + RNG() * (hi - lo); }

function distanceToLine(p, a, b) {
    var dx = b[0] - a[0];
    var dy = b[1] - a[1];
    if (dx === 0 && dy === 0) return Math.abs(p[1] - a[1]);
    var t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    var px = a[0] + t * dx;
    var py = a[1] + t * dy;
    return Math.sqrt((p[0] - px) * (p[0] - px) + (p[1] - py) * (p[1] - py));
}

function rdp(points, tolerance) {
    if (points.length <= 2) return points.slice();
    var maxDist = 0;
    var index = 0;
    for (var i = 1; i < points.length - 1; i++) {
        var d = distanceToLine(points[i], points[0], points[points.length - 1]);
        if (d > maxDist) { maxDist = d; index = i; }
    }
    if (maxDist <= tolerance) return [points[0], points[points.length - 1]];
    var left = rdp(points.slice(0, index + 1), tolerance);
    var right = rdp(points.slice(index), tolerance);
    return left.slice(0, left.length - 1).concat(right);
}

function add(auto, p) { auto.add(Math.round(p[0]), clamp(p[1], -1200, 1200)); }

function uniqueGroups(notes) {
    var groups = [];
    for (var i = 0; i < notes.length; i++) {
        var g = notes[i].getParent();
        if (groups.indexOf(g) < 0) groups.push(g);
    }
    return groups;
}

function selectedRuns(groupNotes) {
    groupNotes.sort(function(a, b) { return a.getOnset() - b.getOnset(); });
    var runs = [];
    var current = [];
    for (var i = 0; i < groupNotes.length; i++) {
        if (!current.length || groupNotes[i].getOnset() <= current[current.length - 1].getEnd() + 1) {
            current.push(groupNotes[i]);
        } else {
            runs.push(current);
            current = [groupNotes[i]];
        }
    }
    if (current.length) runs.push(current);
    return runs;
}

function processRun(auto, groupNotes, interval, tolerance, micro, mode, preserve) {
    var start = groupNotes[0].getOnset();
    var end = groupNotes[groupNotes.length - 1].getEnd();
    if (end <= start) return;

    var count = Math.max(3, Math.ceil((end - start) / interval));
    var samples = [];
    for (var i = 0; i <= count; i++) {
        var t = Math.min(end, start + i * interval);
        samples.push([t, auto.get(t)]);
    }
    if (samples[samples.length - 1][0] < end) samples.push([end, auto.get(end)]);

    var simplified = rdp(samples, tolerance);
    var important = [];
    for (var b = 0; b < groupNotes.length; b++) {
        var nt = groupNotes[b].getOnset();
        important.push([nt, auto.get(nt)]);
        important.push([groupNotes[b].getEnd(), auto.get(groupNotes[b].getEnd())]);
    }

    if (preserve > 0) {
        for (var s = 1; s < samples.length - 1; s++) {
            var pv = samples[s - 1][1], cv = samples[s][1], nv = samples[s + 1][1];
            if ((cv >= pv && cv >= nv) || (cv <= pv && cv <= nv)) {
                if (Math.abs(cv - pv) + Math.abs(nv - cv) > tolerance * 1.5) important.push(samples[s]);
            }
            if (preserve > 1 && Math.abs(cv - pv) > 12) important.push(samples[s]);
        }
    }

    var merged = simplified.concat(important);
    merged.sort(function(a, b) { return a[0] - b[0]; });
    var unique = [];
    for (var u = 0; u < merged.length; u++) {
        if (!unique.length || Math.abs(unique[unique.length - 1][0] - merged[u][0]) > 0.5) unique.push(merged[u]);
        else unique[unique.length - 1][1] = merged[u][1];
    }

    if (mode >= 2) {
        for (var m = 1; m < unique.length - 1; m++) {
            var jitter = mode === 2 ? micro * 0.45 : mode === 3 ? micro * 0.75 : micro;
            if (jitter > 0) unique[m][1] += rand(-jitter, jitter);
        }
    }

    if (mode >= 3) {
        for (var q = 1; q < unique.length - 1; q++) {
            var left = unique[q - 1][1];
            var right = unique[q + 1][1];
            if (Math.abs(unique[q][1] - left) < 3 && Math.abs(unique[q][1] - right) < 3 && RNG() < (mode === 4 ? 0.65 : 0.35)) {
                unique[q][1] += rand(-micro * 0.5, micro * 0.5);
            }
        }
    }

    auto.remove(start, end);
    for (var z = 0; z < unique.length; z++) add(auto, unique[z]);
}

function main() {
    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "Decimate selected pitch without deleting automation belonging to unselected notes.",
        buttons: "OkCancel",
        widgets: [
            { name: "mode", type: "ComboBox", label: "Mode", choices: ["Clean", "Sparse", "Angular", "VOCALOID", "Extreme"], default: 3 },
            { name: "sample", type: "ComboBox", label: "Sampling", choices: ["1/32", "1/24", "1/16", "1/12"], default: 2 },
            { name: "tolerance", type: "ComboBox", label: "Curve simplification", choices: ["Tiny", "Low", "Medium", "High"], default: 1 },
            { name: "micro", type: "ComboBox", label: "Point instability", choices: ["None", "Tiny", "Medium", "High"], default: 1 },
            { name: "preserve", type: "ComboBox", label: "Preserve musical events", choices: ["Basic", "Attacks + Extrema", "Aggressive"], default: 1 },
            { name: "seed", type: "TextBox", label: "Seed", default: "2008" }
        ]
    };
    var r = SV.showCustomDialog(form);
    if (!r.status) return;
    seedRandom(r.answers.seed);

    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    var interval = [SV.QUARTER / 32, SV.QUARTER / 24, SV.QUARTER / 16, SV.QUARTER / 12][parseInt(r.answers.sample)];
    var tolerance = [2.5, 5, 10, 18][parseInt(r.answers.tolerance)];
    var micro = [0, 1.5, 4, 8][parseInt(r.answers.micro)];
    var mode = parseInt(r.answers.mode);
    var preserve = parseInt(r.answers.preserve);
    var groups = uniqueGroups(notes);

    for (var gi = 0; gi < groups.length; gi++) {
        var selected = [];
        for (var n = 0; n < notes.length; n++) if (notes[n].getParent() === groups[gi]) selected.push(notes[n]);
        var runs = selectedRuns(selected);
        var auto = groups[gi].getParameter("pitchDelta");
        for (var ri = 0; ri < runs.length; ri++) processRun(auto, runs[ri], interval, tolerance, micro, mode, preserve);
    }

    SV.finish();
}
