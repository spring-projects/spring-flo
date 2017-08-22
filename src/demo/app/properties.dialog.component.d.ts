import { BsModalRef } from 'ngx-bootstrap';
import { Properties } from 'spring-flo';
import { FormGroup } from '@angular/forms';
export declare class PropertiesDialogComponent {
    private bsModalRef;
    title: string;
    propertiesGroupModel: Properties.PropertiesGroupModel;
    propertiesFormGroup: FormGroup;
    constructor(bsModalRef: BsModalRef);
    handleOk(): void;
    handleCancel(): void;
    readonly okDisabled: boolean;
}
