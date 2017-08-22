import { dia } from 'jointjs';
import { ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Flo } from './../shared/flo.common';
import { Subject } from 'rxjs/Subject';
export declare namespace Properties {
    enum InputType {
        TEXT = 0,
        NUMBER = 1,
        SELECT = 2,
        CHECKBOX = 3,
        EMAIL = 4,
        URL = 5,
        CODE = 6,
    }
    interface Property {
        id: string;
        name: string;
        attr: string;
        description?: string;
        defaultValue?: any;
        value?: any;
    }
    interface ErrorData {
        id: string;
        message: string;
    }
    interface Validation {
        validator?: ValidatorFn | ValidatorFn[] | null;
        asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null;
        errorData?: Array<ErrorData>;
    }
    interface ControlModel<T> {
        readonly type: InputType;
        readonly id: string;
        value: T;
        readonly defaultValue: T;
        readonly name?: string;
        readonly description?: string;
        readonly property: Property;
        readonly validation?: Validation;
    }
    class GenericControlModel<T> implements ControlModel<T> {
        private _property;
        type: InputType;
        constructor(_property: Property, type: InputType);
        readonly id: string;
        readonly name: string;
        readonly description: string;
        readonly defaultValue: any;
        value: T;
        readonly property: Property;
    }
    class PropertiesGroupModel {
        protected cell: dia.Cell;
        protected controlModels: Array<ControlModel<any>>;
        protected loading: boolean;
        protected _loadedSubject: Subject<boolean>;
        constructor(cell: dia.Cell);
        private init();
        readonly isLoading: boolean;
        readonly loadedSubject: Subject<boolean>;
        getControlsModels(): ControlModel<any>[];
        protected createProperties(): Promise<Array<Property>>;
        protected createProperty(metadata: Flo.PropertyMetadata): Property;
        protected createControlModel(property: Property): ControlModel<any>;
        applyChanges(): void;
    }
}
