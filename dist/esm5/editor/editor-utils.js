import { Flo } from '../shared/flo-common';
import * as _ from 'lodash';
var joint = Flo.joint;
import * as _$ from 'jquery';
var $ = _$;
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.fanRoute = function (graph, cell) {
        if (cell instanceof joint.dia.Element) {
            var links = graph.getConnectedLinks(cell);
            var groupsOfOverlappingLinks = _.groupBy(links, function (link) {
                // the key of the group is the model id of the link's source or target, but not our cell id.
                var sourceId = link.get('source').id;
                var targetId = link.get('target').id;
                return cell.id !== sourceId ? sourceId : targetId;
            });
            _.each(groupsOfOverlappingLinks, function (group, key) {
                // If the member of the group has both source and target model adjust vertices.
                var toRoute = {};
                if (key !== undefined) {
                    group.forEach(function (link) {
                        if (link.get('source').id === cell.get('id') && link.get('target').id) {
                            toRoute[link.get('target').id] = link;
                        }
                        else if (link.get('target').id === cell.get('id') && link.get('source').id) {
                            toRoute[link.get('source').id] = link;
                        }
                    });
                    Object.keys(toRoute).forEach(function (k) {
                        Utils.fanRoute(graph, toRoute[k]);
                    });
                }
            });
        }
        else if (cell instanceof joint.dia.Link) {
            // The cell is a link. Let's find its source and target models.
            var srcId_1 = cell.get('source').id || cell.previous('source').id;
            var trgId_1 = cell.get('target').id || cell.previous('target').id;
            // If one of the ends is not a model, the link has no siblings.
            if (!srcId_1 || !trgId_1) {
                return;
            }
            var siblings = graph.getLinks().filter(function (sibling) {
                var _srcId = sibling.get('source').id;
                var _trgId = sibling.get('target').id;
                var vertices = sibling.get('vertices');
                var fanRouted = !vertices || vertices.length === 0 || sibling.get('fanRouted');
                return ((_srcId === srcId_1 && _trgId === trgId_1) || (_srcId === trgId_1 && _trgId === srcId_1)) && fanRouted;
            });
            switch (siblings.length) {
                case 0:
                    // The link was removed and had no siblings.
                    break;
                case 1:
                    // There is only one link between the source and target. No vertices needed.
                    var vertices = cell.get('vertices');
                    if (vertices && vertices.length && cell.get('fanRouted')) {
                        cell.unset('vertices');
                    }
                    break;
                default:
                    // There is more than one siblings. We need to create vertices.
                    // First of all we'll find the middle point of the link.
                    var source = graph.getCell(srcId_1);
                    var target = graph.getCell(trgId_1);
                    if (!source || !target) {
                        // When clearing the graph it may happen that some nodes are gone and some are left
                        return;
                    }
                    var srcCenter = source.getBBox().center();
                    var trgCenter = target.getBBox().center();
                    var midPoint_1 = joint.g.line(srcCenter, trgCenter).midpoint();
                    // Then find the angle it forms.
                    var theta_1 = srcCenter.theta(trgCenter);
                    // This is the maximum distance between links
                    var gap_1 = 20;
                    siblings.forEach(function (sibling, index) {
                        // We want the offset values to be calculated as follows 0, 20, 20, 40, 40, 60, 60 ..
                        var offset = gap_1 * Math.ceil(index / 2);
                        // Now we need the vertices to be placed at points which are 'offset' pixels distant
                        // from the first link and forms a perpendicular angle to it. And as index goes up
                        // alternate left and right.
                        //
                        //  ^  odd indexes
                        //  |
                        //  |---->  index 0 line (straight line between a source center and a target center.
                        //  |
                        //  v  even indexes
                        var sign = index % 2 ? 1 : -1;
                        var angle = joint.g.toRad(theta_1 + sign * 90);
                        // We found the vertex.
                        var vertex = joint.g.point.fromPolar(offset, angle, midPoint_1);
                        sibling.set('fanRouted', true);
                        sibling.set('vertices', [{ x: vertex.x, y: vertex.y }], { 'fanRouted': true });
                    });
            }
        }
    };
    Utils.isCustomPaperEvent = function (args) {
        return args.length === 5 &&
            _.isString(args[0]) &&
            (args[0].indexOf('link:') === 0 || args[0].indexOf('element:') === 0) &&
            args[1] instanceof $.Event &&
            args[2] instanceof joint.dia.CellView &&
            _.isNumber(args[3]) &&
            _.isNumber(args[4]);
    };
    return Utils;
}());
export { Utils };
//# sourceMappingURL=editor-utils.js.map