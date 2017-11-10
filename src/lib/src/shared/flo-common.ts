import { dia } from 'jointjs';
import { Observable } from 'rxjs/Observable';
import * as _joint from 'jointjs';

export namespace Flo {

  export const joint : any = _joint;

  export enum DnDEventType {
    DRAG,
    DROP
  }

  export interface DnDEvent {
    type : DnDEventType;
    view : dia.CellView;
    event : MouseEvent;
  }

  export interface PropertyMetadata {
    readonly id : string;
    readonly name : string;
    readonly description? : string;
    readonly defaultValue? : any;
    readonly type? : string;
    readonly [propName : string] : any;
  }

  export interface ExtraMetadata {
    readonly titleProperty? : string;
    readonly noEditableProps? : boolean;
    readonly noPaletteEntry? : boolean;
    readonly unselectable? : boolean;
    readonly [propName : string] : any;

    readonly allowAdditionalProperties? : boolean; //TODO: Verify it is still needed
  }

  export interface ElementMetadata {
    readonly name : string;
    readonly group : string;
    description?() : Promise<string>;
    get(property : String) : Promise<PropertyMetadata>;
    properties() : Promise<Map<string, PropertyMetadata>>;
    readonly metadata? : ExtraMetadata;
    readonly [propName : string] : any;
  }

  export interface ViewerDescriptor {
    readonly graph : dia.Graph;
    readonly paper? : dia.Paper;
  }

  export interface MetamodelListener {
    metadataError(data : any) : void;
    metadataAboutToChange() : void;
    metadataChanged() : void;
  }

  export interface Metamodel {
    textToGraph(flo : EditorContext, dsl : string) : Promise<any>;
    graphToText(flo : EditorContext) : Promise<string>;
    load() : Promise<Map<string, Map<string, ElementMetadata>>>;
    groups() : Array<string>;

    refresh?() : Promise<Map<string, Map<string, ElementMetadata>>>;
    subscribe?(listener : MetamodelListener) : void;
    unsubscribe?(listener : MetamodelListener) : void;
    isValidPropertyValue?(element : dia.Element, property : string, value : any) : boolean;
  }

  export interface CreationParams {
    metadata? : ElementMetadata;
    props? : Map<string, any>;
  }

  export interface ElementCreationParams extends CreationParams {
    position? : dia.Point;
  }

  export interface LinkCreationParams extends CreationParams {
    source : string;
    target : string;
  }

  export interface EmbeddedChildCreationParams extends CreationParams {
    parent : dia.Cell;
    position? : dia.Point;
  }

  export interface DecorationCreationParams extends EmbeddedChildCreationParams {
    kind : string;
    messages : Array<string>;
  }

  export interface HandleCreationParams extends EmbeddedChildCreationParams {
    kind : string;
  }

  export interface Renderer {
    createNode?(metadata : ElementMetadata, props? : Map<string, any>) : dia.Element;
    createLink?(source : LinkEnd, target : LinkEnd, metadata? : ElementMetadata, props? : Map<string, any>) : dia.Link;
    createHandle?(kind : string, parent : dia.Cell) : dia.Element;
    createDecoration?(kind : string, parent : dia.Cell) : dia.Element;
    initializeNewNode?(node : dia.Element, viewerDescriptor : ViewerDescriptor) : void;
    initializeNewLink?(link : dia.Link, viewerDescriptor : ViewerDescriptor) : void;
    initializeNewHandle?(handle : dia.Element, viewerDescriptor : ViewerDescriptor) : void;
    initializeNewDecoration?(decoration : dia.Element, viewerDescriptor : ViewerDescriptor) : void;
    getNodeView?() : dia.ElementView;
    getLinkView?() : dia.LinkView;
    layout?(paper : dia.Paper) : Promise<any>;
    handleLinkEvent?(context : EditorContext, event : string, link : dia.Link) : void;
    isSemanticProperty?(propertyPath : string, element : dia.Cell) : boolean;
    refreshVisuals?(cell : dia.Cell, propertyPath : string, paper : dia.Paper) : void;
    getLinkAnchorPoint?(linkView : dia.LinkView, view : dia.ElementView, port : SVGElement, reference : dia.Point) : dia.Point;
  }

