var Draft = require('draft-js');

function removeTable(editorState, tableKey) {
  var selection    = editorState.getSelection();
  var contentState = editorState.getCurrentContent();
  var blockMap = contentState.getBlockMap();

  var newBlockMap = blockMap.toSeq().filterNot(function(block, key) {
    return (key.indexOf(tableKey) === 0)
  }).toOrderedMap();

  var newContent = contentState.merge({
      blockMap: newBlockMap,
      selectionBefore: selection,
      selectionAfter: Draft.SelectionState.createEmpty(contentState.getFirstBlock().getKey())
  });

  var newEditorState = Draft.EditorState.push(editorState, newContent, 'remove-table');

  return Draft.EditorState.forceSelection(
      newEditorState,
      newContent.getSelectionAfter()
  );
}

module.exports = removeTable;
