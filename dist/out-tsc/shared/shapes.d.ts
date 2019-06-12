import { dia } from 'jointjs';
import { Flo } from './flo-common';
export declare namespace Constants {
    const REMOVE_HANDLE_TYPE = "remove";
    const PROPERTIES_HANDLE_TYPE = "properties";
    const ERROR_DECORATION_KIND = "error";
    const PALETTE_CONTEXT = "palette";
    const CANVAS_CONTEXT = "canvas";
    const FEEDBACK_CONTEXT = "feedback";
}
export declare namespace Shapes {
    interface CreationParams extends Flo.CreationParams {
        renderer?: Flo.Renderer;
        paper?: dia.Paper;
        graph?: dia.Graph;
    }
    interface ElementCreationParams extends CreationParams {
        position?: dia.Point;
    }
    interface LinkCreationParams extends CreationParams {
        source: Flo.LinkEnd;
        target: Flo.LinkEnd;
    }
    interface EmbeddedChildCreationParams extends CreationParams {
        parent: dia.Cell;
        position?: dia.Point;
    }
    interface DecorationCreationParams extends EmbeddedChildCreationParams {
        kind: string;
        messages: Array<string>;
    }
    interface HandleCreationParams extends EmbeddedChildCreationParams {
        kind: string;
    }
    interface FilterOptions {
        amount: number;
        [propName: string]: any;
    }
    class Factory {
        /**
         * Create a JointJS node that embeds extra metadata (properties).
         */
        static createNode(params: ElementCreationParams): dia.Element;
        static createLink(params: LinkCreationParams): dia.Link;
        static createDecoration(params: DecorationCreationParams): dia.Element;
        static createHandle(params: HandleCreationParams): dia.Element;
    }
}
