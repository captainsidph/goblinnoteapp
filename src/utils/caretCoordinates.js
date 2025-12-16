/**
 * Returns the { top, left } coordinates of the caret in a textarea.
 * We create a hidden div that mirrors the textarea's styles and content.
 */
export function getCaretCoordinates(element, position) {
    const properties = [
        'direction',
        'boxSizing',
        'width',
        'height',
        'overflowX',
        'overflowY',
        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'fontStyle',
        'fontVariant',
        'fontWeight',
        'fontStretch',
        'fontSize',
        'fontSizeAdjust',
        'lineHeight',
        'fontFamily',
        'textAlign',
        'textTransform',
        'textIndent',
        'textDecoration',
        'letterSpacing',
        'wordSpacing',
    ];

    const isFirefox = typeof window !== 'undefined' && window.mozInnerScreenX != null;

    const div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);

    const style = div.style;
    const computed = window.getComputedStyle(element);

    style.whiteSpace = 'pre-wrap';
    if (element.nodeName !== 'INPUT') style.wordWrap = 'break-word';

    style.position = 'absolute';
    style.visibility = 'hidden';

    properties.forEach((prop) => {
        style[prop] = computed[prop];
    });

    if (isFirefox) {
        if (element.scrollHeight > parseInt(computed.height))
            style.overflowY = 'scroll';
    } else {
        style.overflow = 'hidden';
    }

    div.textContent = element.value.substring(0, position);

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    const coordinates = {
        top: span.offsetTop + parseInt(computed['borderTopWidth']),
        left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
        height: parseInt(computed['lineHeight'])
    };

    document.body.removeChild(div);

    return coordinates;
}
