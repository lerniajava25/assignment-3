// Spelskärmen: visar det valda djuret och låter dig mata, leka och släppa det fri.
// All pixelart ritas från textrutor (# = pixel) som SVG, så inga bildfiler behövs.
(() => {
    const API = 'api/pets';
    const MAX_LEVEL = 100;           // samma som PetDTO.MAX_LEVEL i Java
    const DRAG_THRESHOLD = 8;        // px rörelse innan en tryckning räknas som drag

    // --- Pixelart ---
    const SPRITES = {
        dog: [
            '....########....',
            '..##........##..',
            '.####......####.',
            '.####.#..#.####.',
            '.####.#..#.####.',
            '.####......####.',
            '..###..##..###..',
            '..##..#..#..##..',
            '....#..##..#....',
            '.....######.....',
        ],
        cat: [
            '..#..........#..',
            '..##........##..',
            '..###......###..',
            '..############..',
            '.##..........##.',
            '.#............#.',
            '.#..##....##..#.',
            '.#..##....##..#.',
            '.#............#.',
            '.#.....##.....#.',
            '.#....#..#....#.',
            '.##...####...##.',
            '..##........##..',
            '....########....',
        ],
        rabbit: [
            '...##......##...',
            '..#..#....#..#..',
            '..#..#....#..#..',
            '..#..#....#..#..',
            '..#..#....#..#..',
            '...##......##...',
            '...##########...',
            '..#..........#..',
            '..#.##....##.#..',
            '..#.##....##.#..',
            '..#....##....#..',
            '..#...#..#...#..',
            '...#...##...#...',
            '....########....',
        ],
        blob: [
            '....########....',
            '..##........##..',
            '.#............#.',
            '.#..##....##..#.',
            '.#..##....##..#.',
            '.#............#.',
            '.#....####....#.',
            '.#............#.',
            '..##........##..',
            '...##########...',
        ],
        apple: [
            '......#.##..',
            '.####.####..',
            '.##########.',
            '############',
            '##.#########',
            '############',
            '############',
            '.##########.',
            '.##########.',
            '..########..',
            '...##..##...',
        ],
        ball: [
            '...######...',
            '.##########.',
            '###.########',
            '#######.####',
            '#####.######',
            '############',
            '##.#########',
            '#######.####',
            '############',
            '.####.#####.',
            '.##########.',
            '...######...',
        ],
        back: [
            '.......#.',
            '.......#.',
            '.......#.',
            '..#....#.',
            '.#######.',
            '..#......',
        ],
        heart: [
            '.##..##.',
            '########',
            '########',
            '.######.',
            '..####..',
            '...##...',
        ],
    };

    // Gör om en textruta till SVG: varje rad av # blir en rektangel i samma <path>
    function sprite(name) {
        const rows = SPRITES[name];
        const cols = Math.max(...rows.map(r => r.length));
        let d = '';
        rows.forEach((row, y) => {
            for (const m of row.matchAll(/#+/g)) {
                d += `M${m.index} ${y}h${m[0].length}v1h-${m[0].length}z`;
            }
        });
        return `<svg class="sprite" viewBox="0 0 ${cols} ${rows.length}" style="--cols:${cols}" ` +
            `fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="${d}"/></svg>`;
    }

    // Välj sprite utifrån art (svenska och engelska); okänd art får en blob
    function spriteFor(species) {
        const s = species.toLowerCase();
        if (/dog|hund|valp|puppy/.test(s)) return 'dog';
        if (/cat|katt|kitten|kisse/.test(s)) return 'cat';
        if (/rabbit|bunny|kanin|hare/.test(s)) return 'rabbit';
        return 'blob';
    }

    // --- Element ---
    const startEl   = document.getElementById('start');
    const gameEl    = document.getElementById('game');
    const screenEl  = document.getElementById('screen');
    const petEl     = document.getElementById('pet');
    const nameEl    = document.getElementById('pet-name');
    const toastEl   = document.getElementById('toast');
    const releaseDialog = document.getElementById('release-dialog');

    let pet = null;
    let demo = false;                // true = demo-djuret, inga serveranrop
    let busy = false;
    let toastTimer;

    document.querySelectorAll('[data-sprite]').forEach(el => { el.innerHTML = sprite(el.dataset.sprite); });

    // --- Visa / dölja skärmen ---
    document.addEventListener('pet-selected', e => show(e.detail));   // skickas av find-pet.js
    document.getElementById('game-back').addEventListener('click', leave);

    function show(p, isDemo = false) {
        pet = p;
        demo = isDemo;
        startEl.hidden = true;
        gameEl.hidden = false;
        render();
    }

    // Proof of concept: "Continue" öppnar alltid Billy, hunden, helt utan servern.
    // Mata/leka räknas lokalt (se act) och Release hoppar över DELETE-anropet.
    const DEMO_PET = { id: 0, name: 'Billy', species: 'Dog', hungerLevel: 80, happiness: 80 };
    document.getElementById('open-game').addEventListener('click', () => show({ ...DEMO_PET }, true));

    function leave() {
        pet = null;
        msgEl.hidden = true;
        gameEl.hidden = true;
        startEl.hidden = false;
    }

    function render() {
        nameEl.textContent = pet.name;
        nameEl.title = pet.name;

        const kind = spriteFor(pet.species);
        if (petEl.dataset.kind !== kind) {
            petEl.dataset.kind = kind;
            petEl.innerHTML = sprite(kind);
        }
    }

    // Meddelande inne på skärmen (försvinner efter 2 sekunder)
    const msgEl = document.createElement('p');
    msgEl.className = 'screen__msg';
    msgEl.setAttribute('role', 'status');
    msgEl.hidden = true;
    screenEl.append(msgEl);
    let msgTimer;

    function say(text) {
        msgEl.textContent = text;
        msgEl.hidden = false;
        clearTimeout(msgTimer);
        msgTimer = setTimeout(() => { msgEl.hidden = true; }, 2000);
    }

    // --- Mata och leka ---
    async function act(action) {                 // action = 'feed' eller 'play'
        if (!pet || busy) return;

        // Redan mätt / glad: ingen idé att anropa servern
        if (action === 'feed' && pet.hungerLevel <= 0) {
            react('is-no');
            say(`${pet.name} is already full!`);
            return;
        }
        if (action === 'play' && pet.happiness >= MAX_LEVEL) {
            react('is-no');
            say(`${pet.name} is already super happy!`);
            return;
        }

        busy = true;
        try {
            if (demo) {
                pet = changeLevel(pet, action);        // demo: räkna lokalt
            } else {
                const res = await fetch(`${API}/${pet.id}/${action}`, { method: 'PUT' });
                if (!res.ok) throw await toError(res);
                pet = await res.json();                // servern svarar med det uppdaterade djuret
            }
            render();
            react(action === 'feed' ? 'is-eating' : 'is-happy');
            particle(action === 'feed' ? 'apple' : 'heart');
        } catch (err) {
            react('is-no');
            if (err.status === 404) { toast('That pet no longer exists.'); leave(); }
            else toast(err.message);
        } finally {
            busy = false;
        }
    }

    // Samma regler som PetService: 20 poäng per gång, begränsat till 0-100
    const STEP = 20;
    function changeLevel(p, action) {
        const clamp = v => Math.max(0, Math.min(MAX_LEVEL, v));
        return action === 'feed'
            ? { ...p, hungerLevel: clamp(p.hungerLevel - STEP) }
            : { ...p, happiness: clamp(p.happiness + STEP) };
    }

    document.getElementById('btn-feed').addEventListener('click', () => act('feed'));
    document.getElementById('btn-play').addEventListener('click', () => act('play'));

    function react(cls) {
        petEl.classList.remove('is-eating', 'is-happy', 'is-no');
        void petEl.offsetWidth;                    // startar om animationen
        petEl.classList.add(cls);
        petEl.addEventListener('animationend', () => petEl.classList.remove(cls), { once: true });
    }

    function particle(name) {
        const el = document.createElement('span');
        el.className = 'particle';
        el.innerHTML = sprite(name);
        el.style.left = `${42 + Math.random() * 16}%`;
        screenEl.append(el);
        setTimeout(() => el.remove(), 1000);       // timer istället för animationend, så det funkar även utan animationer
    }

    // --- Släppa fri ---
    document.getElementById('btn-release').addEventListener('click', () => {
        if (!pet) return;
        document.getElementById('release-name').textContent = pet.name;
        releaseDialog.showModal();
    });
    document.getElementById('release-cancel').addEventListener('click', () => releaseDialog.close());

    document.getElementById('release-confirm').addEventListener('click', async () => {
        const { id, name } = pet;
        releaseDialog.close();
        try {
            if (!demo) {
                const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
                if (!res.ok && res.status !== 404) throw await toError(res);   // 204 = släppt, 404 = fanns redan inte
            }
            toast(`${name} was released.`);
            leave();
        } catch (err) {
            toast(err.message);
        }
    });

    // --- Mat och leksak: tryck eller dra till skärmen ---
    document.querySelectorAll('.item').forEach(item => {
        item.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            item.setPointerCapture(e.pointerId);
            const x0 = e.clientX, y0 = e.clientY;
            let ghost = null;

            const move = ev => {
                if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > DRAG_THRESHOLD) {
                    const svg = item.querySelector('svg');
                    ghost = item.cloneNode(true);
                    ghost.classList.add('ghost');
                    ghost.querySelector('svg').style.width = `${svg.getBoundingClientRect().width}px`;  // cqw gäller inte utanför konsolen
                    document.body.append(ghost);
                }
                if (ghost) {
                    ghost.style.left = `${ev.clientX}px`;
                    ghost.style.top = `${ev.clientY}px`;
                    screenEl.classList.toggle('is-drop', overScreen(ev));
                }
            };

            const up = ev => {
                item.removeEventListener('pointermove', move);
                item.removeEventListener('pointerup', up);
                item.removeEventListener('pointercancel', up);
                screenEl.classList.remove('is-drop');
                const dragged = ghost !== null;
                ghost?.remove();
                // Tryck på föremålet, eller släpp det över skärmen
                if (ev.type === 'pointerup' && (!dragged || overScreen(ev))) act(item.dataset.action);
            };

            item.addEventListener('pointermove', move);
            item.addEventListener('pointerup', up);
            item.addEventListener('pointercancel', up);
        });

        // Tangentbord (Enter/Space ger click med detail 0, mus och touch hanteras ovan)
        item.addEventListener('click', e => { if (e.detail === 0) act(item.dataset.action); });
    });

    function overScreen(ev) {
        const r = screenEl.getBoundingClientRect();
        return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
    }

    // --- Hjälpfunktioner ---
    async function toError(res) {
        let text = `Request failed (${res.status})`;
        try {
            const body = await res.json();
            text = Array.isArray(body.details) ? body.details.join(', ') : (body.error || body.message || text);
        } catch { /* svaret hade ingen JSON */ }
        const err = new Error(text);
        err.status = res.status;
        return err;
    }

    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3000);
    }
})();
