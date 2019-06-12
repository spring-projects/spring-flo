import * as tslib_1 from "tslib";
import { Component, ElementRef, Input, Output, EventEmitter, Inject, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { dia } from 'jointjs';
import { Flo } from '../shared/flo-common';
import { Shapes, Constants } from '../shared/shapes';
import { DOCUMENT } from '@angular/platform-browser';
import * as _$ from 'jquery';
var joint = Flo.joint;
var $ = _$;
var DEBOUNCE_TIME = 300;
joint.shapes.flo.PaletteGroupHeader = joint.shapes.basic.Generic.extend({
    // The path is the open/close arrow, defaults to vertical (open)
    markup: '<g class="scalable"><rect/></g><text/><g class="rotatable"><path d="m 10 10 l 5 8.7 l 5 -8.7 z"/></g>',
    defaults: joint.util.deepSupplement({
        type: 'palette.groupheader',
        size: { width: 170, height: 30 },
        position: { x: 0, y: 0 },
        attrs: {
            'rect': { fill: '#34302d', 'stroke-width': 1, stroke: '#6db33f', 'follow-scale': true, width: 80, height: 40 },
            'text': {
                text: '',
                fill: '#eeeeee',
                'ref-x': 0.5,
                'ref-y': 7,
                'x-alignment': 'middle',
                'font-size': 18 /*, 'font-weight': 'bold', 'font-variant': 'small-caps', 'text-transform': 'capitalize'*/
            },
            'path': { fill: 'white', 'stroke-width': 2, stroke: 'white' /*,transform:'rotate(90,15,15)'*/ }
        },
        // custom properties
        isOpen: true
    }, joint.shapes.basic.Generic.prototype.defaults)
});
var Palette = /** @class */ (function () {
    function Palette(element, document) {
        var _this = this;
        this.element = element;
        this.document = document;
        this._metamodelListener = {
            metadataError: function (data) { },
            metadataAboutToChange: function () { },
            metadataChanged: function () { return _this.rebuildPalette(); }
        };
        this.initialized = false;
        this._filterText = '';
        this.filterTextModel = new Subject();
        this.paletteEntryPadding = { width: 12, height: 12 };
        this.onPaletteEntryDrop = new EventEmitter();
        this.paletteReady = new EventEmitter();
        this.paletteFocus = new EventEmitter();
        this.mouseMoveHanlder = function (e) { return _this.handleDrag(e); };
        this.mouseUpHanlder = function (e) { return _this.handleMouseUp(e); };
        this.paletteGraph = new joint.dia.Graph();
        this.paletteGraph.set('type', Constants.PALETTE_CONTEXT);
        this._filterText = '';
        this.closedGroups = new Set();
    }
    Object.defineProperty(Palette.prototype, "paletteSize", {
        set: function (size) {
            console.debug('Palette Size: ' + size);
            if (this._paletteSize !== size) {
                this._paletteSize = size;
                this.rebuildPalette();
            }
        },
        enumerable: true,
        configurable: true
    });
    Palette.prototype.onFocus = function () {
        this.paletteFocus.emit();
    };
    Palette.prototype.ngOnInit = function () {
        var _this = this;
        var element = $('#palette-paper', this.element.nativeElement);
        // Create the paper for the palette using the specified element view
        this.palette = new joint.dia.Paper({
            el: element,
            gridSize: 1,
            model: this.paletteGraph,
            height: $(this.element.nativeElement.parentNode).height(),
            width: $(this.element.nativeElement.parentNode).width(),
            elementView: this.getPaletteView(this.renderer && this.renderer.getNodeView ? this.renderer.getNodeView() : joint.dia.ElementView),
            interactive: false
        });
        this.palette.on('cell:pointerup', function (cellview, evt) {
            if (_this.viewBeingDragged) {
                _this.trigger({
                    type: Flo.DnDEventType.DROP,
                    view: _this.viewBeingDragged,
                    event: evt
                });
                _this.viewBeingDragged = undefined;
            }
            _this.clickedElement = undefined;
            $('#palette-floater').remove();
            if (_this.floaterpaper) {
                _this.floaterpaper.remove();
            }
        });
        // Toggle the header open/closed on a click
        this.palette.on('cell:pointerclick', function (cellview, event) {
            // TODO [design][palette] should the user need to click on the arrow rather than anywhere on the header?
            // Click position within the element would be: evt.offsetX, evt.offsetY
            var cell = cellview.model;
            if (cell.attributes.header) {
                // Toggle the header open/closed
                if (cell.get('isOpen')) {
                    _this.rotateClosed(cell);
                }
                else {
                    _this.rotateOpen(cell);
                }
            }
            // TODO [palette] ensure other mouse handling events do nothing for headers
            // TODO [palette] move 'metadata' field to the right place (not inside attrs I think)
        });
        $(this.document).on('mouseup', this.mouseUpHanlder);
        if (this.metamodel) {
            this.metamodel.load().then(function (data) {
                _this.buildPalette(data);
                // Add listener to metamodel
                if (_this.metamodel && _this.metamodel.subscribe) {
                    _this.metamodel.subscribe(_this._metamodelListener);
                }
                // Add debounced listener to filter text changes
                _this.filterTextModel
                    .pipe(debounceTime(DEBOUNCE_TIME))
                    .subscribe(function (value) { return _this.rebuildPalette(); });
                _this.initialized = true;
            });
        }
        else {
            console.error('No Metamodel service specified for palette!');
        }
        this._paletteSize = this._paletteSize || $(this.element.nativeElement.parentNode).width();
    };
    Palette.prototype.ngOnDestroy = function () {
        if (this.metamodel && this.metamodel.unsubscribe) {
            this.metamodel.unsubscribe(this._metamodelListener);
        }
        $(this.document).off('mouseup', this.mouseUpHanlder);
        this.palette.remove();
    };
    Palette.prototype.ngOnChanges = function (changes) {
        // if (changes.hasOwnProperty('paletteSize') || changes.hasOwnProperty('filterText')) {
        //   this.metamodel.load().then(metamodel => this.buildPalette(metamodel));
        // }
    };
    Palette.prototype.createPaletteGroup = function (title, isOpen) {
        var newGroupHeader = new joint.shapes.flo.PaletteGroupHeader({ attrs: { text: { text: title } } });
        newGroupHeader.set('header', title);
        if (!isOpen) {
            newGroupHeader.attr({ 'path': { 'transform': 'rotate(-90,15,13)' } });
            newGroupHeader.set('isOpen', false);
        }
        this.paletteGraph.addCell(newGroupHeader);
        return newGroupHeader;
    };
    Palette.prototype.createPaletteEntry = function (title, metadata) {
        return Shapes.Factory.createNode({
            renderer: this.renderer,
            paper: this.palette,
            metadata: metadata
        });
    };
    Palette.prototype.buildPalette = function (metamodel) {
        var _this = this;
        var startTime = new Date().getTime();
        this.paletteReady.emit(false);
        this.paletteGraph.clear();
        var filterText = this.filterText;
        if (filterText) {
            filterText = filterText.toLowerCase();
        }
        var paletteNodes = [];
        var groupAdded = new Set();
        var parentWidth = this._paletteSize;
        console.debug("Parent Width: " + parentWidth);
        // The field closedGroups tells us which should not be shown
        // Work out the list of active groups/nodes based on the filter text
        this.metamodel.groups().forEach(function (group) {
            if (metamodel && metamodel.has(group)) {
                Array.from(metamodel.get(group).keys()).sort().forEach(function (name) {
                    var node = metamodel.get(group).get(name);
                    if (node) {
                        var nodeActive = !(node.metadata && node.metadata.noPaletteEntry);
                        if (nodeActive && filterText) {
                            nodeActive = false;
                            if (name.toLowerCase().indexOf(filterText) !== -1) {
                                nodeActive = true;
                            }
                            else if (group.toLowerCase().indexOf(filterText) !== -1) {
                                nodeActive = true;
                            }
                            // else if (node.description && node.description.toLowerCase().indexOf(filterText) !== -1) {
                            //   nodeActive = true;
                            // }
                            // else if (node.properties) {
                            //   Object.keys(node.properties).sort().forEach(function(propertyName) {
                            //     if (propertyName.toLowerCase().indexOf(filterText) !== -1 ||
                            //       (node.properties[propertyName].description &&
                            //       node.properties[propertyName].description.toLowerCase().indexOf(filterText) !== -1)) {
                            //       nodeActive=true;
                            //     }
                            //   });
                            // }
                        }
                        if (nodeActive) {
                            if (!groupAdded.has(group)) {
                                var header = _this.createPaletteGroup(group, !_this.closedGroups.has(group));
                                header.set('size', { width: parentWidth, height: 30 });
                                paletteNodes.push(header);
                                groupAdded.add(group);
                            }
                            if (!_this.closedGroups.has(group)) {
                                paletteNodes.push(_this.createPaletteEntry(name, node));
                            }
                        }
                    }
                });
            }
        });
        var cellWidth = 0, cellHeight = 0;
        // Determine the size of the palette entry cell (width and height)
        paletteNodes.forEach(function (pnode) {
            if (pnode.attr('metadata/name')) {
                var dimension = {
                    width: pnode.get('size').width,
                    height: pnode.get('size').height
                };
                if (cellWidth < dimension.width) {
                    cellWidth = dimension.width;
                }
                if (cellHeight < dimension.height) {
                    cellHeight = dimension.height;
                }
            }
        });
        // Adjust the palette entry cell size with paddings.
        cellWidth += 2 * this.paletteEntryPadding.width;
        cellHeight += 2 * this.paletteEntryPadding.height;
        // Align palette entries row to be at the center
        var startX = parentWidth >= cellWidth ? (parentWidth - Math.floor(parentWidth / cellWidth) * cellWidth) / 2 : 0;
        var xpos = startX;
        var ypos = 0;
        var prevNode;
        // Layout palette entry nodes
        paletteNodes.forEach(function (pnode) {
            var dimension = {
                width: pnode.get('size').width,
                height: pnode.get('size').height
            };
            if (pnode.get('header')) { //attributes.attrs.header) {
                // Palette entry header
                xpos = startX;
                pnode.set('position', { x: 0, y: ypos });
                ypos += dimension.height + 5;
            }
            else {
                // Palette entry element
                if (xpos + cellWidth > parentWidth) {
                    // Not enough real estate to place entry in a row - reset x position and leave the y pos which is next line
                    xpos = startX;
                    pnode.set('position', { x: xpos + (cellWidth - dimension.width) / 2, y: ypos + (cellHeight - dimension.height) / 2 });
                }
                else {
                    // Enough real estate to place entry in a row - adjust y position
                    if (prevNode && prevNode.attr('metadata/name')) {
                        ypos -= cellHeight;
                    }
                    pnode.set('position', { x: xpos + (cellWidth - dimension.width) / 2, y: ypos + (cellHeight - dimension.height) / 2 });
                }
                // increment x position and y position (can be reorganized)
                xpos += cellWidth;
                ypos += cellHeight;
            }
            prevNode = pnode;
        });
        this.palette.setDimensions(parentWidth, ypos);
        this.paletteReady.emit(true);
        console.debug('buildPalette took ' + (new Date().getTime() - startTime) + 'ms');
    };
    Palette.prototype.rebuildPalette = function () {
        var _this = this;
        if (this.initialized && this.metamodel) {
            this.metamodel.load().then(function (metamodel) { return _this.buildPalette(metamodel); });
        }
    };
    Object.defineProperty(Palette.prototype, "filterText", {
        get: function () {
            return this._filterText;
        },
        set: function (text) {
            if (this._filterText !== text) {
                this._filterText = text;
                this.filterTextModel.next(text);
            }
        },
        enumerable: true,
        configurable: true
    });
    Palette.prototype.getPaletteView = function (view) {
        var self = this;
        return view.extend({
            pointerdown: function ( /*evt, x, y*/) {
                // Remove the tooltip
                // $('.node-tooltip').remove();
                // TODO move metadata to the right place (not inside attrs I think)
                self.clickedElement = this.model;
                if (self.clickedElement && self.clickedElement.attr('metadata')) {
                    $(self.document).on('mousemove', self.mouseMoveHanlder);
                }
            },
            pointermove: function ( /*evt, x, y*/) {
                // Nothing to prevent move within the palette canvas
            },
        });
    };
    Palette.prototype.handleMouseUp = function (event) {
        $(this.document).off('mousemove', this.mouseMoveHanlder);
    };
    Palette.prototype.trigger = function (event) {
        this.onPaletteEntryDrop.emit(event);
    };
    Palette.prototype.handleDrag = function (event) {
        // TODO offsetX/Y not on firefox
        // console.debug("tracking move: x="+event.pageX+",y="+event.pageY);
        // console.debug('Element = ' + (this.clickedElement ? this.clickedElement.attr('metadata/name'): 'null'));
        if (this.clickedElement && this.clickedElement.attr('metadata')) {
            if (!this.viewBeingDragged) {
                var dataOfClickedElement = this.clickedElement.attr('metadata');
                // custom div if not already built.
                $('<div>', {
                    id: 'palette-floater'
                }).appendTo($('body'));
                var floatergraph = new joint.dia.Graph();
                floatergraph.set('type', Constants.FEEDBACK_CONTEXT);
                var parent_1 = $('#palette-floater');
                this.floaterpaper = new joint.dia.Paper({
                    el: $('#palette-floater'),
                    elementView: this.renderer && this.renderer.getNodeView ? this.renderer.getNodeView() : joint.dia.ElementView,
                    gridSize: 10,
                    model: floatergraph,
                    height: parent_1.height(),
                    width: parent_1.width(),
                    validateMagnet: function () { return false; },
                    validateConnection: function () { return false; }
                });
                // TODO float thing needs to be bigger otherwise icon label is missing
                // Initiative drag and drop - create draggable element
                var floaternode = Shapes.Factory.createNode({
                    'renderer': this.renderer,
                    'paper': this.floaterpaper,
                    'graph': floatergraph,
                    'metadata': dataOfClickedElement
                });
                // Only node view expected
                var box = this.floaterpaper.findViewByModel(floaternode).getBBox();
                var size = floaternode.get('size');
                // Account for node real size including ports
                floaternode.translate(box.width - size.width, box.height - size.height);
                this.viewBeingDragged = this.floaterpaper.findViewByModel(floaternode);
                $('#palette-floater').offset({ left: event.pageX + 5, top: event.pageY + 5 });
            }
            else {
                $('#palette-floater').offset({ left: event.pageX + 5, top: event.pageY + 5 });
                this.trigger({
                    type: Flo.DnDEventType.DRAG,
                    view: this.viewBeingDragged,
                    event: event
                });
            }
        }
    };
    /*
     * Modify the rotation of the arrow in the header from horizontal(closed) to vertical(open)
     */
    Palette.prototype.rotateOpen = function (element) {
        var _this = this;
        setTimeout(function () { return _this.doRotateOpen(element, 90); });
    };
    Palette.prototype.doRotateOpen = function (element, angle) {
        var _this = this;
        angle -= 10;
        element.attr({ 'path': { 'transform': 'rotate(-' + angle + ',15,13)' } });
        if (angle <= 0) {
            element.set('isOpen', true);
            this.closedGroups.delete(element.get('header'));
            this.rebuildPalette();
        }
        else {
            setTimeout(function () { return _this.doRotateOpen(element, angle); }, 10);
        }
    };
    Palette.prototype.doRotateClose = function (element, angle) {
        var _this = this;
        angle += 10;
        element.attr({ 'path': { 'transform': 'rotate(-' + angle + ',15,13)' } });
        if (angle >= 90) {
            element.set('isOpen', false);
            this.closedGroups.add(element.get('header'));
            this.rebuildPalette();
        }
        else {
            setTimeout(function () { return _this.doRotateClose(element, angle); }, 10);
        }
    };
    // TODO better name for this function as this does the animation *and* updates the palette
    /*
     * Modify the rotation of the arrow in the header from vertical(open) to horizontal(closed)
     */
    Palette.prototype.rotateClosed = function (element) {
        var _this = this;
        setTimeout(function () { return _this.doRotateClose(element, 0); });
    };
    tslib_1.__decorate([
        Input(),
        tslib_1.__metadata("design:type", Object)
    ], Palette.prototype, "metamodel", void 0);
    tslib_1.__decorate([
        Input(),
        tslib_1.__metadata("design:type", Object)
    ], Palette.prototype, "renderer", void 0);
    tslib_1.__decorate([
        Input(),
        tslib_1.__metadata("design:type", Object)
    ], Palette.prototype, "paletteEntryPadding", void 0);
    tslib_1.__decorate([
        Output(),
        tslib_1.__metadata("design:type", Object)
    ], Palette.prototype, "onPaletteEntryDrop", void 0);
    tslib_1.__decorate([
        Output(),
        tslib_1.__metadata("design:type", Object)
    ], Palette.prototype, "paletteReady", void 0);
    tslib_1.__decorate([
        Output(),
        tslib_1.__metadata("design:type", Object)
    ], Palette.prototype, "paletteFocus", void 0);
    tslib_1.__decorate([
        Input(),
        tslib_1.__metadata("design:type", Number),
        tslib_1.__metadata("design:paramtypes", [Number])
    ], Palette.prototype, "paletteSize", null);
    Palette = tslib_1.__decorate([
        Component({
            selector: 'flo-palette',
            template: "\n    <div id=\"palette-filter\" class=\"palette-filter\">\n      <input type=\"text\" id=\"palette-filter-textfield\" class=\"palette-filter-textfield\" [(ngModel)]=\"filterText\" (focus)=\"onFocus()\"/>\n    </div>\n    <div id=\"palette-paper-container\" style=\"height:calc(100% - 46px); width:100%;\">\n      <div id=\"palette-paper\" class=\"palette-paper\" style=\"overflow:hidden;\"></div>\n    </div>\n  ",
            styles: ["\n    /* Joint JS paper for drawing palette -> canvas DnD visual feedback START */\n\n    #palette-floater {\n      /* TODO size relative to paper that goes on it? */\n      opacity: 0.75;\n      width:170px;\n      height:60px;\n      background-color: transparent;\n      /*\n        background-color: #6db33f;\n        */\n      float:left;\n      position: absolute;\n      -webkit-user-select: none;\n      -khtml-user-select: none;\n      -moz-user-select: none;\n      -o-user-select: none;\n      user-select: none;\n    }\n\n    #palette-floater.joint-paper > svg {\n      background-color: transparent;\n    }\n\n    #palette-paper-container {\n      overflow-y: auto;\n      overflow-x: hidden;\n      background-color: white;\n      color: white;\n    }\n\n    /* Joint JS paper for drawing palette -> canvas DnD visual feedback END */\n\n    /* Palette START */\n\n    .palette-filter {\n      border: 3px solid #6db33f;\n    }\n\n    .palette-filter-textfield {\n      width: 100%;\n      font-size:24px;\n      /* border: 3px solid #6db33f;\n     */\tfont-family: \"Varela Round\",sans-serif;\n      /* \tpadding: 2px; */\n    }\n\n    .palette-paper {\n      background-color: #eeeeee;\n      /*\n        border-right: 7px solid;\n        */\n      border-color: #6db33f;\n      /* \twidth: 170px;\n            height:100%;\n                float: left;\n         */\n    }\n\n    /* Palette END */\n  "],
            encapsulation: ViewEncapsulation.None
        }),
        tslib_1.__param(1, Inject(DOCUMENT)),
        tslib_1.__metadata("design:paramtypes", [ElementRef, Object])
    ], Palette);
    return Palette;
}());
export { Palette };
//# sourceMappingURL=palette.component.js.map