import {Component, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, Inject, ViewEncapsulation} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { dia } from 'jointjs';
import { Flo } from '../shared/flo-common';
import { Shapes, Constants } from '../shared/shapes';
import { DOCUMENT } from '@angular/common'
import * as _$ from 'jquery';
const joint: any = Flo.joint;
const $: any = _$;

const DEBOUNCE_TIME = 300;

joint.shapes.flo.PaletteGroupHeader = joint.shapes.basic.Generic.extend({
  // The path is the open/close arrow, defaults to vertical (open)
  markup: '<g class="scalable"><rect/></g><text/><g class="rotatable"><path d="m 10 10 l 5 8.7 l 5 -8.7 z"/></g>',
  defaults: joint.util.deepSupplement({
    type: 'palette.groupheader',
    size: {width: 170, height: 30},
    position: {x: 0, y: 0},
    attrs: {
      'rect': { fill: '#34302d', 'stroke-width': 1, stroke: '#6db33f', 'follow-scale': true, width: 80, height: 40 },
      'text': {
        text: '',
        fill: '#eeeeee',
        'ref-x': 0.5,
        'ref-y': 7,
        'x-alignment': 'middle',
        'font-size': 18/*, 'font-weight': 'bold', 'font-variant': 'small-caps', 'text-transform': 'capitalize'*/
      },
      'path': { fill: 'white', 'stroke-width': 2, stroke: 'white'/*,transform:'rotate(90,15,15)'*/}
    },
    // custom properties
    isOpen: true
  }, joint.shapes.basic.Generic.prototype.defaults)
});

