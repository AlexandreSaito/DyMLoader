const logger = document.getElementById('logger');
const unique = document.getElementById('unique');

export default function log(args) {

    const list = unique.querySelectorAll(`[value='${args.stack}']`);

    //    if (list.length == 0) {
    //        unique.innerHTML += ` 
    //<li class="list-group-item">
    //    <input class="form-check-input" type="checkbox" value="${args.stack}" >
    //    ${args.stack}
    //</li>`;
    //        unique.querySelector(`input`).onchange = (e) => {
    //            logger.querySelectorAll(`[data-select="${args.stack}"]`).style.display = e.currentTarget.checked ? 'none' : 'block';
    //        };
    //    }

    let html = `
<a href="#" class="list-group-item list-group-item-action" aria-current="true" data-select="${args.stack}" style="display: ${list.length == 0 || !list[0].checked ? 'block' : 'none'}">
    <p class="mb-1">${args.args.map(x => typeof x == 'object' ? JSON.stringify(x) : x)}</p>
    <small>${args.stack}</small>
</a>
    `;

    logger.innerHTML += html;
}