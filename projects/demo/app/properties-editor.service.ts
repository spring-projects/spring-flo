import {Injectable} from '@angular/core';
import {dia} from 'jointjs';
import {PropertiesDialogComponent} from './properties.dialog.component';
import {BsModalService} from 'ngx-bootstrap/modal';
import {Flo, Properties} from '../../flo';
import {Validators} from '@angular/forms';


@Injectable({
  providedIn: 'root'
})
export class PropertiesEditorService {

  constructor(private modalService: BsModalService) {}

  openPropertiesDialog(cell: dia.Cell) {
    const bsModalRef = this.modalService.show(PropertiesDialogComponent);
    const metadata: Flo.ElementMetadata = cell.get('metadata');
    bsModalRef.content.title = `Properties for ${metadata.name.toUpperCase()}`;
    let propertiesModel = new SamplePropertiesGroupModel(new Properties.DefaultCellPropertiesSource(cell));
    propertiesModel.load();
    bsModalRef.content.propertiesGroupModel = propertiesModel;
  }


}

class SamplePropertiesGroupModel extends Properties.PropertiesGroupModel {
  protected createControlModel(property: Properties.Property): Properties.ControlModel<any> {
    let inputType = Properties.InputType.TEXT;
    let validation: Properties.Validation;
    switch (property.type) {
      case 'number':
        inputType = Properties.InputType.NUMBER;
        break;
      case 'url':
        inputType = Properties.InputType.URL;
        break;
      case 'password':
        inputType = Properties.InputType.PASSWORD;
        break;
      case 'boolean':
        return new Properties.CheckBoxControlModel(property);
      case 'e-mail':
        inputType = Properties.InputType.EMAIL;
        break;
      case 'list':
      case 'list[number]':
      case 'list[boolean]':
        return new Properties.GenericListControlModel(property);
      case 'enum':
        if (Array.isArray(property.valueOptions)) {
          return new Properties.SelectControlModel(property, Properties.InputType.SELECT, (<Array<string>> property.valueOptions).map(o => {
            return {
              name: o,
              value: o === property.defaultValue ? undefined : o
            }
          }));
        }
        break;
      case 'code':
        return new Properties.CodeControlModelWithDynamicLanguageProperty(property, 'language', this, this.encodeTextToDSL, this.decodeTextFromDSL);
      default:
        if (property.name === 'name') {
          validation = {
            validator: Validators.required,
            errorData: [
              { id: 'required', message: 'Name is required!' }
            ]
          }
        }
        break;
    }
    return new Properties.GenericControlModel(property, inputType, validation);
  }

  encodeTextToDSL(text: string): string {
    return '\"' + text.replace(/(?:\r\n|\r|\n)/g, '\\n').replace(/"/g, '""') + '\"';
  }

  decodeTextFromDSL(dsl: string): string {
    if (dsl.charAt(0) === '\"' && dsl.charAt(dsl.length - 1) === '\"') {
      dsl = dsl.substr(1, dsl.length - 2);
    }
    return dsl.replace(/\\n/g, '\n').replace(/\"\"/g, '"');
  }

}

