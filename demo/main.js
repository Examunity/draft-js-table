const Draft = require('draft-js');
const React = require('react');
const Immutable = require('immutable');
const ReactDOM = require('react-dom');
const TableUtils = require('../')
const NewTableMatrix = require('../lib/NewTableMatrix');

const {
    Editor,
    EditorState,
    RichUtils,
    NestedUtils,
    Decorator,
    convertFromRaw
} = Draft;


const {Map, List} = Immutable;

const blockRenderMap = NestedUtils.DefaultBlockRenderMap
    .merge(TableUtils.DefaultBlockRenderMap);

class TableEditorExample extends React.Component {
    constructor(props) {
        super(props);

        var contentState = convertFromRaw({
            entityMap: {},
            blocks: [
                {
                    type: 'header-one',
                    text: 'Demo for editing table in DraftJS'
                },
                {
                    type: 'unstyled',
                    text: 'Insert a table here using the button in the toolbar.'
                }
            ]
        }, blockRenderMap)

        this.state = {
            editorState: EditorState.createWithContent(contentState),
        };

        this.focus = () => this.refs.editor.focus();
        this.onChange = (editorState) => this.setState({editorState});
        this.onUpArrow = (e) => this._onUpArrow(e);
        this.onDownArrow = (e) => this._onDownArrow(e);

        this.handleKeyCommand = (command) => this._handleKeyCommand(command);
        this.toggleBlockType = (type) => this._toggleBlockType(type);
        this.toggleInlineStyle = (style) => this._toggleInlineStyle(style);
    }

    _handleKeyCommand(command) {
        const {editorState} = this.state;
        const newState = (TableUtils.handleKeyCommand(editorState, command)
            || RichUtils.handleKeyCommand(editorState, command));
        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }

    _toggleBlockType(blockType) {
        this.onChange(
            RichUtils.toggleBlockType(
                this.state.editorState,
                blockType
            )
        );
    }

    _toggleInlineStyle(inlineStyle) {
        this.onChange(
            RichUtils.toggleInlineStyle(
                this.state.editorState,
                inlineStyle
            )
        );
    }

    _onUpArrow(e) {
        this.onChange(
            TableUtils.onUpArrow(
                this.state.editorState,
                e
            )
        );
    }

    _onDownArrow(e) {
        this.onChange(
            TableUtils.onDownArrow(
                this.state.editorState,
                e
            )
        );
    }

    render() {
        const {editorState} = this.state;

        // If the user changes block type before entering any text, we can
        // either style the placeholder or hide it. Let's just hide it now.
        let className = 'RichEditor-editor';
        var contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (contentState.getBlockMap().first().getType() !== 'unstyled') {
                className += ' RichEditor-hidePlaceholder';
            }
        }

        let isTable = TableUtils.hasSelectionInTable(editorState);

        return (
            <div className="RichEditor-root">
                {isTable? <TableControls
                    editorState={editorState}
                    onChange={this.onChange}
                /> : <BlockStyleControls
                    editorState={editorState}
                    onToggle={this.toggleBlockType}
                    onChange={this.onChange}
                />}
                <InlineStyleControls
                    editorState={editorState}
                    onToggle={this.toggleInlineStyle}
                />
                <div className={className} onClick={this.focus}>
                    <Editor
                        blockStyleFn={getBlockStyle}
                        customStyleMap={styleMap}
                        editorState={editorState}
                        blockRenderMap={blockRenderMap}
                        handleKeyCommand={this.handleKeyCommand}
                        onChange={this.onChange}
                        placeholder="Tell a story..."
                        ref="editor"
                        spellCheck={true}
                        onUpArrow={this.onUpArrow}
                        onDownArrow={this.onDownArrow}
                    />
                </div>
            </div>
        );
    }
}

// Custom overrides for "code" style.
const styleMap = {
    CODE: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
        fontSize: 16,
        padding: 2,
    },
};

function getBlockStyle(block) {
    return 'RichEditor-' + block.getType();
}

class StyleButton extends React.Component {
    constructor() {
        super();
        this.onToggle = (e) => {
            e.preventDefault();
            this.props.onToggle(this.props.style);
        };
    }

