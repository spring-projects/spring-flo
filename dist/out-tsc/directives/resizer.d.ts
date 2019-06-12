import { EventEmitter, ElementRef, OnInit, OnDestroy } from '@angular/core';
export declare class ResizerDirective implements OnInit, OnDestroy {
    private element;
    private document;
    private dragInProgress;
    private vertical;
    private first;
    private second;
    private _size;
    private _splitSize;
    private _subscriptions;
    maxSplitSize: number;
    sizeChange: EventEmitter<number>;
    private mouseMoveHandler;
    splitSize: number;
    resizerWidth: number;
    resizerHeight: number;
    resizerLeft: string;
    resizerTop: string;
    resizerRight: string;
    resizerBottom: string;
    constructor(element: ElementRef, document: any);
    startDrag(): void;
    private mousemove;
    ngOnInit(): void;
    ngOnDestroy(): void;
}
