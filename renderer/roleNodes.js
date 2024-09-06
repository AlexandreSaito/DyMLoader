
const roleNodes = {
    'modal-dismiss': () => {
        const node = document.createElement('button');
        node.className = 'btn btn-secondary';
        node.setAttribute('data-bs-dismiss', 'modal');
        node.setAttribute('type', 'button');
        node.textContent = 'Close';
        return node;
    },
    'form': (form) => {
        const node = document.createElement('div');
        node.className = 'row';

        return node;
    },
    'form-input': (input) => {
        let inputNode = null;

        if (!input.type) input.type = 'text'
        if (input.type == 'textarea') {
            inputNode = document.createElement('textarea');
        } else {
            inputNode = document.createElement('input');
            inputNode.setAttribute('type', input.type);
        }
        if(input.type == 'file' && input.accept){
            inputNode.setAttribute('accept', input.accept);
        }
        inputNode.className = 'form-control';
        inputNode.name = input.name;

        const node = document.createElement('div');
        node.className = input.col ? `col-${input.col}` : 'col';

        if (input.label) {
            const label = document.createElement('label');
            label.innerHTML = input.label;
            node.append(label);
        }

        node.append(inputNode);

        return node;
    },
    'form-select': (input) => {
        const node = document.createElement('div');
        node.className = input.col ? `col-${input.col}` : 'col';
        if (input.label) {
            const label = document.createElement('label');
            label.innerHTML = input.label;
            node.append(label);
        }

        const inputNode = document.createElement('select');
        inputNode.className = 'form-select';
        if (input.options && Array.isArray(input.options)) {
            for (let i = 0; i < input.options; i++) {
                const opt = document.createElement('option');
                if(typeof input.options == 'string') {
                    input.options = { value: input.options, label: input.options };
                }
                opt.value = input.options.value;
                opt.innerHTML = input.options.label;
                inputNode.append(opt);
            }
        }
        node.append(inputNode);

        return node;
    }
};


export default function getElementFromRole(role, data) {
    if (!roleNodes[role]) return null;
    return roleNodes[role](data);
};