  export interface EditorContext {
    zoomPercent : number;
    gridSize : number;
    readOnlyCanvas : boolean;
    selection : dia.CellView;
    graphToTextSync : boolean;
    noPalette : boolean;
    setDsl(dsl : string) : void;
    updateGraph() : Promise<any>;
    updateText() : Promise<any>;
    performLayout() : Promise<void>;
    clearGraph() : void;
    getGraph() : dia.Graph;
    getPaper() : dia.Paper;
    getMinZoom() : number;
    getMaxZoom() : number;
    getZoomStep() : number;
    fitToPage() : void;
    createNode(metadata : ElementMetadata, props? : Map<string, any>, position? : dia.Point) : dia.Element;
    createLink(source : LinkEnd, target : LinkEnd, metadata? : ElementMetadata, props? : Map<string, any>) : dia.Link;
    deleteSelectedNode() : void;
    readonly textToGraphConversionObservable: Observable<void>;
    readonly graphToTextConversionObservable: Observable<void>;
    readonly paletteReady: Observable<boolean>;
    [propName : string] : any;
  }

  export interface LinkEndDescriptor {
    view : dia.CellView;
    cssClassSelector? : string;
  }

  export interface DnDDescriptor {
    sourceComponent? : string;
    range?: number;
    source? : LinkEndDescriptor;
    target? : LinkEndDescriptor;
  }

  export interface LinkEnd {
    id : string;
    selector? : string;
    port? : string;
  }

  export enum Severity {
    Error,
    Warning
  }

  export interface Marker {
    severity : Severity;
    message : string;
    range? : Range;
  }

  export interface Position {
    ch: number;
    line: number;
  }

  export interface Range {
    start: Position;
    end: Position;
  }

  export interface Editor {
    interactive? : ((cellView: dia.CellView, event: string) => boolean) | boolean | { vertexAdd?: boolean, vertexMove?: boolean, vertexRemove?: boolean, arrowheadMove?: boolean };
    allowLinkVertexEdit? : boolean;
    highlighting? : any;
    createHandles?(context : EditorContext, createHandle : (owner : dia.CellView, kind : string, action : () => void, location : dia.Point) => void, owner : dia.CellView) : void;
    validatePort?(context : EditorContext, view : dia.ElementView, magnet : SVGElement) : boolean;
    validateLink?(context : EditorContext, cellViewS : dia.ElementView, portS : SVGElement, cellViewT : dia.ElementView, portT : SVGElement, isSource : boolean, linkView : dia.LinkView) : boolean;
    calculateDragDescriptor?(context : EditorContext, draggedView : dia.CellView, targetUnderMouse : dia.CellView, coordinate : dia.Point, sourceComponent : string) : DnDDescriptor;
    handleNodeDropping?(context : EditorContext, dragDescriptor : DnDDescriptor) : void;
    showDragFeedback?(context : EditorContext, dragDescriptor : DnDDescriptor) : void;
    hideDragFeedback?(context : EditorContext, dragDescriptor : DnDDescriptor) : void;
    validate?(graph : dia.Graph, dsl: string, flo: EditorContext) : Promise<Map<string, Array<Marker>>>;
    preDelete?(context : EditorContext, deletedElement : dia.Cell) : void;
    setDefaultContent?(editorContext : EditorContext, data : Map<string, Map<string, ElementMetadata>>) : void;
  }

  export function findMagnetByClass(view : dia.CellView, className : string) : HTMLElement {
    if (className && className.startsWith('.')) {
      className = className.substr(1);
    }
    return view.$('[magnet]').toArray().find((magnet : HTMLElement) => magnet.getAttribute('class').split(/\s+/).indexOf(className) >= 0);
  }

  export function findMagnetByPort(view : dia.CellView, port : string) : HTMLElement {
    return view.$('[magnet]').toArray().find((magnet : HTMLElement) => magnet.getAttribute('port') === port);
  }

  /**
   * Return the metadata for a particular palette entry in a particular group.
   * @param {String} name - name of the palette entry
   * @param {string} group - group in which the palette entry should exist (e.g. sinks)
   * @return {{name:string,group:string,unresolved:Boolean}}
   */
  export function getMetadata(metamodel : Map<string, Map<string, ElementMetadata>>, name : string, group : string) : ElementMetadata {
    if (name && group && metamodel.get(group) && metamodel.get(group).get(name)) {
      return metamodel.get(group).get(name);
    } else {
      return {
        name: name,
        group: group,
        unresolved: true,
        get: (property : string) => new Promise(resolve => resolve()),
        properties: () => Promise.resolve(new Map<string, PropertyMetadata>())
      };
    }
  }

}




