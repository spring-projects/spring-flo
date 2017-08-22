import { Flo } from 'spring-flo';
import { BsModalService } from 'ngx-bootstrap';
export declare class AppComponent {
    private modelService;
    metamodel: Flo.Metamodel;
    renderer: Flo.Renderer;
    editor: Flo.Editor;
    dsl: string;
    dslEditor: boolean;
    private editorContext;
    paletteSize: number;
    constructor(modelService: BsModalService);
    arrangeAll(): void;
}
