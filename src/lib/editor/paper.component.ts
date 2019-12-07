import {
  Component,
  ElementRef, EventEmitter,
  HostListener, OnInit,
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
export class PaperComponent implements OnInit {

  @ViewChild('paper', { static: true }) paperElement: ElementRef;

  @Output()
  onDelete = new EventEmitter<number>();

  @Output()
  onProperties = new EventEmitter<number>();

  @Output()
  onBlur = new EventEmitter<boolean>();

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

  @HostListener('keydown.delete')
  deleteHandle() {
    this.onDelete.emit();
  }

  @HostListener('keydown.o')
  oHandle() {
    this.onProperties.emit();
  }

  ngOnInit(): void {
    const onBlur = this.onBlur;
    this.paperElement.nativeElement.addEventListener('blur', () => {
      onBlur.emit();
    });
  }

}
