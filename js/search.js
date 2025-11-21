const cardContainer = document.querySelector(".card-container");
const searchInput = document.querySelector("#search-input");
const searchButton = document.querySelector("#botao-busca");
const paginationContainer = document.querySelector("#pagination-container");

// Global data and filter state
let allGamesData = [];
let activeFilters = {
    text: '',
    genre: 'all',
    year: 'all',
    awards: 'all',
    sort: 'title-asc' // Default sort order
};

// Pagination state
let currentPage = 1;
const itemsPerPage = 5; // Number of games per page

// References to dynamically created filter select elements
let genreFilterSelect;
let yearFilterSelect;
let awardsFilterSelect;
let sortOrderSelect;

/**
 * Aplica os filtros e renderiza os cards.
 */
function applyFiltersAndRender() {
    // Reset to the first page whenever filters change
    currentPage = 1;

    // Update activeFilters from current select values
    activeFilters.text = searchInput.value.toLowerCase();
    activeFilters.genre = genreFilterSelect.value;
    activeFilters.year = yearFilterSelect.value;
    activeFilters.awards = awardsFilterSelect.value;
    activeFilters.sort = sortOrderSelect.value;

    let filteredGames = allGamesData.filter(game => {
        const genreMatch = activeFilters.genre === 'all' || (game.generos && game.generos.includes(activeFilters.genre));

        let yearMatch = true;
        if (activeFilters.year !== 'all' && game.dataLancamento) {
            // Lógica robusta para tratar os dois formatos de data: "YYYY-MM-DD" e "DD/MM/YYYY"
            const dateString = game.dataLancamento.includes('/') ? game.dataLancamento.split('/').reverse().join('-') : game.dataLancamento;
            const gameYear = new Date(dateString).getFullYear();
            yearMatch = gameYear.toString() === activeFilters.year; // Compare as strings
        }

        const awardsMatch = activeFilters.awards === 'all' ||
            (activeFilters.awards === 'yes' && game.premios && game.premios.length > 0) ||
            (activeFilters.awards === 'no' && (!game.premios || game.premios.length === 0));

        const textMatch = !activeFilters.text ||
            (game.titulo.toLowerCase().includes(activeFilters.text) ||
                game.descricao.toLowerCase().includes(activeFilters.text));

        return genreMatch && yearMatch && awardsMatch && textMatch;
    });

    console.log('3. Jogos filtrados antes da ordenação:', filteredGames); // Verifique o conteúdo deste array
    // Apply sorting
    switch (activeFilters.sort) {
        case 'title-asc':
            filteredGames.sort((a, b) => a.titulo.localeCompare(b.titulo));
            break;
        case 'title-desc':
            filteredGames.sort((a, b) => b.titulo.localeCompare(a.titulo));
            break;
        case 'critic-desc':
            filteredGames.sort((a, b) => (b.metacriticCritics || 0) - (a.metacriticCritics || 0));
            break;
        case 'critic-asc':
            filteredGames.sort((a, b) => (a.metacriticCritics || 0) - (b.metacriticCritics || 0));
            break;
        case 'user-desc':
            filteredGames.sort((a, b) => (b.metacriticUsers || 0) - (a.metacriticUsers || 0));
            break;
        case 'user-asc':
            filteredGames.sort((a, b) => (a.metacriticUsers || 0) - (b.metacriticUsers || 0));
            break;
        case 'newest':
            filteredGames.sort((a, b) => {
                const dateA = new Date(a.dataLancamento.includes('/') ? a.dataLancamento.split('/').reverse().join('-') : a.dataLancamento);
                const dateB = new Date(b.dataLancamento.includes('/') ? b.dataLancamento.split('/').reverse().join('-') : b.dataLancamento);
                return dateB.getTime() - dateA.getTime();
            });
            break;
        case 'oldest':
            filteredGames.sort((a, b) => {
                const dateA = new Date(a.dataLancamento.includes('/') ? a.dataLancamento.split('/').reverse().join('-') : a.dataLancamento);
                const dateB = new Date(b.dataLancamento.includes('/') ? b.dataLancamento.split('/').reverse().join('-') : b.dataLancamento);
                return dateA.getTime() - dateB.getTime();
            });
            break;
    }

    renderPaginatedResults(filteredGames);
}

/**
 * Renderiza os cards dos jogos no container.
 * @param {Array<Object>} items A lista de jogos a serem renderizados.
 */
