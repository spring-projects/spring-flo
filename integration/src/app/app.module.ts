import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FloModule } from 'spring-flo';

import { AppComponent }  from './app.component';

@NgModule({
  imports:      [ BrowserModule, FloModule],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
