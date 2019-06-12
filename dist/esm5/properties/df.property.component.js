import * as tslib_1 from "tslib";
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Properties } from '../shared/flo-properties';
var DynamicFormPropertyComponent = /** @class */ (function () {
    function DynamicFormPropertyComponent() {
    }
    Object.defineProperty(DynamicFormPropertyComponent.prototype, "types", {
        get: function () {
            return Properties.InputType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DynamicFormPropertyComponent.prototype, "control", {
        get: function () {
            return this.form.controls[this.model.id];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DynamicFormPropertyComponent.prototype, "errorData", {
        get: function () {
            var _this = this;
            return (this.model.validation && this.model.validation.errorData ? this.model.validation.errorData : [])
                .filter(function (e) { return _this.control.errors && _this.control.errors[e.id]; });
        },
        enumerable: true,
        configurable: true
    });
    tslib_1.__decorate([
        Input(),
        tslib_1.__metadata("design:type", Object)
    ], DynamicFormPropertyComponent.prototype, "model", void 0);
    tslib_1.__decorate([
        Input(),
        tslib_1.__metadata("design:type", FormGroup)
    ], DynamicFormPropertyComponent.prototype, "form", void 0);
    DynamicFormPropertyComponent = tslib_1.__decorate([
        Component({
            selector: 'df-property',
            template: "\n    <tr [formGroup]=\"form\" class=\"df-property-row\" [ngClass]=\"{'invalid-property-value': control.invalid}\">\n\n      <td class=\"df-property-label-cell\">\n        <label [attr.for]=\"model.id\" class=\"df-form-label\">{{model.name}}</label>\n      </td>\n\n      <td class=\"df-property-control-cell\">\n        <div [ngSwitch]=\"model.type\" class=\"df-property-container\">\n\n          <label *ngSwitchCase=\"types.CHECKBOX\" class=\"df-property-control\">\n            <input type=\"checkbox\" [id]=\"model.id\" [(ngModel)]=\"model.value\" [formControlName]=\"model.id\">\n            {{model.value ? 'True' : 'False' }}\n          </label>\n\n          <input *ngSwitchCase=\"types.NUMBER\" class=\"df-property-control\" type=\"number\" [id]=\"model.id\"\n                 [formControlName]=\"model.id\" [placeholder]=\"model.defaultValue || ''\" [(ngModel)]=\"model.value\">\n\n          <input *ngSwitchCase=\"types.PASSWORD\" class=\"df-property-control\" type=\"password\" [id]=\"model.id\"\n                 [formControlName]=\"model.id\" [placeholder]=\"model.defaultValue || ''\" [(ngModel)]=\"model.value\">\n\n          <input *ngSwitchCase=\"types.EMAIL\" class=\"df-property-control\" type=\"password\" [id]=\"model.id\"\n                 [formControlName]=\"model.id\" [placeholder]=\"model.defaultValue || ''\" [(ngModel)]=\"model.value\">\n\n          <input *ngSwitchCase=\"types.URL\" class=\"df-property-control\" type=\"url\" [id]=\"model.id\"\n                 [formControlName]=\"model.id\" [placeholder]=\"model.defaultValue || ''\" [(ngModel)]=\"model.value\">\n\n          <select *ngSwitchCase=\"types.SELECT\" class=\"df-property-control\" [id]=\"model.id\"\n                 [formControlName]=\"model.id\" [(ngModel)]=\"model.value\">\n            <option *ngFor=\"let o of model['options']\" [ngValue]=\"o.value\">{{o.name}}</option>\n          </select>\n\n          <code-editor *ngSwitchCase=\"types.CODE\" class=\"df-property-control\" [id]=\"model.id\"\n                  [formControlName]=\"model.id\" [language]=\"model['language']\" [(ngModel)]=\"model.value\" line-numbers=\"true\"\n                  scrollbar-style=\"simple\" [placeholder]=\"model.defaultValue || 'Enter code snippet...'\" overview-ruler=\"true\">\n          </code-editor>\n\n          <input *ngSwitchDefault class=\"df-property-control\" type=\"text\" [id]=\"model.id\" [formControlName]=\"model.id\"\n                 [placeholder]=\"model.defaultValue || ''\" [(ngModel)]=\"model.value\">\n        </div>\n        <div class=\"help-block\">\n          <div>{{model.description}}</div>\n          <div *ngFor=\"let e of errorData\" class=\"validation-error-block\">{{e.message}}</div>\n        </div>\n      </td>\n\n    </tr>\n  ",
            encapsulation: ViewEncapsulation.None
        }),
        tslib_1.__metadata("design:paramtypes", [])
    ], DynamicFormPropertyComponent);
    return DynamicFormPropertyComponent;
}());
export { DynamicFormPropertyComponent };
//# sourceMappingURL=df.property.component.js.map