function renderCards(items) {
    cardContainer.innerHTML = ""; // Limpa os cards existentes
    if (items.length === 0) {
        paginationContainer.innerHTML = ""; // Clear pagination if no results
        cardContainer.innerHTML = `
            <div class="no-results">
                <p>Nenhum jogo encontrado com os filtros selecionados.</p>
                <span>Tente ajustar sua busca ou limpar os filtros.</span>
            </div>`;
        return;

    }

    items.forEach(dado => {
        const article = document.createElement("article");
        article.classList.add("card");

        let dataFormatada = 'N/A';
        if (dado.dataLancamento) {
            const dateString = dado.dataLancamento.includes('/') ? dado.dataLancamento.split('/').reverse().join('-') : dado.dataLancamento;
            const dataObj = new Date(dateString + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário com fusos horários
            dataFormatada = !isNaN(dataObj.getTime()) ? dataObj.toLocaleDateString('pt-BR') : 'Data inválida';
        }

        const premiosHtml = dado.premios && dado.premios.length > 0
            ? `<h4>Prêmios Notáveis</h4><ul class="awards-list">${dado.premios.map(premio => `<li>${premio.titulo} (${premio.organizacao}, ${premio.ano})</li>`).join('')}</ul>`
            : '';

        article.innerHTML = `
            <img src="${dado.steamImage}" alt="Capa do jogo ${dado.titulo}">
            <a href="${dado.steamLink}" target="_blank" rel="noopener noreferrer" class="steam-link-button">
                <h2>${dado.titulo}</h2>
            </a>
            <div class="genres">${dado.generos ? dado.generos.map(genero => `<span>${genero}</span>`).join(', ') : 'N/A'}</div>
            <p>${dado.descricao}</p>
            <div class="metacritic-scores">
                <div class="score">
                    Crítica: <span>${dado.metacriticCritics || 'N/A'}</span>
                </div>
                <div class="score">
                    Usuários: <span>${dado.metacriticUsers || 'N/A'}</span>
                </div>
            </div>
            <ul>
                <li><strong>Desenvolvedora:</strong> ${dado.desenvolvedora || 'N/A'}</li>
                <li><strong>Publicadora:</strong> ${dado.publicadora || 'N/A'}</li>
                <li><strong>Lançamento:</strong> ${dataFormatada}</li>
            </ul>
            ${premiosHtml}
            <a href="${dado.steamLink}" target="_blank" rel="noopener noreferrer" class="button steam-button">Ver na Steam</a>
        `;
        cardContainer.appendChild(article);
    });
}

/**
 * Handles pagination logic and renders the appropriate items.
 * @param {Array<Object>} allItems The full list of filtered and sorted games.
 */
function renderPaginatedResults(allItems) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsForCurrentPage = allItems.slice(startIndex, endIndex);

    renderCards(itemsForCurrentPage);
    renderPaginationControls(allItems.length);
}

/**
 * Renders the pagination controls (page numbers, next/prev buttons).
 * @param {number} totalItems The total number of items after filtering.
 */
