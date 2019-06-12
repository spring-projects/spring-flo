import * as tslib_1 from "tslib";
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Palette } from './palette/palette.component';
import { EditorComponent } from './editor/editor.component';
import { ResizerDirective } from './directives/resizer';
import { DslEditorComponent } from './dsl-editor/dsl-editor.component';
import { CodeEditorComponent } from './code-editor/code-editor.component';
import { PropertiesGroupComponent } from './properties/properties.group.component';
import { DynamicFormPropertyComponent } from './properties/df.property.component';
var FloModule = /** @class */ (function () {
    function FloModule() {
    }
    FloModule = tslib_1.__decorate([
        NgModule({
            imports: [
                FormsModule,
                CommonModule,
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
    ], FloModule);
    return FloModule;
}());
export { FloModule };
//# sourceMappingURL=module.js.map