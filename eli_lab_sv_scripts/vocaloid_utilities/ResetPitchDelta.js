var TITLE="VOCALOID Utility - Reset Pitch Delta";
function getClientInfo(){return{name:SV.T(TITLE),category:"eli_lab - VOCALOID Utilities",author:"eli_lab",versionNumber:1,minEditorVersion:65537}}
function main(){var ns=SV.getMainEditor().getSelection().getSelectedNotes();if(!ns.length){SV.showMessageBox(SV.T(TITLE),SV.T("Please select notes."));return}for(var i=0;i<ns.length;i++){var n=ns[i],a=n.getParent().getParameter("pitchDelta");a.remove(n.getOnset(),n.getEnd());a.add(n.getOnset(),0);a.add(n.getEnd(),0)}SV.finish()}
