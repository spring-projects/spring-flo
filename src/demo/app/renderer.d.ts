import { Flo } from 'spring-flo';
import { dia } from 'jointjs';
/**
 * @author Alex Boyko
 * @author Andy Clement
 */
export declare class Renderer implements Flo.Renderer {
    createHandle(kind: string): dia.Element;
    createDecoration(kind: string): dia.Element;
    createNode(metadata: Flo.ElementMetadata, props: Map<string, any>): dia.Element;
    initializeNewNode(node: dia.Element, viewerDescriptor: Flo.ViewerDescriptor): void;
    createLink(source: Flo.LinkEnd, target: Flo.LinkEnd, metadata: Flo.ElementMetadata, props: Map<string, any>): dia.Link;
    isSemanticProperty(propertyPath: string, element: dia.Cell): boolean;
    refreshVisuals(cell: dia.Cell, propertyPath: string, paper: dia.Paper): void;
    layout(paper: dia.Paper): Promise<{}>;
    getLinkAnchorPoint(linkView: dia.LinkView, view: dia.ElementView, magnet: SVGElement, reference: dia.Point): dia.Point;
}
