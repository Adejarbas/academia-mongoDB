// ===================================
// VERSÃO OTIMIZADA DO MAIN.JS
// ===================================

// ===== CONFIGURAÇÕES GLOBAIS =====
const CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://trabalho-mongo-db.vercel.app',
    TOKEN_EXPIRY_HOURS: 24,
    DEBUG: window.location.hostname === 'localhost' // Logs apenas em dev
};

// ===== STORAGE GLOBAL =====
let data = {
    alunos: [],
    professores: [],
    treinos: [],
    planos: [],
    planosAlunos: []
};

let currentEditId = null;
let currentEditType = null;
let treinoExercicios = [];

// ===== UTILITÁRIOS CENTRALIZADOS =====

// Verificação de token centralizada
function validateToken() {
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (!lastLoginTime) return false;

    const now = new Date().getTime();
    const loginTime = parseInt(lastLoginTime);
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

    return hoursSinceLogin < CONFIG.TOKEN_EXPIRY_HOURS;
}

// Sistema de erros melhorado
function showError(message, isTokenExpired = false) {
    if (CONFIG.DEBUG) console.error('Erro:', message);
    
    if (isTokenExpired) {
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        handleLogout();
        return;
    }
    
    const errorDiv = document.getElementById('error-message') || createErrorElement();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function createErrorElement() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background-color: #ff4444; color: white;
        padding: 15px; border-radius: 5px;
        z-index: 1000; display: none;
    `;
    document.body.appendChild(errorDiv);
    return errorDiv;
}

// ===== API CENTRALIZADA =====

async function makeRequest(endpoint, options = {}) {
    if (!validateToken()) {
        throw new Error('Token expirado');
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
        throw new Error('Token não encontrado');
    }

    const url = `${CONFIG.BASE_URL}/${endpoint}`;
    if (CONFIG.DEBUG) console.log('Requisição:', options.method || 'GET', url);

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Token expirado');
        }
        throw new Error(responseData.message || 'Erro na requisição');
    }
    
    return responseData;
}

// Wrapper para GET
async function fetchData(endpoint) {
    try {
        const data = await makeRequest(endpoint);
        if (CONFIG.DEBUG) console.log(`Dados recebidos de ${endpoint}:`, data);
        return data;
    } catch (error) {
        const isTokenError = error.message.includes('Token');
        showError(error.message, isTokenError);
        if (isTokenError) handleLogout();
        return [];
    }
}

// Wrapper para POST/PUT/DELETE
async function sendData(endpoint, method, data) {
    try {
        const result = await makeRequest(endpoint, {
            method,
            body: JSON.stringify(data)
        });
        if (CONFIG.DEBUG) console.log('Resposta:', result);
        return result;
    } catch (error) {
        const isTokenError = error.message.includes('Token');
        showError(error.message, isTokenError);
        throw error;
    }
}

// ===== SISTEMA DE BUSCA GENÉRICO =====

function highlightSearchTerm(text, searchInputId) {
    const searchInput = document.getElementById(searchInputId);
    const searchTerm = searchInput?.value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function setupSearch(config) {
    const {
        entity,
        searchInputId,
        filterToggleId,
        filtersPanelId,
        clearFiltersId,
        countSpanId,
        renderFunction,
        customFilters = []
    } = config;

    const searchInput = document.getElementById(searchInputId);
    const filterToggle = document.getElementById(filterToggleId);
    const filtersPanel = document.getElementById(filtersPanelId);
    const clearFilters = document.getElementById(clearFiltersId);
    const countSpan = document.getElementById(countSpanId);

    if (!searchInput) {
        if (CONFIG.DEBUG) console.warn(`Search input ${searchInputId} não encontrado`);
        return;
    }

    // Toggle dos filtros avançados
    if (filterToggle && filtersPanel) {
        filterToggle.addEventListener('click', () => {
            filtersPanel.classList.toggle('show');
            filterToggle.classList.toggle('active');
        });
    }

    // Função de busca e filtro
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        let filteredData = data[entity].filter(item => {
            // Busca por texto
            const matchesSearch = !searchTerm || 
                Object.values(item).some(value => 
                    value && value.toString().toLowerCase().includes(searchTerm)
                );

            // Aplicar filtros customizados
            const matchesCustomFilters = customFilters.every(filter => filter(item));

            return matchesSearch && matchesCustomFilters;
        });

        // Atualizar contagem
        if (countSpan) {
            countSpan.textContent = filteredData.length;
        }

        // Re-renderizar com dados filtrados
        renderFunction(filteredData);
    }

    // Event listeners
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            searchInput.value = '';
            // Limpar filtros customizados
            customFilters.forEach(filter => filter.clear && filter.clear());
            applyFilters();
        });
    }

    // Configurar filtros customizados
    customFilters.forEach(filter => {
        if (filter.element && filter.event) {
            filter.element.addEventListener(filter.event, applyFilters);
        }
    });
}

// Função debounce para melhorar performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== CARREGAMENTO DE DADOS OTIMIZADO =====

async function loadAllData() {
    const entities = ['alunos', 'professores', 'treinos', 'planos', 'plano-alunos'];
    const renderFunctions = [
        { name: 'renderAlunos', func: renderAlunos },
        { name: 'renderProfessores', func: renderProfessores },
        { name: 'renderTreinos', func: renderTreinos },
        { name: 'renderPlanos', func: renderPlanos },
        { name: 'renderPlanosAlunos', func: renderPlanosAlunos },
        { name: 'updateStats', func: updateStats }
    ];

    const setupFunctions = [
        { name: 'populateSelectProfessores', func: populateSelectProfessores },
        { name: 'populateSelectAlunos', func: populateSelectAlunos }
    ];

    try {
        if (CONFIG.DEBUG) console.log('Iniciando carregamento de dados...');
        
        // Carregar dados
        for (const entity of entities) {
            const endpoint = `api/${entity}`;
            const result = await fetchData(endpoint);
            
            // Normalizar nome da propriedade
            const dataKey = entity === 'plano-alunos' ? 'planosAlunos' : entity;
            data[dataKey] = result || [];
            
            if (CONFIG.DEBUG) console.log(`${entity} carregados:`, result?.length || 0);
        }

        // Executar renders com tratamento de erro
        renderFunctions.forEach(({ name, func }) => {
            try {
                func();
            } catch (e) {
                console.error(`Erro em ${name}:`, e);
            }
        });

        // Executar setup functions
        setupFunctions.forEach(({ name, func }) => {
            try {
                func();
            } catch (e) {
                console.error(`Erro em ${name}:`, e);
            }
        });

        // Configurar sistemas de busca
        setupSearchSystems();

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        const isTokenError = error.message.includes('Token');
        showError(`Erro ao carregar dados: ${error.message}`, isTokenError);
    }
}

// Configuração dos sistemas de busca
function setupSearchSystems() {
    const searchConfigs = [
        {
            entity: 'alunos',
            searchInputId: 'alunos-search',
            filterToggleId: 'alunos-filter-toggle',
            filtersPanelId: 'alunos-filters',
            clearFiltersId: 'alunos-clear-filters',
            countSpanId: 'alunos-count',
            renderFunction: renderAlunos,
            customFilters: [
                // Filtros específicos de alunos podem ser adicionados aqui
            ]
        },
        {
            entity: 'professores',
            searchInputId: 'professores-search',
            filterToggleId: 'professores-filter-toggle',
            filtersPanelId: 'professores-filters',
            clearFiltersId: 'professores-clear-filters',
            countSpanId: 'professores-count',
            renderFunction: renderProfessores,
            customFilters: []
        },
        {
            entity: 'treinos',
            searchInputId: 'treinos-search',
            filterToggleId: 'treinos-filter-toggle',
            filtersPanelId: 'treinos-filters',
            clearFiltersId: 'treinos-clear-filters',
            countSpanId: 'treinos-count',
            renderFunction: renderTreinos,
            customFilters: []
        }
    ];

    searchConfigs.forEach(config => {
        try {
            setupSearch(config);
        } catch (e) {
            console.error(`Erro ao configurar busca de ${config.entity}:`, e);
        }
    });
}

// ===== AUTENTICAÇÃO =====

function handleLogout() {
    ['userToken', 'gymproLoggedIn', 'userRole', 'lastLoginTime'].forEach(key => {
        localStorage.removeItem(key);
    });
    window.location.href = 'login.html';
}

// ===== INICIALIZAÇÃO =====

async function initializeApp() {
    if (CONFIG.DEBUG) console.log('Iniciando aplicação...');
    
    if (!validateToken()) {
        if (CONFIG.DEBUG) console.log('Token expirado, redirecionando...');
        handleLogout();
        return;
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
        if (CONFIG.DEBUG) console.log('Token não encontrado, redirecionando...');
        window.location.href = 'login.html';
        return;
    }

    try {
        await loadAllData();
        setupEventListeners();
        if (CONFIG.DEBUG) console.log('Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Erro na inicialização:', error);
        const isTokenError = error.message.includes('Token');
        showError('Erro na inicialização da aplicação.', isTokenError);
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error('Erro na inicialização:', error);
        showError('Erro na inicialização da aplicação.');
    });
});

// ===== CONTINUAÇÃO COM FUNÇÕES ESPECÍFICAS =====
// A partir daqui continuariam as funções de render, CRUD, etc.
// mas já com as otimizações aplicadas...

/* 
OTIMIZAÇÕES APLICADAS:
1. ✅ Base URL centralizada
2. ✅ Token validation centralizada  
3. ✅ Sistema de API unificado
4. ✅ Highlight search genérico
5. ✅ Setup search genérico
6. ✅ Carregamento de dados otimizado
7. ✅ Configuração centralizada
8. ✅ Logs condicionais (apenas em dev)
9. ✅ Tratamento de erro melhorado
10. ✅ Debounce para performance

REDUÇÃO ESTIMADA: ~400 linhas (20% do código original)
*/
