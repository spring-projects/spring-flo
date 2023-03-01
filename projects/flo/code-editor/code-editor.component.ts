import { Component, Input, Output, ElementRef, EventEmitter, OnInit, ViewEncapsulation, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as CodeMirror from 'codemirror';

import $ from 'jquery';

// CodeMirror extensions
import 'codemirror/mode/meta';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/hint/show-hint';
// import 'codemirror/addon/mode/loadmode';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/scroll/simplescrollbars';

// Lint support
// Unclear how to import this dynamically...
// import 'codemirror/addon/lint/javascript-lint';
// import 'codemirror/addon/lint/json-lint';
// import 'codemirror/addon/lint/yaml-lint';

// TODO: use dynamic import with JS7 in the future. CM autoLoad cannot load it properly - thinks its AMD
// Supported languages until dynamic loading
// import 'codemirror/mode/groovy/groovy';
// import 'codemirror/mode/javascript/javascript';
// import 'codemirror/mode/python/python';
// import 'codemirror/mode/ruby/ruby';
// import 'codemirror/mode/clike/clike';
// import 'codemirror/mode/yaml/yaml';

@Component({
  selector: 'code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss', ],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CodeEditorComponent),
      multi: true
    }
  ]
})
export class CodeEditorComponent implements OnInit, ControlValueAccessor {

  private doc: CodeMirror.EditorFromTextArea;

  private _dsl = '';

  private _lint: boolean | CodeMirror.LintOptions = false;

  private _language: string;

  private errorRuler: any;

  private warningRuler: any;

  private _onChangeHandler: (_: any) => void;

  private _onTouchHandler: () => void;

  @Input('line-numbers')
  lineNumbers = false;

  @Input('line-wrapping')
  lineWrapping = false;

  @Input('scrollbar-style')
  scrollbarStyle: string;

  @Input()
  placeholder: string;

  @Input('overview-ruler')
  overviewRuler: boolean;

  @Output()
  dslChange = new EventEmitter<string>();

  @Output()
  focus = new EventEmitter<void>();

  @Output()
  blur = new EventEmitter<void>();

  @Output()
  editor = new EventEmitter<CodeMirror.EditorFromTextArea>();

  private _dslChangedHandler = () => {
    this._dsl = this.doc.getValue();
    this.dslChange.emit(this._dsl);
    if (this._onChangeHandler) {
      this._onChangeHandler(this._dsl);
    }
  };

  constructor(private element: ElementRef) {}

  @Input()
  set dsl(dsl: string) {
    this._dsl = dsl;
    if (this.doc && this._dsl !== this.doc.getValue()) {
      let cursorPosition = (<any>this.doc).getCursor();
      this.doc.setValue(this._dsl || '');
      (<any>this.doc).setCursor(cursorPosition);
    }
  }

  @Input()
  set language(_language: string) {
    if (this._language !== _language) {
      this._language = _language;
      this.loadEditorMode();
    }
  }

  ngOnInit() {

    let options: any = {
      value: this._dsl || '',
      gutters: ['CodeMirror-lint-markers'],
      extraKeys: {'Ctrl-Space': 'autocomplete'},
      lineNumbers: this.lineNumbers,
      lineWrapping: this.lineWrapping,
      matchBrackets: true,
      autoCloseBrackets: true,
    };

    if (this.scrollbarStyle) {
      (<any> options).scrollbarStyle = this.scrollbarStyle;
    }

    if (this._lint) {
      options.lint = this._lint;
    }

    this.doc = CodeMirror.fromTextArea(<HTMLTextAreaElement>$('#code-editor-host', this.element.nativeElement)[0], options);

    if (this.placeholder) {
      this.doc.setOption('placeholder', this.placeholder);
    }

    // Turns out "value" in the option doesn't set it.
    this.doc.setValue(this._dsl || '');

    this.doc.on('change', this._dslChangedHandler);
    this.doc.on('focus', () => {
      this.focus.emit();
      if (this._onTouchHandler) {
        this._onTouchHandler();
      }
    });
    this.doc.on('blur', () => this.blur.emit());

    this.warningRuler = (<any>this.doc).annotateScrollbar('CodeMirror-vertical-ruler-warning');
    this.errorRuler = (<any>this.doc).annotateScrollbar('CodeMirror-vertical-ruler-error');

    this.loadEditorMode();

    this.editor.emit(this.doc);
  }

  private loadEditorMode() {
    // CodeMirror doc object must be initialized
    if (!this.doc) {
      return
    }

    const info = this._language ? (<any>CodeMirror).findModeByName(this._language) : undefined;

    // Set proper editor mode
    if (info) {
      this.doc.setOption('mode', info.mime);
      // (<any>CodeMirror).autoLoadMode(this.doc, info.mode);
    } else {
      this.doc.setOption('mode', 'text/plain');
    }

    // Set proper Lint mode
    this.doc.setOption('lint', this.getLintOptions());
  }

  writeValue(obj: any): void {
    this.dsl = obj;
  }

  registerOnChange(fn: (_: any) => void): void {
    this._onChangeHandler = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouchHandler = fn;
  }

  private getLintOptions(): boolean | any {
    switch (this._language) {
      case 'javascript':
      case 'json':
      case 'coffeescript':
      case 'yaml':
        return {
          onUpdateLinting: (annotations: {}[]) => {
            const warnings: any[] = [];
            const errors: any[] = [];
            if (this.overviewRuler) {
              if (Array.isArray(annotations)) {
                annotations.forEach((a: any) => {
                  if (a.to && a.from && a.from.line >= 0 && a.from.ch >= 0 && a.to.line >= a.from.line && a.from.ch >= 0) {
                    if (a.severity === 'error') {
                      errors.push(a);
                    } else if (a.severity === 'warning') {
                      warnings.push(a);
                    }
                  }
                });
              }
            }
            this.warningRuler.update(warnings);
            this.errorRuler.update(errors);
          }
        }
    }
    return false;
  }

}
