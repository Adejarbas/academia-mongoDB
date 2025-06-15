// Global Data Storage
let data = {
    alunos: [],
    professores: [],
    treinos: [],
    planos: [],
    planosAlunos: []
};

let currentEditId = null;
let currentEditType = null;
let treinoExercicios = []; // Array para armazenar exercícios do treino atual

function checkTokenExpiration() {
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (!lastLoginTime) return true;

    // Verifica se passaram mais de 24 horas desde o último login
    const now = new Date().getTime();
    const loginTime = parseInt(lastLoginTime);
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

    return hoursSinceLogin >= 24;
}

function showError(message, isTokenExpired = false) {
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
    const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://trabalho-mongo-db.vercel.app';
        
    try {
        if (checkTokenExpiration()) {
            throw new Error('Token expirado');
        }

        const token = localStorage.getItem('userToken');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        console.log('Enviando requisição para:', `${baseUrl}/${url}`);
        console.log('Dados:', data);
        
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
    const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://trabalho-mongo-db.vercel.app';
        
    try {
        if (checkTokenExpiration()) {
            throw new Error('Token expirado');
        }

        const token = localStorage.getItem('userToken');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        console.log(`Buscando dados de: ${baseUrl}/${endpoint}`);
        
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
        console.log(`Dados recebidos de ${endpoint}:`, responseData);
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
        console.log('Iniciando carregamento de dados...');
        
        const alunos = await fetchData('api/alunos');
        console.log('Alunos carregados:', alunos);
        data.alunos = alunos || [];
        
        const professores = await fetchData('api/professores');
        console.log('Professores carregados:', professores);
        data.professores = professores || [];
        
        const treinos = await fetchData('api/treinos');
        console.log('Treinos carregados:', treinos);
        data.treinos = treinos || [];        const planos = await fetchData('api/planos');
        console.log('Planos carregados:', planos);
        data.planos = planos || [];
        
        const planosAlunos = await fetchData('api/planos-alunos');
        console.log('Planos-Alunos carregados:', planosAlunos);
        data.planosAlunos = planosAlunos || [];// Atualizar interface
        try { renderAlunos(); } catch (e) { console.error('Erro ao renderizar alunos:', e); }
        try { renderProfessores(); } catch (e) { console.error('Erro ao renderizar professores:', e); }
        try { renderTreinos(); } catch (e) { console.error('Erro ao renderizar treinos:', e); }
        try { renderPlanos(); } catch (e) { console.error('Erro ao renderizar planos:', e); }
        try { renderPlanosAlunos(); } catch (e) { console.error('Erro ao renderizar planos-alunos:', e); }
        try { updateStats(); } catch (e) { console.error('Erro ao atualizar stats:', e); }
          // Popular selects para modais (caso já estejam abertos)
        try { populateSelectProfessores(); } catch (e) { console.error('Erro ao popular select professores:', e); }
        try { populateSelectAlunos(); } catch (e) { console.error('Erro ao popular select alunos:', e); }
          // Configurar sistema de busca após carregar dados
        try { setupAlunosSearch(); } catch (e) { console.error('Erro ao configurar busca de alunos:', e); }
        try { setupProfessoresSearch(); } catch (e) { console.error('Erro ao configurar busca de professores:', e); }
        try { setupPlanosSearch(); } catch (e) { console.error('Erro ao configurar busca de planos:', e); }
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
    console.log('Iniciando aplicação...');
    
    if (checkTokenExpiration()) {
        console.log('Token expirado, redirecionando para login...');
        handleLogout();
        return;
    }

    const token = localStorage.getItem('userToken');
    if (!token) {
        console.log('Token não encontrado, redirecionando para login...');
        window.location.href = 'login.html';
        return;
    }

    try {
        console.log('Usuário logado, mostrando dashboard...');
        showDashboard(); // MOSTRAR O DASHBOARD
        console.log('Iniciando carregamento dos dados...');
        await loadAllData();
        setupEventListeners();
        console.log('Dados carregados com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        const isTokenError = error.message.includes('Token');
        showError('Erro ao carregar dados. Tente novamente mais tarde.', isTokenError);
    }
}

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
        console.error('Erro na inicialização:', error);
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
            } else if (sectionName === 'planos') {
                setTimeout(() => setupPlanosSearch(), 100);
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
    console.log('Renderizando alunos...');
    
    // Inicializar filtros se necessário
    if (filteredAlunos.length === 0 && data.alunos.length > 0) {
        filteredAlunos = [...data.alunos];
    }
    
    // Se temos filtros ativos, usar renderização filtrada
    if (filteredAlunos.length > 0 || data.alunos.length === 0) {
        renderFilteredAlunos();
        return;
    }
    
    // Renderização padrão (fallback)
    const alunosList = document.getElementById('alunos-list');
    if (!alunosList) return;
    
    if (!data.alunos || data.alunos.length === 0) {
        alunosList.innerHTML = '<div class="empty-state">Nenhum aluno encontrado</div>';
        return;
    }
    
    filteredAlunos = [...data.alunos];
    renderFilteredAlunos();
}

function renderProfessores() {
    console.log('Renderizando professores...');
    
    // Inicializar filtros se necessário
    if (filteredProfessores.length === 0 && data.professores.length > 0) {
        filteredProfessores = [...data.professores];
    }
    
    // Se temos filtros ativos, usar renderização filtrada
    if (filteredProfessores.length > 0 || data.professores.length === 0) {
        renderFilteredProfessores();
        return;
    }
    
    // Renderização padrão (fallback)
    const professoresList = document.getElementById('professores-list');
    if (!professoresList) return;
    
    if (!data.professores || data.professores.length === 0) {
        professoresList.innerHTML = '<div class="empty-state">Nenhum professor encontrado</div>';
        return;
    }
    
    filteredProfessores = [...data.professores];
    renderFilteredProfessores();
}
                </button>
            </div>
        `;
        professoresList.appendChild(card);
    });
}

// Atualizar função renderTreinos original para usar os filtros
function renderTreinos() {
    const treinosList = document.getElementById('treinos-list');
    if (!treinosList) return;
    
    if (!data.treinos || data.treinos.length === 0) {
        treinosList.innerHTML = '<div class="empty-state">Nenhum treino encontrado</div>';
        return;
    }

    // Inicializar com todos os treinos
    filteredTreinos = [...data.treinos];
    applyTreinosFilters();
}

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
        const totalAlunos = document.getElementById('total-alunos');
        const totalProfessores = document.getElementById('total-professores');
        const totalTreinos = document.getElementById('total-treinos');
        const totalPlanos = document.getElementById('total-planos');
        
        if (totalAlunos && data.alunos) totalAlunos.textContent = data.alunos.length;
        if (totalProfessores && data.professores) totalProfessores.textContent = data.professores.length;
        if (totalTreinos && data.treinos) totalTreinos.textContent = data.treinos.length;
        if (totalPlanos && data.planos) totalPlanos.textContent = data.planos.length;
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
    
    console.log('Estatísticas atualizadas:', {
        alunos: data.alunos.length,
        professores: data.professores.length,
        treinos: data.treinos.length,
        planos: data.planos.length
    });
}

function setupEventListeners() {
    // Mostrar o dashboard
    showDashboard();
    
    // Configurar navegação
    setupNavigation();
      // Configurar menu mobile
    setupMobileMenu();      // Configurar sistema de busca
    setupAlunosSearch();
    setupProfessoresSearch();
    setupTreinosSearch();
    setupPlanosSearch();
    
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
    
    // Validar formulário
    const validationErrors = validatePlanoForm(formData);
    if (showValidationErrors(validationErrors)) {
        return;
    }
    
    const planoData = {
        nome: formData.get('nome'),
        descricao: formData.get('descricao'), 
        preco: parseFloat(formData.get('preco')) || 0,
        duracaoMeses: parseInt(formData.get('duracaoMeses')) || 0
    };

    try {
        logSystemEvent('plano_form_submit', { editId, nome: planoData.nome });
        
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
            const successMessage = editId ? 'Plano atualizado com sucesso!' : 'Plano cadastrado com sucesso!';
            alert(successMessage);
            
            logSystemEvent('plano_save_success', { editId, nome: planoData.nome });
            
            closeModal('plano-modal');
            form.reset();
            delete form.dataset.editId;
            const titleElement = document.getElementById('plano-modal-title');
            if (titleElement) {
                titleElement.textContent = 'Novo Plano';
            }
            await loadAllData(); // Recarregar dados
        } else {
            const errorData = await response.json();
            const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Erro ao salvar plano';
            
            logSystemEvent('plano_save_error', { error: errorMessage, plano: planoData });
            alert('Erro: ' + errorMessage);
        }
    } catch (error) {
        console.error('Erro ao salvar plano:', error);
        logSystemEvent('plano_save_exception', { error: error.message, plano: planoData });
        alert('Erro ao salvar plano: ' + error.message);
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
        console.log('📊 Renderizando planos dos alunos:', data.planosAlunos);
        
        if (!data.planosAlunos || data.planosAlunos.length === 0) {
            planosAlunosList.innerHTML = '<div class="empty-state">Nenhum plano atribuído ainda</div>';
            return;
        }

        planosAlunosList.innerHTML = '';
        data.planosAlunos.forEach(planoAluno => {
            const card = document.createElement('div');
            card.className = 'plano-aluno-card';
            
            const dataInicio = planoAluno.dataInicio ? new Date(planoAluno.dataInicio).toLocaleDateString('pt-BR') : 'N/A';
            const status = planoAluno.status || 'ATIVO';            card.innerHTML = `
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

let filteredAlunos = []; // Array para armazenar alunos filtrados

// Configurar busca e filtros para alunos
function setupAlunosSearch() {
    console.log('Configurando busca e filtros para alunos...');
    
    const searchInput = document.getElementById('alunos-search');
    const toggleFiltersBtn = document.getElementById('toggle-filters-alunos');
    const filtersPanel = document.getElementById('alunos-filters');
    const aplicarFiltrosBtn = document.getElementById('aplicar-filtros-alunos');
    const limparFiltrosBtn = document.getElementById('limpar-filtros-alunos');
    
    if (!searchInput) {
        console.warn('Campo de busca de alunos não encontrado');
        return;
    }

    // Toggle dos filtros avançados
    if (toggleFiltersBtn && filtersPanel) {
        toggleFiltersBtn.addEventListener('click', () => {
            const isVisible = filtersPanel.style.display !== 'none';
            filtersPanel.style.display = isVisible ? 'none' : 'block';
            toggleFiltersBtn.innerHTML = isVisible ? 
                '<i class="fas fa-filter"></i> Mostrar Filtros' : 
                '<i class="fas fa-filter"></i> Ocultar Filtros';
        });
        console.log('Toggle de filtros configurado');
    }

    // Aplicar filtros
    if (aplicarFiltrosBtn) {
        aplicarFiltrosBtn.addEventListener('click', applyAlunosFilters);
        console.log('Botão aplicar filtros configurado');
    }

    // Limpar filtros
    if (limparFiltrosBtn) {
        limparFiltrosBtn.addEventListener('click', () => {
            console.log('Limpando filtros...');
            searchInput.value = '';
            
            const inputs = [
                'filtro-idade-min', 'filtro-idade-max',
                'filtro-peso-min', 'filtro-peso-max',
                'filtro-email', 'filtro-telefone'
            ];
            
            inputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = '';
            });
            
            applyAlunosFilters();
        });
        console.log('Botão limpar filtros configurado');
    }

    // Event listeners para busca em tempo real no campo principal
    searchInput.addEventListener('input', debounce(applyAlunosFilters, 300));
    
    // Aplicar filtros iniciais
    applyAlunosFilters();
    console.log('Busca de alunos configurada com sucesso');
}

