import { Flo } from './flo-common';
import * as _ from 'lodash';
import * as _$ from 'jquery';
var joint = Flo.joint;
var $ = _$;
var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
var isFF = navigator.userAgent.indexOf('Firefox') > 0;
var IMAGE_W = 120;
var IMAGE_H = 35;
var ERROR_MARKER_SIZE = { width: 16, height: 16 };
var HANDLE_SIZE = { width: 10, height: 10 };
joint.shapes.flo = {};
joint.shapes.flo.NODE_TYPE = 'sinspctr.IntNode';
joint.shapes.flo.LINK_TYPE = 'sinspctr.Link';
joint.shapes.flo.DECORATION_TYPE = 'decoration';
joint.shapes.flo.HANDLE_TYPE = 'handle';
var HANDLE_ICON_MAP = new Map();
var REMOVE = 'remove';
HANDLE_ICON_MAP.set(REMOVE, 'icons/delete.svg');
var DECORATION_ICON_MAP = new Map();
var ERROR = 'error';
DECORATION_ICON_MAP.set(ERROR, 'icons/error.svg');
joint.util.cloneDeep = function (obj) {
    return _.cloneDeepWith(obj, function (o) {
        if (_.isObject(o) && !_.isPlainObject(o)) {
            return o;
        }
    });
};
joint.util.filter.redscale = function (args) {
    var amount = Number.isFinite(args.amount) ? args.amount : 1;
    return _.template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 ${d} ${e} ${f} ${g} 0 0 ${h} ${i} ${k} 0 0 0 0 0 1 0"/></filter>', {
        a: 1 - 0.96 * amount,
        b: 0.95 * amount,
        c: 0.01 * amount,
        d: 0.3 * amount,
        e: 0.2 * amount,
        f: 1 - 0.9 * amount,
        g: 0.7 * amount,
        h: 0.05 * amount,
        i: 0.05 * amount,
        k: 1 - 0.1 * amount
    });
};
joint.util.filter.orangescale = function (args) {
    var amount = Number.isFinite(args.amount) ? args.amount : 1;
    return _.template('<filter><feColorMatrix type="matrix" values="${a} ${b} ${c} 0 ${d} ${e} ${f} ${g} 0 ${h} ${i} ${k} ${l} 0 0 0 0 0 1 0"/></filter>', {
        a: 1.0 + 0.5 * amount,
        b: 1.4 * amount,
        c: 0.2 * amount,
        d: 0.3 * amount,
        e: 0.3 * amount,
        f: 1 + 0.05 * amount,
        g: 0.2 * amount,
        h: 0.15 * amount,
        i: 0.3 * amount,
        k: 0.3 * amount,
        l: 1 - 0.6 * amount
    });
};
joint.shapes.flo.Node = joint.shapes.basic.Generic.extend({
    markup: '<g class="shape"><image class="image" /></g>' +
        '<rect class="border-white"/>' +
        '<rect class="border"/>' +
        '<rect class="box"/>' +
        '<text class="label"/>' +
        '<text class="label2"></text>' +
        '<rect class="input-port" />' +
        '<rect class="output-port"/>' +
        '<rect class="output-port-cover"/>',
    defaults: joint.util.deepSupplement({
        type: joint.shapes.flo.NODE_TYPE,
        position: { x: 0, y: 0 },
        size: { width: IMAGE_W, height: IMAGE_H },
        attrs: {
            '.': { magnet: false },
            // rounded edges around image
            '.border': {
                width: IMAGE_W,
                height: IMAGE_H,
                rx: 3,
                ry: 3,
                'fill-opacity': 0,
                stroke: '#eeeeee',
                'stroke-width': 0
            },
            '.box': {
                width: IMAGE_W,
                height: IMAGE_H,
                rx: 3,
                ry: 3,
                //'fill-opacity': 0, // see through
                stroke: '#6db33f',
                fill: '#eeeeee',
                'stroke-width': 1
            },
            '.input-port': {
                port: 'input',
                height: 8, width: 8,
                magnet: true,
                fill: '#eeeeee',
                transform: 'translate(' + -4 + ',' + ((IMAGE_H / 2) - 4) + ')',
                stroke: '#34302d',
                'stroke-width': 1
            },
            '.output-port': {
                port: 'output',
                height: 8, width: 8,
                magnet: true,
                fill: '#eeeeee',
                transform: 'translate(' + (IMAGE_W - 4) + ',' + ((IMAGE_H / 2) - 4) + ')',
                stroke: '#34302d',
                'stroke-width': 1
            },
            '.label': {
                'text-anchor': 'middle',
                'ref-x': 0.5,
                // 'ref-y': -12, // jointjs specific: relative position to ref'd element
                'ref-y': 0.3,
                ref: '.border',
                fill: 'black',
                'font-size': 14
            },
            '.label2': {
                'text': '\u21d2',
                'text-anchor': 'middle',
                'ref-x': 0.15,
                'ref-y': 0.2,
                ref: '.border',
                // transform: 'translate(' + (IMAGE_W/2) + ',' + (IMAGE_H/2) + ')',
                fill: 'black',
                'font-size': 24
            },
            '.shape': {},
            '.image': {
                width: IMAGE_W,
                height: IMAGE_H
            }
        }
    }, joint.shapes.basic.Generic.prototype.defaults)
});
joint.shapes.flo.Link = joint.dia.Link.extend({
    defaults: joint.util.deepSupplement({
        type: joint.shapes.flo.LINK_TYPE,
        attrs: {
            '.connection': { stroke: '#34302d', 'stroke-width': 2 },
            // Lots of alternatives that have been played with:
            //	            '.smoooth': true
            //	            '.marker-source': { stroke: '#9B59B6', fill: '#9B59B6', d: 'M24.316,5.318,9.833,13.682,9.833,5.5,5.5,5.5,5.5,25.5,9.833,25.5,9.833,17.318,24.316,25.682z' },
            //	            '.marker-target': { stroke: '#F39C12', fill: '#F39C12', d: 'M14.615,4.928c0.487-0.986,1.284-0.986,1.771,0l2.249,4.554c0.486,0.986,1.775,1.923,2.864,2.081l5.024,0.73c1.089,0.158,1.335,0.916,0.547,1.684l-3.636,3.544c-0.788,0.769-1.28,2.283-1.095,3.368l0.859,5.004c0.186,1.085-0.459,1.553-1.433,1.041l-4.495-2.363c-0.974-0.512-2.567-0.512-3.541,0l-4.495,2.363c-0.974,0.512-1.618,0.044-1.432-1.041l0.858-5.004c0.186-1.085-0.307-2.6-1.094-3.368L3.93,13.977c-0.788-0.768-0.542-1.525,0.547-1.684l5.026-0.73c1.088-0.158,2.377-1.095,2.864-2.081L14.615,4.928z' },
            //	        	'.connection': { 'stroke':'black'},
            //	        	'.': { filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 2 } } },
            //	        	'.connection': { 'stroke-width': 10, 'stroke-linecap': 'round' },
            // This means: moveto 10 0, lineto 0 5, lineto, 10 10 closepath(z)
            //	        	'.marker-target': { d: 'M 5 0 L 0 7 L 5 14 z', stroke: '#34302d','stroke-width': 1},
            //	        	'.marker-target': { d: 'M 14 2 L 9,2 L9,0 L 0,7 L 9,14 L 9,12 L 14,12 z', 'stroke-width': 1, fill: '#34302d', stroke: '#34302d'},
            //	        	'.marker-source': {d: 'M 5 0 L 5,10 L 0,10 L 0,0 z', 'stroke-width': 0, fill: '#34302d', stroke: '#34302d'},
            //	            '.marker-target': { stroke: '#E74C3C', fill: '#E74C3C', d: 'M 10 0 L 0 5 L 10 10 z' },
            '.marker-arrowheads': { display: 'none' },
            '.tool-options': { display: 'none' }
        },
    }, joint.dia.Link.prototype.defaults)
});
joint.shapes.flo.LinkView = joint.dia.LinkView.extend({
    options: joint.util.deepSupplement({}, joint.dia.LinkView.prototype.options),
    _beforeArrowheadMove: function () {
        if (this.model.get('source').id) {
            this._oldSource = this.model.get('source');
        }
        if (this.model.get('target').id) {
            this._oldTarget = this.model.get('target');
        }
        joint.dia.LinkView.prototype._beforeArrowheadMove.apply(this, arguments);
    },
    _afterArrowheadMove: function () {
        joint.dia.LinkView.prototype._afterArrowheadMove.apply(this, arguments);
        if (!this.model.get('source').id) {
            if (this._oldSource) {
                this.model.set('source', this._oldSource);
            }
            else {
                this.model.remove();
            }
        }
        if (!this.model.get('target').id) {
            if (this._oldTarget) {
                this.model.set('target', this._oldTarget);
            }
            else {
                this.model.remove();
            }
        }
        delete this._oldSource;
        delete this._oldTarget;
    }
});
// TODO: must do cleanup for the `mainElementView'
joint.shapes.flo.ElementView = joint.dia.ElementView.extend({
    // canShowTooltip: true,
    beingDragged: false,
    // _tempZorder: 0,
    _tempOpacity: 1.0,
    _hovering: false,
    dragLinkStart: function (evt, magnet, x, y) {
        this.model.startBatch('add-link');
        var linkView = this.addLinkFromMagnet(magnet, x, y);
        // backwards compatiblity events
        joint.dia.CellView.prototype.pointerdown.apply(linkView, [evt, x, y]);
        linkView.notify('link:pointerdown', evt, x, y);
        /*** START MAIN DIFF ***/
        var sourceOrTarget = $(magnet).attr('port') === 'input' ? 'source' : 'target';
        linkView.eventData(evt, linkView.startArrowheadMove(sourceOrTarget, { whenNotAllowed: 'remove' }));
        /*** END MAIN DIFF ***/
        this.eventData(evt, { linkView: linkView });
    },
    addLinkFromMagnet: function (magnet, x, y) {
        var paper = this.paper;
        var graph = paper.model;
        var link = paper.getDefaultLink(this, magnet);
        var sourceEnd, targetEnd;
        /*** START MAIN DIFF ***/
        if ($(magnet).attr('port') === 'input') {
            sourceEnd = { x: x, y: y };
            targetEnd = this.getLinkEnd(magnet, x, y, link, 'target');
        }
        else {
            sourceEnd = this.getLinkEnd(magnet, x, y, link, 'source');
            targetEnd = { x: x, y: y };
        }
        /*** END MAIN DIFF ***/
        link.set({
            source: sourceEnd,
            target: targetEnd
        }).addTo(graph, {
            async: false,
            ui: true
        });
        return link.findView(paper);
    },
    // pointerdown: function(evt: any, x: number, y: number) {
    //   // this.canShowTooltip = false;
    //   // this.hideTooltip();
    //   this.beingDragged = false;
    //   this._tempOpacity = this.model.attr('./opacity');
    //
    //   this.model.trigger('batch:start');
    //
    //   if ( // target is a valid magnet start linking
    //     evt.target.getAttribute('magnet') &&
    //     this.paper.options.validateMagnet.call(this.paper, this, evt.target)
    //   ) {
    //     let link = this.paper.getDefaultLink(this, evt.target);
    //     if ($(evt.target).attr('port') === 'input') {
    //       link.set({
    //         source: { x: x, y: y },
    //         target: {
    //           id: this.model.id,
    //           selector: this.getSelector(evt.target),
    //           port: evt.target.getAttribute('port')
    //         }
    //       });
    //     } else {
    //       link.set({
    //         source: {
    //           id: this.model.id,
    //           selector: this.getSelector(evt.target),
    //           port: evt.target.getAttribute('port')
    //         },
    //         target: { x: x, y: y }
    //       });
    //     }
    //     this.paper.model.addCell(link);
    //     this._linkView = this.paper.findViewByModel(link);
    //     if ($(evt.target).attr('port') === 'input') {
    //       this._linkView.startArrowheadMove('source');
    //     } else {
    //       this._linkView.startArrowheadMove('target');
    //     }
    //     this.paper.__creatingLinkFromPort = true;
    //   } else {
    //     this._dx = x;
    //     this._dy = y;
    //     joint.dia.CellView.prototype.pointerdown.apply(this, arguments);
    //   }
    // },
    drag: function (evt, x, y) {
        var interactive = _.isFunction(this.options.interactive) ? this.options.interactive(this, 'pointermove') :
            this.options.interactive;
        if (interactive !== false) {
            this.paper.trigger('dragging-node-over-canvas', { type: Flo.DnDEventType.DRAG, view: this, event: evt });
        }
        joint.dia.ElementView.prototype.drag.apply(this, arguments);
    },
    dragEnd: function (evt, x, y) {
        this.paper.trigger('dragging-node-over-canvas', { type: Flo.DnDEventType.DROP, view: this, event: evt });
        joint.dia.ElementView.prototype.dragEnd.apply(this, arguments);
    },
});
joint.shapes.flo.ErrorDecoration = joint.shapes.basic.Generic.extend({
    markup: '<g class="rotatable"><g class="scalable"><image/></g></g>',
    defaults: joint.util.deepSupplement({
        type: joint.shapes.flo.DECORATION_TYPE,
        size: ERROR_MARKER_SIZE,
        attrs: {
            'image': ERROR_MARKER_SIZE
        }
    }, joint.shapes.basic.Generic.prototype.defaults)
});
export var Constants;
(function (Constants) {
    Constants.REMOVE_HANDLE_TYPE = REMOVE;
    Constants.PROPERTIES_HANDLE_TYPE = 'properties';
    Constants.ERROR_DECORATION_KIND = ERROR;
    Constants.PALETTE_CONTEXT = 'palette';
    Constants.CANVAS_CONTEXT = 'canvas';
    Constants.FEEDBACK_CONTEXT = 'feedback';
})(Constants || (Constants = {}));
export var Shapes;
(function (Shapes) {
    var Factory = /** @class */ (function () {
        function Factory() {
        }
        /**
         * Create a JointJS node that embeds extra metadata (properties).
         */
        Factory.createNode = function (params) {
            var renderer = params.renderer;
            var paper = params.paper;
            var metadata = params.metadata;
            var position = params.position;
            var props = params.props;
            var graph = params.graph || (params.paper ? params.paper.model : undefined);
            var node;
            if (!position) {
                position = { x: 0, y: 0 };
            }
            if (renderer && _.isFunction(renderer.createNode)) {
                node = renderer.createNode(metadata, props);
            }
            else {
                node = new joint.shapes.flo.Node();
                if (metadata) {
                    node.attr('.label/text', metadata.name);
                }
            }
            node.set('type', joint.shapes.flo.NODE_TYPE);
            if (position) {
                node.set('position', position);
            }
            if (props) {
                Array.from(props.keys()).forEach(function (key) { return node.attr("props/" + key, props.get(key)); });
            }
            node.attr('metadata', metadata);
            if (graph) {
                graph.addCell(node);
            }
            if (renderer && _.isFunction(renderer.initializeNewNode)) {
                var descriptor = {
                    paper: paper,
                    graph: graph
                };
                renderer.initializeNewNode(node, descriptor);
            }
            return node;
        };
        Factory.createLink = function (params) {
            var renderer = params.renderer;
            var paper = params.paper;
            var metadata = params.metadata;
            var source = params.source;
            var target = params.target;
            var props = params.props;
            var graph = params.graph || (params.paper ? params.paper.model : undefined);
            var link;
            if (renderer && _.isFunction(renderer.createLink)) {
                link = renderer.createLink(source, target, metadata, props);
            }
            else {
                link = new joint.shapes.flo.Link();
            }
            if (source) {
                link.set('source', source);
            }
            if (target) {
                link.set('target', target);
            }
            link.set('type', joint.shapes.flo.LINK_TYPE);
            if (metadata) {
                link.attr('metadata', metadata);
            }
            if (props) {
                Array.from(props.keys()).forEach(function (key) { return link.attr("props/" + key, props.get(key)); });
            }
            if (graph) {
                graph.addCell(link);
            }
            if (renderer && _.isFunction(renderer.initializeNewLink)) {
                var descriptor = {
                    paper: paper,
                    graph: graph
                };
                renderer.initializeNewLink(link, descriptor);
            }
            // prevent creation of link breaks
            link.attr('.marker-vertices/display', 'none');
            return link;
        };
        Factory.createDecoration = function (params) {
            var renderer = params.renderer;
            var paper = params.paper;
            var parent = params.parent;
            var kind = params.kind;
            var messages = params.messages;
            var location = params.position;
            var graph = params.graph || (params.paper ? params.paper.model : undefined);
            if (!location) {
                location = { x: 0, y: 0 };
            }
            var decoration;
            if (renderer && _.isFunction(renderer.createDecoration)) {
                decoration = renderer.createDecoration(kind, parent);
            }
            else {
                decoration = new joint.shapes.flo.ErrorDecoration({
                    attrs: {
                        image: { 'xlink:href': DECORATION_ICON_MAP.get(kind) },
                    }
                });
            }
            decoration.set('type', joint.shapes.flo.DECORATION_TYPE);
            decoration.set('position', location);
            if ((isChrome || isFF) && parent && typeof parent.get('z') === 'number') {
                decoration.set('z', parent.get('z') + 1);
            }
            decoration.attr('./kind', kind);
            decoration.attr('messages', messages);
            if (graph) {
                graph.addCell(decoration);
            }
            parent.embed(decoration);
            if (renderer && _.isFunction(renderer.initializeNewDecoration)) {
                var descriptor = {
                    paper: paper,
                    graph: graph
                };
                renderer.initializeNewDecoration(decoration, descriptor);
            }
            return decoration;
        };
        Factory.createHandle = function (params) {
            var renderer = params.renderer;
            var paper = params.paper;
            var parent = params.parent;
            var kind = params.kind;
            var location = params.position;
            var graph = params.graph || (params.paper ? params.paper.model : undefined);
            var handle;
            if (!location) {
                location = { x: 0, y: 0 };
            }
            if (renderer && _.isFunction(renderer.createHandle)) {
                handle = renderer.createHandle(kind, parent);
            }
            else {
                handle = new joint.shapes.flo.ErrorDecoration({
                    size: HANDLE_SIZE,
                    attrs: {
                        'image': {
                            'xlink:href': HANDLE_ICON_MAP.get(kind)
                        }
                    }
                });
            }
            handle.set('type', joint.shapes.flo.HANDLE_TYPE);
            handle.set('position', location);
            if ((isChrome || isFF) && parent && typeof parent.get('z') === 'number') {
                handle.set('z', parent.get('z') + 1);
            }
            handle.attr('./kind', kind);
            if (graph) {
                graph.addCell(handle);
            }
            parent.embed(handle);
            if (renderer && _.isFunction(renderer.initializeNewHandle)) {
                var descriptor = {
                    paper: paper,
                    graph: graph
                };
                renderer.initializeNewHandle(handle, descriptor);
            }
            return handle;
        };
        return Factory;
    }());
    Shapes.Factory = Factory;
})(Shapes || (Shapes = {}));
//# sourceMappingURL=shapes.js.map