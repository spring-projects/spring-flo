import { dia } from 'jointjs';
import { ValidatorFn, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms'
import { Flo } from './flo-common';
import { Subject, Observable } from 'rxjs'
import {debounceTime, switchMap} from 'rxjs/operators';

export namespace Properties {

  export enum InputType {
    TEXT,
    NUMBER,
    SELECT,
    CHECKBOX,
    PASSWORD,
    EMAIL,
    URL,
    CODE
  }

  export interface Property {
    readonly id: string;
    readonly name: string;
    readonly type?: string;
    readonly description?: string;
    readonly defaultValue?: any;
    value?: any;
    readonly valueOptions?: any[]
    readonly [propName: string]: any;
  }

  export interface PropertyFilter {
    accept: (property: Property) => boolean;
  }

  export interface SelectOption {
    name: string;
    value: any;
  }

  export interface ErrorData {
    id: string;
    message: string;
  }

  export interface Validation {
    validator?: ValidatorFn|ValidatorFn[]|null,
    asyncValidator?: AsyncValidatorFn|AsyncValidatorFn[]|null,
    errorData?: Array<ErrorData>;
  }

  export interface ControlModel<T> {
    readonly type: InputType;
    readonly id: string;
    value: T;
    readonly defaultValue: T;
    readonly name?: string;
    readonly description?: string;
    readonly property: Property
    readonly validation?: Validation;
  }

  export interface CodeControlModel<T> extends ControlModel<T> {
    readonly language: string;
  }

  export class GenericControlModel<T> implements ControlModel<T> {

    constructor(private _property: Property, public type: InputType, public validation?: Validation) {}

    get id() {
      return this.property.id;
    }

    get name() {
      return this.property.name;
    }

    get description() {
      return this.property.description;
    }

    get defaultValue() {
      return this.property.defaultValue;
    }

    get value(): T {
      return this.getValue();
    }

    set value(value: T) {
      this.setValue(value);
    }

    get property(): Property {
      return this._property;
    }

    protected setValue(value: T) {
      this.property.value = value;
    }

    protected getValue(): T {
      return this.property.value;
    }

  }

  export class CheckBoxControlModel extends GenericControlModel<boolean> {

    constructor(_property: Property, validation?: Validation) {
      super(_property, InputType.CHECKBOX, validation);
    }

    protected getValue() {
      const res = super.getValue();
      const type = typeof res;
      switch (type) {
        case 'boolean':
          return res;
        case 'string':
          switch ((<any>res).trim().toLowerCase()) {
            case 'true':
            case '1':
              return true;
            case 'false':
            case '0':
              return false;
            default:
              return this.property.defaultValue
          }
        case 'number':
          const num = <any> res;
          if (num === 0) {
            return false;
          } else if (num === 1) {
            return true;
          } else {
            return this.property.defaultValue
          }
      }
      return this.property.defaultValue;
    }

  }

  export abstract class AbstractCodeControlModel  extends GenericControlModel<string> implements CodeControlModel<string> {

    abstract language: string;

    constructor(_property: Property, private encode?: (s: string) => string, private decode?: (s: string) => string, validation?: Validation) {
      super(_property, InputType.CODE, validation);
    }

    set value(value: string) {
      if (value && this.encode) {
        super.setValue(this.encode(value));
      } else {
        super.setValue(value);
      }
    }

    get value(): string {
      let dsl = super.getValue();
      if (dsl && this.decode) {
        return this.decode(dsl);
      } else {
        return dsl;
      }
    }

  }


  export class GenericCodeControlModel extends AbstractCodeControlModel {

    constructor(_property: Property, public language: string, encode?: (s: string) => string, decode?: (s: string) => string, validation?: Validation) {
      super(_property, encode, decode, validation);
    }

  }

  export class CodeControlModelWithDynamicLanguageProperty extends AbstractCodeControlModel {

    private _langControlModel: Properties.ControlModel<any>;

    constructor(_property: Properties.Property, private _languagePropertyName: string,
                private _groupModel: Properties.PropertiesGroupModel,
                encode?: (s: string) => string, decode?: (s: string) => string, validation?: Validation) {
      super(_property, encode, decode, validation);
    }

    get language(): string {
      const value = this.languageControlModel.value;
      return value ? value : this.languageControlModel.defaultValue;
    }

    get languageControlModel(): Properties.ControlModel<any> {
      if (!this._langControlModel) {
        // Cast to Properties.ControlModel<any> from Properties.ControlModel<any> | undefined
        // Should not be undefined!
        this._langControlModel = <Properties.ControlModel<any>> this._groupModel.getControlsModels().find(c => c.id === this._languagePropertyName);
      }
      return this._langControlModel;
    }

  }

  export class GenericListControlModel extends GenericControlModel<string> {

    constructor(property: Property, validation?: Validation) {
      super(property, InputType.TEXT, validation);
    }

    get value(): string {
      return this.property.value ? this.property.value.toString().trim().split(/\s*,\s*/).join(', ') : '';
    }

    set value(value: string) {
      this.property.value = value && value.trim() ? value.split(/\s*,\s*/).join(',') : undefined;
    }

  }

  export class SelectControlModel extends GenericControlModel<any> {
    constructor(_property: Property, type: InputType, public options: Array<SelectOption>, validation?: Validation) {
      super(_property, type, validation);
      if (_property.defaultValue === undefined) {
        options.unshift({
          name: 'SELECT',
          value: _property.defaultValue
        })
      }
    }
  }

  export interface PropertiesSource {
    getProperties(): Promise<Property[]>;
    applyChanges(properties: Property[]): void;
  }

  export class DefaultCellPropertiesSource implements PropertiesSource {

    protected cell: dia.Cell;

    constructor(cell: dia.Cell) {
      this.cell = cell;
    }

    getProperties(): Promise<Array<Property>> {
      let metadata: Flo.ElementMetadata = this.cell.get('metadata');
      return Promise.resolve(metadata.properties().then(propsMetadata => Array.from(propsMetadata.values()).map(m => this.createProperty(m))));
    }

    protected createProperty(metadata: Flo.PropertyMetadata): Property {
      return {
        id: metadata.id,
        name: metadata.name,
        type: metadata.type,
        defaultValue: metadata.defaultValue,
        attr: `props/${metadata.name}`,
        value: this.cell.attr(`props/${metadata.name}`),
        description: metadata.description,
        valueOptions: metadata.options
      }
    }

    applyChanges(properties: Property[]) {
      this.cell.trigger('batch:start', { batchName: 'update properties' });

      properties.forEach(property => {
        if ((typeof property.value === 'boolean' && !property.defaultValue && !property.value) ||
          (property.value === property.defaultValue || property.value === '' || property.value === undefined || property.value === null)) {
          let currentValue = this.cell.attr(property.attr);
          if (currentValue !== undefined && currentValue !== null) {
            // Remove attr doesn't fire appropriate event. Set default value first as a workaround to schedule DSL resync
            // this.cell.attr(property.attr, property.defaultValue === undefined ? null : property.defaultValue);
            this.cell.attr(property.attr, null);
            this.cell.removeAttr(property.attr);
          }
        } else {
          this.cell.attr(property.attr, property.value);
        }
      });

      this.cell.trigger('batch:stop', { batchName: 'update properties' });
    }

  }

  export class PropertiesGroupModel {

    protected propertiesSource: PropertiesSource;

    protected controlModels: Array<ControlModel<any>>;

    protected loading = true;

    protected _loadedSubject: Subject<boolean>;

    constructor(propertiesSource: PropertiesSource) {
      this.propertiesSource = propertiesSource;
    }

    load() {
      this.loading = true;
      this._loadedSubject = new Subject<boolean>();
      this.propertiesSource.getProperties().then(properties => {
        this.controlModels = properties.map(p => this.createControlModel(p));
        this.loading = false;
        this._loadedSubject.next(true);
        this._loadedSubject.complete();
      });
    }

    get isLoading(): boolean {
      return this.loading;
    }

    get loadedSubject() {
      return this._loadedSubject;
    }

    getControlsModels() {
      return this.controlModels;
    }

    protected createControlModel(property: Property): ControlModel<any> {
      return new GenericControlModel(property, InputType.TEXT);
    }

    public applyChanges(): void {
      if (this.loading) {
        return;
      }

      let properties = this.controlModels.map(cm => cm.property);

      this.propertiesSource.applyChanges(properties);
    }

  }

  const UNIQUE_RESOURCE_ERROR = {uniqueResource: true};

  export namespace Validators {

    export function uniqueResource(service: (value: any) => Observable<boolean>, debounceDuration: number): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors> => {
        return new Observable<ValidationErrors>(obs => {
          if (control.valueChanges) {
            return control.valueChanges.pipe(
              debounceTime(debounceDuration),
              switchMap(() => service(control.value)),
            ).subscribe((res) => {
              if (res) {
                obs.next(undefined);
              } else {
                obs.next(UNIQUE_RESOURCE_ERROR);
              }
              obs.complete();
            }, () => {
              obs.next(UNIQUE_RESOURCE_ERROR);
              obs.complete();
            });
          } else {
            service(control.value).subscribe((res) => {
              if (res) {
                obs.next(undefined);
              } else {
                obs.next(UNIQUE_RESOURCE_ERROR);
              }
              obs.complete();
            }, () => {
              obs.next(UNIQUE_RESOURCE_ERROR);
              obs.complete();
            })
          }
        });
      }
    }

    export function noneOf(excluded: Array<any>): ValidatorFn {
      return (control: AbstractControl): {[key: string]: any} => {
        return excluded.find(e => e === control.value) ? {'noneOf': {value: control.value}} : {};
      };
    }

  }

}