// Debounce function para otimizar performance
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

// Aplicar filtros aos alunos
function applyAlunosFilters() {
    console.log('Aplicando filtros aos alunos...');
    
    const searchTerm = document.getElementById('alunos-search')?.value.toLowerCase() || '';
    const idadeMin = parseInt(document.getElementById('filtro-idade-min')?.value) || 0;
    const idadeMax = parseInt(document.getElementById('filtro-idade-max')?.value) || 200;
    const pesoMin = parseFloat(document.getElementById('filtro-peso-min')?.value) || 0;
    const pesoMax = parseFloat(document.getElementById('filtro-peso-max')?.value) || 1000;
    const emailFilter = document.getElementById('filtro-email')?.value.toLowerCase() || '';
    const telefoneFilter = document.getElementById('filtro-telefone')?.value.toLowerCase() || '';

    console.log('Filtros aplicados:', { searchTerm, idadeMin, idadeMax, pesoMin, pesoMax, emailFilter, telefoneFilter });

    filteredAlunos = data.alunos.filter(aluno => {
        // Busca por nome principal
        const matchesSearch = !searchTerm || 
            (aluno.nome && aluno.nome.toLowerCase().includes(searchTerm)) ||
            (aluno.email && aluno.email.toLowerCase().includes(searchTerm)) ||
            (aluno.telefone && aluno.telefone.toLowerCase().includes(searchTerm));

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

        // Filtros avançados
        const matchesIdade = idade >= idadeMin && idade <= idadeMax;
        const peso = parseFloat(aluno.peso) || 0;
        const matchesPeso = peso >= pesoMin && peso <= pesoMax;
        const matchesEmail = !emailFilter || 
            (aluno.email && aluno.email.toLowerCase().includes(emailFilter));
        const matchesTelefone = !telefoneFilter || 
            (aluno.telefone && aluno.telefone.toLowerCase().includes(telefoneFilter));

        return matchesSearch && matchesIdade && matchesPeso && matchesEmail && matchesTelefone;
    });

    console.log(`${filteredAlunos.length} alunos encontrados após filtros`);
    
    // Renderizar alunos filtrados
    renderFilteredAlunos();
}

