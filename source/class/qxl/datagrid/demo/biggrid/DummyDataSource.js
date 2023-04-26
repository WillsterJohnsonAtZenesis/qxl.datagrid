/* ************************************************************************
 *
 *    Qooxdoo DataGrid
 *
 *    https://github.com/qooxdoo/qooxdoo
 *
 *    Copyright:
 *      2022-23 Zenesis Limited, https://www.zenesis.com
 *
 *    License:
 *      MIT: https://opensource.org/licenses/MIT
 *
 *      This software is provided under the same licensing terms as Qooxdoo,
 *      please see the LICENSE file in the Qooxdoo project's top-level directory
 *      for details.
 *
 *    Authors:
 *      * John Spackman (john.spackman@zenesis.com, @johnspackman)
 *
 * *********************************************************************** */

qx.Class.define("qxl.datagrid.demo.biggrid.DummyDataSource", {
  extend: qx.core.Object,
  implement: [qxl.datagrid.source.IDataSource],

  construct(numRows, numColumns) {
    super();
    this.__data = {};
    if (numRows) {
      this.setNumRows(numRows);
    }
    if (numColumns) {
      this.setNumColumns(numColumns);
    }
  },

  properties: {
    numRows: {
      init: 100,
      event: "changeNumRows",
      apply: "_applyNumXxx"
    },
    numColumns: {
      init: 100,
      event: "changeNumColumns",
      apply: "_applyNumXxx"
    }
  },

  events: {
    /** Fired when the size changes */
    changeSize: "qx.event.type.Data"
  },

  members: {
    __data: null,

    /** @type{qxl.datagrid.source.Range} the current range of data that has been promised via `makeAvailable` */
    __range: null,

    /**
     * Apply for numRows and numColumns
     */
    _applyNumXxx(value) {
      for (let id in this.__data) {
        let pos = qxl.datagrid.source.Position.fromId(id);
        if (pos.getColumn() >= this.getNumColumns() || pos.getRow() >= this.getNumRows()) {
          let model = this.__data[id];
          model.dispose();
          delete this.__data[id];
        }
      }
      if (this.__range) {
        if (this.__range.getColumn() > this.getNumColumns()) {
          this.__range.setColumn(this.getNumColumns());
        }
        if (this.__range.getRow() > this.getNumRows()) {
          this.__range.setRow(this.getNumRows());
        }
      }
    },

    /*
     * @override
     */
    isAvailable(range) {
      if (!this.__range) {
        return false;
      }
      return this.__range.eclipses(range) || this.__range.columnZero().eclipses(range);
    },

    /*
     * @override
     */
    async makeAvailable(range) {
      let oldData = this.__data;
      let newData = {};
      for (let pos of range) {
        let id = pos.toId();
        let model = oldData[id];
        if (!model) {
          model = new qxl.datagrid.demo.biggrid.DummyModel().set({
            rowIndex: pos.getRow(),
            columnIndex: pos.getColumn()
          });
        } else {
          delete oldData[id];
        }
        newData[id] = model;
      }
      for (let pos of range.rowsIterator()) {
        let id = pos.toId();
        if (!newData[id]) {
          newData[id] = oldData[id];
          delete oldData[id];
        }
      }
      for (let id in oldData) {
        oldData[id].dispose();
      }
      this.__data = newData;
      this.__range = range;
    },

    /**
     * @override
     */
    getModelForPosition(pos) {
      let model = this.__data[pos.toId()];
      return model;
    },

    /**
     * @override
     */
    getPositionOfModel(value) {
      return new qxl.datagrid.source.Position(value.getRowIndex(), value.getColumnIndex());
    },

    /**
     * @override
     */
    getSize() {
      return new qxl.datagrid.source.Position(this.getNumRows(), this.getNumColumns());
    }
  }
});