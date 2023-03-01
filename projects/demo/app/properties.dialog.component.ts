import { Component, ViewEncapsulation } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Properties } from 'spring-flo';
import { FormGroup } from '@angular/forms';

// For JS linting
// import 'jshint';

@Component({
  selector: 'properties-dialog-content',
  templateUrl: './properties.dialog.component.html',
  encapsulation: ViewEncapsulation.None
})
export class PropertiesDialogComponent {

  public title: string;

  propertiesGroupModel : Properties.PropertiesGroupModel;

  propertiesFormGroup : FormGroup;

  constructor(public bsModalRef: BsModalRef) {
    this.propertiesFormGroup = new FormGroup({});
  }

  handleOk() {
    this.propertiesGroupModel.applyChanges();
    this.bsModalRef.hide();
  }

  handleCancel() {
    this.bsModalRef.hide();
  }

  get okDisabled() {
    return !this.propertiesGroupModel || !this.propertiesFormGroup || !this.propertiesFormGroup.valid;
  }

}
