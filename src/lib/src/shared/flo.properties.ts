import { dia } from 'jointjs';
import { ValidatorFn, AsyncValidatorFn } from '@angular/forms'
import { Flo } from './../shared/flo.common';
import { Subject } from 'rxjs/Subject'

export namespace Properties {

  export enum InputType {
    TEXT,
    NUMBER,
    SELECT,
    CHECKBOX,
    EMAIL,
    URL,
    CODE
  }

  export interface Property {
    id : string;
    name : string;
    attr : string;
    description? : string;
    defaultValue? : any;
    value? : any;
  }

  export interface ErrorData {
    id : string;
    message : string;
  }

  export interface Validation {
    validator?: ValidatorFn|ValidatorFn[]|null,
    asyncValidator?: AsyncValidatorFn|AsyncValidatorFn[]|null,
    errorData? : Array<ErrorData>;
  }

  export interface ControlModel<T> {
    readonly type : InputType;
    readonly id : string;
    value : T;
    readonly defaultValue : T;
    readonly name? : string;
    readonly description? : string;
    readonly property : Property
    readonly validation? : Validation;
  }

  // export interface Model {
  //   loaded : EventEmitter<boolean>;
  //   controls : EventEmitter<ControlModel>;
  //   applyChanges() : void;
  // }

  export class GenericControlModel<T> implements ControlModel<T> {

    constructor(private _property : Property, public type : InputType) {}

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

    get value() : T {
      return <T> this.property.value;
    }

    set value(value : T) {
      this.property.value = value;
    }

    get property() : Property {
      return this._property;
    }

  }

  export class PropertiesGroupModel {

    protected cell : dia.Cell;

    protected controlModels : Array<ControlModel<any>>;

    protected loading : boolean = true;

    protected _loadedSubject = new Subject<boolean>();

    constructor(cell : dia.Cell) {
      this.cell = cell;
      this.init();
    }

    private init() {
      this.createProperties().then(properties => {
        this.controlModels = properties.map(p => this.createControlModel(p));
        this.loading = false;
        this._loadedSubject.next(true);
      });
    }

    get isLoading() : boolean {
      return this.loading;
    }

    get loadedSubject() {
      return this._loadedSubject;
    }

    getControlsModels() {
      return this.controlModels;
    }

    protected createProperties() : Promise<Array<Property>> {
      let metadata : Flo.ElementMetadata = this.cell.attr('metadata');
      return Promise.resolve(metadata.properties().then(propsMetadata => propsMetadata.map(m => this.createProperty(m))));
    }

    protected createProperty(metadata : Flo.PropertyMetadata) : Property {
      return {
        id: metadata.id,
        name: metadata.name,
        defaultValue: metadata.defaultValue,
        attr: `props/${metadata.name}`,
        value: this.cell.attr(`props/${metadata.name}`),
        description: metadata.description
      }
    }

    protected createControlModel(property : Property) : ControlModel<any> {
      return new GenericControlModel(property, InputType.TEXT);
    }

    public applyChanges() : void {
      if (this.loading) {
        return;
      }

      let properties = this.controlModels.map(cm => cm.property);

      this.cell.trigger('batch:start', { batchName: 'update properties' });

      properties.forEach(property => {
        if ((typeof property.value === 'boolean' && !property.defaultValue && !property.value) ||
          (property.value === property.defaultValue || property.value === '' || property.value === undefined || property.value === null)) {
          let currentValue = this.cell.attr(property.attr);
          if (currentValue !== undefined && currentValue !== null) {
            // Remove attr doesn't fire appropriate event. Set default value first as a workaround to schedule DSL resync
            this.cell.attr(property.attr, property.defaultValue === undefined ? null : property.defaultValue);
            this.cell.removeAttr(property.attr);
          }
        } else {
          this.cell.attr(property.attr, property.value);
        }
      });

      this.cell.trigger('batch:stop', { batchName: 'update properties' });
    }

  }

}
