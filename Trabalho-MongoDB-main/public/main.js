// ===== CONFIGURAÇÕES GLOBAIS =====
const CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://trabalho-mongo-db.vercel.app',
    TOKEN_EXPIRY_HOURS: 24,
    DEBUG: window.location.hostname === 'localhost' // Logs apenas em dev
};

// Global Data Storage
let data = {
    alunos: [],
    professores: [],
    treinos: [],    planos: [],
    planosAlunos: []
};

let currentEditId = null;
let currentEditType = null;
let treinoExercicios = []; // Array para armazenar exercícios do treino atual

// Variáveis globais para sistema de filtros
let filteredAlunos = [];
let filteredProfessores = [];
let filteredTreinos = [];

// ===== UTILITÁRIOS CENTRALIZADOS =====

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

// Base URL centralizada
function getBaseUrl() {
    return CONFIG.BASE_URL;
}

function checkTokenExpiration() {
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (!lastLoginTime) return true;

    // Verifica se passaram mais de 24 horas desde o último login
    const now = new Date().getTime();
    const loginTime = parseInt(lastLoginTime);
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

    return hoursSinceLogin >= CONFIG.TOKEN_EXPIRY_HOURS;
}

function showError(message, isTokenExpired = false) {
    if (CONFIG.DEBUG) console.error('🚨 Erro:', message);
    
    // Se o token expirou, redireciona para login
    if (isTokenExpired) {
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        handleLogout();
        return;
    }
    
    // Exibe mensagem de erro
    const errorDiv = document.getElementById('error-message') || createErrorElement();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Esconde após 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function createErrorElement() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #ff4444;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
        display: none;
    `;
    document.body.appendChild(errorDiv);
    return errorDiv;
}

// API Functions
async function sendData(url, method, data) {
    const baseUrl = getBaseUrl();
        
    try {
        if (checkTokenExpiration()) {
            throw new Error('Token expirado');
        }

        const token = localStorage.getItem('userToken');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        if (CONFIG.DEBUG) {
            console.log('📤 Enviando requisição para:', `${baseUrl}/${url}`);
            console.log('📋 Dados:', data);
        }
        
        const response = await fetch(`${baseUrl}/${url}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expirado');
            }
            throw new Error(responseData.message || 'Erro na requisição');
        }
        
        return responseData;
    } catch (error) {
        console.error('Erro na requisição:', error);
        const isTokenError = error.message.includes('Token');
        showError(error.message, isTokenError);
        throw error;
    }
}

async function fetchData(endpoint) {
    const baseUrl = getBaseUrl();
        
    try {
        if (checkTokenExpiration()) {
            throw new Error('Token expirado');
        }

        const token = localStorage.getItem('userToken');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        if (CONFIG.DEBUG) console.log(`📥 Buscando dados de: ${baseUrl}/${endpoint}`);
        
        const response = await fetch(`${baseUrl}/${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            if (response.status === 401) {
                throw new Error('Token expirado');
            }
            throw new Error(error.message || `Erro ao carregar ${endpoint}`);
        }
        
        const responseData = await response.json();
        if (CONFIG.DEBUG) console.log(`✅ Dados recebidos de ${endpoint}:`, responseData);
        return responseData;
    } catch (error) {
        console.error(`Erro ao carregar ${endpoint}:`, error);
        const isTokenError = error.message.includes('Token');
        showError(error.message, isTokenError);
        if (isTokenError) {
            handleLogout();
        }
        return [];
    }
}

// Load Data Functions
async function loadAllData() {
    try {
        if (CONFIG.DEBUG) console.log('🚀 Iniciando carregamento de dados...');
        
        const alunos = await fetchData('api/alunos');
        if (CONFIG.DEBUG) console.log('👥 Alunos carregados:', alunos);
        data.alunos = alunos || [];
        
        const professores = await fetchData('api/professores');
        if (CONFIG.DEBUG) console.log('👨‍🏫 Professores carregados:', professores);
        data.professores = professores || [];
        
        const treinos = await fetchData('api/treinos');
        if (CONFIG.DEBUG) console.log('💪 Treinos carregados:', treinos);
        data.treinos = treinos || [];
        
        const planos = await fetchData('api/planos');
        if (CONFIG.DEBUG) console.log('📋 Planos carregados:', planos);
        data.planos = planos || [];
        
        const planosAlunos = await fetchData('api/plano-alunos');
        if (CONFIG.DEBUG) console.log('🔗 Planos-Alunos carregados:', planosAlunos);
        data.planosAlunos = planosAlunos || [];

        // Atualizar interface com tratamento de erro individual
        const renderFunctions = [
            { name: 'renderAlunos', func: renderAlunos },
            { name: 'renderProfessores', func: renderProfessores },
            { name: 'renderTreinos', func: renderTreinos },
            { name: 'renderPlanos', func: renderPlanos },
            { name: 'renderPlanosAlunos', func: renderPlanosAlunos },
            { name: 'updateStats', func: updateStats }
        ];

        renderFunctions.forEach(({ name, func }) => {
            try { 
                func(); 
            } catch (e) { 
                console.error(`❌ Erro em ${name}:`, e); 
            }
        });
        
        // Popular selects para modais (caso já estejam abertos)
        const setupFunctions = [
            { name: 'populateSelectProfessores', func: populateSelectProfessores },
            { name: 'populateSelectAlunos', func: populateSelectAlunos }
        ];

        setupFunctions.forEach(({ name, func }) => {
            try { 
                func(); 
            } catch (e) { 
                console.error(`❌ Erro em ${name}:`, e); 
            }
        });
        
        // Configurar sistema de busca após carregar dados
        const searchFunctions = [
            { name: 'setupAlunosSearch', func: setupAlunosSearch },
            { name: 'setupProfessoresSearch', func: setupProfessoresSearch }
        ];

        searchFunctions.forEach(({ name, func }) => {
            try { 
                func(); 
            } catch (e) { 
                console.error(`❌ Erro em ${name}:`, e); 
            }
        });
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        const isTokenError = error.message.includes('Token');
        showError(`Erro ao carregar dados: ${error.message}`, isTokenError);
    }
}

// Authentication
function handleLogout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('gymproLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('lastLoginTime');
    window.location.href = 'login.html';
}

// Initialize App
async function initializeApp() {
    if (CONFIG.DEBUG) console.log('🚀 Iniciando aplicação...');
    
    if (checkTokenExpiration()) {
        if (CONFIG.DEBUG) console.log('⏰ Token expirado, redirecionando para login...');
        handleLogout();
        return;
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
        if (CONFIG.DEBUG) console.log('🔑 Token não encontrado, redirecionando para login...');
        window.location.href = 'login.html';
        return;
    }

    try {
        if (CONFIG.DEBUG) console.log('📊 Iniciando carregamento dos dados...');
        await loadAllData();
        setupEventListeners();
        if (CONFIG.DEBUG) console.log('✅ Dados carregados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        const isTokenError = error.message.includes('Token');
        showError('Erro ao carregar dados. Tente novamente mais tarde.', isTokenError);
    }
}

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    if (CONFIG.DEBUG) console.log('📄 DOM carregado, inicializando aplicação...');
    initializeApp().catch(error => {
        console.error('❌ Erro na inicialização:', error);
        const isTokenError = error.message.includes('Token');
        showError('Erro na inicialização da aplicação.', isTokenError);
    });
});

// Função para mostrar o dashboard
function showDashboard() {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        dashboard.style.display = 'flex';
    }
}

// Função para configurar navegação
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionName = item.getAttribute('data-section');
            
            // Remover classe active de todos os itens
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Esconder todas as seções
            sections.forEach(section => section.classList.remove('active'));
              // Mostrar seção selecionada
            const targetSection = document.getElementById(`${sectionName}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Reconfigurar sistemas de busca para a seção ativa
            if (sectionName === 'alunos') {
                setTimeout(() => setupAlunosSearch(), 100);
            } else if (sectionName === 'professores') {
                setTimeout(() => setupProfessoresSearch(), 100);
            } else if (sectionName === 'treinos') {
                setTimeout(() => setupTreinosSearch(), 100);
            }
            
            // Atualizar título da página
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                const titles = {
                    'home': 'Dashboard Administrativo',
                    'alunos': 'Gerenciar Alunos',
                    'professores': 'Gerenciar Professores',
                    'treinos': 'Gerenciar Treinos',
                    'planos': 'Gerenciar Planos'
                };
                pageTitle.textContent = titles[sectionName] || 'Dashboard';
            }
        });
    });
}

