var SCRIPT_TITLE = "VOCALOID Analysis Cache Reset";
var ANALYSIS_KEY = "eli_lab.vocaloid.analysis.v1";
var MORA_KEY = "eli_lab.vocaloid.mora.v1";

function getClientInfo() {
    return {
        name: SV.T(SCRIPT_TITLE),
        category: "eli_lab - VOCALOID Tuning Lab",
        author: "eli_lab",
        versionNumber: 1,
        minEditorVersion: 67840
    };
}

function main() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();
    if (!notes.length) {
        SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Please select notes."));
        return;
    }

    var removed = 0;
    for (var i = 0; i < notes.length; i++) {
        if (notes[i].hasScriptData(ANALYSIS_KEY)) {
            notes[i].removeScriptData(ANALYSIS_KEY);
            removed++;
        }
        if (notes[i].hasScriptData(MORA_KEY)) notes[i].removeScriptData(MORA_KEY);
    }

    SV.showMessageBox(SV.T(SCRIPT_TITLE), SV.T("Removed VOCALOID analysis metadata from " + removed + " notes."));
    SV.finish();
}
