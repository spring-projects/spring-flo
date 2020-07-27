import { isDevMode } from '@angular/core';

export class Logger {

  constructor() {
  }

  static log(value: any, ...rest: any[]) {
    if (isDevMode()) {
      console.log(value, ...rest);
    }
  }

  static debug(value: any, ...rest: any[]) {
    if (isDevMode()) {
      console.debug(value, ...rest);
    }
  }

  static error(value: any, ...rest: any[]) {
    console.error(value, ...rest);
  }

  static warn(value: any, ...rest: any[]) {
    console.warn(value, ...rest);
  }

}
