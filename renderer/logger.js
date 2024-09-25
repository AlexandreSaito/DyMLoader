const logger = document.getElementById('logger');
const unique = document.getElementById('unique');

export default function log(args) {
    const list = unique.querySelectorAll(`[value='${args.stack}']`);
    let html = `
<a href="#" class="list-group-item" data-select="${args.stack}" style="display: ${list.length == 0 || !list[0].checked ? 'block' : 'none'}">
    <p class="mb-1">${args.args.map(x => typeof x == 'object' ? JSON.stringify(x) : x)}</p>
    <small>${args.stack}</small>
</a>
    `;

    logger.innerHTML += html;
}