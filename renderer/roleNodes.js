
const roleNodes = {
    'modal-dismiss': () => {
        const node = document.createElement('button');
        node.className = 'btn btn-secondary';
        node.setAttribute('data-bs-dismiss', 'modal');
        node.setAttribute('type', 'button');
        node.textContent = 'Close';
        return node;
    },
    'form-input': (input) => {

    },
    'form': (form) => {
        const node = document.createElement('div');
        node.className = 'row';

        return node;
    }
};


export default function getElementFromRole(role, data) {
    if (!roleNodes[role]) return null;
    return roleNodes[role](data);
};
