import { Subject, Observable } from 'rxjs';
import { debounceTime, mergeMap } from 'rxjs/operators';
export var Properties;
(function (Properties) {
    let InputType;
    (function (InputType) {
        InputType[InputType["TEXT"] = 0] = "TEXT";
        InputType[InputType["NUMBER"] = 1] = "NUMBER";
        InputType[InputType["SELECT"] = 2] = "SELECT";
        InputType[InputType["CHECKBOX"] = 3] = "CHECKBOX";
        InputType[InputType["PASSWORD"] = 4] = "PASSWORD";
        InputType[InputType["EMAIL"] = 5] = "EMAIL";
        InputType[InputType["URL"] = 6] = "URL";
        InputType[InputType["CODE"] = 7] = "CODE";
    })(InputType = Properties.InputType || (Properties.InputType = {}));
    class GenericControlModel {
        constructor(_property, type, validation) {
            this._property = _property;
            this.type = type;
            this.validation = validation;
        }
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
        get value() {
            return this.getValue();
        }
        set value(value) {
            this.setValue(value);
        }
        get property() {
            return this._property;
        }
        setValue(value) {
            this.property.value = value;
        }
        getValue() {
            return this.property.value;
        }
    }
    Properties.GenericControlModel = GenericControlModel;
    class CheckBoxControlModel extends GenericControlModel {
        constructor(_property, validation) {
            super(_property, InputType.CHECKBOX, validation);
        }
        getValue() {
            const res = super.getValue();
            const type = typeof res;
            switch (type) {
                case 'boolean':
                    return res;
                case 'string':
                    switch (res.trim().toLowerCase()) {
                        case 'true':
                        case '1':
                            return true;
                        case 'false':
                        case '0':
                            return false;
                        default:
                            return this.property.defaultValue;
                    }
                case 'number':
                    const num = res;
                    if (num === 0) {
                        return false;
                    }
                    else if (num === 1) {
                        return true;
                    }
                    else {
                        return this.property.defaultValue;
                    }
            }
            return this.property.defaultValue;
        }
    }
    Properties.CheckBoxControlModel = CheckBoxControlModel;
    class AbstractCodeControlModel extends GenericControlModel {
        constructor(_property, encode, decode, validation) {
            super(_property, InputType.CODE, validation);
            this.encode = encode;
            this.decode = decode;
        }
        set value(value) {
            if (value && this.encode) {
                super.setValue(this.encode(value));
            }
            else {
                super.setValue(value);
            }
        }
        get value() {
            let dsl = super.getValue();
            if (dsl && this.decode) {
                return this.decode(dsl);
            }
            else {
                return dsl;
            }
        }
    }
    Properties.AbstractCodeControlModel = AbstractCodeControlModel;
    class GenericCodeControlModel extends AbstractCodeControlModel {
        constructor(_property, language, encode, decode, validation) {
            super(_property, encode, decode, validation);
            this.language = language;
        }
    }
    Properties.GenericCodeControlModel = GenericCodeControlModel;
    class CodeControlModelWithDynamicLanguageProperty extends AbstractCodeControlModel {
        constructor(_property, _languagePropertyName, _groupModel, encode, decode, validation) {
            super(_property, encode, decode, validation);
            this._languagePropertyName = _languagePropertyName;
            this._groupModel = _groupModel;
        }
        get language() {
            const value = this.languageControlModel.value;
            return value ? value : this.languageControlModel.defaultValue;
        }
        get languageControlModel() {
            if (!this._langControlModel) {
                // Cast to Properties.ControlModel<any> from Properties.ControlModel<any> | undefined
                // Should not be undefined!
                this._langControlModel = this._groupModel.getControlsModels().find(c => c.id === this._languagePropertyName);
            }
            return this._langControlModel;
        }
    }
    Properties.CodeControlModelWithDynamicLanguageProperty = CodeControlModelWithDynamicLanguageProperty;
    class GenericListControlModel extends GenericControlModel {
        constructor(property, validation) {
            super(property, InputType.TEXT, validation);
        }
        get value() {
            return this.property.value ? this.property.value.join(', ') : '';
        }
        set value(value) {
            this.property.value = value && value.trim() ? value.split(/\s*,\s*/) : undefined;
        }
    }
    Properties.GenericListControlModel = GenericListControlModel;
    class SelectControlModel extends GenericControlModel {
        constructor(_property, type, options) {
            super(_property, type);
            this.options = options;
            if (_property.defaultValue === undefined) {
                options.unshift({
                    name: 'SELECT',
                    value: _property.defaultValue
                });
            }
        }
    }
    Properties.SelectControlModel = SelectControlModel;
    class DefaultCellPropertiesSource {
        constructor(cell) {
            this.cell = cell;
        }
        getProperties() {
            let metadata = this.cell.attr('metadata');
            return Promise.resolve(metadata.properties().then(propsMetadata => Array.from(propsMetadata.values()).map(m => this.createProperty(m))));
        }
        createProperty(metadata) {
            return {
                id: metadata.id,
                name: metadata.name,
                type: metadata.type,
                defaultValue: metadata.defaultValue,
                attr: `props/${metadata.name}`,
                value: this.cell.attr(`props/${metadata.name}`),
                description: metadata.description,
                valueOptions: metadata.options
            };
        }
        applyChanges(properties) {
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
                }
                else {
                    this.cell.attr(property.attr, property.value);
                }
            });
            this.cell.trigger('batch:stop', { batchName: 'update properties' });
        }
    }
    Properties.DefaultCellPropertiesSource = DefaultCellPropertiesSource;
    class PropertiesGroupModel {
        constructor(propertiesSource) {
            this.loading = true;
            this.propertiesSource = propertiesSource;
        }
        load() {
            this.loading = true;
            this._loadedSubject = new Subject();
            this.propertiesSource.getProperties().then(properties => {
                this.controlModels = properties.map(p => this.createControlModel(p));
                this.loading = false;
                this._loadedSubject.next(true);
                this._loadedSubject.complete();
            });
        }
        get isLoading() {
            return this.loading;
        }
        get loadedSubject() {
            return this._loadedSubject;
        }
        getControlsModels() {
            return this.controlModels;
        }
        createControlModel(property) {
            return new GenericControlModel(property, InputType.TEXT);
        }
        applyChanges() {
            if (this.loading) {
                return;
            }
            let properties = this.controlModels.map(cm => cm.property);
            this.propertiesSource.applyChanges(properties);
        }
    }
    Properties.PropertiesGroupModel = PropertiesGroupModel;
    let Validators;
    (function (Validators) {
        function uniqueResource(service, debounce) {
            return (control) => {
                return new Observable(obs => {
                    if (control.valueChanges && control.value) {
                        control.valueChanges
                            .pipe(debounceTime(debounce), mergeMap(value => service(value)))
                            .subscribe(() => {
                            obs.next({ uniqueResource: true });
                            obs.complete();
                        }, () => {
                            obs.next(undefined);
                            obs.complete();
                        });
                    }
                    else {
                        obs.next(undefined);
                        obs.complete();
                    }
                });
            };
        }
        Validators.uniqueResource = uniqueResource;
        function noneOf(excluded) {
            return (control) => {
                return excluded.find(e => e === control.value) ? { 'noneOf': { value: control.value } } : {};
            };
        }
        Validators.noneOf = noneOf;
    })(Validators = Properties.Validators || (Properties.Validators = {}));
})(Properties || (Properties = {}));
//# sourceMappingURL=flo-properties.js.map