// Função para configurar menu mobile
function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
}

// Render Functions
function renderAlunos() {
    console.log('🔥 renderAlunos() chamada');
    console.log('📊 data.alunos:', data.alunos);
    console.log('📊 data.alunos.length:', data.alunos?.length);
    
    const alunosList = document.getElementById('alunos-list');
    console.log('🎯 alunosList element:', alunosList);
    
    if (!alunosList) {
        console.log('❌ Elemento alunos-list não encontrado');
        return;
    }
    
    if (!data.alunos || data.alunos.length === 0) {
        console.log('⚠️ Nenhum aluno encontrado - exibindo estado vazio');
        alunosList.innerHTML = '<div class="empty-state">Nenhum aluno encontrado</div>';
        return;
    }

    console.log('✅ Renderizando alunos diretamente');
    
    // Renderizar diretamente sem filtros por enquanto
    alunosList.innerHTML = '';
    data.alunos.forEach((aluno, index) => {
        console.log(`🎨 Renderizando aluno ${index + 1}:`, aluno.nome);
        
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-info">
                <h3>${aluno.nome || 'N/A'}</h3>
                <p>${aluno.email || 'N/A'}</p>
                <p>Telefone: ${aluno.telefone || 'N/A'} | Idade: ${aluno.idade || 'N/A'} anos</p>
                <p>Nascimento: ${aluno.dataNascimento ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'} | Peso: ${aluno.peso || 'N/A'}kg</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editAluno('${aluno._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteAluno('${aluno._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        alunosList.appendChild(card);
    });
    
    // Atualizar contador se existir
    const countSpan = document.getElementById('alunos-count');
    if (countSpan) {
        countSpan.textContent = `${data.alunos.length} aluno${data.alunos.length !== 1 ? 's' : ''} encontrado${data.alunos.length !== 1 ? 's' : ''}`;
    }
    
    console.log('✅ Renderização concluída!');
}

function renderProfessores() {
    const professoresList = document.getElementById('professores-list');
    if (!professoresList) return;
    
    if (!data.professores || data.professores.length === 0) {
        professoresList.innerHTML = '<div class="empty-state">Nenhum professor encontrado</div>';
        return;
    }
    
    // Inicializar sistema de filtros se necessário
    if (typeof filteredProfessores === 'undefined') {
        window.filteredProfessores = [];
    }
    
    // Renderizar diretamente por enquanto
    professoresList.innerHTML = '';
    data.professores.forEach(professor => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `            <div class="item-info">
                <h3>${professor.nome || 'N/A'}</h3>
                <p>${professor.email || 'N/A'}</p>
                <p>Especialidade: ${professor.especialidade || 'N/A'}</p>
                <p>Telefone: ${professor.telefone || 'N/A'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editProfessor('${professor._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteProfessor('${professor._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        professoresList.appendChild(card);
    });
}

// Função renderTreinos atualizada com filtros
function renderTreinos() {
    const treinosList = document.getElementById('treinos-list');
    if (!treinosList) return;
    
    // Popular filtro de professores
    populateProfessorFilter();
    
    if (!data.treinos || data.treinos.length === 0) {
        treinosList.innerHTML = '<div class="empty-state">Nenhum treino encontrado</div>';
        return;
    }

    // Inicializar com todos os treinos
    if (typeof filteredTreinos === 'undefined') {
        window.filteredTreinos = [];
    }
    filteredTreinos = data.treinos || [];
    updateTreinosCount();
    renderFilteredTreinos();
}
    data.treinos.forEach(treino => {
        // Encontrar nomes do professor e aluno
        const professor = data.professores.find(p => p._id === treino.professor);
        const aluno = data.alunos.find(a => a._id === treino.aluno);
        
        // Preparar lista de exercícios
        const exerciciosText = treino.exercicios && treino.exercicios.length > 0 
            ? `${treino.exercicios.length} exercício(s): ${treino.exercicios.slice(0, 3).join(', ')}${treino.exercicios.length > 3 ? '...' : ''}`
            : 'Nenhum exercício adicionado';
        
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-info">
                <h3>${treino.nome || 'N/A'}</h3>
                <p><strong>Professor:</strong> ${professor ? professor.nome : 'Não informado'}</p>
                <p><strong>Aluno:</strong> ${aluno ? aluno.nome : 'Não informado'}</p>
                <p><strong>Exercícios:</strong> ${exerciciosText}</p>
                <p><strong>Descrição:</strong> ${treino.descricao || 'N/A'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editTreino('${treino._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteTreino('${treino._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        treinosList.appendChild(card);
    });


function renderPlanos() {
    const planosList = document.getElementById('planos-disponiveis-list');
    if (!planosList) return;
    
    if (!data.planos || data.planos.length === 0) {
        planosList.innerHTML = '<div class="empty-state">Nenhum plano encontrado</div>';
        return;
    }
      planosList.innerHTML = '';
    data.planos.forEach(plano => {
        const card = document.createElement('div');
        card.className = 'plano-card';
        card.innerHTML = `
            <h3>${plano.nome || 'N/A'}</h3>
            <span class="preco">R$ ${plano.preco || '0,00'}</span>
            <p class="descricao">${plano.descricao || 'Acesso completo à academia'}</p>
            <span class="duracao">Duração: ${plano.duracaoMeses || 'N/A'} ${plano.duracaoMeses == 1 ? 'mês' : 'meses'}</span>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editPlano('${plano._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deletePlano('${plano._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        planosList.appendChild(card);
    });
}

function updateStats() {
    try {
        const stats = [
            { id: 'total-alunos', data: data.alunos, name: 'alunos' },
            { id: 'total-professores', data: data.professores, name: 'professores' },
            { id: 'total-treinos', data: data.treinos, name: 'treinos' },
            { id: 'total-planos', data: data.planos, name: 'planos' }
        ];

        stats.forEach(({ id, data: entityData, name }) => {
            const element = document.getElementById(id);
            if (element && entityData) {
                element.textContent = entityData.length;
            }
        });

        if (CONFIG.DEBUG) {
            console.log('📊 Estatísticas atualizadas:', {
                alunos: data.alunos.length,
                professores: data.professores.length,
                treinos: data.treinos.length,
                planos: data.planos.length
            });
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar estatísticas:', error);
    }
}

function setupEventListeners() {
    // Mostrar o dashboard
    showDashboard();
    
    // Configurar navegação
    setupNavigation();
      // Configurar menu mobile
    setupMobileMenu();    // Configurar sistema de busca
    setupAlunosSearch();
    setupProfessoresSearch();
    setupTreinosSearch();
    
    // Botões de logout
    const logoutButtons = document.querySelectorAll('#logout-btn, .logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    });
    
    // LOG: Verificar se formulário existe
    const alunoForm = document.getElementById('aluno-form');
    console.log('🔍 Formulário de aluno encontrado:', alunoForm ? 'SIM' : 'NÃO');
    
    if (alunoForm) {
        console.log('📝 Adicionando event listener ao formulário de aluno');
        alunoForm.addEventListener('submit', async function(e) {
            console.log('🎯 EVENT LISTENER ATIVADO - Submit do formulário!');
            e.preventDefault();
            console.log('🛑 preventDefault() chamado');
            await submitAlunoForm();
        });
    }

    // Event listener para formulário de professor
    const professorForm = document.getElementById('professor-form');
    if (professorForm) {
        professorForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitProfessorForm();
        });
    }
    
    // Event listener para formulário de treino
    const treinoForm = document.getElementById('treino-form');
    if (treinoForm) {
        treinoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitTreinoForm();
        });
    }

    // Configurar listener para input de exercício
    setupExercicioInputListener();    // Event listener para formulário de plano
    const planoForm = document.getElementById('plano-form');
    if (planoForm) {
        planoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitPlanoForm();
        });
    }    // Event listener para formulário de atribuição de plano
    const atribuirPlanoForm = document.getElementById('atribuir-plano-form');
    if (atribuirPlanoForm) {
        atribuirPlanoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await submitAtribuirPlanoForm();
        });
    }// Event listeners para fechar modais clicando fora
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                // Usar a função closeModal para garantir limpeza do estado
                const modalId = event.target.id;
                closeModal(modalId);
            }
        });
    
    console.log('Event listeners configurados');
}

