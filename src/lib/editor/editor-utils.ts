import { dia } from 'jointjs';
import { Flo } from '../shared/flo-common';
import * as _ from 'lodash';
const joint: any = Flo.joint;
import * as _$ from 'jquery';
const $: any = _$;


export class Utils {

  static fanRoute(graph: dia.Graph, cell: dia.Cell) {
    if (cell instanceof joint.dia.Element) {

      const links = graph.getConnectedLinks(cell);

      const groupsOfOverlappingLinks = _.groupBy(links, (link: dia.Link) => {
        // the key of the group is the model id of the link's source or target, but not our cell id.
        const sourceId = link.get('source').id;
        const targetId = link.get('target').id;
        return cell.id !== sourceId ? sourceId : targetId;
      });

      _.each(groupsOfOverlappingLinks, (group: any, key: string) => {
        // If the member of the group has both source and target model adjust vertices.
        let toRoute: any = {};
        if (key !== undefined) {
          group.forEach((link: dia.Link) => {
            if (link.get('source').id === cell.get('id') && link.get('target').id) {
              toRoute[link.get('target').id] = link;
            } else if (link.get('target').id === cell.get('id') && link.get('source').id) {
              toRoute[link.get('source').id] = link;
            }
          });
          Object.keys(toRoute).forEach(k => {
            Utils.fanRoute(graph, toRoute[k]);
          });
        }
      });

    } else if (cell instanceof joint.dia.Link) {
      const link = <joint.dia.Link> cell;
      // The cell is a link. Let's find its source and target models.
      let src = link.source() || link.previous('source');
      let trg = link.target() || cell.previous('target');

      // If one of the ends is not a model, the link has no siblings.
      if (!src.id || !trg.id) { return; }

      const siblings: dia.Link[] = graph.getLinks().filter((sibling: dia.Link) => {

        const _src = sibling.source();
        const _trg = sibling.target();
        const vertices = sibling.get('vertices');
        const fanRouted = !vertices || vertices.length === 0 || sibling.get('fanRouted');

        return ((_.isEqual(_src, src) && _.isEqual(_trg, trg)) || (_.isEqual(_src, trg) && _.isEqual(_trg, src))) && fanRouted;

      });

      switch (siblings.length) {

        case 0:
          // The link was removed and had no siblings.
          break;

        case 1:
          // There is only one link between the source and target. No vertices needed.
          let vertices = cell.get('vertices');
          if (vertices && vertices.length && cell.get('fanRouted')) {
            cell.unset('vertices');
          }
          break;

        default:

          // There is more than one siblings. We need to create vertices.

          // First of all we'll find the middle point of the link.
          let source = link.getSourceElement();
          let target = link.getTargetElement();

          if (!source || !target) {
            // When clearing the graph it may happen that some nodes are gone and some are left
            return;
          }

          let srcCenter = source.getBBox().center();
          let trgCenter = target.getBBox().center();
          let midPoint = joint.g.line(srcCenter, trgCenter).midpoint();

          // Then find the angle it forms.
          let theta = srcCenter.theta(trgCenter);

          // This is the maximum distance between links
          let gap = 20;

          siblings.forEach((sibling: dia.Link, index: number) => {

            // We want the offset values to be calculated as follows 0, 20, 20, 40, 40, 60, 60 ..
            let offset = gap * Math.ceil(index / 2);

            // Now we need the vertices to be placed at points which are 'offset' pixels distant
            // from the first link and forms a perpendicular angle to it. And as index goes up
            // alternate left and right.
            //
            //  ^  odd indexes
            //  |
            //  |---->  index 0 line (straight line between a source center and a target center.
            //  |
            //  v  even indexes
            let sign = index % 2 ? 1 : -1;
            let angle = joint.g.toRad(theta + sign * 90);

            // We found the vertex.
            let vertex = joint.g.point.fromPolar(offset, angle, midPoint);

            sibling.set('fanRouted', true);
            (<any>sibling).set('vertices', [{ x: vertex.x, y: vertex.y }], {'fanRouted': true});
          });
      }
    }

  }

  static isCustomPaperEvent(args: any): boolean {
    return args.length === 5 &&
      _.isString(args[0]) &&
      (args[0].indexOf('link:') === 0 || args[0].indexOf('element:') === 0) &&
      args[1] instanceof $.Event &&
      args[2] instanceof joint.dia.CellView &&
      _.isNumber(args[3]) &&
      _.isNumber(args[4]);
  }

}
