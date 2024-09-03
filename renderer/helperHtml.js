
import getElementFromRole from './roleNodes.js'

export function makeHtml(parent, elements) {
    if (!Array.isArray(elements)) elements = [elements];

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        try {
            if (element.role) {
                parent.append(getElementFromRole(element.role));
                continue;
            }
            const el = document.createElement(element.tag);

            if (element.id) el.id = element.id;
            if (element.class) el.className = element.class;
            if (element.type) el.setAttribute('type', element.type);
            if (element.value) el.setAttribute('value', element.value);
            if (element.name) el.setAttribute('name', element.name);
            if (element.placeholder) el.setAttribute('placeholder', element.placeholder);
            if (element.style) el.setAttribute('style', element.style);
            if (element.text) el.textContent = element.text;

            if (element.children) makeHtml(el, element.children);

            parent.append(el);
        } catch (e) {
            console.log('failed to create element', element, e);
        }

    }
};

export function getFormAsData(element) {
    const data = {};

    const input = element.querySelectorAll('input, select, textArea');

    for (let i = 0; i < input.length; i++) {
        const e = input[i];
        const name = e.getAttribute('name') ?? e.getAttribute('id');
        data[name] = e.value;
    }

    return data;
}
