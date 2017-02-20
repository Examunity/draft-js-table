import React, {Component} from 'react';

class NewTableMatrix extends Component {

  constructor(props, ...args) {
    super(props, ...args);
    this.state = {matrix: [2, 2]};
  }

  renderInfo() {
    let {matrix} = this.state;
    return <span>{[matrix[0], ' x ', matrix[1], ' Table']}</span>;
  }

  _mouseEnter(row, col) {
    this.setState({matrix: [row, col]});
  }

  _onClick(row, col) {
    let {newTable} = this.props;
    if (typeof newTable == "function") newTable(row, col);
  }

  renderTable(row, col) {
    let {matrix} = this.state;
    let rows = Array.apply(null, Array(row));
    return rows.map((_, curRow) => {
      let cols = Array.apply(null, Array(col));
      return (
        <div style={styles.row} key={"row-"+curRow}>
          {cols.map((_, curCol) => {
            let highlight = ((curRow < matrix[0]) && (curCol < matrix[1]));
            return <div onClick={this._onClick.bind(this, curRow+1, curCol+1)}
                        onMouseEnter={this._mouseEnter.bind(this, curRow+1, curCol+1)}
                        style={highlight ? styles.hCell : styles.cell} key={"cell-"+curRow+"-"+curCol}>
              </div>;
          })
          }
        </div>
      );
    });
  }

  render() {
    let {matrix} = this.state;
    let rows = Math.max(matrix[0] + 1, 5);
    let cols = Math.max(matrix[1] + 1, 5);
    return (
      <div style={styles.wrapper}>
        <div style={styles.table}>
          {this.renderTable(rows, cols)}
        </div>
        {this.renderInfo()}
      </div>
    );
  }

}

const styles = {
  wrapper: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: '10px',
    zIndex: 2,
    border: '1px solid #666666',
  },
  table: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    display: 'flex',
    height: '15px',
    width: '15px',
    margin: '2px',
    border: '1px solid #666666',
  },
  hCell: {
    display: 'flex',
    height: '15px',
    width: '15px',
    margin: '2px',
    border: '1px solid blue',
    backgroundColor: '#cfe2ff',
  }
};

module.exports = NewTableMatrix;
