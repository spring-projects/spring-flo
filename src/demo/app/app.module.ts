import { NgModule }      from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { FloModule } from 'spring-flo';
import { ModalModule } from 'ngx-bootstrap/modal';

import { PropertiesDialogComponent } from './properties.dialog.component';
import { AppComponent }  from './app.component';

@NgModule({
  imports:      [ BrowserModule, FormsModule, FloModule, ModalModule.forRoot() ],
  declarations: [ AppComponent, PropertiesDialogComponent ],
  entryComponents: [ PropertiesDialogComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