// CRUD Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Popular selects específicos para modal de treino
        if (modalId === 'treino-modal') {
            populateSelectProfessores();
            populateSelectAlunos();
            
            // Se não está editando (não tem editId), limpar exercícios
            const form = document.getElementById('treino-form');
            if (form && !form.dataset.editId) {
                clearExerciciosList();
            }
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
          // Limpar estado do modal baseado no tipo
        if (modalId === 'aluno-modal') {
            const form = document.getElementById('aluno-form');
            if (form) {
                form.reset(); // Limpa todos os campos
                delete form.dataset.editId; // Remove ID de edição
                const titleElement = document.getElementById('aluno-modal-title');
                if (titleElement) {
                    titleElement.textContent = 'Novo Aluno'; // Reseta título
                }
            }
        } else if (modalId === 'professor-modal') {
            const form = document.getElementById('professor-form');
            if (form) {
                form.reset(); // Limpa todos os campos                delete form.dataset.editId; // Remove ID de edição
                const titleElement = document.getElementById('professor-modal-title');
                if (titleElement) {
                    titleElement.textContent = 'Novo Professor'; // Reseta título
                }
            }
        } else if (modalId === 'treino-modal') {
            const form = document.getElementById('treino-form');            if (form) {
                form.reset(); // Limpa todos os campos
                delete form.dataset.editId; // Remove ID de edição
                const titleElement = document.getElementById('treino-modal-title');
                if (titleElement) {
                    titleElement.textContent = 'Novo Treino'; // Reseta título
                }
                clearExerciciosList(); // Limpa lista de exercícios
            }
        } else if (modalId === 'plano-modal') {
            const form = document.getElementById('plano-form');
            if (form) {
                form.reset(); // Limpa todos os campos
                delete form.dataset.editId; // Remove ID de edição
                const titleElement = document.getElementById('plano-modal-title');
                if (titleElement) {
                    titleElement.textContent = 'Novo Plano'; // Reseta título
                }
            }} else if (modalId === 'atribuir-plano-modal') {
            const form = document.getElementById('atribuir-plano-form');
            if (form) {
                form.reset(); // Limpa todos os campos
                delete form.dataset.editId; // Remove ID de edição
                const titleElement = document.getElementById('atribuir-plano-modal-title');
                if (titleElement) {
                    titleElement.textContent = 'Atribuir Plano'; // Reseta título
                }
            }
        }
    }
}

async function editAluno(id) {
    try {
        const response = await fetch(`/api/alunos/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        if (response.ok) {
            const aluno = await response.json();
            
            // Preencher o formulário com os dados do aluno
            document.getElementById('aluno-nome').value = aluno.nome || '';
            document.getElementById('aluno-email').value = aluno.email || '';
            document.getElementById('aluno-telefone').value = aluno.telefone || '';
            document.getElementById('aluno-nascimento').value = aluno.dataNascimento ? aluno.dataNascimento.split('T')[0] : '';
            document.getElementById('aluno-peso').value = aluno.peso || '';
              // Atualizar título do modal e armazenar ID
            const titleElement = document.getElementById('aluno-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Editar Aluno';
            }
            document.getElementById('aluno-form').dataset.editId = id;
            
            openModal('aluno-modal');
        } else {
            alert('Erro ao carregar dados do aluno');
        }
    } catch (error) {
        console.error('Erro ao editar aluno:', error);
        alert('Erro ao carregar dados do aluno');
    }
}

async function deleteAluno(id) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        try {
            const response = await fetch(`/api/alunos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            });
            
            if (response.ok) {
                alert('Aluno excluído com sucesso!');
                await loadAllData(); // Recarregar dados
            } else {
                alert('Erro ao excluir aluno');
            }
        } catch (error) {
            console.error('Erro ao excluir aluno:', error);
            alert('Erro ao excluir aluno');
        }
    }
}

async function editProfessor(id) {
    console.log('=== EDITANDO PROFESSOR ===');
    console.log('🆔 ID do professor:', id);
    
    try {
        const token = localStorage.getItem('userToken');
        console.log('🔑 Token encontrado:', token ? 'SIM' : 'NÃO');
        console.log('🌐 URL:', `/api/professores/${id}`);
        
        const response = await fetch(`/api/professores/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📨 Status da resposta:', response.status);
        console.log('📨 Response OK:', response.ok);
        
        if (response.ok) {
            const professor = await response.json();
            console.log('👨‍🏫 Dados do professor:', professor);
              // Preencher o formulário com os dados do professor
            document.getElementById('professor-nome').value = professor.nome || '';
            document.getElementById('professor-email').value = professor.email || '';
            document.getElementById('professor-telefone').value = professor.telefone || '';
            document.getElementById('professor-especialidade').value = professor.especialidade || '';
              // Atualizar título do modal e armazenar ID
            const titleElement = document.getElementById('professor-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Editar Professor';
            }
            document.getElementById('professor-form').dataset.editId = id;
            
            openModal('professor-modal');
        } else {
            console.error('❌ Erro na resposta:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('❌ Corpo da resposta:', errorText);
            alert('Erro ao carregar dados do professor');
        }
    } catch (error) {
        console.error('💥 Erro na requisição:', error);
        alert('Erro ao carregar dados do professor');
    }
}

async function deleteProfessor(id) {
    if (confirm('Tem certeza que deseja excluir este professor?')) {
        try {
            const response = await fetch(`/api/professores/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            });
            
            if (response.ok) {
                alert('Professor excluído com sucesso!');
                await loadAllData(); // Recarregar dados
            } else {
                alert('Erro ao excluir professor');
            }
        } catch (error) {
            console.error('Erro ao excluir professor:', error);
            alert('Erro ao excluir professor');
        }
    }
}

async function editTreino(id) {
    try {
        const response = await fetch(`/api/treinos/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        if (response.ok) {
            const treino = await response.json();
            
            // Preencher o formulário com os dados do treino
            document.getElementById('treino-nome').value = treino.nome || '';
            document.getElementById('treino-descricao').value = treino.descricao || '';
            document.getElementById('treino-professor').value = treino.professor || '';
            document.getElementById('treino-aluno').value = treino.aluno || '';
            
            // Carregar exercícios existentes
            treinoExercicios = treino.exercicios || [];
            renderExerciciosList();
              // Atualizar título do modal e armazenar ID
            const titleElement = document.getElementById('treino-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Editar Treino';
            }
            document.getElementById('treino-form').dataset.editId = id;
            
            openModal('treino-modal');
        } else {
            alert('Erro ao carregar dados do treino');
        }
    } catch (error) {
        console.error('Erro ao editar treino:', error);
        alert('Erro ao carregar dados do treino');
    }
}

async function deleteTreino(id) {
    if (confirm('Tem certeza que deseja excluir este treino?')) {
        try {
            const response = await fetch(`/api/treinos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            });
            
            if (response.ok) {
                alert('Treino excluído com sucesso!');
                await loadAllData(); // Recarregar dados
            } else {
                alert('Erro ao excluir treino');
            }
        } catch (error) {
            console.error('Erro ao excluir treino:', error);
            alert('Erro ao excluir treino');
        }
    }
}

