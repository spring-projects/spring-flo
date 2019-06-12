import { ElementRef, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { dia } from 'jointjs';
import { Flo } from '../shared/flo-common';
export interface VisibilityState {
    visibility: string;
    children: Array<VisibilityState>;
}
export declare class EditorComponent implements OnInit, OnDestroy {
    private element;
    /**
     * Joint JS Graph object representing the Graph model
     */
    private graph;
    /**
     * Joint JS Paper object representing the canvas control containing the graph view
     */
    private paper;
    /**
     * Currently selected element
     */
    private _selection;
    /**
     * Current DnD descriptor for frag in progress
     */
    private highlighted;
    /**
     * Flag specifying whether the Flo-Editor is in read-only mode.
     */
    private _readOnlyCanvas;
    /**
     * Grid size
     */
    private _gridSize;
    private _hiddenPalette;
    private editorContext;
    private textToGraphEventEmitter;
    private graphToTextEventEmitter;
    private _graphToTextSyncEnabled;
    private validationEventEmitter;
    private _disposables;
    private _dslText;
    private textToGraphConversionCompleted;
    private graphToTextConversionCompleted;
    private paletteReady;
    /**
     * Metamodel. Retrieves metadata about elements that can be shown in Flo
     */
    metamodel: Flo.Metamodel;
    /**
     * Renders elements.
     */
    renderer: Flo.Renderer;
    /**
     * Editor. Provides domain specific editing capabilities on top of standard Flo features
     */
    editor: Flo.Editor;
    /**
     * Size (Width) of the palette
     */
    paletteSize: number;
    /**
     * Min zoom percent value
     */
    minZoom: number;
    /**
     * Max zoom percent value
     */
    maxZoom: number;
    /**
     * Zoom percent increment/decrement step
     */
    zoomStep: number;
    paperPadding: number;
    floApi: EventEmitter<Flo.EditorContext>;
    validationMarkers: EventEmitter<Map<string | number, Flo.Marker[]>>;
    contentValidated: EventEmitter<boolean>;
    private dslChange;
    private _resizeHandler;
    constructor(element: ElementRef);
    ngOnInit(): void;
    ngOnDestroy(): void;
    noPalette: boolean;
    graphToTextSync: boolean;
    private performGraphToTextSyncing;
    createHandle(element: dia.CellView, kind: string, action: () => void, location: dia.Point): dia.Element;
    removeEmbeddedChildrenOfType(element: dia.Cell, types: Array<string>): void;
    selection: dia.CellView;
    readOnlyCanvas: boolean;
    /**
     * Displays graphical feedback for the drag and drop in progress based on current drag and drop descriptor object
     *
     * @param dragDescriptor DnD info object. Has on info on graph node being dragged (drag source) and what it is
     * being dragged over at the moment (drop target)
     */
    showDragFeedback(dragDescriptor: Flo.DnDDescriptor): void;
    /**
     * Hides graphical feedback for the drag and drop in progress based on current drag and drop descriptor object
     *
     * @param dragDescriptor DnD info object. Has on info on graph node being dragged (drag source) and what it is
     * being dragged over at the moment (drop target)
     */
    hideDragFeedback(dragDescriptor: Flo.DnDDescriptor): void;
    /**
     * Sets the new DnD info object - the descriptor for DnD
     *
     * @param dragDescriptor DnD info object. Has on info on graph node being dragged (drag source) and what it is
     * being dragged over at the moment (drop target)
     */
    setDragDescriptor(dragDescriptor?: Flo.DnDDescriptor): void;
    /**
     * Handles DnD events when a node is being dragged over canvas
     *
     * @param draggedView The Joint JS view object being dragged
     * @param targetUnderMouse The Joint JS view under mouse cursor
     * @param x X coordinate of the mouse on the canvas
     * @param y Y coordinate of the mosue on the canvas
     * @param context DnD context (palette or canvas)
     */
    handleNodeDragging(draggedView: dia.CellView, targetUnderMouse: dia.CellView, x: number, y: number, sourceComponent: string): void;
    /**
     * Handles DnD drop event when a node is being dragged and dropped on the main canvas
     */
    handleNodeDropping(): void;
    /**
     * Hides DOM Node (used to determine drop target DOM element)
     * @param domNode DOM node to hide
     * @returns
     */
    private _hideNode;
    /**
     * Restored DOM node original visibility (used to determine drop target DOM element)
     * @param domNode DOM node to restore visibility of
     * @param oldVisibility original visibility parameter
     */
    _restoreNodeVisibility(domNode: HTMLElement, oldVisibility: VisibilityState): void;
    /**
     * Unfortunately we can't just use event.target because often draggable shape on the canvas overlaps the target.
     * We can easily find the element(s) at location, but only nodes :-( Unclear how to find links at location
     * (bounding box of a link for testing is bad).
     * The result of that is that links can only be the drop target when dragging from the palette currently.
     * When DnDing shapes on the canvas drop target cannot be a link.
     *
     * Excluded views enables you to choose to filter some possible answers (useful in the case where elements are stacked
     * - e.g. Drag-n-Drop)
     */
    getTargetViewFromEvent(event: MouseEvent, x: number, y: number, excludeViews?: Array<dia.CellView>): dia.CellView;
    handleDnDFromPalette(dndEvent: Flo.DnDEvent): void;
    handleDragFromPalette(dnDEvent: Flo.DnDEvent): void;
    createNode(metadata: Flo.ElementMetadata, props: Map<string, any>, position: dia.Point): dia.Element;
    createLink(source: Flo.LinkEnd, target: Flo.LinkEnd, metadata: Flo.ElementMetadata, props: Map<string, any>): dia.Link;
    handleDropFromPalette(event: Flo.DnDEvent): void;
    private fitToContent;
    autosizePaper(): void;
    fitToPage(): void;
    zoomPercent: number;
    gridSize: number;
    validateContent(): Promise<any>;
    markElement(cell: dia.Cell, markers: Array<Flo.Marker>): void;
    doLayout(): Promise<void>;
    dsl: string;
    /**
     * Ask the server to parse the supplied text into a JSON graph of nodes and links,
     * then update the view based on that new information.
     */
    updateGraphRepresentation(): Promise<any>;
    updateTextRepresentation(): Promise<any>;
    initMetamodel(): void;
    initGraph(): void;
    handleNodeCreation(node: dia.Element): void;
    /**
     * Forwards a link event occurrence to any handlers in the editor service, if they are defined. Event examples
     * are 'change:source', 'change:target'.
     */
    handleLinkEvent(event: string, link: dia.Link): void;
    handleLinkCreation(link: dia.Link): void;
    initGraphListeners(): void;
    initPaperListeners(): void;
    initPaper(): void;
    updatePaletteReadyState(ready: boolean): void;
}
