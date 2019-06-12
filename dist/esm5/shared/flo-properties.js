import * as tslib_1 from "tslib";
import { Subject, Observable } from 'rxjs';
import { debounceTime, mergeMap } from 'rxjs/operators';
export var Properties;
(function (Properties) {
    var InputType;
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
    var GenericControlModel = /** @class */ (function () {
        function GenericControlModel(_property, type, validation) {
            this._property = _property;
            this.type = type;
            this.validation = validation;
        }
        Object.defineProperty(GenericControlModel.prototype, "id", {
            get: function () {
                return this.property.id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GenericControlModel.prototype, "name", {
            get: function () {
                return this.property.name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GenericControlModel.prototype, "description", {
            get: function () {
                return this.property.description;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GenericControlModel.prototype, "defaultValue", {
            get: function () {
                return this.property.defaultValue;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GenericControlModel.prototype, "value", {
            get: function () {
                return this.getValue();
            },
            set: function (value) {
                this.setValue(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GenericControlModel.prototype, "property", {
            get: function () {
                return this._property;
            },
            enumerable: true,
            configurable: true
        });
        GenericControlModel.prototype.setValue = function (value) {
            this.property.value = value;
        };
        GenericControlModel.prototype.getValue = function () {
            return this.property.value;
        };
        return GenericControlModel;
    }());
    Properties.GenericControlModel = GenericControlModel;
    var CheckBoxControlModel = /** @class */ (function (_super) {
        tslib_1.__extends(CheckBoxControlModel, _super);
        function CheckBoxControlModel(_property, validation) {
            return _super.call(this, _property, InputType.CHECKBOX, validation) || this;
        }
        CheckBoxControlModel.prototype.getValue = function () {
            var res = _super.prototype.getValue.call(this);
            var type = typeof res;
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
                    var num = res;
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
        };
        return CheckBoxControlModel;
    }(GenericControlModel));
    Properties.CheckBoxControlModel = CheckBoxControlModel;
    var AbstractCodeControlModel = /** @class */ (function (_super) {
        tslib_1.__extends(AbstractCodeControlModel, _super);
        function AbstractCodeControlModel(_property, encode, decode, validation) {
            var _this = _super.call(this, _property, InputType.CODE, validation) || this;
            _this.encode = encode;
            _this.decode = decode;
            return _this;
        }
        Object.defineProperty(AbstractCodeControlModel.prototype, "value", {
            get: function () {
                var dsl = _super.prototype.getValue.call(this);
                if (dsl && this.decode) {
                    return this.decode(dsl);
                }
                else {
                    return dsl;
                }
            },
            set: function (value) {
                if (value && this.encode) {
                    _super.prototype.setValue.call(this, this.encode(value));
                }
                else {
                    _super.prototype.setValue.call(this, value);
                }
            },
            enumerable: true,
            configurable: true
        });
        return AbstractCodeControlModel;
    }(GenericControlModel));
    Properties.AbstractCodeControlModel = AbstractCodeControlModel;
    var GenericCodeControlModel = /** @class */ (function (_super) {
        tslib_1.__extends(GenericCodeControlModel, _super);
        function GenericCodeControlModel(_property, language, encode, decode, validation) {
            var _this = _super.call(this, _property, encode, decode, validation) || this;
            _this.language = language;
            return _this;
        }
        return GenericCodeControlModel;
    }(AbstractCodeControlModel));
    Properties.GenericCodeControlModel = GenericCodeControlModel;
    var CodeControlModelWithDynamicLanguageProperty = /** @class */ (function (_super) {
        tslib_1.__extends(CodeControlModelWithDynamicLanguageProperty, _super);
        function CodeControlModelWithDynamicLanguageProperty(_property, _languagePropertyName, _groupModel, encode, decode, validation) {
            var _this = _super.call(this, _property, encode, decode, validation) || this;
            _this._languagePropertyName = _languagePropertyName;
            _this._groupModel = _groupModel;
            return _this;
        }
        Object.defineProperty(CodeControlModelWithDynamicLanguageProperty.prototype, "language", {
            get: function () {
                var value = this.languageControlModel.value;
                return value ? value : this.languageControlModel.defaultValue;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CodeControlModelWithDynamicLanguageProperty.prototype, "languageControlModel", {
            get: function () {
                var _this = this;
                if (!this._langControlModel) {
                    // Cast to Properties.ControlModel<any> from Properties.ControlModel<any> | undefined
                    // Should not be undefined!
                    this._langControlModel = this._groupModel.getControlsModels().find(function (c) { return c.id === _this._languagePropertyName; });
                }
                return this._langControlModel;
            },
            enumerable: true,
            configurable: true
        });
        return CodeControlModelWithDynamicLanguageProperty;
    }(AbstractCodeControlModel));
    Properties.CodeControlModelWithDynamicLanguageProperty = CodeControlModelWithDynamicLanguageProperty;
    var GenericListControlModel = /** @class */ (function (_super) {
        tslib_1.__extends(GenericListControlModel, _super);
        function GenericListControlModel(property, validation) {
            return _super.call(this, property, InputType.TEXT, validation) || this;
        }
        Object.defineProperty(GenericListControlModel.prototype, "value", {
            get: function () {
                return this.property.value ? this.property.value.join(', ') : '';
            },
            set: function (value) {
                this.property.value = value && value.trim() ? value.split(/\s*,\s*/) : undefined;
            },
            enumerable: true,
            configurable: true
        });
        return GenericListControlModel;
    }(GenericControlModel));
    Properties.GenericListControlModel = GenericListControlModel;
    var SelectControlModel = /** @class */ (function (_super) {
        tslib_1.__extends(SelectControlModel, _super);
        function SelectControlModel(_property, type, options) {
            var _this = _super.call(this, _property, type) || this;
            _this.options = options;
            if (_property.defaultValue === undefined) {
                options.unshift({
                    name: 'SELECT',
                    value: _property.defaultValue
                });
            }
            return _this;
        }
        return SelectControlModel;
    }(GenericControlModel));
    Properties.SelectControlModel = SelectControlModel;
    var DefaultCellPropertiesSource = /** @class */ (function () {
        function DefaultCellPropertiesSource(cell) {
            this.cell = cell;
        }
        DefaultCellPropertiesSource.prototype.getProperties = function () {
            var _this = this;
            var metadata = this.cell.attr('metadata');
            return Promise.resolve(metadata.properties().then(function (propsMetadata) { return Array.from(propsMetadata.values()).map(function (m) { return _this.createProperty(m); }); }));
        };
        DefaultCellPropertiesSource.prototype.createProperty = function (metadata) {
            return {
                id: metadata.id,
                name: metadata.name,
                type: metadata.type,
                defaultValue: metadata.defaultValue,
                attr: "props/" + metadata.name,
                value: this.cell.attr("props/" + metadata.name),
                description: metadata.description,
                valueOptions: metadata.options
            };
        };
        DefaultCellPropertiesSource.prototype.applyChanges = function (properties) {
            var _this = this;
            this.cell.trigger('batch:start', { batchName: 'update properties' });
            properties.forEach(function (property) {
                if ((typeof property.value === 'boolean' && !property.defaultValue && !property.value) ||
                    (property.value === property.defaultValue || property.value === '' || property.value === undefined || property.value === null)) {
                    var currentValue = _this.cell.attr(property.attr);
                    if (currentValue !== undefined && currentValue !== null) {
                        // Remove attr doesn't fire appropriate event. Set default value first as a workaround to schedule DSL resync
                        _this.cell.attr(property.attr, property.defaultValue === undefined ? null : property.defaultValue);
                        _this.cell.removeAttr(property.attr);
                    }
                }
                else {
                    _this.cell.attr(property.attr, property.value);
                }
            });
            this.cell.trigger('batch:stop', { batchName: 'update properties' });
        };
        return DefaultCellPropertiesSource;
    }());
    Properties.DefaultCellPropertiesSource = DefaultCellPropertiesSource;
    var PropertiesGroupModel = /** @class */ (function () {
        function PropertiesGroupModel(propertiesSource) {
            this.loading = true;
            this.propertiesSource = propertiesSource;
        }
        PropertiesGroupModel.prototype.load = function () {
            var _this = this;
            this.loading = true;
            this._loadedSubject = new Subject();
            this.propertiesSource.getProperties().then(function (properties) {
                _this.controlModels = properties.map(function (p) { return _this.createControlModel(p); });
                _this.loading = false;
                _this._loadedSubject.next(true);
                _this._loadedSubject.complete();
            });
        };
        Object.defineProperty(PropertiesGroupModel.prototype, "isLoading", {
            get: function () {
                return this.loading;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PropertiesGroupModel.prototype, "loadedSubject", {
            get: function () {
                return this._loadedSubject;
            },
            enumerable: true,
            configurable: true
        });
        PropertiesGroupModel.prototype.getControlsModels = function () {
            return this.controlModels;
        };
        PropertiesGroupModel.prototype.createControlModel = function (property) {
            return new GenericControlModel(property, InputType.TEXT);
        };
        PropertiesGroupModel.prototype.applyChanges = function () {
            if (this.loading) {
                return;
            }
            var properties = this.controlModels.map(function (cm) { return cm.property; });
            this.propertiesSource.applyChanges(properties);
        };
        return PropertiesGroupModel;
    }());
    Properties.PropertiesGroupModel = PropertiesGroupModel;
    var Validators;
    (function (Validators) {
        function uniqueResource(service, debounce) {
            return function (control) {
                return new Observable(function (obs) {
                    if (control.valueChanges && control.value) {
                        control.valueChanges
                            .pipe(debounceTime(debounce), mergeMap(function (value) { return service(value); }))
                            .subscribe(function () {
                            obs.next({ uniqueResource: true });
                            obs.complete();
                        }, function () {
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
            return function (control) {
                return excluded.find(function (e) { return e === control.value; }) ? { 'noneOf': { value: control.value } } : {};
            };
        }
        Validators.noneOf = noneOf;
    })(Validators = Properties.Validators || (Properties.Validators = {}));
})(Properties || (Properties = {}));
//# sourceMappingURL=flo-properties.js.map