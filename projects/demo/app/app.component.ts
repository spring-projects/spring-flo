import { Component, ViewEncapsulation } from '@angular/core';
import { Flo } from 'spring-flo';
import { BsModalService } from 'ngx-bootstrap/modal';
const { Metamodel } = require('./metamodel');
const { Renderer } = require('./renderer');
const { Editor } = require('./editor');

// Code editor used from Flo requires the follwoing CM extensions
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/ruby/ruby';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/lint/javascript-lint';
import {PropertiesEditorService} from './properties-editor.service';
import {dia} from 'jointjs';

@Component({
  selector: 'demo-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {

  metamodel: Flo.Metamodel;
  renderer: Flo.Renderer;
  editor: Flo.Editor;
  dsl: string;
  dslEditor = false;

  editorContext: Flo.EditorContext;

  paletteSize = 170;

  constructor(private propertiesEditor: PropertiesEditorService) {
    this.metamodel = new Metamodel();
    this.renderer = new Renderer();
    this.editor = new Editor(propertiesEditor);
    this.dsl = '';
  }

  arrangeAll() {
    this.editorContext.performLayout().then(() => this.editorContext.fitToPage());
  }

  markersChanged(markers: Map<string | number, Array<Flo.Marker>>) {
    console.log('MARKERS: ' + JSON.stringify(markers));
  }

  openPropertiesDialog(cell: dia.Cell) {
    this.propertiesEditor.openPropertiesDialog(cell)
  }

  processKeyUp(evt: KeyboardEvent): void {
    this.dsl = (evt.target as HTMLTextAreaElement).value;
  }

}
