import * as tslib_1 from "tslib";
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Properties } from '../shared/flo-properties';
var PropertiesGroupComponent = /** @class */ (function () {
    function PropertiesGroupComponent() {
    }
    PropertiesGroupComponent.prototype.ngOnInit = function () {
        var _this = this;
        if (this.propertiesGroupModel.isLoading) {
            var subscription_1 = this.propertiesGroupModel.loadedSubject.subscribe(function (loaded) {
                if (loaded) {
                    subscription_1.unsubscribe();
                    _this.createGroupControls();
                }
            });
        }
        else {
            this.createGroupControls();
        }
    };
    PropertiesGroupComponent.prototype.createGroupControls = function () {
        var _this = this;
        this.propertiesGroupModel.getControlsModels().forEach(function (c) {
            if (c.validation) {
                _this.form.addControl(c.id, new FormControl(c.value || '', c.validation.validator, c.validation.asyncValidator));
            }
            else {
                _this.form.addControl(c.id, new FormControl(c.value || ''));
            }
        });
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
            template: "\n    <div *ngIf=\"propertiesGroupModel && !propertiesGroupModel.isLoading\" class=\"properties-group-container\" [formGroup]=\"form\">\n        <df-property *ngFor=\"let model of propertiesGroupModel.getControlsModels()\" [model]=\"model\" [form]=\"form\" class=\"property-row\"></df-property>\n    </div>\n  ",
            encapsulation: ViewEncapsulation.None
        })
    ], PropertiesGroupComponent);
    return PropertiesGroupComponent;
}());
export { PropertiesGroupComponent };
//# sourceMappingURL=properties.group.component.js.map