function renderPaginationControls(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    paginationContainer.innerHTML = "";

    if (totalPages <= 1) return;

    const createButton = (page, text = page, classes = []) => {
        const button = document.createElement('button');
        button.textContent = text;
        if (page === currentPage && typeof page === 'number') {
            button.classList.add('active');
        }
        button.classList.add(...classes);
        button.addEventListener('click', () => {
            if (typeof page === 'number') {
                currentPage = page;
                applyFiltersAndRenderForPagination();
            }
        });
        return button;
    };

    const createEllipsis = () => {
        const span = document.createElement('span');
        span.textContent = '...';
        span.classList.add('pagination-ellipsis');
        return span;
    };

    // Botão "Anterior"
    const prevPage = currentPage > 1 ? currentPage - 1 : 1;
    const prevButton = createButton(prevPage, 'Anterior');
    prevButton.disabled = currentPage === 1;
    paginationContainer.appendChild(prevButton);

    if (totalPages <= 9) { // Se houver 9 páginas ou menos, mostra todas
        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.appendChild(createButton(i));
        }
    } else {
        const pagesToShow = new Set([1, totalPages, currentPage]);
        if (currentPage > 1) pagesToShow.add(currentPage - 1);
        if (currentPage > 2) pagesToShow.add(currentPage - 2);
        if (currentPage < totalPages) pagesToShow.add(currentPage + 1);
        if (currentPage < totalPages - 1) pagesToShow.add(currentPage + 2);

        let lastPage = 0;
        const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);

        sortedPages.forEach(page => {
            if (lastPage !== 0 && page > lastPage + 1) {
                paginationContainer.appendChild(createEllipsis());
            }
            paginationContainer.appendChild(createButton(page));
            lastPage = page;
        });
    }

    // Botão "Próximo"
    const nextPage = currentPage < totalPages ? currentPage + 1 : totalPages;
    const nextButton = createButton(nextPage, 'Próximo');
    nextButton.disabled = currentPage === totalPages;
    paginationContainer.appendChild(nextButton);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Get references to filter containers
    const textFilterContainer = document.querySelector("#text-filter-container");
    const genreFilterContainer = document.querySelector("#genre-filter-container");
    const yearFilterContainer = document.querySelector("#year-filter-container");
    const awardsFilterContainer = document.querySelector("#awards-filter-container");
    const sortOrderContainer = document.querySelector("#sort-order-container"); // New container

    try {
        const response = await fetch('../data/data.json');
        allGamesData = await response.json();
        console.log('1. Dados dos jogos carregados:', allGamesData); // Verifique se este array não está vazio

        // Ordena os jogos em ordem alfabética pelo título no carregamento inicial
        allGamesData.sort((a, b) => a.titulo.localeCompare(b.titulo));

        // Inicializa os filtros e armazena as referências aos elementos <select>
        populateTextFilter(textFilterContainer);
        genreFilterSelect = populateGenreFilter(allGamesData, genreFilterContainer);
        yearFilterSelect = populateYearFilter(allGamesData, yearFilterContainer);
        awardsFilterSelect = populateAwardsFilter(awardsFilterContainer);
        sortOrderSelect = populateSortOrderFilter(sortOrderContainer);

        // Verifica se há um termo de busca na URL
        const urlParams = new URLSearchParams(window.location.search);
        const queryFromUrl = urlParams.get('q');
        if (queryFromUrl) {
            searchInput.value = queryFromUrl;
            const sidebarSearchInput = document.querySelector("#sidebar-search-input");
            if (sidebarSearchInput) {
                sidebarSearchInput.value = queryFromUrl;
            }
            activeFilters.text = queryFromUrl.toLowerCase();
        }

        // Initial render
        applyFiltersAndRender();

        // Event Listeners
        searchButton.addEventListener('click', () => {
            activeFilters.text = searchInput.value.toLowerCase();
            const sidebarSearchInput = document.querySelector("#sidebar-search-input");
            if (sidebarSearchInput) {
                sidebarSearchInput.value = searchInput.value;
            }
            applyFiltersAndRender();
        });

        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                activeFilters.text = searchInput.value.toLowerCase();
                const sidebarSearchInput = document.querySelector("#sidebar-search-input");
                if (sidebarSearchInput) {
                    sidebarSearchInput.value = searchInput.value;
                }
                applyFiltersAndRender();
            }
        });

        // Attach listeners to the dynamically created select elements
        genreFilterSelect.addEventListener('change', applyFiltersAndRender);
        yearFilterSelect.addEventListener('change', applyFiltersAndRender);
        awardsFilterSelect.addEventListener('change', applyFiltersAndRender);
        sortOrderSelect.addEventListener('change', applyFiltersAndRender);

        // Listener for sidebar search input (if it exists)
        const sidebarSearchInput = document.querySelector("#sidebar-search-input");
        if (sidebarSearchInput) {
            sidebarSearchInput.addEventListener('keyup', (event) => {
                activeFilters.text = event.target.value.toLowerCase();
                searchInput.value = event.target.value; // Sync with main search bar
                if (event.key === 'Enter' || event.target.value.length === 0 || event.target.value.length > 2) {
                    applyFiltersAndRender();
                }
            });
        }
        console.log('2. Inicialização completa, chamando applyFiltersAndRender.'); // Confirma que a função será chamada
    } catch (error) {
        console.error("Erro ao carregar os dados dos jogos:", error);
        cardContainer.innerHTML = '<p>Não foi possível carregar os jogos. Tente novamente mais tarde.</p>';
    }
});

/**
 * Re-applies filters and renders but WITHOUT resetting the current page.
 * Used for pagination controls to avoid jumping to page 1.
 */
