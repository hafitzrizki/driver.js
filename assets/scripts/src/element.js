import Position from './position';

/**
 * Wrapper around DOMElements to enrich them
 * with the functionality necessary
 */
export default class Element {
  /**
   * DOM element object
   * @param node
   * @param options
   * @param popover
   * @param overlay
   * @param window
   * @param document
   */
  constructor(node, options, popover, overlay, window, document) {
    this.node = node;
    this.document = document;
    this.window = window;
    this.options = options;
    this.overlay = overlay;
    this.popover = popover;
  }

  /**
   * Gets the screen co-ordinates (x,y) for the current dom element
   * @returns {{x: number, y: number}}
   */
  getScreenCoordinates() {
    let tempNode = this.node;

    let x = this.document.documentElement.offsetLeft;
    let y = this.document.documentElement.offsetTop;

    if (tempNode.offsetParent) {
      do {
        x += tempNode.offsetLeft;
        y += tempNode.offsetTop;
      } while (tempNode = tempNode.offsetParent);
    }

    return { x, y };
  }

  isInView() {
    let top = this.node.offsetTop;
    let left = this.node.offsetLeft;
    const width = this.node.offsetWidth;
    const height = this.node.offsetHeight;

    let el = this.node;

    while (el.offsetParent) {
      el = el.offsetParent;
      top += el.offsetTop;
      left += el.offsetLeft;
    }

    return (
      top >= this.window.pageYOffset &&
      left >= this.window.pageXOffset &&
      (top + height) <= (this.window.pageYOffset + this.window.innerHeight) &&
      (left + width) <= (this.window.pageXOffset + this.window.innerWidth)
    );
  }

  bringInView() {
    if (this.isInView()) {
      return;
    }

    const elementRect = this.getCalculatedPosition();
    const absoluteElementTop = elementRect.top + this.window.pageYOffset;
    const middle = absoluteElementTop - (this.window.innerHeight / 2);

    this.window.scrollTo(0, middle);
  }

  /**
   * Gets the calculated position on screen, around which
   * we need to draw
   */
  getCalculatedPosition() {
    const coordinates = this.getScreenCoordinates();
    const position = new Position({
      left: Number.MAX_VALUE,
      top: Number.MAX_VALUE,
      right: 0,
      bottom: 0,
    });

    // If we have the position for this element
    // and the element is visible on screen (has some height)
    if (typeof coordinates.x === 'number' && typeof coordinates.y === 'number' && (this.node.offsetWidth > 0 || this.node.offsetHeight > 0)) {
      position.left = Math.min(position.left, coordinates.x);
      position.top = Math.min(position.top, coordinates.y);
      position.right = Math.max(position.right, coordinates.x + this.node.offsetWidth);
      position.bottom = Math.max(position.bottom, coordinates.y + this.node.offsetHeight);
    }

    return position;
  }

  /**
   * Is called when element is about to be deselected
   * i.e. when moving the focus to next element of closing
   */
  onDeselected() {
    if (!this.popover) {
      return;
    }

    this.popover.hide();
  }

  /**
   * Is called when the element is about to be highlighted
   * i.e. either if overlay has started moving the highlight towards
   * this element of has just decided to highlight it
   */
  onHighlightStarted() {
    if (!this.popover) {
      return;
    }

    this.showPopover();
  }

  onHighlighted() {
    if (this.popover) {
      this.showPopover();
    }

    const highlightedElement = this;
    const lastHighlightedElement = this.overlay.getLastHighlightedElement();
    const popoverElement = this.popover;

    const highlightedNode = this.node;
    const lastHighlightedNode = lastHighlightedElement && lastHighlightedElement.node;

    // If this element is not already highlighted (because this call could
    // be from the resize or scroll) and is not in view
    if (highlightedNode !== lastHighlightedNode) {
      if (!highlightedElement.isInView()) {
        highlightedElement.bringInView();
      }

      if (popoverElement && !popoverElement.isInView()) {
        popoverElement.bringInView();
      }
    }
  }

  showPopover() {
    const position = this.getCalculatedPosition();

    this.popover.show(position);
  }

  getFullPageSize() {
    // eslint-disable-next-line prefer-destructuring
    const body = this.document.body;
    const html = this.document.documentElement;

    return {
      height: Math.max(body.scrollHeight, body.offsetHeight, html.scrollHeight, html.offsetHeight),
      width: Math.max(body.scrollWidth, body.offsetWidth, html.scrollWidth, html.offsetWidth),
    };
  }
}
