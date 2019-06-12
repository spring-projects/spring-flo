import { ElementRef, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { dia } from 'jointjs';
import { Flo } from '../shared/flo-common';
export declare class Palette implements OnInit, OnDestroy, OnChanges {
    private element;
    private document;
    private _metamodelListener;
    /**
     * The names of any groups in the palette that have been deliberately closed (the arrow clicked on)
     */
    private closedGroups;
    /**
     * Model of the clicked element
     */
    private clickedElement;
    private viewBeingDragged;
    private initialized;
    private _paletteSize;
    private _filterText;
    private paletteGraph;
    private palette;
    private floaterpaper;
    private filterTextModel;
    metamodel: Flo.Metamodel;
    renderer: Flo.Renderer;
    paletteEntryPadding: dia.Size;
    onPaletteEntryDrop: EventEmitter<Flo.DnDEvent>;
    paletteReady: EventEmitter<boolean>;
    paletteFocus: EventEmitter<void>;
    private mouseMoveHanlder;
    private mouseUpHanlder;
    paletteSize: number;
    constructor(element: ElementRef, document: any);
    onFocus(): void;
    ngOnInit(): void;
    ngOnDestroy(): void;
    ngOnChanges(changes: SimpleChanges): void;
    private createPaletteGroup;
    private createPaletteEntry;
    private buildPalette;
    rebuildPalette(): void;
    filterText: string;
    private getPaletteView;
    private handleMouseUp;
    private trigger;
    private handleDrag;
    private rotateOpen;
    private doRotateOpen;
    private doRotateClose;
    private rotateClosed;
}
