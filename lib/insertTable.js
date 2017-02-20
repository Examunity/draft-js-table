var Draft = require('draft-js');
import {Seq} from 'immutable';

var TYPES = require('./TYPES');
var createTable = require('./createTable');
var findParentByType = require('./findParentByType');


/**
 * Insert a table to replace current block
 *
 * @param {Draft.EditorState} editorState
 * @param {Number} countRows
 * @param {Number} countColumns
 * @return {Draft.EditorState}
 */
function insertTable(editorState, countRows, countColumns) {
    var selection = editorState.getSelection();
    var content = editorState.getCurrentContent();

    countRows = countRows || 1;
    countColumns = countColumns || 2;

    // Get current block which will became the first cell
    var startKey = selection.getStartKey();
    var currentBlock = content.getBlockForKey(startKey);
    let isTable = false;
    if (currentBlock.getType() === TYPES.CELL) {
      isTable = true;
    }

    // Generate block map to append
    var parentKey = currentBlock.getParentKey();
    var tableBlocks = createTable(false, countRows, countColumns);

    // Find first cell to focus
    var firstCell = tableBlocks.find(function(blk) {
        return blk.getType() === TYPES.CELL;
    });

    // Keep text from current block
    /*firstCell = firstCell.merge({
        text: currentBlock.getText(),
        characterList: currentBlock.getCharacterList()
    });
    tableBlocks = tableBlocks.set(firstCell.getKey(), firstCell);
    */

    // Append everythings to block map
    var blockMap = content.getBlockMap();
    var blocksBefore = blockMap.toSeq()
        .takeUntil(function(blk) {
            return blk === currentBlock;
        });
    var blocksAfter = blockMap.toSeq()
        .skipUntil(function(blk) {
            return blk === currentBlock;
        })
        .rest();
    let seqObj = {};
    seqObj[startKey] = currentBlock;
    var newBlocks = blocksBefore.concat(
        Seq(seqObj),
        tableBlocks.toSeq(),
        blocksAfter
    ).toOrderedMap();

    var newContent = content.merge({
        blockMap: newBlocks,
        selectionBefore: selection,
        selectionAfter: selection.merge({
            anchorKey: firstCell.getKey(),
            anchorOffset: selection.getStartOffset(),
            focusKey: firstCell.getKey(),
            focusOffset: selection.getStartOffset(),
            isBackward: false
        })
    });

    // Push new contentState
    return Draft.EditorState.push(editorState, newContent, 'insert-table');
}

module.exports = insertTable;
