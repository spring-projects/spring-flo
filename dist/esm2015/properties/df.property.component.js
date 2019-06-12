import * as tslib_1 from "tslib";
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Properties } from '../shared/flo-properties';
let DynamicFormPropertyComponent = class DynamicFormPropertyComponent {
    constructor() { }
    get types() {
        return Properties.InputType;
    }
    get control() {
        return this.form.controls[this.model.id];
    }
    get errorData() {
        return (this.model.validation && this.model.validation.errorData ? this.model.validation.errorData : [])
            .filter(e => this.control.errors && this.control.errors[e.id]);
    }
};
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
        template: `
    <tr [formGroup]="form" class="df-property-row" [ngClass]="{'invalid-property-value': control.invalid}">

      <td class="df-property-label-cell">
        <label [attr.for]="model.id" class="df-form-label">{{model.name}}</label>
      </td>

      <td class="df-property-control-cell">
        <div [ngSwitch]="model.type" class="df-property-container">

          <label *ngSwitchCase="types.CHECKBOX" class="df-property-control">
            <input type="checkbox" [id]="model.id" [(ngModel)]="model.value" [formControlName]="model.id">
            {{model.value ? 'True' : 'False' }}
          </label>

          <input *ngSwitchCase="types.NUMBER" class="df-property-control" type="number" [id]="model.id"
                 [formControlName]="model.id" [placeholder]="model.defaultValue || ''" [(ngModel)]="model.value">

          <input *ngSwitchCase="types.PASSWORD" class="df-property-control" type="password" [id]="model.id"
                 [formControlName]="model.id" [placeholder]="model.defaultValue || ''" [(ngModel)]="model.value">

          <input *ngSwitchCase="types.EMAIL" class="df-property-control" type="password" [id]="model.id"
                 [formControlName]="model.id" [placeholder]="model.defaultValue || ''" [(ngModel)]="model.value">

          <input *ngSwitchCase="types.URL" class="df-property-control" type="url" [id]="model.id"
                 [formControlName]="model.id" [placeholder]="model.defaultValue || ''" [(ngModel)]="model.value">

          <select *ngSwitchCase="types.SELECT" class="df-property-control" [id]="model.id"
                 [formControlName]="model.id" [(ngModel)]="model.value">
            <option *ngFor="let o of model['options']" [ngValue]="o.value">{{o.name}}</option>
          </select>

          <code-editor *ngSwitchCase="types.CODE" class="df-property-control" [id]="model.id"
                  [formControlName]="model.id" [language]="model['language']" [(ngModel)]="model.value" line-numbers="true"
                  scrollbar-style="simple" [placeholder]="model.defaultValue || 'Enter code snippet...'" overview-ruler="true">
          </code-editor>

          <input *ngSwitchDefault class="df-property-control" type="text" [id]="model.id" [formControlName]="model.id"
                 [placeholder]="model.defaultValue || ''" [(ngModel)]="model.value">
        </div>
        <div class="help-block">
          <div>{{model.description}}</div>
          <div *ngFor="let e of errorData" class="validation-error-block">{{e.message}}</div>
        </div>
      </td>

    </tr>
  `,
        encapsulation: ViewEncapsulation.None
    }),
    tslib_1.__metadata("design:paramtypes", [])
], DynamicFormPropertyComponent);
export { DynamicFormPropertyComponent };
//# sourceMappingURL=df.property.component.js.map