// Renderizar alunos filtrados
function renderFilteredAlunos() {
    const alunosList = document.getElementById('alunos-list');
    if (!alunosList) return;
    
    if (filteredAlunos.length === 0) {
        alunosList.innerHTML = '<div class="empty-state">Nenhum aluno encontrado com os filtros aplicados</div>';
        return;
    }
    
    alunosList.innerHTML = '';
    filteredAlunos.forEach(aluno => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        // Calcular idade
        let idade = 'N/A';
        if (aluno.dataNascimento) {
            const nascimento = new Date(aluno.dataNascimento);
            const hoje = new Date();
            let idadeNum = hoje.getFullYear() - nascimento.getFullYear();
            const mes = hoje.getMonth() - nascimento.getMonth();
            if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
                idadeNum--;
            }
            idade = idadeNum + ' anos';
        }
        
        card.innerHTML = `
            <div class="item-info">
                <h3>${aluno.nome || 'N/A'}</h3>
                <p><i class="fas fa-envelope"></i> ${aluno.email || 'N/A'}</p>
                <p><i class="fas fa-phone"></i> ${aluno.telefone || 'N/A'}</p>
                <p><i class="fas fa-birthday-cake"></i> ${idade}</p>
                <p><i class="fas fa-weight"></i> ${aluno.peso || 'N/A'}kg</p>
                <p><i class="fas fa-calendar"></i> ${aluno.dataNascimento ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editAluno('${aluno._id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteAluno('${aluno._id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        alunosList.appendChild(card);
    });
    
    // Atualizar título da seção com contador
    const sectionHeader = document.querySelector('#alunos-section .section-header h2');
    if (sectionHeader) {
        const total = data.alunos.length;
        const filtered = filteredAlunos.length;
        if (total === filtered) {
            sectionHeader.textContent = `Gerenciar Alunos (${total})`;
        } else {
            sectionHeader.textContent = `Gerenciar Alunos (${filtered}/${total})`;
        }
    }
}
                <h3>${highlightSearchTerm(aluno.nome || 'N/A')}</h3>
                <p>${highlightSearchTerm(aluno.email || 'N/A')}</p>
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
function highlightSearchTerm(text) {
    const searchTerm = document.getElementById('alunos-search')?.value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Atualizar função renderAlunos original para usar os filtros
function renderAlunos() {
    // Primeiro, resetar filtros para mostrar todos
    filteredAlunos = [...data.alunos];
    
    // Aplicar filtros atuais (se houver)
    applyAlunosFilters();
}
// ==================== FIM DO SISTEMA DE BUSCA E FILTROS - ALUNOS ====================

// ==================== SISTEMA DE BUSCA E FILTROS - PROFESSORES ====================

let filteredProfessores = []; // Array para armazenar professores filtrados

// ==================== SISTEMA DE BUSCA E FILTROS - PROFESSORES ====================

let filteredProfessores = []; // Array para armazenar professores filtrados

// Configurar busca e filtros para professores
function setupProfessoresSearch() {
    console.log('Configurando busca e filtros para professores...');
    
    const searchInput = document.getElementById('professores-search');
    const toggleFiltersBtn = document.getElementById('toggle-filters-professores');
    const filtersPanel = document.getElementById('professores-filters');
    const aplicarFiltrosBtn = document.getElementById('aplicar-filtros-professores');
    const limparFiltrosBtn = document.getElementById('limpar-filtros-professores');
    
    if (!searchInput) {
        console.warn('Campo de busca de professores não encontrado');
        return;
    }

    // Toggle dos filtros avançados
    if (toggleFiltersBtn && filtersPanel) {
        toggleFiltersBtn.addEventListener('click', () => {
            const isVisible = filtersPanel.style.display !== 'none';
            filtersPanel.style.display = isVisible ? 'none' : 'block';
            toggleFiltersBtn.innerHTML = isVisible ? 
                '<i class="fas fa-filter"></i> Mostrar Filtros' : 
                '<i class="fas fa-filter"></i> Ocultar Filtros';
        });
        console.log('Toggle de filtros configurado');
    }

    // Aplicar filtros
    if (aplicarFiltrosBtn) {
        aplicarFiltrosBtn.addEventListener('click', applyProfessoresFilters);
        console.log('Botão aplicar filtros configurado');
    }

    // Limpar filtros
    if (limparFiltrosBtn) {
        limparFiltrosBtn.addEventListener('click', () => {
            console.log('Limpando filtros de professores...');
            searchInput.value = '';
            
            const inputs = [
                'filtro-prof-especialidade', 'filtro-prof-email',
                'filtro-prof-telefone', 'filtro-prof-nome'
            ];
            
            inputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = '';
            });
            
            applyProfessoresFilters();
        });
        console.log('Botão limpar filtros configurado');
    }

    // Event listeners para busca em tempo real no campo principal
    searchInput.addEventListener('input', debounce(applyProfessoresFilters, 300));
    
    // Aplicar filtros iniciais
    applyProfessoresFilters();
    console.log('Busca de professores configurada com sucesso');
}

// Aplicar filtros aos professores
function applyProfessoresFilters() {
    console.log('Aplicando filtros aos professores...');
    
    const searchTerm = document.getElementById('professores-search')?.value.toLowerCase() || '';
    const especialidadeFilter = document.getElementById('filtro-prof-especialidade')?.value.toLowerCase() || '';
    const emailFilter = document.getElementById('filtro-prof-email')?.value.toLowerCase() || '';
    const telefoneFilter = document.getElementById('filtro-prof-telefone')?.value.toLowerCase() || '';
    const nomeFilter = document.getElementById('filtro-prof-nome')?.value.toLowerCase() || '';

    console.log('Filtros aplicados:', { searchTerm, especialidadeFilter, emailFilter, telefoneFilter, nomeFilter });

    filteredProfessores = data.professores.filter(professor => {
        // Busca principal
        const matchesSearch = !searchTerm || 
            (professor.nome && professor.nome.toLowerCase().includes(searchTerm)) ||
            (professor.email && professor.email.toLowerCase().includes(searchTerm)) ||
            (professor.especialidade && professor.especialidade.toLowerCase().includes(searchTerm));

        // Filtros avançados
        const matchesEspecialidade = !especialidadeFilter || 
            (professor.especialidade && professor.especialidade.toLowerCase().includes(especialidadeFilter));
        const matchesEmail = !emailFilter || 
            (professor.email && professor.email.toLowerCase().includes(emailFilter));
        const matchesTelefone = !telefoneFilter || 
            (professor.telefone && professor.telefone.toLowerCase().includes(telefoneFilter));
        const matchesNome = !nomeFilter || 
            (professor.nome && professor.nome.toLowerCase().includes(nomeFilter));

        return matchesSearch && matchesEspecialidade && matchesEmail && matchesTelefone && matchesNome;
    });

    console.log(`${filteredProfessores.length} professores encontrados após filtros`);
    
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
                <h3>${professor.nome || 'N/A'}</h3>
                <p><i class="fas fa-envelope"></i> ${professor.email || 'N/A'}</p>
                <p><i class="fas fa-graduation-cap"></i> ${professor.especialidade || 'N/A'}</p>
                <p><i class="fas fa-phone"></i> ${professor.telefone || 'N/A'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editProfessor('${professor._id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteProfessor('${professor._id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        professoresList.appendChild(card);
    });
    
    // Atualizar título da seção com contador
    const sectionHeader = document.querySelector('#professores-section .section-header h2');
    if (sectionHeader) {
        const total = data.professores.length;
        const filtered = filteredProfessores.length;
        if (total === filtered) {
            sectionHeader.textContent = `Gerenciar Professores (${total})`;
        } else {
            sectionHeader.textContent = `Gerenciar Professores (${filtered}/${total})`;
        }
    }
}
        });
    }

    // Event listeners para busca em tempo real
    if (searchInput) {
        searchInput.addEventListener('input', applyProfessoresFilters);
    }
    if (especialidadeFilter) {
        especialidadeFilter.addEventListener('change', applyProfessoresFilters);
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
    const especialidadeSelecionada = document.getElementById('especialidade-filter')?.value || '';

    filteredProfessores = data.professores.filter(professor => {
        // Busca por nome e email
        const matchesSearch = !searchTerm || 
            (professor.nome && professor.nome.toLowerCase().includes(searchTerm)) ||
            (professor.email && professor.email.toLowerCase().includes(searchTerm));

        // Filtro por especialidade
        const matchesEspecialidade = !especialidadeSelecionada || 
            (professor.especialidade && professor.especialidade === especialidadeSelecionada);

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
function highlightSearchTermProfessores(text) {
    const searchTerm = document.getElementById('professores-search')?.value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Atualizar função renderProfessores original para usar os filtros
function renderProfessores() {
    // Primeiro, resetar filtros para mostrar todos
    filteredProfessores = [...data.professores];
    
    // Popular dropdown de especialidades
    populateEspecialidadeFilter();
    
    // Aplicar filtros atuais (se houver)
    applyProfessoresFilters();
}
// ==================== FIM DO SISTEMA DE BUSCA E FILTROS - PROFESSORES ====================

// ===== SISTEMA DE BUSCA E FILTROS - TREINOS =====
let filteredTreinos = [];

// Configurar sistema de busca simples para treinos
function setupTreinosSearch() {
    const searchInput = document.getElementById('treinos-search');
    
    if (!searchInput) {
        return;
    }

    // Event listener para busca em tempo real
    searchInput.addEventListener('input', applyTreinosFilters);
}


// Aplicar filtros de treinos
// Aplicar busca simples de treinos por nome
function applyTreinosFilters() {
    if (!data.treinos) {
        filteredTreinos = [];
        renderFilteredTreinos();
        return;
    }

    const searchTerm = document.getElementById('treinos-search')?.value.toLowerCase() || '';

    filteredTreinos = data.treinos.filter(treino => {
        // Busca apenas por nome do treino
        const matchesSearch = !searchTerm || 
            (treino.nome && treino.nome.toLowerCase().includes(searchTerm));

        return matchesSearch;
    });

    renderFilteredTreinos();
}



// Renderizar treinos filtrados
function renderFilteredTreinos() {
    const treinosList = document.getElementById('treinos-list');
    if (!treinosList) return;
    
    if (filteredTreinos.length === 0) {
        treinosList.innerHTML = '<div class="empty-state">Nenhum treino encontrado com os filtros aplicados</div>';
        return;
    }
    
    treinosList.innerHTML = '';    filteredTreinos.forEach(treino => {
        // Encontrar nomes do professor e aluno (como na versão original)
        const professor = data.professores.find(p => p._id === treino.professor);
        const aluno = data.alunos.find(a => a._id === treino.aluno);
        
        // Preparar lista de exercícios (como na versão original)
        const exerciciosText = treino.exercicios && treino.exercicios.length > 0 
            ? `${treino.exercicios.length} exercício(s): ${treino.exercicios.slice(0, 3).join(', ')}${treino.exercicios.length > 3 ? '...' : ''}`
            : 'Nenhum exercício adicionado';
        
        const card = document.createElement('div');
        card.className = 'item-card';
        
        card.innerHTML = `
            <div class="item-info">
                <h3>${highlightSearchTermTreinos(treino.nome || 'N/A')}</h3>
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
}

