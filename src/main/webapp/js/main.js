// "Find pet"-overlayen: hämtar djur, söker, sorterar och bläddrar i webbläsaren.
// När ett djur väljs skickas händelsen "pet-selected" (djuret ligger i event.detail).
(() => {
    const API = 'api/pets'; //OBS. inte ihopkopplat än!!!
    const PAGE_SIZE = 10;
    const MAX_LEVEL = 100;

    const dialog   = document.getElementById('find-pet');
    const openBtn  = document.getElementById('open-adopt');
    const search   = document.getElementById('find-search');
    const tbody    = document.getElementById('find-rows');
    const pageInfo = document.getElementById('find-page');
    const prevBtn  = document.getElementById('find-prev');
    const nextBtn  = document.getElementById('find-next');
    const headers  = dialog.querySelectorAll('th[data-key]');

    let pets = [];
    let query = '';
    let sort = { key: 'id', dir: 'asc' };
    let page = 1;
    let status = '';                 // "Loading..." eller felmeddelande

    // Öppna / stänga
    openBtn.addEventListener('click', async () => {
        search.value = '';
        query = '';
        page = 1;
        dialog.showModal();
        await load();
    });

    document.getElementById('find-back').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); }); // klick på bakgrunden

    // --- Hämta data ---
    async function load() {
        status = 'Loading...';
        render();
        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            pets = await res.json();
            status = '';
        } catch (err) {
            pets = [];
            status = `Could not load pets. ${err.message}`;
        }
        render();
    }

    // Sök, sortera, bläddra
    search.addEventListener('input', () => {
        query = search.value.trim().toLowerCase();
        page = 1;
        render();
    });

    headers.forEach(th => {
        th.querySelector('button').addEventListener('click', () => {
            const key = th.dataset.key;
            sort = sort.key === key && sort.dir === 'asc'
                ? { key, dir: 'desc' }
                : { key, dir: 'asc' };
            page = 1;
            render();
        });
    });

    prevBtn.addEventListener('click', () => { page--; render(); });
    nextBtn.addEventListener('click', () => { page++; render(); });

    function visiblePets() {
        const filtered = pets.filter(p =>
            !query || p.name.toLowerCase().includes(query) || p.species.toLowerCase().includes(query));

        return filtered.sort((a, b) => {
            const x = a[sort.key], y = b[sort.key];
            const diff = typeof x === 'number'
                ? x - y
                : x.localeCompare(y, undefined, { sensitivity: 'base' });
            return (sort.dir === 'asc' ? diff : -diff) || a.id - b.id;   // id som tie-breaker
        });
    }

    function render() {
        const list = visiblePets();
        const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
        page = Math.min(Math.max(page, 1), pages);
        const slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

        const message = status || (list.length === 0
            ? (pets.length ? 'No pets match your search' : 'No pets yet')
            : '');

        tbody.replaceChildren(...Array.from({ length: PAGE_SIZE }, (_, i) =>
            slice[i] ? petRow(slice[i]) : emptyRow(i === 0 ? message : '')));

        headers.forEach(th => {
            th.setAttribute('aria-sort', th.dataset.key !== sort.key
                ? 'none'
                : sort.dir === 'asc' ? 'ascending' : 'descending');
        });

        pageInfo.textContent = `${page}/${pages}`;
        prevBtn.disabled = page <= 1;
        nextBtn.disabled = page >= pages;
    }

    function petRow(pet) {
        const tr = document.createElement('tr');
        tr.className = 'is-pet';

        tr.insertCell().textContent = pet.id;

        const nameBtn = document.createElement('button');
        nameBtn.type = 'button';
        nameBtn.className = 'pet-link';
        nameBtn.textContent = pet.name;
        tr.insertCell().append(nameBtn);

        tr.insertCell().textContent = pet.species;
        tr.insertCell().textContent = `${pet.hungerLevel}/${MAX_LEVEL}`;
        tr.insertCell().textContent = `${pet.happiness}/${MAX_LEVEL}`;

        tr.addEventListener('click', () => choose(pet));
        return tr;
    }

    function emptyRow(message) {
        const tr = document.createElement('tr');
        if (message) {
            const td = tr.insertCell();
            td.colSpan = 5;
            td.className = 'find-pet__message';
            td.textContent = message;
        } else {
            tr.setAttribute('aria-hidden', 'true');
            for (let i = 0; i < 5; i++) tr.insertCell();
        }
        return tr;
    }

    function choose(pet) {
        dialog.close();
        document.dispatchEvent(new CustomEvent('pet-selected', { detail: pet }));
    }
})();
