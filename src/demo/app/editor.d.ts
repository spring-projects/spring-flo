import { Flo } from 'spring-flo';
import { dia } from 'jointjs';
import { BsModalService } from 'ngx-bootstrap';
/**
 * @author Alex Boyko
 * @author Andy Clement
 */
export declare class Editor implements Flo.Editor {
    private modelService;
    constructor(modelService: BsModalService);
    createHandles(context: Flo.EditorContext, createHandle: (owner: dia.CellView, kind: string, action: () => void, location: dia.Point) => void, owner: dia.CellView): void;
    openPropertiesDialog(cell: dia.Cell): void;
    validatePort(context: Flo.EditorContext, view: dia.ElementView, magnet: SVGElement): boolean;
    validateLink(context: Flo.EditorContext, cellViewS: dia.ElementView, magnetS: SVGElement, cellViewT: dia.ElementView, magnetT: SVGElement, isSource: boolean, linkView: dia.LinkView): boolean;
    preDelete(context: Flo.EditorContext, deletedElement: dia.Cell): void;
    handleNodeDropping(context: Flo.EditorContext, dragDescriptor: Flo.DnDDescriptor): void;
    calculateDragDescriptor(context: Flo.EditorContext, draggedView: dia.CellView, targetUnderMouse: dia.CellView, point: dia.Point, sourceComponent: string): Flo.DnDDescriptor;
    validate(graph: dia.Graph): Promise<Map<string, Array<Flo.Marker>>>;
    moveNodeOnNode(context: Flo.EditorContext, node: dia.Element, pivotNode: dia.Element, side: string, shouldRepairDamage: boolean): void;
    /**
     * Node moved onto a link. Remove the existing link and replace it with two links
     * that go from the original link source to the dropped node and from the dropped node
     * to the original link target.
     */
    moveNodeOnLink(context: Flo.EditorContext, node: dia.Element, link: dia.Link, shouldRepairDamage: boolean): void;
    /**
     * When a node is removed any dangling links should be removed. What this function will also try to do
     * is if removing a node from a chain it will attempt to replace dangling links with a link from the
     * deleted nodes original source to the deleted nodes original target.
     */
    repairDamage(context: Flo.EditorContext, node: dia.Element): void;
    /**
     * Check if node being dropped and drop target node next to each other such that they won't be swapped by the drop
     */
    canSwap(context: Flo.EditorContext, dropee: dia.Element, target: dia.Element, side: string): boolean;
}
