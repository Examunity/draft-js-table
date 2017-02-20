var onDirectionArrow = require('./onDirectionArrow');

module.exports = {
    TYPES:                      require('./TYPES'),
    ALIGNS:                     require('./ALIGNS'),
    DefaultBlockRenderMap:      require('./blockRenderMap'),

    TableAnchor:                require('./tableAnchor'),

    insertTable:                require('./insertTable'),
    insertRow:                  require('./insertRow'),
    insertColumn:               require('./insertColumn'),

    removeRow:                  require('./removeRow'),
    removeColumn:               require('./removeColumn'),

    setAlignForCell:            require('./setAlignForCell'),

    getTableForSelection:       require('./getTableForSelection'),
    getTableForBlock:           require('./getTableForBlock'),
    getAlignForCell:            require('./getAlignForCell'),
    hasSelectionInTable:        require('./hasSelectionInTable'),

    handleKeyCommand:           require('./handleKeyCommand'),

    NewTableMatrix:             require('./NewTableMatrix'),

    onUpArrow:                  onDirectionArrow.bind(null, 1),
    onDownArrow:                onDirectionArrow.bind(null, -1)
};
