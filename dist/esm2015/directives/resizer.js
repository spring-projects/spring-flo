import * as tslib_1 from "tslib";
import { Directive, Input, Output, EventEmitter, Inject, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { fromEvent } from 'rxjs';
import { sampleTime } from 'rxjs/operators';
import { CompositeDisposable, Disposable } from 'ts-disposables';
import * as _$ from 'jquery';
const $ = _$;
let ResizerDirective = class ResizerDirective {
    constructor(element, document) {
        this.element = element;
        this.document = document;
        this.dragInProgress = false;
        this.vertical = true;
        this._subscriptions = new CompositeDisposable();
        this.sizeChange = new EventEmitter();
        this.mouseMoveHandler = (e) => {
            if (this.dragInProgress) {
                this.mousemove(e);
            }
        };
    }
    set splitSize(splitSize) {
        if (this.maxSplitSize && splitSize > this.maxSplitSize) {
            splitSize = this.maxSplitSize;
        }
        if (this.vertical) {
            // Handle vertical resizer
            $(this.element.nativeElement).css({
                left: splitSize + 'px'
            });
            $(this.first).css({
                width: splitSize + 'px'
            });
            $(this.second).css({
                left: (splitSize + this._size) + 'px'
            });
        }
        else {
            // Handle horizontal resizer
            $(this.element.nativeElement).css({
                bottom: splitSize + 'px'
            });
            $(this.first).css({
                bottom: (splitSize + this._size) + 'px'
            });
            $(this.second).css({
                height: splitSize + 'px'
            });
        }
        this._splitSize = splitSize;
        // Update the local field
        this.sizeChange.emit(splitSize);
    }
    set resizerWidth(width) {
        this._size = width;
        this.vertical = true;
    }
    set resizerHeight(height) {
        this._size = height;
        this.vertical = false;
    }
    set resizerLeft(first) {
        this.first = first;
    }
    set resizerTop(first) {
        this.first = first;
    }
    set resizerRight(second) {
        this.second = second;
    }
    set resizerBottom(second) {
        this.second = second;
    }
    startDrag() {
        this.dragInProgress = true;
    }
    mousemove(event) {
        let size;
        if (this.vertical) { // Handle vertical resizer. Calculate new size relative to palette container DOM node
            size = event.pageX - $(this.first).offset().left;
        }
        else {
            // Handle horizontal resizer Calculate new size relative to palette container DOM node
            size = window.innerHeight - event.pageY - $(this.second).offset().top;
        }
        this.splitSize = size;
    }
    ngOnInit() {
        // Need to set left and right elements width and fire events on init when DOM is built
        this.splitSize = this._splitSize;
        let subscription1 = fromEvent($(this.document).get(0), 'mousemove')
            .pipe(sampleTime(300))
            .subscribe(this.mouseMoveHandler);
        this._subscriptions.add(Disposable.create(() => subscription1.unsubscribe()));
        let subscription2 = fromEvent($(this.document).get(0), 'mouseup')
            .subscribe(e => {
            if (this.dragInProgress) {
                this.mousemove(e);
                this.dragInProgress = false;
            }
        });
        this._subscriptions.add(Disposable.create(() => subscription2.unsubscribe()));
    }
    ngOnDestroy() {
        this._subscriptions.dispose();
    }
};
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number)
], ResizerDirective.prototype, "maxSplitSize", void 0);
tslib_1.__decorate([
    Output(),
    tslib_1.__metadata("design:type", Object)
], ResizerDirective.prototype, "sizeChange", void 0);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number),
    tslib_1.__metadata("design:paramtypes", [Number])
], ResizerDirective.prototype, "splitSize", null);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number),
    tslib_1.__metadata("design:paramtypes", [Number])
], ResizerDirective.prototype, "resizerWidth", null);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", Number),
    tslib_1.__metadata("design:paramtypes", [Number])
], ResizerDirective.prototype, "resizerHeight", null);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [String])
], ResizerDirective.prototype, "resizerLeft", null);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [String])
], ResizerDirective.prototype, "resizerTop", null);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [String])
], ResizerDirective.prototype, "resizerRight", null);
tslib_1.__decorate([
    Input(),
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [String])
], ResizerDirective.prototype, "resizerBottom", null);
ResizerDirective = tslib_1.__decorate([
    Directive({
        selector: '[resizer]',
        host: { '(mousedown)': 'startDrag()' }
    }),
    tslib_1.__param(1, Inject(DOCUMENT)),
    tslib_1.__metadata("design:paramtypes", [ElementRef, Object])
], ResizerDirective);
export { ResizerDirective };
//# sourceMappingURL=resizer.js.map