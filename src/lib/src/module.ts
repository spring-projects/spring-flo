import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { Palette } from './palette/palette.component';
import { EditorComponent } from './editor/editor.component';
import { ResizerDirective } from './directives/resizer';
import { DslEditorComponent } from './dsl-editor/dsl-editor.component';
import { CodeEditorComponent } from './code-editor/code-editor.component';
import { PropertiesGroupComponent } from './properties/properties.group.component';
import { DynamicFormPropertyComponent } from './properties/df.property.component';

@NgModule({
  imports: [
    FormsModule,
    BrowserModule,
    ReactiveFormsModule
  ],
  declarations: [
    Palette,
    EditorComponent,
    ResizerDirective,
    DslEditorComponent,
    CodeEditorComponent,
    PropertiesGroupComponent,
    DynamicFormPropertyComponent
  ],
  exports: [
    EditorComponent,
    DslEditorComponent,
    DynamicFormPropertyComponent,
    PropertiesGroupComponent
  ]
})
export class FloModule { }
