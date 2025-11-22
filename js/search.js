const cardContainer = document.querySelector(".card-container");
const searchInput = document.querySelector("#search-input");
const searchButton = document.querySelector("#botao-busca");
const paginationContainer = document.querySelector("#pagination-container");

let allGamesData = [];
const activeFilters = {
    text: '',
    genre: 'all',
    year: 'all',
    awards: 'all',
    sort: 'title-asc'
};

let currentPage = 1;
const itemsPerPage = 5;

let genreFilterSelect;
let yearFilterSelect;
let awardsFilterSelect;
let sortOrderSelect;

function parseGameDate(dateString) {
    if (!dateString) return null;
    const normalizedDate = dateString.includes('/') ? dateString.split('/').reverse().join('-') : dateString;
    const date = new Date(`${normalizedDate}T00:00:00`);
    return !isNaN(date.getTime()) ? date : null;
}

function getFilteredAndSortedGames() {
    let filteredGames = allGamesData.filter(game => {
        const genreMatch = activeFilters.genre === 'all' || game.generos?.includes(activeFilters.genre);

        const yearMatch = activeFilters.year === 'all' || (parseGameDate(game.dataLancamento)?.getFullYear().toString() === activeFilters.year);

        const awardsMatch = activeFilters.awards === 'all' ||
            (activeFilters.awards === 'yes' && game.premios?.length > 0) ||
            (activeFilters.awards === 'no' && !game.premios?.length);

        const textMatch = !activeFilters.text ||
            game.titulo.toLowerCase().includes(activeFilters.text) ||
            game.descricao.toLowerCase().includes(activeFilters.text);

        return genreMatch && yearMatch && awardsMatch && textMatch;
    });

    const sortFunctions = {
        'title-asc': (a, b) => a.titulo.localeCompare(b.titulo),
        'title-desc': (a, b) => b.titulo.localeCompare(a.titulo),
        'critic-desc': (a, b) => (b.metacriticCritics || 0) - (a.metacriticCritics || 0),
        'critic-asc': (a, b) => (a.metacriticCritics || 0) - (b.metacriticCritics || 0),
        'user-desc': (a, b) => (b.metacriticUsers || 0) - (a.metacriticUsers || 0),
        'user-asc': (a, b) => (a.metacriticUsers || 0) - (b.metacriticUsers || 0),
        'newest': (a, b) => (parseGameDate(b.dataLancamento)?.getTime() || 0) - (parseGameDate(a.dataLancamento)?.getTime() || 0),
        'oldest': (a, b) => (parseGameDate(a.dataLancamento)?.getTime() || 0) - (parseGameDate(b.dataLancamento)?.getTime() || 0),
    };

    return filteredGames.sort(sortFunctions[activeFilters.sort]);
}