    render() {
        let className = 'RichEditor-styleButton';
        if (this.props.active) {
            className += ' RichEditor-activeButton';
        }

        return (
            <span className={className} onMouseDown={this.onToggle}>
                {this.props.label}
            </span>
        );
    }
}

const BLOCK_TYPES = [
    {label: 'H1', style: 'header-one'},
    {label: 'H2', style: 'header-two'},
    {label: 'H3', style: 'header-three'},
    {label: 'H4', style: 'header-four'},
    {label: 'H5', style: 'header-five'},
    {label: 'H6', style: 'header-six'},
    {label: 'Blockquote', style: 'blockquote'},
    {label: 'UL', style: 'unordered-list-item'},
    {label: 'OL', style: 'ordered-list-item'},
    {label: 'Code Block', style: 'code-block'},
];

const BlockStyleControls = (props) => {
    const {editorState} = props;
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    function onInsertTable(row, col) {
        props.onChange(
            TableUtils.insertTable(editorState, row, col)
        );
    }

    return (
        <div className="RichEditor-controls">
            {BLOCK_TYPES.map((type) =>
                <StyleButton
                    key={type.label}
                    active={type.style === blockType}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            )}
            <InsertTable className={'RichEditor-styleButton'} onMouseDown={onInsertTable}>Insert Table</InsertTable>
        </div>
    );
};

var INLINE_STYLES = [
    {label: 'Bold', style: 'BOLD'},
    {label: 'Italic', style: 'ITALIC'},
    {label: 'Underline', style: 'UNDERLINE'},
    {label: 'Monospace', style: 'CODE'},
];

const InlineStyleControls = (props) => {
    var currentStyle = props.editorState.getCurrentInlineStyle();
    return (
        <div className="RichEditor-controls">
            {INLINE_STYLES.map(type =>
                <StyleButton
                    key={type.label}
                    active={currentStyle.has(type.style)}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            )}
        </div>
    );
};

class InsertTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { menuOpen: false };
  }

  _newTable(row, col) {
    this.props.onMouseDown(row, col);
    this.setState({ menuOpen: false });
  }

  toggle() {
    this.setState({ menuOpen: true });
  }

  render() {
    return (
      <div className={this.props.className} style={{position: 'relative', display: 'inline-block'}}>
        <span onClick={this.toggle.bind(this)}>{this.props.children}</span>
        {this.state.menuOpen && <NewTableMatrix newTable={this._newTable.bind(this)} />}
      </div>
    );
  }
}

class TableControls extends React.Component {
    constructor(props) {
        super(props);

        this.onInsertRow = this._onInsertRow.bind(this);
        this.onInsertColumn = this._onInsertColumn.bind(this);
        this.onRemoveRow = this._onRemoveRow.bind(this);
        this.onRemoveColumn = this._onRemoveColumn.bind(this);
    }

    _onInsertRow(e) {
        e.preventDefault();
        this.props.onChange(
            TableUtils.insertRow(this.props.editorState)
        );
    }

    _onRemoveRow(e) {
        e.preventDefault();
        this.props.onChange(
            TableUtils.removeRow(this.props.editorState)
        );
    }

    _onInsertColumn(e) {
        e.preventDefault();
        this.props.onChange(
            TableUtils.insertColumn(this.props.editorState)
        );
    }

    _onRemoveColumn(e) {
        e.preventDefault();
        this.props.onChange(
            TableUtils.removeColumn(this.props.editorState)
        );
    }

    render() {
        return (
                <div className="RichEditor-controls">
                    <span className={'RichEditor-styleButton'} onMouseDown={this.onInsertRow}>Insert Row</span>
                    <span className={'RichEditor-styleButton'} onMouseDown={this.onInsertColumn}>Insert Column</span>
                    <span className={'RichEditor-styleButton'} onMouseDown={this.onRemoveRow}>Remove Row</span>
                    <span className={'RichEditor-styleButton'} onMouseDown={this.onRemoveColumn}>Remove Column</span>
                </div>
            );
    }
};

ReactDOM.render(
    <TableEditorExample />,
    document.getElementById('target')
);