@Component({
  selector: 'flo-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class Palette implements OnInit, OnDestroy, OnChanges {

  private _metamodelListener: Flo.MetamodelListener = {
    metadataError: (data) => {},
    metadataAboutToChange: () => {},
    metadataChanged: () => this.rebuildPalette()
  };

  /**
   * The names of any groups in the palette that have been deliberately closed (the arrow clicked on)
   */
  private closedGroups: Set<string>;

  /**
   * Model of the clicked element
   */
  private clickedElement: dia.Cell | undefined;

  private viewBeingDragged: dia.CellView | undefined;

  private initialized = false;

  private _paletteSize: number;

  private _filterText = '';

  private paletteGraph: dia.Graph;

  private palette: dia.Paper;

  private floaterpaper: dia.Paper;

  private filterTextModel = new Subject<string>();

  @Input()
  metamodel: Flo.Metamodel;

  @Input()
  renderer: Flo.Renderer;

  @Input()
  paletteEntryPadding: dia.Size = {width: 12, height: 12};

  @Output()
  onPaletteEntryDrop = new EventEmitter<Flo.DnDEvent>();

  @Output()
  paletteReady = new EventEmitter<boolean>();

  @Output()
  paletteFocus = new EventEmitter<void>();

  private mouseMoveHanlder = (e: any) => this.handleDrag(e);
  private mouseUpHanlder = (e: any) => this.handleMouseUp(e);

  @Input()
  set paletteSize(size: number) {
    console.debug('Palette Size: ' + size);
    if (this._paletteSize !== size) {
      this._paletteSize = size;
      this.rebuildPalette();
    }
  }

  constructor(private element: ElementRef, @Inject(DOCUMENT) private document: any) {
    this.paletteGraph = new joint.dia.Graph();
    this.paletteGraph.set('type', Constants.PALETTE_CONTEXT);
    this._filterText = '';

    this.closedGroups = new Set<string>();
  }

  onFocus(): void {
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

    this.palette.on('cell:pointerup', (cellview: dia.CellView, evt: any) => {
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
    this.palette.on('cell:pointerclick', (cellview: dia.CellView, event: any) => {
        // TODO [design][palette] should the user need to click on the arrow rather than anywhere on the header?
        // Click position within the element would be: evt.offsetX, evt.offsetY
        const cell: dia.Cell = cellview.model;
        if (cell.attributes.header) {
          // Toggle the header open/closed
          // if (cell.get('isOpen')) {
          //   this.rotateClosed(cell);
          // } else {
          //   this.rotateOpen(cell);
          // }
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
    } else {
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

  ngOnChanges(changes: SimpleChanges) {
    // if (changes.hasOwnProperty('paletteSize') || changes.hasOwnProperty('filterText')) {
    //   this.metamodel.load().then(metamodel => this.buildPalette(metamodel));
    // }
  }

  private createPaletteGroup(title: string, isOpen: boolean): dia.Element {
    const paletteRenderer: Flo.PaletteRenderer = this.renderer.getPaletteRenderer ? this.renderer.getPaletteRenderer() : {
      createGroupHeader: (title: string, isOpen: boolean) => {
        const newGroupHeader = new joint.shapes.flo.PaletteGroupHeader({attrs: {text: {text: title}}});
        if (!isOpen) {
          newGroupHeader.attr({'path': {'transform': 'rotate(-90,15,13)'}});
        }
        return newGroupHeader;
      },
      onClose: (groupView: dia.CellView) => this.rotateClosed(groupView.model),
      onOpen: (groupView: dia.CellView) => this.rotateOpen(groupView.model)
    };
    let newGroupHeader = paletteRenderer.createGroupHeader(title, isOpen);
    if (!isOpen) {
      newGroupHeader.set('isOpen', false);
    }
    newGroupHeader.set('header', title);

    this.paletteGraph.addCell(newGroupHeader);

    const view = this.palette.findViewByModel(newGroupHeader);

    view.on('cell:pointerclick', () => {
      if (newGroupHeader.get('isOpen')) {
        if (typeof paletteRenderer.onClose === 'function') {
          paletteRenderer.onClose(view).then(() => {
            newGroupHeader.set('isOpen', false);
            this.closedGroups.add(newGroupHeader.get('header'));
            this.rebuildPalette();
          });
        } else {
          newGroupHeader.set('isOpen', false);
          this.closedGroups.add(newGroupHeader.get('header'));
          this.rebuildPalette();
        }
      } else {
        if (typeof paletteRenderer.onOpen === 'function') {
          paletteRenderer.onOpen(view).then(() => {
            newGroupHeader.set('isOpen', true);
            this.closedGroups.delete(newGroupHeader.get('header'));
            this.rebuildPalette();
          });
        } else {
          newGroupHeader.set('isOpen', true);
          this.closedGroups.delete(newGroupHeader.get('header'));
          this.rebuildPalette();
        }
      }
    });

    return newGroupHeader;
  }

  private createPaletteEntry(title: string, metadata: Flo.ElementMetadata) {
    return Shapes.Factory.createNode({
      renderer: this.renderer,
      paper: this.palette,
      metadata: metadata
    });
  }

  private buildPalette(metamodel: Map<string, Map<string, Flo.ElementMetadata>>) {
    let startTime: number = new Date().getTime();

    this.paletteReady.emit(false);
    this.paletteGraph.clear();

    let filterText = this.filterText;
    if (filterText) {
      filterText = filterText.toLowerCase();
    }

    let paletteNodes: Array<dia.Element> = [];
    let groupAdded: Set<string> = new Set<string>();

    let parentWidth: number = this._paletteSize;
    console.debug(`Parent Width: ${parentWidth}`);

    // The field closedGroups tells us which should not be shown
    // Work out the list of active groups/nodes based on the filter text
    this.metamodel.groups().forEach(group => {
      if (metamodel && metamodel.has(group)) {
        Array.from(metamodel.get(group)!.keys()).sort().forEach(name => {
          let node = metamodel.get(group)!.get(name);
          if (node) {
            let nodeActive: boolean = !(node.metadata && node.metadata.noPaletteEntry);
            if (nodeActive && filterText) {
              nodeActive = false;
              if (name.toLowerCase().indexOf(filterText) !== -1) {
                nodeActive = true;
              } else if (group.toLowerCase().indexOf(filterText) !== -1) {
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
                let header: dia.Element = this.createPaletteGroup(group, !this.closedGroups.has(group));
                header.set('size', {width: parentWidth, height: header.size().height || 30});
                console.log('Group size set to: ' + JSON.stringify(header.size()));
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
        const elementSize = this.palette.findViewByModel(pnode).getBBox();
        let dimension: dia.Size = {
          width: elementSize.width,
          height: elementSize.height
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
    let startX: number = parentWidth >= cellWidth ? (parentWidth - Math.floor(parentWidth / cellWidth) * cellWidth) / 2 : 0;
    let xpos = startX;
    let ypos = 0;
    let prevNode: dia.Element;

    // Layout palette entry nodes
    paletteNodes.forEach(pnode => {
      let dimension: dia.Size = {
        width: pnode.get('size').width,
        height: pnode.get('size').height
      };
      if (pnode.get('header')) { //attributes.attrs.header) {
        // Palette entry header
        xpos = startX;
        pnode.set('position', {x: 0, y: ypos});
        ypos += dimension.height + 5;
      } else {
        // Palette entry element
        if (xpos + cellWidth > parentWidth) {
          // Not enough real estate to place entry in a row - reset x position and leave the y pos which is next line
          xpos = startX;
          pnode.set('position', { x: xpos + (cellWidth - dimension.width) / 2, y: ypos + (cellHeight - dimension.height) / 2});
        } else {
          // Enough real estate to place entry in a row - adjust y position
          if (prevNode && prevNode.attr('metadata/name')) {
            ypos -= cellHeight;
          }
          pnode.set('position', { x: xpos + (cellWidth - dimension.width) / 2, y: ypos + (cellHeight - dimension.height) / 2});
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

  set filterText(text: string) {
    if (this._filterText !== text) {
      this._filterText = text;
      this.filterTextModel.next(text);
    }
  }

  get filterText(): string {
    return this._filterText;
  }

  private getPaletteView(view: any): dia.Element {
    let self: Palette = this;
    return view.extend({
      pointerdown: function(/*evt, x, y*/) {
        // Remove the tooltip
        // $('.node-tooltip').remove();
        // TODO move metadata to the right place (not inside attrs I think)
        self.clickedElement = this.model;
        if (self.clickedElement && self.clickedElement.attr('metadata')) {
          $(self.document).on('mousemove', self.mouseMoveHanlder);
        }
      },
      pointermove: function(/*evt, x, y*/) {
        // Nothing to prevent move within the palette canvas
      },
      // events: {
      //   // Tooltips on the palette elements
      //   'mouseenter': function(evt) {
      //
      //     // Ignore 'mouseenter' if any other buttons are pressed
      //     if (evt.buttons) {
      //       return;
      //     }
      //
      //     var model = this.model;
      //     var metadata = model.attr('metadata');
      //     if (!metadata) {
      //       return;
      //     }
      //
      //     this.showTooltip(evt.pageX, evt.pageY);
      //   },
      //   // TODO bug here - if the call to get the info takes a while, the tooltip may appear after the pointer has left the cell
      //   'mouseleave': function(/*evt, x,y*/) {
      //     this.hideTooltip();
      //   },
      //   'mousemove': function(evt) {
      //     this.moveTooltip(evt.pageX, evt.pageY);
      //   }
      // },

      // showTooltip: function(x, y) {
      //   var model = this.model;
      //   var metadata = model.attr('metadata');
      //   // TODO refactor to use tooltip module
      //   var nodeTooltip = document.createElement('div');
      //   $(nodeTooltip).addClass('node-tooltip');
      //   $(nodeTooltip).appendTo($('body')).fadeIn('fast');
      //   var nodeDescription = document.createElement('div');
      //   $(nodeTooltip).addClass('tooltip-description');
      //   $(nodeTooltip).append(nodeDescription);
      //
      //   metadata.get('description').then(function(description) {
      //     $(nodeDescription).text(description ? description: model.attr('metadata/name'));
      //   }, function() {
      //     $(nodeDescription).text(model.attr('metadata/name'));
      //   });
      //
      //   if (!metadata.metadata || !metadata.metadata['hide-tooltip-options']) {
      //     metadata.get('properties').then(function(metaProps) {
      //       if (metaProps) {
      //         Object.keys(metaProps).sort().forEach(function(propertyName) {
      //           var optionRow = document.createElement('div');
      //           var optionName = document.createElement('span');
      //           var optionDescription = document.createElement('span');
      //           $(optionName).addClass('node-tooltip-option-name');
      //           $(optionDescription).addClass('node-tooltip-option-description');
      //           $(optionName).text(metaProps[propertyName].name);
      //           $(optionDescription).text(metaProps[propertyName].description);
      //           $(optionRow).append(optionName);
      //           $(optionRow).append(optionDescription);
      //           $(nodeTooltip).append(optionRow);
      //         });
      //       }
      //     }, function(error) {
      //       if (error) {
      //         $log.error(error);
      //       }
      //     });
      //   }
      //
      //   var mousex = x + 10;
      //   var mousey = y + 10;
      //   $('.node-tooltip').css({ top: mousey, left: mousex });
      // },
      //
      // hideTooltip: function() {
      //   $('.node-tooltip').remove();
      // },
      //
      // moveTooltip: function(x, y) {
      //   var mousex = x + 10; // Get X coordinates
      //   var mousey = y + 10; // Get Y coordinates
      //   $('.node-tooltip').css({ top: mousey, left: mousex });
      // }

    });
  }

  private handleMouseUp(event: any) {
    $(this.document).off('mousemove', this.mouseMoveHanlder);
  }

  private trigger(event: Flo.DnDEvent) {
    this.onPaletteEntryDrop.emit(event);
  }

  private handleDrag(event: any) {
    // TODO offsetX/Y not on firefox
    // console.debug("tracking move: x="+event.pageX+",y="+event.pageY);
    // console.debug('Element = ' + (this.clickedElement ? this.clickedElement.attr('metadata/name'): 'null'));
    if (this.clickedElement && this.clickedElement.attr('metadata')) {
      if (!this.viewBeingDragged) {

        let dataOfClickedElement: Flo.ElementMetadata = this.clickedElement.attr('metadata');
        // custom div if not already built.
        $('<div>', {
          id: 'palette-floater'
        }).appendTo($('body'));

        let floatergraph: dia.Graph = new joint.dia.Graph();
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
        let floaternode: dia.Element = Shapes.Factory.createNode({
          'renderer': this.renderer,
          'paper': this.floaterpaper,
          'graph': floatergraph,
          'metadata': dataOfClickedElement
        });

        // Only node view expected
        const view = this.floaterpaper.findViewByModel(floaternode);
        let box: dia.BBox = (<dia.ElementView>view).getBBox();
        let size: dia.Size = floaternode.get('size');
        parent.css('width', size.width + 10);
        parent.css('height', size.height + 10);
        // Account for node real size including ports
        floaternode.translate(box.width - size.width, box.height - size.height);
        this.viewBeingDragged = this.floaterpaper.findViewByModel(floaternode);
        parent.offset({left: event.pageX + 5, top: event.pageY + 5});
      } else {
        $('#palette-floater').offset({left: event.pageX + 5, top: event.pageY + 5});
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
  private rotateOpen(element: dia.Cell): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => this.doRotateOpen(element, 90).then(() => {
        resolve();
      }));
    });
  }

  private doRotateOpen(element: dia.Cell, angle: number): Promise<void> {
    return new Promise(resolve => {
      angle -= 10;
      element.attr({'path': {'transform': 'rotate(-' + angle + ',15,13)'}});
      if (angle <= 0) {
        resolve();
      } else {
        setTimeout(() => this.doRotateOpen(element, angle).then(() => resolve()), 10);
      }
    });
  }

  private doRotateClose(element: dia.Cell, angle: number): Promise<void> {
    return new Promise(resolve => {
      angle += 10;
      element.attr({'path': {'transform': 'rotate(-' + angle + ',15,13)'}});
      if (angle >= 90) {
        resolve();
      } else {
        setTimeout(() => this.doRotateClose(element, angle).then(() => resolve()), 10);
      }
    });
  }

  // TODO better name for this function as this does the animation *and* updates the palette

  /*
   * Modify the rotation of the arrow in the header from vertical(open) to horizontal(closed)
   */
  private rotateClosed(element: dia.Cell): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.doRotateClose(element, 0).then(() => {
          resolve();
        });
      });
    });
  }

}
