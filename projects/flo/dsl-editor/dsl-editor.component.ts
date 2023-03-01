import { Component, Input, Output, ElementRef, EventEmitter, OnInit, ViewEncapsulation } from '@angular/core';
import debounce from 'lodash/debounce';
import * as CodeMirror from 'codemirror';
import $ from 'jquery';

import 'codemirror/addon/lint/lint';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/scroll/simplescrollbars';

@Component({
  selector: 'dsl-editor',
  templateUrl: './dsl-editor.component.html',
  styleUrls: ['./dsl-editor.component.scss', ],
  encapsulation: ViewEncapsulation.None
})
export class DslEditorComponent implements OnInit {

  private doc: CodeMirror.EditorFromTextArea;

  private _dsl = '';

  private _lint: boolean | CodeMirror.LintOptions = false;

  private _hint: any;

  @Input('line-numbers')
  lineNumbers = false;

  @Input('line-wrapping')
  lineWrapping = false;

  @Input('scrollbar-style')
  scrollbarStyle: string;

  @Input()
  placeholder: string;

  @Input()
  debounce = 0;

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
  set lintOptions(lintOptions: boolean | CodeMirror.LintOptions) {
    this._lint = lintOptions;
    if (this.doc) {
      this.doc.setOption('lint', this._lint);
    }
  }

  @Input()
  set hintOptions(hintOptions: any) {
    this._hint = hintOptions;
    if (this.doc) {
      this.doc.setOption('hintOptions', this._hint);
    }
  }

  triggerLinting() {
    this.doc.setOption('lint', {});
    this.doc.setOption('lint', this._lint);
  }

  ngOnInit() {

    let options: CodeMirror.EditorConfiguration = {
      value: this._dsl || '',
      gutters: ['CodeMirror-lint-markers'],
      extraKeys: {'Ctrl-Space': 'autocomplete'},
      lineNumbers: this.lineNumbers,
      lineWrapping: this.lineWrapping,
      electricChars: false,
      smartIndent: false,
    };

    if (this.scrollbarStyle) {
      (<any> options).scrollbarStyle = this.scrollbarStyle;
    }

    if (this._lint) {
      options.lint = this._lint;
    }

    if (this._hint) {
      (<any>options).hintOptions = this._hint;
    }

    this.doc = CodeMirror.fromTextArea(<HTMLTextAreaElement>$('#dsl-editor-host', this.element.nativeElement)[0], options);

    if (this.placeholder) {
      this.doc.setOption('placeholder', this.placeholder);
    }

    // Turns out "value" in the option doesn't set it.
    this.doc.setValue(this._dsl || '');

    this.doc.on('change', this.debounce ? debounce(this._dslChangedHandler, this.debounce) : this._dslChangedHandler);
    this.doc.on('focus', () => this.focus.emit());
    this.doc.on('blur', () => this.blur.emit());

    this.editor.emit(this.doc);
  }

}
