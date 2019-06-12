import { dia } from 'jointjs';
import { ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Flo } from './flo-common';
import { Subject, Observable } from 'rxjs';
export declare namespace Properties {
    enum InputType {
        TEXT = 0,
        NUMBER = 1,
        SELECT = 2,
        CHECKBOX = 3,
        PASSWORD = 4,
        EMAIL = 5,
        URL = 6,
        CODE = 7
    }
    interface Property {
        readonly id: string;
        readonly name: string;
        readonly type?: string;
        readonly description?: string;
        readonly defaultValue?: any;
        value?: any;
        readonly valueOptions?: any[];
        readonly [propName: string]: any;
    }
    interface SelectOption {
        name: string;
        value: any;
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
    interface CodeControlModel<T> extends ControlModel<T> {
        readonly language: string;
    }
    class GenericControlModel<T> implements ControlModel<T> {
        private _property;
        type: InputType;
        validation?: Validation;
        constructor(_property: Property, type: InputType, validation?: Validation);
        readonly id: string;
        readonly name: string;
        readonly description: string;
        readonly defaultValue: any;
        value: T;
        readonly property: Property;
        protected setValue(value: T): void;
        protected getValue(): T;
    }
    class CheckBoxControlModel extends GenericControlModel<boolean> {
        constructor(_property: Property, validation?: Validation);
        protected getValue(): any;
    }
    abstract class AbstractCodeControlModel extends GenericControlModel<string> implements CodeControlModel<string> {
        private encode?;
        private decode?;
        abstract language: string;
        constructor(_property: Property, encode?: (s: string) => string, decode?: (s: string) => string, validation?: Validation);
        value: string;
    }
    class GenericCodeControlModel extends AbstractCodeControlModel {
        language: string;
        constructor(_property: Property, language: string, encode?: (s: string) => string, decode?: (s: string) => string, validation?: Validation);
    }
    class CodeControlModelWithDynamicLanguageProperty extends AbstractCodeControlModel {
        private _languagePropertyName;
        private _groupModel;
        private _langControlModel;
        constructor(_property: Properties.Property, _languagePropertyName: string, _groupModel: Properties.PropertiesGroupModel, encode?: (s: string) => string, decode?: (s: string) => string, validation?: Validation);
        readonly language: string;
        readonly languageControlModel: Properties.ControlModel<any>;
    }
    class GenericListControlModel extends GenericControlModel<string> {
        constructor(property: Property, validation?: Validation);
        value: string;
    }
    class SelectControlModel extends GenericControlModel<any> {
        options: Array<SelectOption>;
        constructor(_property: Property, type: InputType, options: Array<SelectOption>);
    }
    interface PropertiesSource {
        getProperties(): Promise<Property[]>;
        applyChanges(properties: Property[]): void;
    }
    class DefaultCellPropertiesSource implements PropertiesSource {
        protected cell: dia.Cell;
        constructor(cell: dia.Cell);
        getProperties(): Promise<Array<Property>>;
        protected createProperty(metadata: Flo.PropertyMetadata): Property;
        applyChanges(properties: Property[]): void;
    }
    class PropertiesGroupModel {
        protected propertiesSource: PropertiesSource;
        protected controlModels: Array<ControlModel<any>>;
        protected loading: boolean;
        protected _loadedSubject: Subject<boolean>;
        constructor(propertiesSource: PropertiesSource);
        load(): void;
        readonly isLoading: boolean;
        readonly loadedSubject: Subject<boolean>;
        getControlsModels(): ControlModel<any>[];
        protected createControlModel(property: Property): ControlModel<any>;
        applyChanges(): void;
    }
    namespace Validators {
        function uniqueResource(service: (value: any) => Observable<any>, debounce: number): AsyncValidatorFn;
        function noneOf(excluded: Array<any>): ValidatorFn;
    }
}
