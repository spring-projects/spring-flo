import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';
import { Properties } from '../shared/flo-properties';

@Component({
  selector: 'df-property',
  templateUrl: './df.property.component.html',
  encapsulation: ViewEncapsulation.None
})
export class DynamicFormPropertyComponent {

  @Input()
  model: Properties.ControlModel<any>;

  @Input() form: FormGroup;

  constructor() {}

  get types() {
    return Properties.InputType;
  }

  get control(): AbstractControl {
    return this.form.controls[this.model.id];
  }

  get errorData() {
    return (this.model.validation && this.model.validation.errorData ? this.model.validation.errorData : [])
      .filter(e => this.control.errors && this.control.errors[e.id]);
  }

  get selectControlModel(): Properties.SelectControlModel {
    return this.model as Properties.SelectControlModel;
  }

  get codeControlModel(): Properties.CodeControlModel<any> {
    return this.model as Properties.CodeControlModel<any>;
  }

}
