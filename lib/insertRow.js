var Draft = require('draft-js');

var TYPES = require('./TYPES');
var getTableForSelection = require('./getTableForSelection');
var getHeaderForBlock = require('./getHeaderForBlock');
var createRow = require('./createRow');
var findParentByType = require('./findParentByType');
/**
 * Insert a row in a table
 *
 * @param {Draft.EditorState} editorState
 * @return {Draft.EditorState}
 */
function insertRow(editorState) {
    var selection = editorState.getSelection();
    var content = editorState.getCurrentContent();

    var cell = content.getBlockForKey(selection.getEndKey());

    var rowBlock = findParentByType(content, cell, TYPES.ROW);

    var tableBlock = getTableForSelection(content, selection);

    // Not a table?
    if (!tableBlock) {
        return editorState;
    }

    // Find head and body
    var tableHead = getHeaderForBlock(content, tableBlock.getKey());

    var tableBlocks = content.getBlockChildren(tableBlock.getKey());
    var tableBody = tableBlocks.find(function(blk) {
        return blk.getType() === TYPES.BODY;
    });

    // Search for a row, to get count of cells
    var rowFromHead = false;
    var firstRow = content.getBlockChildren(tableBody.getKey()).last();
    if (!firstRow) {
        rowFromHead = true;
        firstRow = content.getBlockChildren(tableHead.getKey()).first();
    }

    if (!firstRow) {
        return editorState;
    }

    var countCells = content.getBlockChildren(firstRow.getKey()).size;

    // Create row
    var rowBlocks = createRow(tableBody.getKey(), countCells);
    var firstCell = rowBlocks.findLast(function(blk) {
        return blk.getType() === TYPES.CELL;
    });


    var blockMap = content.getBlockMap();
    var blocksAfter = blockMap.toSeq().reverse()
        .takeUntil(function(blk) {
            return blk === rowBlock;
        }).concat([[rowBlock.getKey(), rowBlock]]).reverse();

    var blocksBefore = blockMap.toSeq()
        .takeUntil(function(blk) {
            return blk === rowBlock;
        });
    var newBlocks = blocksBefore.concat(
        rowBlocks.toSeq(),
        blocksAfter
    ).toOrderedMap();

    var newContent = content.merge({
        blockMap: newBlocks,
        selectionBefore: selection,
        selectionAfter: selection.merge({
            anchorKey: firstCell.getKey(),
            anchorOffset: 0,
            focusKey: firstCell.getKey(),
            focusOffset: 0,
            isBackward: false
        })
    });

    // Push new contentState
    var newEditorState = Draft.EditorState.push(editorState, newContent, 'insert-row');

    // Force selection in new row
    return Draft.EditorState.forceSelection(
        newEditorState,
        newContent.getSelectionAfter()
    );
}

module.exports = insertRow;
