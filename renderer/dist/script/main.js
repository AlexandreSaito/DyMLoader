var socket = io();

socket.on('connected', function (object) {
    console.log('connectado!');
});

function toggleCss(element, css1, css2) {
    if (element.classList.contains(css1)) {
        element.classList.add(css2);
        element.classList.remove(css1);
        return;
    }
    element.classList.add(css1);
    element.classList.remove(css2);
}

function keepSync(name, action) {
    socket.on('config-changed', (data) => {
        if (data.name == name) action(data);
    });
    socket.emit('get-config', { name: name }, (data) => {
        console.log(data);
        if (data.name == name) action(data);
    });
}