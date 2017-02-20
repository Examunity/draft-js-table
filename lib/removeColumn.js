var Draft = require('draft-js');

var createCell = require('./createCell');
var getTableForSelection = require('./getTableForSelection');
var getHeaderForBlock = require('./getHeaderForBlock');
var TableAnchor = require('./tableAnchor');
var findParentByType = require('./findParentByType');
var removeTable = require('./removeTable');

var TYPES = require('./TYPES');
var ALIGNS = require('./ALIGNS');

/**
 * Remove a cell from a row
 *
 * @param {OrderedMap<String:ContentBlock>} blockMap
 * @param {Number} index
 * @return {OrderedMap<String:ContentBlock>}
 */
function removeCellInRow(blockMap, rowBlock, index) {
    var blockSeq = blockMap.toSeq();

    var blocksBeforeRow = blockSeq
        .takeUntil(function(blk) {
            return blk === rowBlock;
        });

    var blocksAfterRow = blockSeq
        .skipUntil(function(blk) {
            return blk === rowBlock;
        })
        .rest();

    var blockCells = blocksAfterRow
        .takeUntil(function(blk) {
            return blk.getType() !== TYPES.CELL;
        });

    var ourKey = blockCells.toArray()[index].getKey();

    return blockMap.remove(ourKey);
}

/**
 * Remove a column from a table
 *
 * @param {Draft.EditorState} editorState
 * @param {String} align
 * @return {Draft.EditorState}
 */
function removeColumn(editorState, align) {
    align = align || ALIGNS.LEFT;

    var selection    = editorState.getSelection();
    var contentState = editorState.getCurrentContent();
    var tableBlock   = getTableForSelection(contentState, selection);

    // Not a table?
    if (!tableBlock) {
        return editorState;
    }

    var rowBlock = findParentByType(contentState, contentState.getBlockForKey(selection.getStartKey()), TYPES.ROW);

    var anchor = TableAnchor.createForSelection(contentState, selection);
    var cellIndex = anchor.getColumn();

    var tableKey = tableBlock.getKey();
    var blockMap = contentState.getBlockMap();

    // Header
    // Extract list of rows
    var rowBlocks = contentState.getBlockMap()
        .filter(function(block) {
            return (block.getParentKey().indexOf(tableKey) === 0
                && block.getType() === TYPES.ROW);
        });

    // Insert cell for each row
    var newBlockMap = rowBlocks.reduce(function(_blockMap, rowBlock) {
        return removeCellInRow(_blockMap, rowBlock, cellIndex);
    }, blockMap);

    var newCurrentCell = newBlockMap
        .skipUntil(function(block) {
            return block === rowBlock;
        })
        .findLast(function(block) {
            return block.getType() === TYPES.CELL;
        });

    if (!newCurrentCell) {
      return removeTable(editorState, tableKey);
    }

    var newContent = contentState.merge({
        blockMap: newBlockMap,
        selectionBefore: selection,
        selectionAfter: Draft.SelectionState.createEmpty(newCurrentCell.getKey())
    });

    // Push new contentState
    var newEditorState = Draft.EditorState.push(editorState, newContent, 'remove-column');

    return Draft.EditorState.forceSelection(
        newEditorState,
        newContent.getSelectionAfter()
    );
}

module.exports = removeColumn;
