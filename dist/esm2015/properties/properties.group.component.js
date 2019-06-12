import * as tslib_1 from "tslib";
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Properties } from '../shared/flo-properties';
let PropertiesGroupComponent = class PropertiesGroupComponent {
    ngOnInit() {
        if (this.propertiesGroupModel.isLoading) {
            let subscription = this.propertiesGroupModel.loadedSubject.subscribe(loaded => {
                if (loaded) {
                    subscription.unsubscribe();
                    this.createGroupControls();
                }
            });
        }
        else {
            this.createGroupControls();
        }
    }
    createGroupControls() {
        this.propertiesGroupModel.getControlsModels().forEach(c => {
            if (c.validation) {
                this.form.addControl(c.id, new FormControl(c.value || '', c.validation.validator, c.validation.asyncValidator));
            }
            else {
                this.form.addControl(c.id, new FormControl(c.value || ''));
            }
        });
    }
};
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Properties.PropertiesGroupModel)
], PropertiesGroupComponent.prototype, "propertiesGroupModel", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", FormGroup)
], PropertiesGroupComponent.prototype, "form", void 0);
PropertiesGroupComponent = tslib_1.__decorate([
    Component({
        selector: 'properties-group',
        template: `
    <div *ngIf="propertiesGroupModel && !propertiesGroupModel.isLoading" class="properties-group-container" [formGroup]="form">
        <df-property *ngFor="let model of propertiesGroupModel.getControlsModels()" [model]="model" [form]="form" class="property-row"></df-property>
    </div>
  `,
        encapsulation: ViewEncapsulation.None
    })
], PropertiesGroupComponent);
export { PropertiesGroupComponent };
//# sourceMappingURL=properties.group.component.js.map