import { OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Properties } from './../shared/flo.properties';
export declare class PropertiesGroupComponent implements OnInit {
    propertiesGroupModel: Properties.PropertiesGroupModel;
    form: FormGroup;
    private formEventEmitter;
    ngOnInit(): void;
    createGroupControls(): void;
}
