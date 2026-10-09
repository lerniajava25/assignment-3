// "Find pet"-overlayen. Sök, sortering och sidor sköts av servern (GET api/pets).
// När ett djur väljs skickas händelsen "pet-selected" (djuret ligger i event.detail).
(() => {
    const API = 'api/pets';
    const PAGE_SIZE = 10;
    const MAX_LEVEL = 100;           // samma som PetDTO.MAX_LEVEL i Java
    const SEARCH_DELAY_MS = 250;     // väntar lite medan man skriver, så vi inte skickar ett anrop per tecken

    const dialog   = document.getElementById('find-pet');
    const openBtn  = document.getElementById('open-adopt');
    const search   = document.getElementById('find-search');
    const tbody    = document.getElementById('find-rows');
    const pageInfo = document.getElementById('find-page');
    const prevBtn  = document.getElementById('find-prev');
    const nextBtn  = document.getElementById('find-next');
    const headers  = dialog.querySelectorAll('th[data-key]');

    let rows = [];                   // djuren på den aktuella sidan
    let total = 0;                   // antal träffar totalt (för "1/8")
    let query = '';
    let sort = { key: 'id', dir: 'asc' };
    let page = 1;
    let status = '';                 // "Loading..." eller felmeddelande
    let requestId = 0;               // används för att ignorera inaktuella svar
    let searchTimer;

    // --- Öppna / stänga ---
    openBtn.addEventListener('click', () => {
        search.value = '';
        query = '';
        page = 1;
        dialog.showModal();
        load();
    });

    document.getElementById('find-back').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); }); // klick på bakgrunden

    // --- Hämta en sida från servern ---
    async function load() {
        const mine = ++requestId;
        if (rows.length === 0) { status = 'Loading...'; render(); }

        try {
            const params = new URLSearchParams({
                offset: (page - 1) * PAGE_SIZE,
                limit: PAGE_SIZE,
                sortBy: sort.key,
                order: sort.dir,
            });
            if (query) params.set('search', query);

            const res = await fetch(`${API}?${params}`);
            if (!res.ok) throw await toError(res);
            const items = await res.json();
            if (mine !== requestId) return;            // ett nyare anrop har startat, släng det här svaret

            rows = items;
            const header = res.headers.get('X-Total-Count');
            // Utan headern vet vi inte totalen: gissa att det finns mer om sidan är full
            total = header !== null
                ? Number(header)
                : (page - 1) * PAGE_SIZE + items.length + (items.length === PAGE_SIZE ? 1 : 0);
            status = '';

            // Sidan finns inte längre (t.ex. djur har släppts): hoppa till sista sidan
            if (items.length === 0 && total > 0 && page > 1) {
                page = Math.ceil(total / PAGE_SIZE);
                return load();
            }
        } catch (err) {
            if (mine !== requestId) return;
            rows = [];
            total = 0;
            status = `Could not load pets. ${err.message}`;
        }
        render();
    }

    // Gör om felsvaret från servern till ett läsbart meddelande
    async function toError(res) {
        try {
            const body = await res.json();
            const text = Array.isArray(body.details) ? body.details.join(', ') : (body.error || body.message);
            return new Error(text || `Request failed (${res.status})`);
        } catch {
            return new Error(`Request failed (${res.status})`);
        }
    }

    // --- Sök, sortera, bläddra ---
    search.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            query = search.value.trim();
            page = 1;
            load();
        }, SEARCH_DELAY_MS);
    });

    headers.forEach(th => {
        th.querySelector('button').addEventListener('click', () => {
            const key = th.dataset.key;
            sort = sort.key === key && sort.dir === 'asc'
                ? { key, dir: 'desc' }
                : { key, dir: 'asc' };
            page = 1;
            load();
        });
    });

    prevBtn.addEventListener('click', () => { page--; load(); });
    nextBtn.addEventListener('click', () => { page++; load(); });

    // --- Rita ---
    function render() {
        const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const message = status || (rows.length === 0
            ? (query ? 'No pets match your search' : 'No pets yet')
            : '');

        // Alltid PAGE_SIZE rader så att tabellen behåller samma höjd
        tbody.replaceChildren(...Array.from({ length: PAGE_SIZE }, (_, i) =>
            rows[i] ? petRow(rows[i]) : emptyRow(i === 0 ? message : '')));

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

        // Knapp i namncellen så att raden går att välja med tangentbordet
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