async function editPlano(id) {
    try {
        const response = await fetch(`/api/planos/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        if (response.ok) {
            const plano = await response.json();
              // Preencher o formulário com os dados do plano
            document.getElementById('plano-nome').value = plano.nome || '';
            document.getElementById('plano-descricao').value = plano.descricao || '';
            document.getElementById('plano-preco').value = plano.preco || '';
            document.getElementById('plano-duracao').value = plano.duracaoMeses || '';
              // Atualizar título do modal e armazenar ID
            const titleElement = document.getElementById('plano-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Editar Plano';
            }
            document.getElementById('plano-form').dataset.editId = id;
            
            openModal('plano-modal');
        } else {
            alert('Erro ao carregar dados do plano');
        }
    } catch (error) {
        console.error('Erro ao editar plano:', error);
        alert('Erro ao carregar dados do plano');
    }
}

async function deletePlano(id) {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
        try {
            const response = await fetch(`/api/planos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            });
            
            if (response.ok) {
                alert('Plano excluído com sucesso!');
                await loadAllData(); // Recarregar dados
            } else {
                alert('Erro ao excluir plano');
            }
        } catch (error) {
            console.error('Erro ao excluir plano:', error);
            alert('Erro ao excluir plano');
        }
    }
}

// Função para submeter formulário de aluno
async function submitAlunoForm() {
    console.log('=== INICIANDO ENVIO DO FORMULÁRIO ===');
    
    const form = document.getElementById('aluno-form');
    const formData = new FormData(form);
    const editId = form.dataset.editId;
    
    // LOG 1: Verificar token
    const token = localStorage.getItem('userToken');
    console.log('🔑 Token encontrado:', token ? 'SIM' : 'NÃO');
    console.log('🔑 Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'NULL');
    
    // LOG 2: Verificar dados do formulário
    console.log('📝 Dados do FormData:');
    for (let [key, value] of formData.entries()) {
        console.log(`   ${key}: ${value}`);
    }
    
    const alunoData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        telefone: formData.get('telefone'),
        dataNascimento: formData.get('dataNascimento'),
        peso: parseFloat(formData.get('peso')),
        idade: calculateAge(formData.get('dataNascimento'))
    };

    console.log('📊 Dados processados do aluno:', alunoData);
    console.log('✏️ Edit ID:', editId);

    try {
        const url = editId ? `/api/alunos/${editId}` : '/api/alunos';
        const method = editId ? 'PUT' : 'POST';
        
        // LOG 3: Verificar URL e método
        console.log('🌐 URL completa:', window.location.origin + url);
        console.log('🔧 Método:', method);
        console.log('🎯 Base URL detectada:', window.location.hostname === 'localhost' ? 'localhost:3000' : 'Vercel');
        
        console.log('🚀 Enviando requisição:', { url, method });
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify(alunoData)
        });

        // LOG 4: Verificar resposta
        console.log('📨 Status da resposta:', response.status, response.statusText);
        console.log('📨 Headers da resposta:', Object.fromEntries(response.headers.entries()));
        
        // Clonar response para poder ler o body duas vezes
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        console.log('📨 Body da resposta:', responseText);

        if (response.ok) {
            console.log('✅ SUCESSO! Aluno salvo com sucesso!');
            alert(editId ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');            closeModal('aluno-modal');
            form.reset();
            delete form.dataset.editId;
            const titleElement = document.getElementById('aluno-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Novo Aluno';
            }
            await loadAllData(); // Recarregar dados
        } else {
            console.log('❌ ERRO na resposta da API');
            const errorData = await response.json();
            console.error('📨 Erro da API:', errorData);
            alert('Erro: ' + (errorData.message || 'Erro ao salvar aluno'));
        }
    } catch (error) {
        console.log('💥 ERRO CRÍTICO na requisição');
        console.error('🚨 Erro detalhado:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            toString: error.toString()
        });
        alert('Erro ao salvar aluno: ' + error.message);
    }
}

// Função para submeter formulário de professor
async function submitProfessorForm() {
    const form = document.getElementById('professor-form');
    const formData = new FormData(form);
    const editId = form.dataset.editId;
      const professorData = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        telefone: formData.get('telefone'),
        especialidade: formData.get('especialidade')
    };

    try {
        const url = editId ? `/api/professores/${editId}` : '/api/professores';
        const method = editId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify(professorData)
        });

        if (response.ok) {
            alert(editId ? 'Professor atualizado com sucesso!' : 'Professor cadastrado com sucesso!');            closeModal('professor-modal');
            form.reset();
            delete form.dataset.editId;
            const titleElement = document.getElementById('professor-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Novo Professor';
            }
            await loadAllData(); // Recarregar dados
        } else {
            const errorData = await response.json();
            alert('Erro: ' + (errorData.message || 'Erro ao salvar professor'));
        }
    } catch (error) {
        console.error('Erro ao salvar professor:', error);
        alert('Erro ao salvar professor');
    }
}

// Função para submeter formulário de treino
async function submitTreinoForm() {
    const form = document.getElementById('treino-form');
    const formData = new FormData(form);
    const editId = form.dataset.editId;
    
    const treinoData = {
        nome: formData.get('nome'),
        descricao: formData.get('descricao'),
        professor: formData.get('professor'),
        aluno: formData.get('aluno'),
        exercicios: treinoExercicios // Incluir exercícios no envio
    };

    try {
        const url = editId ? `/api/treinos/${editId}` : '/api/treinos';
        const method = editId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify(treinoData)
        });

        if (response.ok) {
            alert(editId ? 'Treino atualizado com sucesso!' : 'Treino cadastrado com sucesso!');            closeModal('treino-modal');
            form.reset();
            delete form.dataset.editId;
            const titleElement = document.getElementById('treino-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Novo Treino';
            }
            clearExerciciosList(); // Limpar lista de exercícios
            await loadAllData(); // Recarregar dados
        } else {
            const errorData = await response.json();
            alert('Erro: ' + (errorData.message || 'Erro ao salvar treino'));
        }
    } catch (error) {
        console.error('Erro ao salvar treino:', error);
        alert('Erro ao salvar treino');
    }
}

// Função para submeter formulário de plano
async function submitPlanoForm() {
    const form = document.getElementById('plano-form');
    const formData = new FormData(form);
    const editId = form.dataset.editId;
      const planoData = {
        nome: formData.get('nome'),
        descricao: formData.get('descricao'), 
        preco: parseFloat(formData.get('preco')) || 0,
        duracaoMeses: parseInt(formData.get('duracaoMeses')) || 0
    };

    try {
        const url = editId ? `/api/planos/${editId}` : '/api/planos';
        const method = editId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify(planoData)
        });

        if (response.ok) {
            alert(editId ? 'Plano atualizado com sucesso!' : 'Plano cadastrado com sucesso!');            closeModal('plano-modal');
            form.reset();
            delete form.dataset.editId;
            const titleElement = document.getElementById('plano-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Novo Plano';
            }
            await loadAllData(); // Recarregar dados
        } else {
            const errorData = await response.json();
            alert('Erro: ' + (errorData.message || 'Erro ao salvar plano'));
        }
    } catch (error) {
        console.error('Erro ao salvar plano:', error);
        alert('Erro ao salvar plano');
    }
}

