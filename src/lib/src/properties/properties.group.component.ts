import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Properties } from './../shared/flo.properties';

@Component({
  selector: 'properties-group',
  templateUrl: './properties.group.component.html',
  encapsulation: ViewEncapsulation.None
})
export class PropertiesGroupComponent implements OnInit {

  @Input()
  propertiesGroupModel : Properties.PropertiesGroupModel;

  form : FormGroup;

  @Output('form')
  private formEventEmitter = new EventEmitter<FormGroup>();

  ngOnInit() {
    this.form = new FormGroup({});
    if (this.propertiesGroupModel.isLoading) {
      let subscription = this.propertiesGroupModel.loadedSubject.subscribe(loaded => {
        if (loaded) {
          subscription.unsubscribe();
          this.createGroupControls();
        }
      })
    } else {
      this.createGroupControls();
    }
    this.formEventEmitter.emit(this.form);
  }

  createGroupControls() {
    this.propertiesGroupModel.getControlsModels().forEach(c => {
      if (c.validation) {
        this.form.addControl(c.id, new FormControl(c.value || '', c.validation.validator, c.validation.asyncValidator));
      } else {
        this.form.addControl(c.id, new FormControl(c.value || ''));
      }
    })
  }

}