// Destacar termo de busca para treinos
function highlightSearchTermTreinos(text) {
    const searchTerm = document.getElementById('treinos-search')?.value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// ===== FUNÇÕES AUXILIARES PARA TREINOS =====

// Buscar nome do aluno por ID
function getAlunoName(alunoId) {
    if (!alunoId || !data.alunos) return null;
    const aluno = data.alunos.find(a => a._id === alunoId);
    return aluno ? aluno.nome : null;
}

// Buscar nome do professor por ID
function getProfessorName(professorId) {
    if (!professorId || !data.professores) return null;
    const professor = data.professores.find(p => p._id === professorId);
    return professor ? professor.nome : null;
}

// ===== SISTEMA DE BUSCA E FILTROS PARA PLANOS DOS ALUNOS =====

let filteredPlanosAlunos = [];

// Configurar sistema de busca e filtros para planos dos alunos
function setupPlanosSearch() {    const searchInput = document.getElementById('planos-search');
    const filterBtn = document.getElementById('planos-filter-toggle');
    const filtersPanel = document.getElementById('planos-filters');
    const clearBtn = document.getElementById('planos-clear-filters');
    
    if (!searchInput) {
        return;
    }

    // Event listeners para busca em tempo real
    searchInput.addEventListener('input', applyPlanosFilters);
    
    // Event listener para botão de filtros (igual aos outros)
    if (filterBtn && filtersPanel) {
        filterBtn.addEventListener('click', () => {
            if (filtersPanel.style.display === 'none' || filtersPanel.style.display === '') {
                filtersPanel.style.display = 'block';
            } else {
                filtersPanel.style.display = 'none';
            }
        });
    }
    
    // Event listeners para filtros avançados
    const filterInputs = ['preco-min', 'preco-max', 'duracao-min', 'duracao-max', 'status-filter'];
    filterInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', applyPlanosFilters);
            input.addEventListener('change', applyPlanosFilters);
        }
    });
    
    // Event listener para limpar filtros
    if (clearBtn) {
        clearBtn.addEventListener('click', clearPlanosFilters);
    }
    
    // Aplicar filtros inicial
    applyPlanosFilters();
}