function applyFiltersAndRenderForPagination() {
    // Rola a página para o topo para mostrar os novos resultados
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // This function is similar to applyFiltersAndRender, but it doesn't reset currentPage.
    activeFilters.text = searchInput.value.toLowerCase();
    activeFilters.genre = genreFilterSelect.value;
    activeFilters.year = yearFilterSelect.value;
    activeFilters.awards = awardsFilterSelect.value;
    activeFilters.sort = sortOrderSelect.value;

    let filteredGames = allGamesData.filter(game => {
        const genreMatch = activeFilters.genre === 'all' || (game.generos && game.generos.includes(activeFilters.genre));
        let yearMatch = true;
        if (activeFilters.year !== 'all' && game.dataLancamento) {
            const dateString = game.dataLancamento.includes('/') ? game.dataLancamento.split('/').reverse().join('-') : game.dataLancamento;
            const gameYear = new Date(dateString).getFullYear();
            yearMatch = gameYear.toString() === activeFilters.year;
        }
        const awardsMatch = activeFilters.awards === 'all' || (activeFilters.awards === 'yes' && game.premios && game.premios.length > 0) || (activeFilters.awards === 'no' && (!game.premios || game.premios.length === 0));
        const textMatch = !activeFilters.text || (game.titulo.toLowerCase().includes(activeFilters.text) || game.descricao.toLowerCase().includes(activeFilters.text));
        return genreMatch && yearMatch && awardsMatch && textMatch;
    });

    // Apply sorting
    switch (activeFilters.sort) {
        case 'title-asc': filteredGames.sort((a, b) => a.titulo.localeCompare(b.titulo)); break;
        case 'title-desc': filteredGames.sort((a, b) => b.titulo.localeCompare(a.titulo)); break;
        case 'critic-desc': filteredGames.sort((a, b) => (b.metacriticCritics || 0) - (a.metacriticCritics || 0)); break;
        case 'critic-asc': filteredGames.sort((a, b) => (a.metacriticCritics || 0) - (b.metacriticCritics || 0)); break;
        case 'user-desc': filteredGames.sort((a, b) => (b.metacriticUsers || 0) - (a.metacriticUsers || 0)); break;
        case 'user-asc': filteredGames.sort((a, b) => (a.metacriticUsers || 0) - (b.metacriticUsers || 0)); break;
        case 'newest': filteredGames.sort((a, b) => new Date(b.dataLancamento.includes('/') ? b.dataLancamento.split('/').reverse().join('-') : b.dataLancamento).getTime() - new Date(a.dataLancamento.includes('/') ? a.dataLancamento.split('/').reverse().join('-') : a.dataLancamento).getTime()); break;
        case 'oldest': filteredGames.sort((a, b) => new Date(a.dataLancamento.includes('/') ? a.dataLancamento.split('/').reverse().join('-') : a.dataLancamento).getTime() - new Date(b.dataLancamento.includes('/') ? b.dataLancamento.split('/').reverse().join('-') : b.dataLancamento).getTime()); break;
    }

    renderPaginatedResults(filteredGames);
}


/**
 * Popula o filtro de texto na barra lateral.
 * @param {HTMLElement} container O elemento HTML onde o filtro de texto será inserido.
 */
function populateTextFilter(container) {
    container.innerHTML = `
        <h4>Buscar por Nome</h4>
        <input type="text" id="sidebar-search-input" placeholder="Buscar nos resultados...">
    `;
}

/**
 * Popula o filtro de Gêneros.
 * @param {Array<Object>} games A lista completa de jogos.
 * @param {HTMLElement} container O elemento HTML onde o filtro de gênero será inserido.
 * @returns {HTMLSelectElement} O elemento <select> criado para os gêneros.
 */
function populateGenreFilter(games, container) {
    const allGenres = new Set();
    games.forEach(game => game.generos.forEach(genre => allGenres.add(genre)));

    const sortedGenres = Array.from(allGenres).sort();

    const select = document.createElement('select');
    select.id = 'genre-select';
    select.innerHTML = `<option value="all">Todos os Gêneros</option>` +
        sortedGenres.map(genre => `<option value="${genre}">${genre}</option>`).join('');

    container.innerHTML = '<h4>Gênero</h4>';
    container.appendChild(select);
    return select;
}

/**
 * Popula o filtro de Ano de Lançamento.
 * @param {Array<Object>} games A lista completa de jogos.
 * @param {HTMLElement} container O elemento HTML onde o filtro de ano será inserido.
 * @returns {HTMLSelectElement} O elemento <select> criado para os anos.
 */
function populateYearFilter(games, container) {
    const allYears = new Set();
    games.forEach(game => {
        if (game.dataLancamento) {
            const dateString = game.dataLancamento.includes('/') ? game.dataLancamento.split('/').reverse().join('-') : game.dataLancamento;
            const year = new Date(dateString).getFullYear();
            if (!isNaN(year)) {
                allYears.add(year);
            }
        }
    });

    const sortedYears = Array.from(allYears).sort((a, b) => b - a); // Ordena do mais novo para o mais antigo

    const select = document.createElement('select');
    select.id = 'year-select';
    select.innerHTML = `<option value="all">Todos os Anos</option>` +
        sortedYears.map(year => `<option value="${year}">${year}</option>`).join('');

    container.innerHTML = '<h4>Ano de Lançamento</h4>';
    container.appendChild(select);
    return select;
}

/**
 * Popula o filtro de Jogos Premiados.
 * @param {HTMLElement} container O elemento HTML onde o filtro de prêmios será inserido.
 * @returns {HTMLSelectElement} O elemento <select> criado para os prêmios.
 */
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

/**
 * Popula o filtro de Ordem de Classificação.
 * @param {HTMLElement} container O elemento HTML onde o filtro de ordenação será inserido.
 * @returns {HTMLSelectElement} O elemento <select> criado para a ordenação.
 */
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