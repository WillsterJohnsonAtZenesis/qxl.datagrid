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

/**
 * Base implementation of `qxl.datagrid.ui.factory.IWidgetFactory`
 */
qx.Class.define("qxl.datagrid.ui.factory.AbstractWidgetFactory", {
  extend: qx.core.Object,
  type: "abstract",
  implement: [qxl.datagrid.ui.factory.IWidgetFactory],

  /**
   * Constructor
   */
  construct(columns) {
    super();
    this.__widgets = {};
    this.__editors = {};
    if (columns) {
      this.setColumns(columns);
    }
  },

  properties: {
    /** The data source */
    dataSource: {
      init: null,
      check: "qxl.datagrid.source.IDataSource",
      event: "changeDataSource"
    },

    /** The columns on display in this widget */
    columns: {
      init: null,
      nullable: true,
      check: "qxl.datagrid.column.IColumns",
      apply: "_applyColumns",
      event: "changeColumns"
    }
  },

  members: {
    /** @type {Record<string, qx.ui.core.Widget>} the widgets, indexed by row:column */
    __widgets: null,

    /** @type {string} the appearance to set on each widget */
    __widgetAppearance: null,

    /** @type {string} the appearance to set on each editor */
    __editorAppearance: null,

    /**
     * Apply for `columns`
     */
    _applyColumns(value, oldValue) {
      this.disposeAllWidgets();
    },

    /**
     * Unbinds and disposes all the widgets
     */
    disposeAllWidgets() {
      Object.values(this.getWidgets()).forEach(widget => {
        this.unbindWidget(widget);
        this.disposeWidget(widget);
      });
    },

    /**
     * @override
     */
    getWidgetFor(rowIndex, columnIndex) {
      let id = rowIndex + ":" + columnIndex;
      let widget = this.__widgets[id];
      if (!widget) {
        let column = this.getColumns().getColumn(columnIndex);
        widget = this.__widgets[id] = this._createWidget(column);
        if (this.__widgetAppearance) {
          widget.setAppearance(this.__widgetAppearance);
        }
        widget.setUserData("qxl.datagrid.factory.AbstractWidgetFactory.bindingData", {
          rowIndex: rowIndex,
          columnIndex: columnIndex,
          column: column
        });
      }
      return widget;
    },

    /**
     * @override
     */
    getEditorFor(rowIndex, columnIndex) {
      let id = rowIndex + ":" + columnIndex;
      let editor = this.__editors[id];
      if (!editor) {
        let column = this.getColumns().getColumn(columnIndex);
        editor = this.__editors[id] = this._createEditor(column);
        if (!editor) {
          return null;
        }
        if (this.__editorAppearance) {
          editor.setAppearance(this.__editorAppearance);
        }
        editor.setUserData("qxl.datagrid.factory.AbstractWidgetFactory.bindingData", {
          rowIndex: rowIndex,
          columnIndex: columnIndex,
          column: column
        });
      }
      return editor;
    },

    /**
     * @override
     */
    getModelForWidget(widget) {
      let bindingData = widget.getUserData("qxl.datagrid.factory.AbstractWidgetFactory.bindingData");
      return bindingData?.model || null;
    },

    /**
     * Disposes of the given widget
     */
    disposeWidget(widget) {
      let bindingData = widget.getUserData("qxl.datagrid.factory.AbstractWidgetFactory.bindingData");
      let id = bindingData.rowIndex + ":" + bindingData.columnIndex;
      if (bindingData.model) {
        this.unbindWidget(widget);
      }
      widget.setUserData("qxl.datagrid.factory.AbstractWidgetFactory.bindingData", null);
      delete this.__widgets[id];
      widget.dispose();
    },

    /**
     * Disposes of the given editor
     */
    disposeEditor(editor) {
      let bindingData = editor.getUserData("qxl.datagrid.factory.AbstractWidgetFactory.bindingData");
      let id = bindingData.rowIndex + ":" + bindingData.columnIndex;
      if (bindingData.model) {
        this.unbindWidget(editor);
      }
      editor.setUserData("qxl.datagrid.factory.AbstractWidgetFactory.bindingData", null);
      delete this.__editors[id];
      editor.dispose();
    },

    /**
     * Called to create a widget
     *
     * @param {qxl.datagrid.column.Column} column the column to create for
     * @return {qx.ui.core.Widget}
     */
    _createWidget(column) {
      throw new Error("No such method " + this.classname + "._createWidget");
    },

    /**
     * Called to create an editor
     *
     * @param {qxl.datagrid.column.Column} column the column to create for
     * @return {qx.ui.core.Widget}
     */
    _createEditor(column) {
      throw new Error("No such method " + this.classname + "._createEditor");
    },

    /**
     * Returns a map of all widgets
     *
     * @returns {Record<string, qx.ui.core.Widget>}
     */
    getWidgets() {
      return this.__widgets;
    },

    /**
     * Returns a map of all editors
     *
     * @returns {Record<string, qx.ui.core.Widget>}
     */
    getEditors() {
      return this.__editors;
    },

    /**
     * Updates all widgets to the new appearance, and sets the
     * appearance for new widgets
     * @param appearance {string} the appearance
     */
    setChildAppearances(appearance) {
      this.__widgetAppearance = appearance;
      Object.values(this.getWidgets()).forEach(widget => {
        widget.setAppearance(this.__widgetAppearance);
      });
    },

    /**
     * Updates all editors to the new appearance, and sets the
     * appearance for new editors
     * @param appearance {string} the appearance
     */
    setEditorAppearances(appearance) {
      this.__editorAppearance = appearance;
      Object.values(this.getEditors()).forEach(editor => {
        editor.setAppearance(this.__editorAppearance);
      });
    }
  }
});
