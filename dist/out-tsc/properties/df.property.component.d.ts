import { FormGroup, AbstractControl } from '@angular/forms';
import { Properties } from '../shared/flo-properties';
export declare class DynamicFormPropertyComponent {
    model: Properties.ControlModel<any>;
    form: FormGroup;
    constructor();
    readonly types: typeof Properties.InputType;
    readonly control: AbstractControl;
    readonly errorData: Properties.ErrorData[];
}
