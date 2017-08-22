import { Component, ViewEncapsulation, EventEmitter, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { Properties } from 'spring-flo';
import { FormGroup } from '@angular/forms';


@Component({
  selector: 'properties-dialog-content',
  templateUrl: './properties.dialog.component.html',
  encapsulation: ViewEncapsulation.None
})
export class PropertiesDialogComponent {

  public title: string;

  propertiesGroupModel : Properties.PropertiesGroupModel;

  propertiesFormGroup : FormGroup;

  constructor(private bsModalRef: BsModalRef) {}

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
