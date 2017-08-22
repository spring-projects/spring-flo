/// <reference types="codemirror" />
import { ElementRef, OnInit, OnDestroy } from '@angular/core';
import 'rxjs/add/operator/debounceTime';
import * as CodeMirror from 'codemirror';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/scroll/simplescrollbars';
export declare class DslEditorComponent implements OnInit, OnDestroy {
    private element;
    private doc;
    private _dsl;
    private _lint;
    private _hint;
    private lineNumbers;
    private lineWrapping;
    private scrollbarStyle;
    private placeholder;
    private debounce;
    private dslChange;
    private focus;
    private blur;
    private _dslChangedHandler;
    constructor(element: ElementRef);
    dsl: string;
    lintOptions: boolean | CodeMirror.LintOptions;
    hintOptions: any;
    ngOnInit(): void;
    ngOnDestroy(): void;
}
