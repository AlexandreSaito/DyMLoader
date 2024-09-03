import { makeHtml, getFormAsData } from './helperHtml.js'

const mainModalElement = document.getElementById('main-modal');
const mainModal = new bootstrap.Modal(mainModalElement, {
    keyboard: true
})

let modalRequest = [];
let modalShown = false;

const showAlert = (message) => {
    let alert = mainModalElement.querySelector('.alert');
    if (!alert) {
        alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.setAttribute('role', 'alert');
    }
    alert.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    mainModalElement.querySelector('.modal-body').prepend(alert);
}

mainModalElement.addEventListener('show.bs.modal', function () {
    modalShown = true;
});
mainModalElement.addEventListener('hidden.bs.modal', function () {
    mainModalElement.querySelector('.modal-title').innerHTML = '';
    mainModalElement.querySelector('.modal-body').innerHTML = '';
    mainModalElement.querySelector('.modal-footer').innerHTML = '';

    const requestId = mainModalElement.getAttribute('request-id');
    if (requestId) {
        api.send('modal-action', { id: requestId, origin: 'event-close', handled: mainModalElement.getAttribute('request-was-send') });
    }
    modalShown = false;
    if (modalRequest.length != 0) {
        openModal(modalRequest.pop());
        return;
    }
});

api.on('request-modal', (e, args) => {
    openModal(args);
});

api.on('modal-response', (e, args) => {
    if (args.id != mainModalElement.getAttribute('request-id')) {
        console.log('modal-response shouldnt be handled');
        return;
    }
    if (modalShown == true && args.data == true) {
        mainModal.hide();
        return;
    }

    showAlert(args.data);
});

export default function openModal(request) {
    if (modalShown == true) {
        modalRequest.push(request);
        return;
    }

    mainModalElement.querySelector('.modal-title').innerHTML = request.title;
    if (typeof request.body === 'object') makeHtml(mainModalElement.querySelector('.modal-body'), request.body);
    if (typeof request.footer === 'object') makeHtml(mainModalElement.querySelector('.modal-footer'), request.footer);
    else mainModalElement.querySelector('.modal-footer') = request.footer;

    mainModalElement.setAttribute('request-id', request.id);
    mainModalElement.setAttribute('request-was-send', false);

    mainModalElement.querySelector('button:not([data-bs-dismiss])').onclick = (e) => {
        e.preventDefault();

        const target = e.currentTarget;
        if (!target) return;

        const name = target.getAttribute('name') ?? target.getAttribute('id');

        const data = getFormAsData(mainModalElement);

        api.send('modal-action', {
            id: mainModalElement.getAttribute('request-id'),
            origin: name,
            handled: mainModalElement.getAttribute('request-was-send'),
            data: data
        });

        mainModalElement.getAttribute('request-was-send', true);
    };

    mainModal.show();
};