// Aplicar filtros de planos dos alunos
function applyPlanosFilters() {
    if (!data.planosAlunos) {
        filteredPlanosAlunos = [];
        renderFilteredPlanosAlunos();
        updatePlanosResultsCount();
        return;
    }

    const searchTerm = document.getElementById('planos-search')?.value.toLowerCase() || '';
    const precoMin = parseFloat(document.getElementById('preco-min')?.value) || 0;
    const precoMax = parseFloat(document.getElementById('preco-max')?.value) || Infinity;
    const duracaoMin = parseInt(document.getElementById('duracao-min')?.value) || 0;
    const duracaoMax = parseInt(document.getElementById('duracao-max')?.value) || Infinity;
    const statusFilter = document.getElementById('status-filter')?.value || '';

    filteredPlanosAlunos = data.planosAlunos.filter(planoAluno => {
        // Busca por nome do aluno ou nome do plano
        const nomeAluno = planoAluno.alunoInfo?.nome?.toLowerCase() || '';
        const nomePlano = planoAluno.planoInfo?.nome?.toLowerCase() || '';
        const matchesSearch = !searchTerm || 
            nomeAluno.includes(searchTerm) || 
            nomePlano.includes(searchTerm);

        // Filtro por preço
        const planoPreco = parseFloat(planoAluno.planoInfo?.preco) || 0;
        const matchesPreco = planoPreco >= precoMin && planoPreco <= precoMax;
        
        // Filtro por duração
        const planoDuracao = parseInt(planoAluno.planoInfo?.duracaoMeses) || 0;
        const matchesDuracao = planoDuracao >= duracaoMin && planoDuracao <= duracaoMax;

        // Filtro por status
        const planoStatus = planoAluno.status || 'ATIVO';
        const matchesStatus = !statusFilter || planoStatus === statusFilter;

        return matchesSearch && matchesPreco && matchesDuracao && matchesStatus;
    });

    renderFilteredPlanosAlunos();
    updatePlanosResultsCount();
}

