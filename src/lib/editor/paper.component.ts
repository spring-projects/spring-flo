import {
  Component,
  ElementRef, EventEmitter,
  HostListener,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

@Component({
  selector: 'flo-editor-paper',
  template: `
    <div #paper tabindex="0" id="paper-container">
      <ng-content></ng-content>
    </div>`,
  styleUrls: ['./editor.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PaperComponent {

  @ViewChild('paper', { static: true }) paperElement: ElementRef;

  @Output()
  onDelete = new EventEmitter<number>();

  @HostListener('click')
  click() {
    this.paperElement.nativeElement.focus();
  }

  @HostListener('mousedown')
  mousedown() {
    this.paperElement.nativeElement.focus();
  }

  @HostListener('keydown.backspace')
  backspaceHandle() {
    this.onDelete.emit();
  }

}