function renderCards(items) {
    cardContainer.innerHTML = "";
    if (items.length === 0) {
        cardContainer.innerHTML = `
            <div class="no-results">
                <p>Nenhum jogo encontrado com os filtros selecionados.</p>
                <span>Tente ajustar sua busca ou limpar os filtros.</span>
            </div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach(dado => {
        const article = document.createElement("article");
        article.classList.add("card");

        const dataObj = parseGameDate(dado.dataLancamento);
        const dataFormatada = dataObj ? dataObj.toLocaleDateString('pt-BR') : 'N/A';

        const premiosHtml = dado.premios?.length > 0
            ? `<h4>Prêmios Notáveis</h4><ul class="awards-list">${dado.premios.map(p => `<li>${p.titulo} (${p.organizacao}, ${p.ano})</li>`).join('')}</ul>`
            : '';

        article.innerHTML = `
            <img src="${dado.steamImage}" alt="Capa do jogo ${dado.titulo}">
            <a href="${dado.steamLink}" target="_blank" rel="noopener noreferrer" class="steam-link-button">
                <h2>${dado.titulo}</h2>
            </a>
            <div class="genres">${dado.generos ? dado.generos.join(', ') : 'N/A'}</div>
            <p>${dado.descricao}</p>
            <div class="metacritic-scores">
                <div class="score">Crítica: <span>${dado.metacriticCritics || 'N/A'}</span></div>
                <div class="score">Usuários: <span>${dado.metacriticUsers || 'N/A'}</span></div>
            </div>
            <ul>
                <li><strong>Desenvolvedora:</strong> ${dado.desenvolvedora || 'N/A'}</li>
                <li><strong>Publicadora:</strong> ${dado.publicadora || 'N/A'}</li>
                <li><strong>Lançamento:</strong> ${dataFormatada}</li>
            </ul>
            ${premiosHtml}
            <a href="${dado.steamLink}" target="_blank" rel="noopener noreferrer" class="button steam-button">Ver na Steam</a>
        `;
        fragment.appendChild(article);
    });
    cardContainer.appendChild(fragment);
}

function renderPaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    paginationContainer.innerHTML = "";

    if (totalPages <= 1) return;

    const handlePageClick = (page) => {
        if (typeof page === 'number' && page !== currentPage) {
            currentPage = page;
            renderContent(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const createButton = (page, text = page, isDisabled = false) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.disabled = isDisabled;
        if (page === currentPage) button.classList.add('active');
        button.addEventListener('click', () => handlePageClick(page));
        return button;
    };

    const createEllipsis = () => {
        const span = document.createElement('span');
        span.textContent = '...';
        span.classList.add('pagination-ellipsis');
        return span;
    };

    paginationContainer.appendChild(createButton(currentPage - 1, 'Anterior', currentPage === 1));

    if (totalPages <= 9) {
        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.appendChild(createButton(i));
        }
    } else {
        const pagesToShow = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
        if (currentPage > 2) pagesToShow.add(currentPage - 2);
        if (currentPage < totalPages - 1) pagesToShow.add(currentPage + 2);

        let lastPage = 0;
        Array.from(pagesToShow).sort((a, b) => a - b).forEach(page => {
            if (page > 0 && page <= totalPages) {
                if (page > lastPage + 1) {
                    paginationContainer.appendChild(createEllipsis());
                }
                paginationContainer.appendChild(createButton(page));
                lastPage = page;
            }
        });
    }

    paginationContainer.appendChild(createButton(currentPage + 1, 'Próximo', currentPage === totalPages));
}

function renderContent(resetPage = true) {
    if (resetPage) {
        currentPage = 1;
    }

    const allItems = getFilteredAndSortedGames();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const itemsForCurrentPage = allItems.slice(startIndex, startIndex + itemsPerPage);

    renderCards(itemsForCurrentPage);
    renderPaginationControls(allItems.length);
}

function updateActiveFilters() {
    activeFilters.text = searchInput.value.toLowerCase();
    activeFilters.genre = genreFilterSelect.value;
    activeFilters.year = yearFilterSelect.value;
    activeFilters.awards = awardsFilterSelect.value;
    activeFilters.sort = sortOrderSelect.value;
}

function handleFilterChange() {
    updateActiveFilters();
    renderContent(true);
}

function populateTextFilter(container) {
    container.innerHTML = `
        <h4>Buscar por Nome</h4>
        <input type="text" id="sidebar-search-input" placeholder="Buscar nos resultados...">
    `;
}

function populateGenreFilter(games, container) {
    const allGenres = new Set(games.flatMap(game => game.generos || []));
    const sortedGenres = Array.from(allGenres).sort();

    const select = document.createElement('select');
    select.id = 'genre-select';
    select.innerHTML = `<option value="all">Todos os Gêneros</option>` +
        sortedGenres.map(genre => `<option value="${genre}">${genre}</option>`).join('');

    container.innerHTML = '<h4>Gênero</h4>';
    container.appendChild(select);
    return select;
}

function populateYearFilter(games, container) {
    const allYears = new Set();
    games.forEach(game => {
        const year = parseGameDate(game.dataLancamento)?.getFullYear();
        if (year) allYears.add(year);
    });

    const sortedYears = Array.from(allYears).sort((a, b) => b - a);

    const select = document.createElement('select');
    select.id = 'year-select';
    select.innerHTML = `<option value="all">Todos os Anos</option>` +
        sortedYears.map(year => `<option value="${year}">${year}</option>`).join('');

    container.innerHTML = '<h4>Ano de Lançamento</h4>';
    container.appendChild(select);
    return select;
}

function populateAwardsFilter(container) {
    const select = document.createElement('select');
    select.id = 'awards-select';
    select.innerHTML = `
        <option value="all">Todos</option>
        <option value="yes">Apenas Premiados</option>
        <option value="no">Não Premiados</option>
    `;
    container.innerHTML = '<h4>Jogos Premiados</h4>';
    container.appendChild(select);
    return select;
}

function populateSortOrderFilter(container) {
    const select = document.createElement('select');
    select.id = 'sort-order-select';
    select.innerHTML = `
        <option value="title-asc">Título (A-Z)</option>
        <option value="title-desc">Título (Z-A)</option>
        <option value="critic-desc">Crítica (Maior)</option>
        <option value="critic-asc">Crítica (Menor)</option>
        <option value="user-desc">Usuários (Maior)</option>
        <option value="user-asc">Usuários (Menor)</option>
        <option value="newest">Lançamento (Mais Novo)</option>
        <option value="oldest">Lançamento (Mais Antigo)</option>
    `;
    container.innerHTML = '<h4>Ordenar por</h4>';
    container.appendChild(select);
    return select;
}

async function initializeApp() {
    const textFilterContainer = document.querySelector("#text-filter-container");
    const genreFilterContainer = document.querySelector("#genre-filter-container");
    const yearFilterContainer = document.querySelector("#year-filter-container");
    const awardsFilterContainer = document.querySelector("#awards-filter-container");
    const sortOrderContainer = document.querySelector("#sort-order-container");

    try {
        const response = await fetch('../data/data.json');
        allGamesData = await response.json();

        populateTextFilter(textFilterContainer);
        genreFilterSelect = populateGenreFilter(allGamesData, genreFilterContainer);
        yearFilterSelect = populateYearFilter(allGamesData, yearFilterContainer);
        awardsFilterSelect = populateAwardsFilter(awardsFilterContainer);
        sortOrderSelect = populateSortOrderFilter(sortOrderContainer);

        const urlParams = new URLSearchParams(window.location.search);
        const queryFromUrl = urlParams.get('q');
        const sidebarSearchInput = document.querySelector("#sidebar-search-input");

        if (queryFromUrl) {
            searchInput.value = queryFromUrl;
            if (sidebarSearchInput) sidebarSearchInput.value = queryFromUrl;
        }

        updateActiveFilters();
        renderContent(true);

        const handleSearch = () => {
            if (sidebarSearchInput) sidebarSearchInput.value = searchInput.value;
            handleFilterChange();
        };

        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keyup', e => e.key === 'Enter' && handleSearch());

        genreFilterSelect.addEventListener('change', handleFilterChange);
        yearFilterSelect.addEventListener('change', handleFilterChange);
        awardsFilterSelect.addEventListener('change', handleFilterChange);
        sortOrderSelect.addEventListener('change', handleFilterChange);

        if (sidebarSearchInput) {
            sidebarSearchInput.addEventListener('keyup', (event) => {
                searchInput.value = event.target.value;
                if (event.key === 'Enter' || event.target.value.length === 0 || event.target.value.length > 2) {
                    handleFilterChange();
                }
            });
        }
    } catch (error) {
        console.error("Erro ao carregar os dados dos jogos:", error);
        cardContainer.innerHTML = '<p>Não foi possível carregar os jogos. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);