// Renderizar planos dos alunos filtrados
function renderFilteredPlanosAlunos() {
    const planosAlunosList = document.getElementById('planos-alunos-list');
    if (!planosAlunosList) return;
    
    if (filteredPlanosAlunos.length === 0) {
        planosAlunosList.innerHTML = '<div class="empty-state">Nenhum plano encontrado com os filtros aplicados</div>';
        return;
    }
    
    planosAlunosList.innerHTML = '';
    filteredPlanosAlunos.forEach(planoAluno => {
        const card = document.createElement('div');
        card.className = 'plano-aluno-card';
        
        const dataInicio = planoAluno.dataInicio ? new Date(planoAluno.dataInicio).toLocaleDateString('pt-BR') : 'N/A';
        const status = planoAluno.status || 'ATIVO';
        
        card.innerHTML = `
            <div class="plano-aluno-info">
                <h3>${highlightSearchTermPlanos(planoAluno.alunoInfo?.nome || 'N/A')}</h3>
                <p><strong>Plano:</strong> ${highlightSearchTermPlanos(planoAluno.planoInfo?.nome || 'N/A')}</p>
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
}

// Atualizar contador de resultados de planos dos alunos
function updatePlanosResultsCount() {
    const resultsCount = document.getElementById('planos-results-count');
    if (resultsCount) {
        const count = filteredPlanosAlunos.length;
        resultsCount.textContent = `${count} resultado${count !== 1 ? 's' : ''}`;
    }
}

// Limpar filtros de planos dos alunos
function clearPlanosFilters() {
    // Limpar campos de busca e filtros
    document.getElementById('planos-search').value = '';
    document.getElementById('preco-min').value = '';
    document.getElementById('preco-max').value = '';
    document.getElementById('duracao-min').value = '';
    document.getElementById('duracao-max').value = '';
    document.getElementById('status-filter').value = '';
    
    // Reaplicar filtros (que agora estarão limpos)
    applyPlanosFilters();
}

// Destacar termo de busca para planos dos alunos
function highlightSearchTermPlanos(text) {
    const searchTerm = document.getElementById('planos-search')?.value;
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// ===== FUNÇÕES DE VALIDAÇÃO FRONTEND =====

// Validar email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar telefone (10 ou 11 dígitos)
function validatePhone(phone) {
    const phoneRegex = /^\d{10,11}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Validar CPF (básico)
function validateCPF(cpf) {
    const cpfRegex = /^\d{11}$/;
    return cpfRegex.test(cpf.replace(/\D/g, ''));
}

// Validar preço
function validatePrice(price) {
    return !isNaN(price) && parseFloat(price) >= 0;
}

// Validar campos obrigatórios
function validateRequiredFields(formData, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!formData.get(field) || formData.get(field).trim() === '') {
            errors.push(`O campo ${field} é obrigatório`);
        }
    });
    
    return errors;
}

// Mostrar erros de validação
function showValidationErrors(errors) {
    if (errors.length === 0) return false;
    
    const errorMessage = errors.join('\n');
    alert('Erros de validação:\n\n' + errorMessage);
    return true;
}

// Validar formulário de aluno
function validateAlunoForm(formData) {
    const errors = [];
    
    // Campos obrigatórios
    const requiredFields = ['nome', 'email', 'telefone', 'dataNascimento', 'peso'];
    errors.push(...validateRequiredFields(formData, requiredFields));
    
    // Validar email
    const email = formData.get('email');
    if (email && !validateEmail(email)) {
        errors.push('Email inválido');
    }
    
    // Validar telefone
    const telefone = formData.get('telefone');
    if (telefone && !validatePhone(telefone)) {
        errors.push('Telefone deve ter 10 ou 11 dígitos');
    }
    
    // Validar peso
    const peso = formData.get('peso');
    if (peso && !validatePrice(peso)) {
        errors.push('Peso deve ser um número positivo');
    }
    
    return errors;
}

// Validar formulário de plano
function validatePlanoForm(formData) {
    const errors = [];
    
    // Campos obrigatórios
    const requiredFields = ['nome', 'preco', 'duracaoMeses'];
    errors.push(...validateRequiredFields(formData, requiredFields));
    
    // Validar preço
    const preco = formData.get('preco');
    if (preco && !validatePrice(preco)) {
        errors.push('Preço deve ser um número positivo');
    }
    
    // Validar duração
    const duracao = formData.get('duracaoMeses');
    if (duracao && (isNaN(duracao) || parseInt(duracao) <= 0)) {
        errors.push('Duração deve ser um número positivo');
    }
    
    return errors;
}

// Formatar moeda brasileira
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Formatar data brasileira
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Formatar telefone brasileiro
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
}

// Debounce para busca
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

// ===== UTILITÁRIOS DE SISTEMA =====

// Verificar se o sistema está funcionando
async function checkSystemHealth() {
    try {
        const response = await fetch('/api/status/health');
        const data = await response.json();
        
        if (data.status === 'OK') {
            console.log('✅ Sistema funcionando normalmente');
            return true;
        } else {
            console.error('❌ Sistema com problemas:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao verificar sistema:', error);
        return false;
    }
}

// Verificar conectividade
function checkConnectivity() {
    return navigator.onLine;
}

// Logs do sistema
function logSystemEvent(event, details = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        event,
        details,
        user: localStorage.getItem('userName') || 'unknown'
    };
    
    console.log('📊 SYSTEM LOG:', logEntry);
    
    // Salvar logs localmente para debug
    const logs = JSON.parse(localStorage.getItem('systemLogs') || '[]');
    logs.push(logEntry);
    
    // Manter apenas os últimos 100 logs
    if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('systemLogs', JSON.stringify(logs));
}

// Verificar sistema ao carregar
document.addEventListener('DOMContentLoaded', () => {
    checkSystemHealth();
    logSystemEvent('system_loaded');
});

// Verificar conectividade
window.addEventListener('online', () => {
    logSystemEvent('connectivity_restored');
    console.log('🌐 Conectividade restaurada');
});

window.addEventListener('offline', () => {
    logSystemEvent('connectivity_lost');
    console.log('🚫 Conectividade perdida');
});

console.log('🚀 Sistema Multi-Tenant Academia carregado com sucesso!');
console.log('📊 Logs disponíveis em localStorage.getItem("systemLogs")');
console.log('🧪 Página de teste: /test.html');