// Função auxiliar para calcular idade
function calculateAge(birthDate) {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Funções para popular selects
function populateSelectProfessores() {
    const select = document.getElementById('treino-professor');
    if (!select) return;
    
    console.log('🧑‍🏫 Populando select de professores:', data.professores);
    
    // Limpar opções existentes (manter apenas a primeira)
    select.innerHTML = '<option value="">Selecione um professor</option>';
    
    // Adicionar opções dos professores carregados
    if (data.professores && data.professores.length > 0) {
        data.professores.forEach(professor => {
            const option = document.createElement('option');
            option.value = professor._id;
            option.textContent = professor.nome;
            select.appendChild(option);
        });
        console.log(`✅ Adicionados ${data.professores.length} professores ao select`);
    } else {
        console.log('❌ Nenhum professor encontrado para popular o select');
    }
}

function populateSelectAlunos() {
    const select = document.getElementById('treino-aluno');
    if (!select) return;
    
    console.log('👨‍🎓 Populando select de alunos:', data.alunos);
    
    // Limpar opções existentes (manter apenas a primeira)
    select.innerHTML = '<option value="">Selecione um aluno</option>';
    
    // Adicionar opções dos alunos carregados
    if (data.alunos && data.alunos.length > 0) {
        data.alunos.forEach(aluno => {
            const option = document.createElement('option');
            option.value = aluno._id;
            option.textContent = aluno.nome;
            select.appendChild(option);
        });
        console.log(`✅ Adicionados ${data.alunos.length} alunos ao select`);
    } else {
        console.log('❌ Nenhum aluno encontrado para popular o select');
    }
}

// ==================== SISTEMA DE EXERCÍCIOS PARA TREINOS ====================

// Função para adicionar exercício à lista
function addExercicio() {
    const exercicioInput = document.getElementById('exercicio-input');
    const exercicioNome = exercicioInput.value.trim();
    
    if (!exercicioNome) {
        alert('Por favor, digite o nome do exercício');
        return;
    }
    
    // Verificar se exercício já existe
    if (treinoExercicios.includes(exercicioNome)) {
        alert('Este exercício já foi adicionado');
        return;
    }
    
    // Adicionar exercício ao array
    treinoExercicios.push(exercicioNome);
    
    // Limpar input
    exercicioInput.value = '';
    
    // Atualizar renderização da lista
    renderExerciciosList();
}

// Função para remover exercício da lista
function removeExercicio(index) {
    if (confirm('Tem certeza que deseja remover este exercício?')) {
        treinoExercicios.splice(index, 1);
        renderExerciciosList();
    }
}

// Função para renderizar lista de exercícios
function renderExerciciosList() {
    const exerciciosList = document.getElementById('exercicios-list');
    
    if (!exerciciosList) return;
    
    // Limpar lista atual
    exerciciosList.innerHTML = '';
    
    if (treinoExercicios.length === 0) {
        // Mostrar mensagem quando não há exercícios
        exerciciosList.innerHTML = '<div class="exercicios-empty">Nenhum exercício adicionado ainda</div>';
        return;
    }
    
    // Renderizar cada exercício
    treinoExercicios.forEach((exercicio, index) => {
        const exercicioItem = document.createElement('div');
        exercicioItem.className = 'exercicio-item';
        exercicioItem.innerHTML = `
            <span class="exercicio-nome">${exercicio}</span>
            <button type="button" class="btn btn-danger btn-small" onclick="removeExercicio(${index})" title="Remover exercício">
                <i class="fas fa-trash"></i>
            </button>
        `;
        exerciciosList.appendChild(exercicioItem);
    });
}

// Função para limpar lista de exercícios (usado ao abrir/fechar modal)
function clearExerciciosList() {
    treinoExercicios = [];
    renderExerciciosList();
}

// Função para permitir adicionar exercício com Enter
function setupExercicioInputListener() {
    const exercicioInput = document.getElementById('exercicio-input');
    if (exercicioInput) {
        exercicioInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addExercicio();
            }
        });
    }
}

// ==================== FIM DO SISTEMA DE EXERCÍCIOS ====================

// ==================== SISTEMA DE PLANOS E ATRIBUIÇÕES ====================

// Função para validar e abrir modal de atribuição de plano
function openAtribuirPlanoModal() {
    // Verificar se existem planos
    if (!data.planos || data.planos.length === 0) {
        alert('Adicione planos, antes de atribuir');
        return;
    }
    
    // Verificar se existem alunos
    if (!data.alunos || data.alunos.length === 0) {
        alert('Adicione alunos, antes de atribuir planos');
        return;
    }
    
    // Popular os selects
    populateAtribuirSelects();
    
    // Definir data padrão como hoje
    const today = new Date().toISOString().split('T')[0];
    const dataInput = document.getElementById('atribuir-data');
    if (dataInput) {
        dataInput.value = today;
    }
    
    // Abrir modal
    openModal('atribuir-plano-modal');
}

// Função para renderizar planos dos alunos (atribuições)
function renderPlanosAlunos() {
    const planosAlunosList = document.getElementById('planos-alunos-list');
    if (!planosAlunosList) {
        console.log('Elemento planos-alunos-list não encontrado');
        return;
    }
    
    try {
        if (!data.planosAlunos || data.planosAlunos.length === 0) {
            planosAlunosList.innerHTML = '<div class="empty-state">Nenhum plano atribuído ainda</div>';
            return;
        }        planosAlunosList.innerHTML = '';
        data.planosAlunos.forEach(planoAluno => {
            const card = document.createElement('div');
            card.className = 'plano-aluno-card';
            
            const dataInicio = planoAluno.dataInicio ? new Date(planoAluno.dataInicio).toLocaleDateString('pt-BR') : 'N/A';
            const status = planoAluno.status || 'ATIVO';
            
            card.innerHTML = `
                <div class="plano-aluno-info">
                    <h3>${planoAluno.alunoInfo?.nome || 'N/A'}</h3>
                    <p><strong>Plano:</strong> ${planoAluno.planoInfo?.nome || 'N/A'}</p>
                    <p><strong>Preço:</strong> R$ ${planoAluno.planoInfo?.preco || '0,00'}</p>
                    <p><strong>Duração:</strong> ${planoAluno.planoInfo?.duracaoMeses || 'N/A'} meses</p>
                    <p><strong>Início:</strong> ${dataInicio}</p>
                    <span class="status-badge status-${status.toLowerCase()}">${status}</span>
                </div>
                <div class="plano-aluno-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editPlanoAluno('${planoAluno._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deletePlanoAluno('${planoAluno._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            planosAlunosList.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao renderizar planos dos alunos:', error);
        planosAlunosList.innerHTML = '<div class="empty-state">Erro ao carregar planos dos alunos</div>';
    }
}

// Função para popular selects do modal de atribuição
function populateAtribuirSelects() {
    try {
        // Popular select de alunos
        const selectAluno = document.getElementById('atribuir-aluno');
        if (selectAluno && data.alunos) {
            selectAluno.innerHTML = '<option value="">Selecione um aluno</option>';
            data.alunos.forEach(aluno => {
                if (aluno && aluno._id && aluno.nome) {
                    const option = document.createElement('option');
                    option.value = aluno._id;
                    option.textContent = aluno.nome;
                    selectAluno.appendChild(option);
                }
            });
        }
        
        // Popular select de planos
        const selectPlano = document.getElementById('atribuir-plano');
        if (selectPlano && data.planos) {
            selectPlano.innerHTML = '<option value="">Selecione um plano</option>';
            data.planos.forEach(plano => {
                if (plano && plano._id && plano.nome) {
                    const option = document.createElement('option');
                    option.value = plano._id;
                    option.textContent = `${plano.nome} - R$ ${plano.preco || '0,00'}`;
                    selectPlano.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error('Erro ao popular selects de atribuição:', error);
    }
}

// Função para submeter formulário de atribuição de plano
async function submitAtribuirPlanoForm() {
    console.log('=== DEBUG ATRIBUIÇÃO DE PLANO ===');
    
    const form = document.getElementById('atribuir-plano-form');
    const formData = new FormData(form);
    const editId = form.dataset.editId;
    
    // Log para debug
    console.log('Form data:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
      const atribuicaoData = {
        alunoId: formData.get('alunoId'),
        planoId: formData.get('planoId'), 
        dataInicio: formData.get('dataInicio'),
        status: formData.get('status') || 'ATIVO'
    };
    
    console.log('Dados processados:', atribuicaoData);

    try {
        const url = editId ? `/api/planos-alunos/${editId}` : '/api/planos-alunos';
        const method = editId ? 'PUT' : 'POST';
        
        console.log('URL:', url);
        console.log('Method:', method);
        console.log('Body:', JSON.stringify(atribuicaoData));
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            },
            body: JSON.stringify(atribuicaoData)
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            alert(editId ? 'Atribuição atualizada com sucesso!' : 'Plano atribuído com sucesso!');
            closeModal('atribuir-plano-modal');
            form.reset();
            delete form.dataset.editId;
            await loadAllData(); // Recarregar dados
        } else {
            const errorData = await response.json();
            console.error('Erro da API:', errorData);
            alert('Erro: ' + (errorData.message || 'Erro ao atribuir plano'));
        }
    } catch (error) {
        console.error('Erro ao atribuir plano:', error);
        alert('Erro ao atribuir plano: ' + error.message);
    }
}

// Função para editar atribuição de plano
async function editPlanoAluno(id) {
    try {
        const response = await fetch(`/api/planos-alunos/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken')}`
            }
        });
        
        if (response.ok) {
            const planoAluno = await response.json();
            
            // Popular selects primeiro
            populateAtribuirSelects();
              // Preencher o formulário
            document.getElementById('atribuir-aluno').value = planoAluno.aluno || '';
            document.getElementById('atribuir-plano').value = planoAluno.plano || '';
            document.getElementById('atribuir-data').value = planoAluno.dataInicio ? 
                new Date(planoAluno.dataInicio).toISOString().split('T')[0] : '';
            document.getElementById('atribuir-status').value = planoAluno.status || 'ATIVO';
            
            // Configurar modo de edição
            const form = document.getElementById('atribuir-plano-form');
            form.dataset.editId = id;
            
            openModal('atribuir-plano-modal');
        } else {
            alert('Erro ao carregar dados da atribuição');
        }
    } catch (error) {
        console.error('Erro ao editar atribuição:', error);
        alert('Erro ao carregar dados da atribuição');
    }
}

