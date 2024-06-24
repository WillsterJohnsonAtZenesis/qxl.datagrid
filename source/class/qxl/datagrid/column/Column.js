/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2020 Zenesis Ltd, https://www.zenesis.com

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * John Spackman (https://githuib.com/johnspackman, john.spackman@zenesis.com)

************************************************************************ */

/**
 * Abstract base for columns; this works with `qxl.datagrid`
 * to provide an easy way for columns of specific types to be managed
 */
qx.Class.define("qxl.datagrid.column.Column", {
  extend: qx.core.Object,
  type: "abstract",

  construct(path) {
    super();
    if (path) {
      this.setPath(path);
    }
  },

  properties: {
    /** Optional path to the value in a node for this column */
    path: {
      init: null,
      nullable: true,
      check: "String",
      event: "changePath"
    },

    /** Caption for the header */
    caption: {
      init: null,
      check: "String",
      event: "changeCaption"
    },

    /** Assigned width, can be null */
    width: {
      init: null,
      nullable: true,
      check: "Integer",
      event: "changeWidth",
      apply: "_applyWidth"
    },

    /** Minimum width, can be null */
    minWidth: {
      init: null,
      nullable: true,
      check: "Integer",
      event: "changeMinWidth",
      apply: "_applyMinWidth"
    },

    /** Maximum width, can be null */
    maxWidth: {
      init: null,
      nullable: true,
      check: "Integer",
      event: "changeMaxWidth",
      apply: "_applyMaxWidth"
    },

    /** Flex of the column  */
    flex: {
      init: 0,
      nullable: false,
      check: "Integer",
      event: "changeFlex",
      apply: "_applyFlex"
    },

    /** Whether the column is editable */
    readOnly: {
      init: false,
      check: "Boolean",
      apply: "_applyReadOnly",
      event: "changeReadOnly"
    },

    /** Whether the column is enabled (this is controlled by the data grid) */
    enabled: {
      init: true,
      check: "Boolean",
      apply: "_applyEnabled",
      event: "changeEnabled"
    },

    /**
     * Options passed to the bindings.
     *
     * @type {(widget: qx.ui.core.Widget, model: qx.ui.core.Object, reverse: boolean) => object | null}
     */
    bindingOptions: {
      init: () => undefined
    },

    /**
     * A callback used to determine whether a given cell on the grid should fill
     * the remaining width in the row. By default, this always returns false.
     *
     * @type {(model: any, child: qx.ui.core.Widget, relativePosition: qxl.datagrid.source.Position, absolutePosition: qxl.datagrid.source.Position) => boolean}
     */
    shouldFillWidth: {
      init: null,
      check: "Function",
      nullable: true,
      event: "changeShouldFillWidth"
    },

    /**
     * A callback used to determine how many columns a cell should fill. This
     * also includes header cells at negative indexes.
     *
     * If the returned value is not a number, is zero or is negative, the
     * colspan will default to 1. If a non-integer value is returned, it will
     * always be rounded down.
     *
     * For grid cells, the behavior of colSpan will be overridden by
     * {@link #shouldFillWidth} if that property's value function returns
     * `true`.
     *
     * Providing a callback to this property will override the default call to
     * {@link qxl.datagrid.ui.GridStyling#colSpan}'s value function. Columns
     * may defer back to the GridStyling property value function by calling the
     * first argument `stylingFn` (no parameters necessary).
     *
     *
     * @type {(stylingFn: Function, model: any, child: qx.ui.core.Widget, relativePosition: qxl.datagrid.source.Position, absolutePosition: qxl.datagrid.source.Position) => Integer}
     */
    colSpan: {
      init: null,
      check: "Function",
      nullable: true,
      event: "changecolSpan"
    },

    /**
     * User-specified.
     * Whether this column supports sorting.
     * If true, the column will be sortable and the user can click on the header to sort the column.
     */
    sortable: {
      init: false,
      check: "Boolean",
      event: "changeSortable"
    },

    /**
     * Only relevant when sortable is set to true
     * Defines the sort order for this column
     * This is changed when the user clicks on a column to sort it,
     * but can also be set programatically.
     * Note: The code ensures that at most one column within an instance of qxl.datagrid.column.Columns has a sortOrder of "asc" or "desc"
     */
    sortOrder: {
      init: null,
      nullable: true,
      check: ["asc", "desc"],
      event: "changeSortOrder"
    },

    /**
     * Whether or not the column will display a widget for editing, enforced by the widgetFactory
     *
     * If true, then double clicking the cell will swap in the widget returned by {@link #createWidgetForEdit}
     */
    editable: {
      check: "Boolean",
      init: false,
      event: "changeEditable"
    }
  },

  events: {
    /** Fired when the column details change */
    change: "qx.event.type.Data",

    /** Fired when the user taps on a header cell */
    headerTap: "qx.event.type.Event",

    /** Fired when the effectivelyEnabled needs to be checked, data is a {Boolean} */
    changeEffectivelyEnabled: "qx.event.type.Data",

    /** Fired when the effectivelyReadOnly needs to be checked, data is a {Boolean} */
    changeEffectivelyReadOnly: "qx.event.type.Data"
  },

  members: {
    __datagrid: null,

    /**
     * Called by the DataGrid when the column is added.  Do NOT call this manually.
     *
     * @param {qxl.datagrid.DataGrid} datagrid
     */
    setDataGrid(datagrid) {
      if (this.__datagrid === datagrid) {
        return;
      }
      if (qx.core.Environment.get("qx.debug")) {
        this.assertInstance(datagrid, qxl.datagrid.DataGrid);
        this.assertTrue(!this.__datagrid, "DataGrid already set");
      }
      if (this.__datagrid) {
        this.__datagrid.removeListener("changeEnabled", this.__onDataGridChangeEnabled, this);
        this.__datagrid.removeListener("changeReadOnly", this.__onDataGridChangeReadOnly, this);
      }
      this.__datagrid = datagrid;
      if (datagrid) {
        datagrid.addListener("changeEnabled", this.__onDataGridChangeEnabled, this);
        datagrid.addListener("changeReadOnly", this.__onDataGridChangeReadOnly, this);
      }
      this.fireDataEvent("changeEffectivelyEnabled", this.isEffectivelyEnabled());
      this.fireDataEvent("changeEffectivelyReadOnly", this.isEffectivelyEnabled());
    },

    /**
     * Returns the datagrid, if any
     *
     * @returns {qxl.datagrid.DataGrid}
     */
    getDataGrid() {
      return this.__datagrid;
    },

    /**
     * Event handler for when the datagrid changes `enabled`
     */
    __onDataGridChangeEnabled(evt) {
      this.fireDataEvent("changeEffectivelyEnabled", this.isEffectivelyEnabled());
    },

    /**
     * Event handler for when the datagrid changes `readOnly`
     */
    __onDataGridChangeReadOnly(evt) {
      this.fireDataEvent("changeEffectivelyReadOnly", this.isEffectivelyEnabled());
    },

    /**
     * Detects whether the column is read only, taking into account the datagrid
     *
     * @returns {Boolean}
     */
    isEffectivelyReadOnly() {
      return this.getReadOnly() || !this.getEnabled() || !!this.__datagrid?.isReadOnly() || !this.__datagrid?.isEnabled();
    },

    /**
     * Detects whether the column is enabled, taking into account the datagrid
     *
     * @returns {Boolean}
     */
    isEffectivelyEnabled() {
      return !this.getEnabled() || !!this.__datagrid?.isEnabled();
    },

    /**
     * Called to implement the binding for a display widget
     *
     * @param {qx.ui.core.Widget} widget
     * @param {qx.core.Object} model
     * @param {qxl.datagrid.ui.factory.IWidgetFactory} factory
     * @returns {qxl.datagrid.binding.Bindings} the object to dispose of to remove the binding
     */
    bindWidget(widget, model, factory) {
      return this.initBinding(widget, model, factory);
    },

    /**
     * Called to implement the binding for an editor widget
     *
     * @param {qx.ui.core.Widget} widget
     * @param {qx.core.Object} model
     * @param {qxl.datagrid.ui.factory.IWidgetFactory} factory
     * @returns {qxl.datagrid.binding.Bindings} the object to dispose of to remove the binding
     */
    bindEditor(widget, model, factory) {
      let path = this.getPath();
      let bindings = this.initBinding(widget, model, factory);
      if (path) {
        if (model) {
          let bindingId = widget.bind("value", model, path, this.getBindingOptions()(widget, model, true));
          bindings.add(widget, bindingId);
        }
      }
      return bindings;
    },

    /**
     * Initializes bindings between a widget and a model
     *
     * @param {qx.ui.core.Widget} widget
     * @param {qx.core.Object} model
     * @param {qxl.datagrid.ui.factory.IWidgetFactory} factory
     * @returns {qxl.datagrid.binding.Bindings} the object to dispose of to remove the binding
     */
    initBinding(widget, model, factory) {
      let path = this.getPath();
      let bindings = new qxl.datagrid.binding.Bindings(model);
      if (path) {
        if (model) {
          let bindingId = model.bind(path, widget, "value", this.getBindingOptions()(widget, model, false));
          bindings.add(model, bindingId);
        }
      }
      if (typeof widget.setReadOnly == "function") {
        const update = () => {
          widget.setReadOnly(this.isEffectivelyReadOnly());
          widget.setEnabled(this.isEffectivelyEnabled());
        };

        bindings.add(
          this,
          this.addListener("changeEffectivelyReadOnly", () => update()),
          "listener"
        );
        bindings.add(
          this,
          this.addListener("changeEffectivelyEnabled", () => update()),
          "listener"
        );
        update();
      } else {
        const update = () => {
          widget.setEnabled(this.isEffectivelyEnabled() && !this.isEffectivelyReadOnly());
        };

        bindings.add(
          this,
          this.addListener("changeEffectivelyReadOnly", () => update()),
          "listener"
        );
        bindings.add(
          this,
          this.addListener("changeEffectivelyEnabled", () => update()),
          "listener"
        );
        update();
      }
      return bindings;
    },

    /**
     * Creates a widget for displaying a value for for a single cell
     * @returns {qx.ui.core.Widget}
     */
    createWidgetForDisplay() {
      return new qx.ui.basic.Label().set({
        appearance: "qxl-datagrid-cell"
      });
    },

    /**
     * Creates a widget for editing a value for for a single cell
     * @returns {qx.ui.core.Widget}
     */
    createWidgetForEdit() {
      return new qx.ui.form.TextField();
    },

    /**
     * Apply for `width` property
     */
    _applyWidth(value) {},

    /**
     * Apply for `minWidth` property
     */
    _applyMinWidth(value) {},

    /**
     * Apply for `maxWidth` property
     */
    _applyMaxWidth(value) {},

    /**
     * Apply for `flex` property
     */
    _applyFlex(value) {},

    /**
     * Apply for `readOnly` property
     */
    _applyReadOnly(value) {},

    /**
     * Apply for `enabled` property
     */
    _applyEnabled(value) {}
  }
});
