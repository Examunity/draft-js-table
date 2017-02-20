var Draft = require('draft-js');

var createCell = require('./createCell');
var getTableForSelection = require('./getTableForSelection');
var getHeaderForBlock = require('./getHeaderForBlock');
var TableAnchor = require('./tableAnchor');
var TYPES = require('./TYPES');
var ALIGNS = require('./ALIGNS');

/**
 * Insert a cell into a row
 *
 * @param {OrderedMap<String:ContentBlock>} blockMap
 * @param {Number} index
 * @param {String} text
 * @return {OrderedMap<String:ContentBlock>}
 */
function insertCellInRow(blockMap, rowBlock, index, text) {
    var blockSeq = blockMap.toSeq();

    var blocksAfterRow = blockSeq
        .skipUntil(function(blk) {
            return blk === rowBlock;
        })
        .rest();

    var blockCells = blocksAfterRow
        .takeUntil(function(blk) {
            return blk.getType() !== TYPES.CELL;
        });

    var cellKey = blockCells.toArray()[index].getKey();

    var cellsBefore = blockSeq
        .takeUntil(function(blk, key) {
            return (key === cellKey);
        });
    var cellsAfter = blockSeq
        .skipUntil(function(blk, key) {
            return (key === cellKey);
        });

    // Create new cell and add it in the list
    var newCellBlock = createCell(rowBlock.getKey(), text);

    // Create new sequence of cells
    return cellsBefore.concat(
        [[newCellBlock.getKey(), newCellBlock]],
        cellsAfter
    ).toOrderedMap();
}

/**
 * Insert a column in a table
 *
 * @param {Draft.EditorState} editorState
 * @param {String} align
 * @return {Draft.EditorState}
 */
function insertColumn(editorState, align) {
    align = align || ALIGNS.LEFT;

    var selection    = editorState.getSelection();
    var contentState = editorState.getCurrentContent();
    var tableBlock   = getTableForSelection(contentState, selection);

    // Not a table?
    if (!tableBlock) {
        return editorState;
    }

    var anchor = TableAnchor.createForSelection(contentState, selection);
    var cellIndex = anchor.getColumn();

    var tableKey = tableBlock.getKey();
    var blockMap = contentState.getBlockMap();

    // Extract list of rows
    var rowBlocks = contentState.getBlockMap()
        .filter(function(block) {
            return (block.getParentKey().indexOf(tableKey) === 0
                && block.getType() === TYPES.ROW);
        });

    // Insert cell for each row
    var newBlockMap = rowBlocks.reduce(function(_blockMap, rowBlock) {
        return insertCellInRow(_blockMap, rowBlock, cellIndex, ' ');
    }, blockMap);

    var newContent = contentState.merge({
        blockMap: newBlockMap,
        selectionBefore: selection,
        selectionAfter: selection
    });

    // Push new contentState
    return Draft.EditorState.push(editorState, newContent, 'insert-column');
}

module.exports = insertColumn;