// Função para deletar atribuição de plano
async function deletePlanoAluno(id) {
    if (confirm('Tem certeza que deseja remover esta atribuição de plano?')) {
        try {
            const response = await fetch(`/api/planos-alunos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                }
            });
            
            if (response.ok) {
                alert('Atribuição removida com sucesso!');
                await loadAllData(); // Recarregar dados
            } else {
                alert('Erro ao remover atribuição');
            }
        } catch (error) {
            console.error('Erro ao remover atribuição:', error);
            alert('Erro ao remover atribuição');
        }
    }
}

// ==================== FIM DO SISTEMA DE PLANOS E ATRIBUIÇÕES ====================

// ==================== SISTEMA DE BUSCA E FILTROS - ALUNOS ====================

// Configurar busca e filtros para alunos
function setupAlunosSearch() {
    const searchInput = document.getElementById('alunos-search');
    const filterToggle = document.getElementById('toggle-filters-alunos'); // ID correto
    const filtersPanel = document.getElementById('alunos-filters');
    const clearFilters = document.getElementById('limpar-filtros-alunos'); // ID correto
    const applyFilters = document.getElementById('aplicar-filtros-alunos'); // Botão aplicar filtros
    const idadeMin = document.getElementById('filtro-idade-min'); // ID correto
    const idadeMax = document.getElementById('filtro-idade-max'); // ID correto
    const pesoMin = document.getElementById('filtro-peso-min'); // ID correto
    const pesoMax = document.getElementById('filtro-peso-max'); // ID correto
    const countSpan = document.getElementById('alunos-count');    console.log('🔍 Configurando busca de alunos...');
    console.log('Elementos encontrados:', {
        searchInput: !!searchInput,
        filterToggle: !!filterToggle,
        filtersPanel: !!filtersPanel,
        clearFilters: !!clearFilters,
        applyFilters: !!applyFilters,
        idadeMin: !!idadeMin,
        idadeMax: !!idadeMax,
        pesoMin: !!pesoMin,
        pesoMax: !!pesoMax
    });

    if (!searchInput) return;

    // Toggle dos filtros avançados
    if (filterToggle && filtersPanel) {
        filterToggle.addEventListener('click', () => {
            const isVisible = filtersPanel.style.display !== 'none';
            filtersPanel.style.display = isVisible ? 'none' : 'block';
            filterToggle.innerHTML = isVisible ? 
                '<i class="fas fa-filter"></i> Mostrar Filtros' : 
                '<i class="fas fa-filter"></i> Ocultar Filtros';
        });
    }

    // Limpar filtros
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            searchInput.value = '';
            if (idadeMin) idadeMin.value = '';
            if (idadeMax) idadeMax.value = '';
            if (pesoMin) pesoMin.value = '';            if (pesoMax) pesoMax.value = '';
            applyAlunosFilters();
        });
    }

    // Aplicar filtros
    if (applyFilters) {
        applyFilters.addEventListener('click', applyAlunosFilters);
    }

    // Event listeners para busca em tempo real
    if (searchInput) {
        searchInput.addEventListener('input', applyAlunosFilters);
    }
    if (idadeMin) idadeMin.addEventListener('input', applyAlunosFilters);
    if (idadeMax) idadeMax.addEventListener('input', applyAlunosFilters);
    if (pesoMin) pesoMin.addEventListener('input', applyAlunosFilters);
    if (pesoMax) pesoMax.addEventListener('input', applyAlunosFilters);
}

// Aplicar filtros aos alunos
function applyAlunosFilters() {
    console.log('🔍 applyAlunosFilters() chamada');
    console.log('📊 data.alunos atual:', data.alunos);
    
    // Garantir que filteredAlunos existe
    if (typeof filteredAlunos === 'undefined') {
        window.filteredAlunos = [];
    }
      const searchTerm = document.getElementById('alunos-search')?.value.toLowerCase() || '';
    const idadeMin = parseInt(document.getElementById('filtro-idade-min')?.value) || 0;
    const idadeMax = parseInt(document.getElementById('filtro-idade-max')?.value) || 999;
    const pesoMin = parseFloat(document.getElementById('filtro-peso-min')?.value) || 0;
    const pesoMax = parseFloat(document.getElementById('filtro-peso-max')?.value) || 9999;

    console.log('🔍 Filtros:', { searchTerm, idadeMin, idadeMax, pesoMin, pesoMax });

    filteredAlunos = data.alunos.filter(aluno => {
        // Busca por nome e email
        const matchesSearch = !searchTerm || 
            (aluno.nome && aluno.nome.toLowerCase().includes(searchTerm)) ||
            (aluno.email && aluno.email.toLowerCase().includes(searchTerm));

        // Calcular idade do aluno
        let idade = 0;
        if (aluno.dataNascimento) {
            const nascimento = new Date(aluno.dataNascimento);
            const hoje = new Date();
            idade = hoje.getFullYear() - nascimento.getFullYear();
            const mes = hoje.getMonth() - nascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                idade--;
            }
        }

        // Filtro por idade
        const matchesIdade = idade >= idadeMin && idade <= idadeMax;

        // Filtro por peso
        const peso = parseFloat(aluno.peso) || 0;
        const matchesPeso = peso >= pesoMin && peso <= pesoMax;

        return matchesSearch && matchesIdade && matchesPeso;
    });

    console.log('✅ filteredAlunos após filtro:', filteredAlunos);
    console.log('✅ filteredAlunos.length:', filteredAlunos.length);

    // Atualizar contador
    const countSpan = document.getElementById('alunos-count');
    if (countSpan) {
        countSpan.textContent = `${filteredAlunos.length} aluno${filteredAlunos.length !== 1 ? 's' : ''} encontrado${filteredAlunos.length !== 1 ? 's' : ''}`;
    }

    // Renderizar alunos filtrados
    console.log('🎨 Chamando renderFilteredAlunos()');
    renderFilteredAlunos();
}

// Renderizar alunos filtrados
function renderFilteredAlunos() {
    console.log('🎨 renderFilteredAlunos() chamada');
    console.log('🎨 filteredAlunos:', filteredAlunos);
    
    const alunosList = document.getElementById('alunos-list');
    console.log('🎯 alunosList element:', alunosList);
    
    if (!alunosList) {
        console.log('❌ Elemento alunos-list não encontrado em renderFilteredAlunos');
        return;
    }
    
    if (filteredAlunos.length === 0) {
        console.log('⚠️ Nenhum aluno filtrado - exibindo mensagem');
        alunosList.innerHTML = '<div class="empty-state">Nenhum aluno encontrado com os filtros aplicados</div>';
        return;
    }
    
    console.log('✅ Renderizando', filteredAlunos.length, 'alunos');
    alunosList.innerHTML = '';
    filteredAlunos.forEach(aluno => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        // Calcular idade
        let idade = 'N/A';
        if (aluno.dataNascimento) {
            const nascimento = new Date(aluno.dataNascimento);
            const hoje = new Date();
            idade = hoje.getFullYear() - nascimento.getFullYear();
            const mes = hoje.getMonth() - nascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                idade--;
            }
            idade = idade + ' anos';
        }
        
        card.innerHTML = `            <div class="item-info">
                <h3>${highlightSearchTermAlunos(aluno.nome || 'N/A')}</h3>
                <p>${highlightSearchTermAlunos(aluno.email || 'N/A')}</p>
                <p>Telefone: ${aluno.telefone || 'N/A'} | Idade: ${idade}</p>
                <p>Nascimento: ${aluno.dataNascimento ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'} | Peso: ${aluno.peso || 'N/A'}kg</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editAluno('${aluno._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteAluno('${aluno._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        alunosList.appendChild(card);
    });
}

// Destacar termo de busca
// Função genérica para destacar termos de busca
function highlightSearchTerm(text, searchInputId) {
    const searchInput = document.getElementById(searchInputId);
    const searchTerm = searchInput?.value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Função específica para alunos (mantida para compatibilidade)
function highlightSearchTermAlunos(text) {
    return highlightSearchTerm(text, 'alunos-search');
}

// Função específica para professores (mantida para compatibilidade)
function highlightSearchTermProfessores(text) {
    return highlightSearchTerm(text, 'professores-search');
}

// Função específica para treinos (mantida para compatibilidade)
function highlightSearchTermTreinos(text) {
    return highlightSearchTerm(text, 'treinos-search');
}

// Atualizar função renderAlunos original para usar os filtros
// ==================== FIM DO SISTEMA DE BUSCA E FILTROS - ALUNOS ====================

// ==================== SISTEMA DE BUSCA E FILTROS - PROFESSORES ====================

// Configurar busca e filtros para professores
function setupProfessoresSearch() {
    console.log('🔍 Configurando busca de professores...');
      const searchInput = document.getElementById('professores-search');
    const filterToggle = document.getElementById('toggle-filters-professores');
    const filtersPanel = document.getElementById('professores-filters');
    const clearFilters = document.getElementById('limpar-filtros-professores');
    const especialidadeFilter = document.getElementById('filtro-prof-especialidade');
    const countSpan = document.getElementById('professores-count');    console.log('Elementos encontrados:', {
        searchInput: !!searchInput,
        filterToggle: !!filterToggle,
        filtersPanel: !!filtersPanel,
        clearFilters: !!clearFilters,
        especialidadeFilter: !!especialidadeFilter,
        aplicarFiltros: !!document.getElementById('aplicar-filtros-professores'),
        countSpan: !!countSpan
    });

    if (!searchInput) {
        console.log('❌ Campo de busca de professores não encontrado');
        return;
    }

    // Toggle dos filtros avançados
    if (filterToggle && filtersPanel) {
        console.log('✅ Configurando toggle de filtros');
        filterToggle.addEventListener('click', () => {
            console.log('🔥 Toggle clicado!');
            const isVisible = filtersPanel.style.display !== 'none';
            filtersPanel.style.display = isVisible ? 'none' : 'block';
            filterToggle.innerHTML = isVisible ? 
                '<i class="fas fa-filter"></i> Filtros' : 
                '<i class="fas fa-filter"></i> Ocultar';
            console.log('Panel agora está:', filtersPanel.style.display);
        });
    } else {
        console.log('❌ Elementos de toggle não encontrados:', {
            filterToggle: !!filterToggle,
            filtersPanel: !!filtersPanel
        });
    }    // Limpar filtros
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            searchInput.value = '';
            if (especialidadeFilter) especialidadeFilter.value = '';
            applyProfessoresFilters();
        });
    }

    // Botão aplicar filtros
    const aplicarFiltros = document.getElementById('aplicar-filtros-professores');
    if (aplicarFiltros) {
        aplicarFiltros.addEventListener('click', applyProfessoresFilters);
    }

    // Event listeners para busca em tempo real
    if (searchInput) {
        searchInput.addEventListener('input', applyProfessoresFilters);
    }
    if (especialidadeFilter) {
        especialidadeFilter.addEventListener('input', applyProfessoresFilters);
    }
    
    const nomeFilter = document.getElementById('filtro-prof-nome');
    if (nomeFilter) {
        nomeFilter.addEventListener('input', applyProfessoresFilters);
    }
}

// Popular dropdown de especialidades
function populateEspecialidadeFilter() {
    const especialidadeFilter = document.getElementById('especialidade-filter');
    if (!especialidadeFilter || !data.professores) return;

    // Extrair especialidades únicas
    const especialidades = [...new Set(
        data.professores
            .map(professor => professor.especialidade)
            .filter(esp => esp && esp.trim() !== '')
    )].sort();

    // Limpar e popular o select
    especialidadeFilter.innerHTML = '<option value="">Todas as especialidades</option>';
    especialidades.forEach(especialidade => {
        const option = document.createElement('option');
        option.value = especialidade;
        option.textContent = especialidade;
        especialidadeFilter.appendChild(option);
    });
}

// Aplicar filtros aos professores
function applyProfessoresFilters() {
    const searchTerm = document.getElementById('professores-search')?.value.toLowerCase() || '';
    const especialidadeFilter = document.getElementById('filtro-prof-especialidade')?.value.toLowerCase() || '';

    filteredProfessores = data.professores.filter(professor => {
        // Busca geral (campo de busca principal)
        const matchesSearch = !searchTerm || 
            (professor.nome && professor.nome.toLowerCase().includes(searchTerm)) ||
            (professor.email && professor.email.toLowerCase().includes(searchTerm)) ||
            (professor.especialidade && professor.especialidade.toLowerCase().includes(searchTerm));

        // Filtro específico por especialidade
        const matchesEspecialidade = !especialidadeFilter || 
            (professor.especialidade && professor.especialidade.toLowerCase().includes(especialidadeFilter));

        return matchesSearch && matchesEspecialidade;
    });

    // Atualizar contador
    const countSpan = document.getElementById('professores-count');
    if (countSpan) {
        countSpan.textContent = `${filteredProfessores.length} professor${filteredProfessores.length !== 1 ? 'es' : ''} encontrado${filteredProfessores.length !== 1 ? 's' : ''}`;
    }

    // Renderizar professores filtrados
    renderFilteredProfessores();
}

// Renderizar professores filtrados
function renderFilteredProfessores() {
    const professoresList = document.getElementById('professores-list');
    if (!professoresList) return;
    
    if (filteredProfessores.length === 0) {
        professoresList.innerHTML = '<div class="empty-state">Nenhum professor encontrado com os filtros aplicados</div>';
        return;
    }
    
    professoresList.innerHTML = '';
    filteredProfessores.forEach(professor => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        card.innerHTML = `
            <div class="item-info">
                <h3>${highlightSearchTermProfessores(professor.nome || 'N/A')}</h3>
                <p>${highlightSearchTermProfessores(professor.email || 'N/A')}</p>
                <p>Telefone: ${professor.telefone || 'N/A'}</p>
                <p><strong>Especialidade:</strong> <span class="especialidade-badge">${professor.especialidade || 'N/A'}</span></p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editProfessor('${professor._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteProfessor('${professor._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        professoresList.appendChild(card);
    });
}

// Destacar termo de busca para professores
// Atualizar função renderProfessores original para usar os filtros
function refreshProfessoresDisplay() {
    // Primeiro, resetar filtros para mostrar todos
    if (typeof filteredProfessores === 'undefined') {
        window.filteredProfessores = [];
    }
    filteredProfessores = [...data.professores];
    
    // Popular dropdown de especialidades
    populateEspecialidadeFilter();
    
    // Aplicar filtros atuais (se houver)
    applyProfessoresFilters();
}
// ==================== FIM DO SISTEMA DE BUSCA E FILTROS - PROFESSORES ====================

// ===== SISTEMA DE BUSCA E FILTROS - TREINOS =====

// Configurar sistema de busca para treinos
function setupTreinosSearch() {
    console.log('🔍 Configurando busca de treinos...');
    
    const searchInput = document.getElementById('treinos-search');
    const filterToggle = document.getElementById('treinos-filter-toggle');
    const filtersPanel = document.getElementById('treinos-filters');
    const clearFilters = document.getElementById('treinos-clear-filters');
    const exerciciosMin = document.getElementById('exercicios-min');
    const exerciciosMax = document.getElementById('exercicios-max');
    const professorFilter = document.getElementById('professor-filter');
    const countSpan = document.getElementById('treinos-count');

    console.log('Elementos encontrados:', {
        searchInput: !!searchInput,
        filterToggle: !!filterToggle,
        filtersPanel: !!filtersPanel,
        clearFilters: !!clearFilters,
        exerciciosMin: !!exerciciosMin,
        exerciciosMax: !!exerciciosMax,
        professorFilter: !!professorFilter,
        countSpan: !!countSpan
    });

    if (!searchInput) {
        console.log('❌ Campo de busca de treinos não encontrado');
        return;
    }

    // Toggle dos filtros avançados
    if (filterToggle && filtersPanel) {
        console.log('✅ Configurando toggle de filtros de treinos');
        filterToggle.addEventListener('click', () => {
            console.log('🔥 Toggle de treinos clicado!');
            const isVisible = filtersPanel.style.display !== 'none';
            filtersPanel.style.display = isVisible ? 'none' : 'block';
            filterToggle.innerHTML = isVisible ? 
                '<i class="fas fa-filter"></i> Filtros' : 
                '<i class="fas fa-filter"></i> Ocultar';
            console.log('Panel de treinos agora está:', filtersPanel.style.display);
        });
    } else {
        console.log('❌ Elementos de toggle de treinos não encontrados:', {
            filterToggle: !!filterToggle,
            filtersPanel: !!filtersPanel
        });
    }

    // Limpar filtros
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            searchInput.value = '';
            if (exerciciosMin) exerciciosMin.value = '';
            if (exerciciosMax) exerciciosMax.value = '';
            if (professorFilter) professorFilter.value = '';
            applyTreinosFilters();
        });
    }

    // Event listeners para busca em tempo real
    if (searchInput) {
        searchInput.addEventListener('input', applyTreinosFilters);
    }
    if (exerciciosMin) {
        exerciciosMin.addEventListener('input', applyTreinosFilters);
    }
    if (exerciciosMax) {
        exerciciosMax.addEventListener('input', applyTreinosFilters);
    }
    if (professorFilter) {
        professorFilter.addEventListener('change', applyTreinosFilters);
    }
}

// Popular dropdown de professores para filtro
function populateProfessorFilter() {
    const professorFilter = document.getElementById('professor-filter');
    if (!professorFilter || !data.professores) return;

    // Extrair professores únicos
    const professores = data.professores.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    // Limpar e popular o select
    professorFilter.innerHTML = '<option value="">Todos os professores</option>';
    professores.forEach(professor => {
        const option = document.createElement('option');
        option.value = professor._id;
        option.textContent = professor.nome || 'Professor sem nome';
        professorFilter.appendChild(option);
    });
}

// Aplicar filtros de treinos
function applyTreinosFilters() {
    if (!data.treinos) {
        filteredTreinos = [];
        updateTreinosCount();
        renderFilteredTreinos();
        return;
    }

    const searchTerm = document.getElementById('treinos-search')?.value.toLowerCase() || '';
    const exerciciosMin = parseInt(document.getElementById('exercicios-min')?.value) || 0;
    const exerciciosMax = parseInt(document.getElementById('exercicios-max')?.value) || Infinity;
    const professorId = document.getElementById('professor-filter')?.value || '';

    console.log('🔍 Aplicando filtros de treinos:', { searchTerm, exerciciosMin, exerciciosMax, professorId });    filteredTreinos = data.treinos.filter(treino => {
        // Busca por texto (nome do aluno, professor ou nome do treino)
        let matchesSearch = true;
        if (searchTerm) {
            // Encontrar aluno e professor pelos IDs
            const aluno = data.alunos.find(a => a._id === treino.alunoId) || data.alunos.find(a => a._id === treino.aluno);
            const professor = data.professores.find(p => p._id === treino.professorId) || data.professores.find(p => p._id === treino.professor);
            
            const alunoNome = aluno ? aluno.nome : '';
            const professorNome = professor ? professor.nome : '';
            const treinoNome = treino.nome || '';
            
            matchesSearch = 
                alunoNome.toLowerCase().includes(searchTerm) ||
                professorNome.toLowerCase().includes(searchTerm) ||
                treinoNome.toLowerCase().includes(searchTerm);
        }

        // Filtro por número de exercícios
        const numExercicios = treino.exercicios ? treino.exercicios.length : 0;
        const matchesExercicios = numExercicios >= exerciciosMin && numExercicios <= exerciciosMax;

        // Filtro por professor
        const matchesProfessor = !professorId || treino.professorId === professorId;

        return matchesSearch && matchesExercicios && matchesProfessor;
    });

    console.log(`📊 Treinos filtrados: ${filteredTreinos.length} de ${data.treinos.length}`);
    
    updateTreinosCount();
    renderFilteredTreinos();
}

// Atualizar contador de treinos
function updateTreinosCount() {
    const countSpan = document.getElementById('treinos-count');
    if (countSpan) {
        const total = filteredTreinos.length;
        countSpan.textContent = `${total} treino${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    }
}

// Renderizar treinos filtrados
function renderFilteredTreinos() {
    const treinosList = document.getElementById('treinos-list');
    if (!treinosList) return;
    
    if (filteredTreinos.length === 0) {
        treinosList.innerHTML = '<div class="empty-state">Nenhum treino encontrado com os filtros aplicados</div>';
        return;
    }
    
    treinosList.innerHTML = '';
    
    filteredTreinos.forEach(treino => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        // Encontrar aluno e professor pelos IDs
        const aluno = data.alunos.find(a => a._id === treino.alunoId) || data.alunos.find(a => a._id === treino.aluno);
        const professor = data.professores.find(p => p._id === treino.professorId) || data.professores.find(p => p._id === treino.professor);
        
        const alunoNome = aluno ? aluno.nome : 'Aluno não encontrado';
        const professorNome = professor ? professor.nome : 'Professor não encontrado';
        const numExercicios = treino.exercicios ? treino.exercicios.length : 0;
        
        card.innerHTML = `
            <div class="item-info">
                <h3>${highlightSearchTermTreinos(treino.nome || 'Treino sem nome')}</h3>
                <p><strong>Aluno:</strong> ${highlightSearchTermTreinos(alunoNome)}</p>
                <p><strong>Professor:</strong> ${highlightSearchTermTreinos(professorNome)}</p>
                <p><strong>Exercícios:</strong> <span class="badge badge-info">${numExercicios}</span></p>
                <p><strong>Data:</strong> ${treino.data ? new Date(treino.data).toLocaleDateString('pt-BR') : 'N/A'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editTreino('${treino._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteTreino('${treino._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        treinosList.appendChild(card);
    });
}
