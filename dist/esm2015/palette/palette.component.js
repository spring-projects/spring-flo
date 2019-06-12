import * as tslib_1 from "tslib";
import { Component, ElementRef, Input, Output, EventEmitter, Inject, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { dia } from 'jointjs';
import { Flo } from '../shared/flo-common';
import { Shapes, Constants } from '../shared/shapes';
import { DOCUMENT } from '@angular/platform-browser';
import * as _$ from 'jquery';
const joint = Flo.joint;
const $ = _$;
const DEBOUNCE_TIME = 300;
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
let Palette = class Palette {
    constructor(element, document) {
        this.element = element;
        this.document = document;
        this._metamodelListener = {
            metadataError: (data) => { },
            metadataAboutToChange: () => { },
            metadataChanged: () => this.rebuildPalette()
        };
        this.initialized = false;
        this._filterText = '';
        this.filterTextModel = new Subject();
        this.paletteEntryPadding = { width: 12, height: 12 };
        this.onPaletteEntryDrop = new EventEmitter();
        this.paletteReady = new EventEmitter();
        this.paletteFocus = new EventEmitter();
        this.mouseMoveHanlder = (e) => this.handleDrag(e);
        this.mouseUpHanlder = (e) => this.handleMouseUp(e);
        this.paletteGraph = new joint.dia.Graph();
        this.paletteGraph.set('type', Constants.PALETTE_CONTEXT);
        this._filterText = '';
        this.closedGroups = new Set();
    }
    set paletteSize(size) {
        console.debug('Palette Size: ' + size);
        if (this._paletteSize !== size) {
            this._paletteSize = size;
            this.rebuildPalette();
        }
    }
    onFocus() {
        this.paletteFocus.emit();
    }
    ngOnInit() {
        let element = $('#palette-paper', this.element.nativeElement);
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
        this.palette.on('cell:pointerup', (cellview, evt) => {
            if (this.viewBeingDragged) {
                this.trigger({
                    type: Flo.DnDEventType.DROP,
                    view: this.viewBeingDragged,
                    event: evt
                });
                this.viewBeingDragged = undefined;
            }
            this.clickedElement = undefined;
            $('#palette-floater').remove();
            if (this.floaterpaper) {
                this.floaterpaper.remove();
            }
        });
        // Toggle the header open/closed on a click
        this.palette.on('cell:pointerclick', (cellview, event) => {
            // TODO [design][palette] should the user need to click on the arrow rather than anywhere on the header?
            // Click position within the element would be: evt.offsetX, evt.offsetY
            const cell = cellview.model;
            if (cell.attributes.header) {
                // Toggle the header open/closed
                if (cell.get('isOpen')) {
                    this.rotateClosed(cell);
                }
                else {
                    this.rotateOpen(cell);
                }
            }
            // TODO [palette] ensure other mouse handling events do nothing for headers
            // TODO [palette] move 'metadata' field to the right place (not inside attrs I think)
        });
        $(this.document).on('mouseup', this.mouseUpHanlder);
        if (this.metamodel) {
            this.metamodel.load().then(data => {
                this.buildPalette(data);
                // Add listener to metamodel
                if (this.metamodel && this.metamodel.subscribe) {
                    this.metamodel.subscribe(this._metamodelListener);
                }
                // Add debounced listener to filter text changes
                this.filterTextModel
                    .pipe(debounceTime(DEBOUNCE_TIME))
                    .subscribe((value) => this.rebuildPalette());
                this.initialized = true;
            });
        }
        else {
            console.error('No Metamodel service specified for palette!');
        }
        this._paletteSize = this._paletteSize || $(this.element.nativeElement.parentNode).width();
    }
    ngOnDestroy() {
        if (this.metamodel && this.metamodel.unsubscribe) {
            this.metamodel.unsubscribe(this._metamodelListener);
        }
        $(this.document).off('mouseup', this.mouseUpHanlder);
        this.palette.remove();
    }
    ngOnChanges(changes) {
        // if (changes.hasOwnProperty('paletteSize') || changes.hasOwnProperty('filterText')) {
        //   this.metamodel.load().then(metamodel => this.buildPalette(metamodel));
        // }
    }
    createPaletteGroup(title, isOpen) {
        let newGroupHeader = new joint.shapes.flo.PaletteGroupHeader({ attrs: { text: { text: title } } });
        newGroupHeader.set('header', title);
        if (!isOpen) {
            newGroupHeader.attr({ 'path': { 'transform': 'rotate(-90,15,13)' } });
            newGroupHeader.set('isOpen', false);
        }
        this.paletteGraph.addCell(newGroupHeader);
        return newGroupHeader;
    }
    createPaletteEntry(title, metadata) {
        return Shapes.Factory.createNode({
            renderer: this.renderer,
            paper: this.palette,
            metadata: metadata
        });
    }
    buildPalette(metamodel) {
        let startTime = new Date().getTime();
        this.paletteReady.emit(false);
        this.paletteGraph.clear();
        let filterText = this.filterText;
        if (filterText) {
            filterText = filterText.toLowerCase();
        }
        let paletteNodes = [];
        let groupAdded = new Set();
        let parentWidth = this._paletteSize;
        console.debug(`Parent Width: ${parentWidth}`);
        // The field closedGroups tells us which should not be shown
        // Work out the list of active groups/nodes based on the filter text
        this.metamodel.groups().forEach(group => {
            if (metamodel && metamodel.has(group)) {
                Array.from(metamodel.get(group).keys()).sort().forEach(name => {
                    let node = metamodel.get(group).get(name);
                    if (node) {
                        let nodeActive = !(node.metadata && node.metadata.noPaletteEntry);
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
                                let header = this.createPaletteGroup(group, !this.closedGroups.has(group));
                                header.set('size', { width: parentWidth, height: 30 });
                                paletteNodes.push(header);
                                groupAdded.add(group);
                            }
                            if (!this.closedGroups.has(group)) {
                                paletteNodes.push(this.createPaletteEntry(name, node));
                            }
                        }
                    }
                });
            }
        });
        let cellWidth = 0, cellHeight = 0;
        // Determine the size of the palette entry cell (width and height)
        paletteNodes.forEach(pnode => {
            if (pnode.attr('metadata/name')) {
                let dimension = {
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
        let startX = parentWidth >= cellWidth ? (parentWidth - Math.floor(parentWidth / cellWidth) * cellWidth) / 2 : 0;
        let xpos = startX;
        let ypos = 0;
        let prevNode;
        // Layout palette entry nodes
        paletteNodes.forEach(pnode => {
            let dimension = {
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
    }
    rebuildPalette() {
        if (this.initialized && this.metamodel) {
            this.metamodel.load().then(metamodel => this.buildPalette(metamodel));
        }
    }
    set filterText(text) {
        if (this._filterText !== text) {
            this._filterText = text;
            this.filterTextModel.next(text);
        }
    }
    get filterText() {
        return this._filterText;
    }
    getPaletteView(view) {
        let self = this;
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
    }
    handleMouseUp(event) {
        $(this.document).off('mousemove', this.mouseMoveHanlder);
    }
    trigger(event) {
        this.onPaletteEntryDrop.emit(event);
    }
    handleDrag(event) {
        // TODO offsetX/Y not on firefox
        // console.debug("tracking move: x="+event.pageX+",y="+event.pageY);
        // console.debug('Element = ' + (this.clickedElement ? this.clickedElement.attr('metadata/name'): 'null'));
        if (this.clickedElement && this.clickedElement.attr('metadata')) {
            if (!this.viewBeingDragged) {
                let dataOfClickedElement = this.clickedElement.attr('metadata');
                // custom div if not already built.
                $('<div>', {
                    id: 'palette-floater'
                }).appendTo($('body'));
                let floatergraph = new joint.dia.Graph();
                floatergraph.set('type', Constants.FEEDBACK_CONTEXT);
                const parent = $('#palette-floater');
                this.floaterpaper = new joint.dia.Paper({
                    el: $('#palette-floater'),
                    elementView: this.renderer && this.renderer.getNodeView ? this.renderer.getNodeView() : joint.dia.ElementView,
                    gridSize: 10,
                    model: floatergraph,
                    height: parent.height(),
                    width: parent.width(),
                    validateMagnet: () => false,
                    validateConnection: () => false
                });
                // TODO float thing needs to be bigger otherwise icon label is missing
                // Initiative drag and drop - create draggable element
                let floaternode = Shapes.Factory.createNode({
                    'renderer': this.renderer,
                    'paper': this.floaterpaper,
                    'graph': floatergraph,
                    'metadata': dataOfClickedElement
                });
                // Only node view expected
                let box = this.floaterpaper.findViewByModel(floaternode).getBBox();
                let size = floaternode.get('size');
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
    }
    /*
     * Modify the rotation of the arrow in the header from horizontal(closed) to vertical(open)
     */
    rotateOpen(element) {
        setTimeout(() => this.doRotateOpen(element, 90));
    }
    doRotateOpen(element, angle) {
        angle -= 10;
        element.attr({ 'path': { 'transform': 'rotate(-' + angle + ',15,13)' } });
        if (angle <= 0) {
            element.set('isOpen', true);
            this.closedGroups.delete(element.get('header'));
            this.rebuildPalette();
        }
        else {
            setTimeout(() => this.doRotateOpen(element, angle), 10);
        }
    }
    doRotateClose(element, angle) {
        angle += 10;
        element.attr({ 'path': { 'transform': 'rotate(-' + angle + ',15,13)' } });
        if (angle >= 90) {
            element.set('isOpen', false);
            this.closedGroups.add(element.get('header'));
            this.rebuildPalette();
        }
        else {
            setTimeout(() => this.doRotateClose(element, angle), 10);
        }
    }
    // TODO better name for this function as this does the animation *and* updates the palette
    /*
     * Modify the rotation of the arrow in the header from vertical(open) to horizontal(closed)
     */
    rotateClosed(element) {
        setTimeout(() => this.doRotateClose(element, 0));
    }
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
        template: `
    <div id="palette-filter" class="palette-filter">
      <input type="text" id="palette-filter-textfield" class="palette-filter-textfield" [(ngModel)]="filterText" (focus)="onFocus()"/>
    </div>
    <div id="palette-paper-container" style="height:calc(100% - 46px); width:100%;">
      <div id="palette-paper" class="palette-paper" style="overflow:hidden;"></div>
    </div>
  `,
        styles: [`
    /* Joint JS paper for drawing palette -> canvas DnD visual feedback START */

    #palette-floater {
      /* TODO size relative to paper that goes on it? */
      opacity: 0.75;
      width:170px;
      height:60px;
      background-color: transparent;
      /*
        background-color: #6db33f;
        */
      float:left;
      position: absolute;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -o-user-select: none;
      user-select: none;
    }

    #palette-floater.joint-paper > svg {
      background-color: transparent;
    }

    #palette-paper-container {
      overflow-y: auto;
      overflow-x: hidden;
      background-color: white;
      color: white;
    }

    /* Joint JS paper for drawing palette -> canvas DnD visual feedback END */

    /* Palette START */

    .palette-filter {
      border: 3px solid #6db33f;
    }

    .palette-filter-textfield {
      width: 100%;
      font-size:24px;
      /* border: 3px solid #6db33f;
     */	font-family: "Varela Round",sans-serif;
      /* 	padding: 2px; */
    }

    .palette-paper {
      background-color: #eeeeee;
      /*
        border-right: 7px solid;
        */
      border-color: #6db33f;
      /* 	width: 170px;
            height:100%;
                float: left;
         */
    }

    /* Palette END */
  `],
        encapsulation: ViewEncapsulation.None
    }),
    tslib_1.__param(1, Inject(DOCUMENT)),
    tslib_1.__metadata("design:paramtypes", [ElementRef, Object])
], Palette);
export { Palette };
//# sourceMappingURL=palette.component.js.map