// Adds DOM matchers like toBeInTheDocument() to expect().
import '@testing-library/jest-dom/vitest';

// jsdom (the test browser) does not implement <dialog> yet; real browsers
// do. This stand-in only opens and closes it.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
