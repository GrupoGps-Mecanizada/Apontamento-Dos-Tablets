/**
 * APLICAÇÃO PRINCIPAL DO SISTEMA DE MONITORAMENTO USIMINAS
 * Arquivo: /js/app.js
 * 
 * Coordena todo o funcionamento do sistema
 */

class SistemaMonitoramento {
    constructor() {
        // Estados principais
        this.equipamentos = new Map();
        this.motoristas = new Map();
        this.contatos = new Map();
        this.filtros = {
            tipo: 'TODOS',
            status: 'TODOS'
        };
        
        // Controles de estado
        this.isLoading = false;
        this.ultimaAtualizacao = null;
        this.autoUpdateInterval = null;
        
        // Elementos DOM principais
        this.elements = {};
        
        // Inicializar sistema
        this.init();
    }

    /**
     * Inicialização do sistema
     */
    async init() {
        try {
            this.log('🚀 Iniciando Sistema de Monitoramento Usiminas...');
            
            // Verificar dependências
            this.checkDependencies();
            
            // Configurar elementos DOM
            this.setupDOMElements();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Carregar dados salvos
            this.loadSavedData();
            
            // Carregar dados dos equipamentos
            await this.loadEquipmentData();
            
            // Configurar auto-update
            this.setupAutoUpdate();
            
            // Atualizar interface
            this.updateInterface();
            
            // Atualizar data atual
            this.updateCurrentDate();
            
            this.log('✅ Sistema inicializado com sucesso!');
            
        } catch (error) {
            this.logError('❌ Erro na inicialização:', error);
            this.showError('Erro ao inicializar o sistema: ' + error.message);
        }
    }

    /**
     * Verificar se todas as dependências estão carregadas
     */
    checkDependencies() {
        const required = ['CONFIG', 'EQUIPAMENTOS_BASE', 'EquipmentManager', 'MotoristaManager'];
        const missing = required.filter(dep => typeof window[dep] === 'undefined');
        
        if (missing.length > 0) {
            throw new Error(`Dependências não carregadas: ${missing.join(', ')}`);
        }
    }

    /**
     * Configurar referências aos elementos DOM
     */
    setupDOMElements() {
        this.elements = {
            // Containers principais
            equipamentosContainer: document.getElementById('equipamentos-container'),
            loading: document.getElementById('loading'),
            
            // Header
            dataAtual: document.getElementById('data-atual'),
            btnAtualizar: document.getElementById('btn-atualizar'),
            btnMotoristas: document.getElementById('btn-motoristas'),
            
            // Filtros
            filtroTipo: document.getElementById('filtro-tipo'),
            filtroStatus: document.getElementById('filtro-status'),
            resumoStatus: document.getElementById('resumo-status'),
            
            // Modais
            modalMotoristas: document.getElementById('modal-motoristas'),
            modalContato: document.getElementById('modal-contato'),
            
            // Formulários
            motoristaVaga: document.getElementById('motorista-vaga'),
            motoristaNome: document.getElementById('motorista-nome'),
            motoristaTelefone: document.getElementById('motorista-telefone'),
            motoristaRadio: document.getElementById('motorista-radio'),
            motoristasLista: document.getElementById('motoristas-lista')
        };
        
        // Verificar se todos os elementos foram encontrados
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                this.logWarn(`⚠️ Elemento não encontrado: ${key}`);
            }
        });
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botões do header
        if (this.elements.btnAtualizar) {
            this.elements.btnAtualizar.addEventListener('click', () => {
                this.refreshData();
            });
        }
        
        if (this.elements.btnMotoristas) {
            this.elements.btnMotoristas.addEventListener('click', () => {
                this.openMotoristaModal();
            });
        }
        
        // Filtros
        if (this.elements.filtroTipo) {
            this.elements.filtroTipo.addEventListener('change', (e) => {
                this.filtros.tipo = e.target.value;
                this.updateInterface();
            });
        }
        
        if (this.elements.filtroStatus) {
            this.elements.filtroStatus.addEventListener('change', (e) => {
                this.filtros.status = e.target.value;
                this.updateInterface();
            });
        }
        
        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Clique fora dos modais para fechar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
        
        // Auto-format telefone
        if (this.elements.motoristaTelefone) {
            this.elements.motoristaTelefone.addEventListener('input', (e) => {
                if (CONFIG.AUTO_PHONE_FORMAT) {
                    e.target.value = this.formatPhone(e.target.value);
                }
            });
        }
        
        // Prevenir reload acidental
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    /**
     * Atalhos de teclado
     */
    handleKeyboardShortcuts(e) {
        // F5 ou Ctrl+R - Atualizar dados
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            this.refreshData();
        }
        
        // Ctrl+M - Abrir modal de motoristas
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            this.openMotoristaModal();
        }
        
        // Escape - Fechar modais
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
        
        // Ctrl+Shift+D - Toggle dados simulados (debug)
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            CONFIG.USE_MOCK_DATA = !CONFIG.USE_MOCK_DATA;
            this.log(`🎭 Dados simulados: ${CONFIG.USE_MOCK_DATA ? 'ATIVADO' : 'DESATIVADO'}`);
            this.refreshData();
        }
    }

    /**
     * Carregar dados salvos do localStorage
     */
    loadSavedData() {
        try {
            // Carregar motoristas
            const motoristasData = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'motoristas');
            if (motoristasData) {
                const motoristas = JSON.parse(motoristasData);
                Object.entries(motoristas).forEach(([vaga, data]) => {
                    this.motoristas.set(vaga, data);
                });
                this.log(`📋 ${this.motoristas.size} motoristas carregados`);
            }
            
            // Carregar contatos
            const contatosData = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'contatos');
            if (contatosData) {
                const contatos = JSON.parse(contatosData);
                Object.entries(contatos).forEach(([id, data]) => {
                    this.contatos.set(id, data);
                });
                this.log(`📞 ${this.contatos.size} contatos carregados`);
            }
            
            // Carregar filtros
            const filtrosData = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'filtros');
            if (filtrosData) {
                this.filtros = { ...this.filtros, ...JSON.parse(filtrosData) };
                this.applyFilters();
            }
            
        } catch (error) {
            this.logWarn('⚠️ Erro ao carregar dados salvos:', error);
        }
    }

    /**
     * Salvar dados no localStorage
     */
    saveData() {
        if (!CONFIG.AUTO_SAVE) return;
        
        try {
            // Salvar motoristas
            const motoristasObj = Object.fromEntries(this.motoristas);
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'motoristas', JSON.stringify(motoristasObj));
            
            // Salvar contatos
            const contatosObj = Object.fromEntries(this.contatos);
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'contatos', JSON.stringify(contatosObj));
            
            // Salvar filtros
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'filtros', JSON.stringify(this.filtros));
            
        } catch (error) {
            this.logWarn('⚠️ Erro ao salvar dados:', error);
        }
    }

    /**
     * Carregar dados dos equipamentos
     */
    async loadEquipmentData() {
        this.showLoading(true);
        
        try {
            let equipmentData;
            
            if (CONFIG.USE_MOCK_DATA) {
                equipmentData = this.loadMockData();
                this.log('🎭 Usando dados simulados');
            } else {
                equipmentData = await this.loadRealData();
                this.log('📡 Dados carregados da API');
            }
            
            this.processEquipmentData(equipmentData);
            this.ultimaAtualizacao = new Date();
            
        } catch (error) {
            this.logError('❌ Erro ao carregar dados dos equipamentos:', error);
            this.showError('Erro ao carregar dados: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Carregar dados simulados
     */
    loadMockData() {
        return DADOS_SIMULADOS.equipamentos;
    }

    /**
     * Carregar dados reais da API
     */
    async loadRealData() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data.equipamentos || {};
            
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Timeout: Requisição demorou muito para responder');
            }
            throw error;
        }
    }

    /**
     * Processar dados dos equipamentos
     */
    processEquipmentData(data) {
        // Limpar dados anteriores
        this.equipamentos.clear();
        
        // Processar cada equipamento base
        EQUIPAMENTOS_BASE.lista.forEach(equipBase => {
            const equipData = data[equipBase.codigo] || {};
            
            const equipment = {
                ...equipBase,
                primeiroRegistro: equipData.primeiroRegistro || null,
                status: this.determineStatus(equipData),
                totalApontamentos: equipData.totalApontamentos || 0,
                apontamentos: equipData.apontamentos || [],
                motorista: this.motoristas.get(equipBase.codigo) || null,
                ultimoContato: this.getLastContact(equipBase.codigo)
            };
            
            this.equipamentos.set(equipBase.codigo, equipment);
        });
        
        this.log(`📊 ${this.equipamentos.size} equipamentos processados`);
    }

    /**
     * Determinar status do equipamento
     */
    determineStatus(equipData) {
        if (!equipData.primeiroRegistro) {
            return 'CRITICO';
        }
        
        if (equipData.totalApontamentos <= 2) {
            return 'POUCOS';
        }
        
        const primeiroHora = equipData.primeiroRegistro;
        const horaLimite = CONFIG.HORA_LIMITE_NORMAL;
        const horaCritico = CONFIG.HORA_LIMITE_CRITICO;
        
        if (primeiroHora > horaCritico) {
            return 'CRITICO';
        }
        
        if (primeiroHora > horaLimite) {
            return 'TARDIO';
        }
        
        return 'OK';
    }

    /**
     * Obter último contato do equipamento
     */
    getLastContact(vaga) {
        const contatos = Array.from(this.contatos.values())
            .filter(c => c.vaga === vaga)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return contatos[0] || null;
    }

    /**
     * Atualizar interface completa
     */
    updateInterface() {
        this.updateEquipmentDisplay();
        this.updateStatusSummary();
        this.updateFiltersState();
        this.updateMotoristasList();
    }

    /**
     * Atualizar exibição dos equipamentos
     */
    updateEquipmentDisplay() {
        if (!this.elements.equipamentosContainer) return;
        
        const filteredEquipments = this.getFilteredEquipments();
        const groupedEquipments = this.groupEquipmentsByType(filteredEquipments);
        
        this.elements.equipamentosContainer.innerHTML = '';
        
        Object.entries(groupedEquipments).forEach(([tipo, equipments]) => {
            if (equipments.length === 0) return;
            
            const section = this.createTypeSection(tipo, equipments);
            this.elements.equipamentosContainer.appendChild(section);
        });
    }

    /**
     * Obter equipamentos filtrados
     */
    getFilteredEquipments() {
        let filtered = Array.from(this.equipamentos.values());
        
        // Filtro por tipo
        if (this.filtros.tipo !== 'TODOS') {
            filtered = filtered.filter(eq => eq.tipo === this.filtros.tipo);
        }
        
        // Filtro por status
        if (this.filtros.status !== 'TODOS') {
            filtered = filtered.filter(eq => eq.status === this.filtros.status);
        }
        
        return filtered;
    }

    /**
     * Agrupar equipamentos por tipo
     */
    groupEquipmentsByType(equipments) {
        const groups = {};
        
        equipments.forEach(eq => {
            if (!groups[eq.tipo]) {
                groups[eq.tipo] = [];
            }
            groups[eq.tipo].push(eq);
        });
        
        // Ordenar equipamentos dentro de cada grupo
        Object.keys(groups).forEach(tipo => {
            groups[tipo].sort((a, b) => a.codigo.localeCompare(b.codigo));
        });
        
        return groups;
    }

    /**
     * Criar seção de tipo de equipamento
     */
    createTypeSection(tipo, equipments) {
        const section = document.createElement('div');
        section.className = 'categoria-section';
        
        const categoria = EQUIPAMENTOS_BASE.categorias[tipo];
        const title = document.createElement('h3');
        title.className = 'categoria-title';
        title.innerHTML = `
            <i class="${categoria.icon}"></i>
            ${categoria.nome} (${equipments.length} equipamentos)
        `;
        
        section.appendChild(title);
        
        equipments.forEach(equipment => {
            const card = this.createEquipmentCard(equipment);
            section.appendChild(card);
        });
        
        return section;
    }

    /**
     * Criar card de equipamento
     */
    createEquipmentCard(equipment) {
        const card = document.createElement('div');
        card.className = 'equipamento-card';
        card.dataset.vaga = equipment.codigo;
        
        const statusConfig = STATUS_CONFIG.tipos[equipment.status];
        
        card.innerHTML = `
            <div class="equipamento-header">
                <div class="equipamento-info">
                    <div class="equipamento-vaga">${equipment.codigo}</div>
                    <div class="equipamento-placa">${equipment.placa}</div>
                    <div class="equipamento-apontamentos">${equipment.totalApontamentos} apontamentos</div>
                </div>
                <div class="equipamento-status">
                    <div class="status-badge ${equipment.status.toLowerCase()}">
                        <i class="${statusConfig.icon}"></i>
                        ${statusConfig.label}
                    </div>
                    ${equipment.motorista ? `
                        <div class="motorista-info">
                            <i class="fas fa-user"></i>
                            ${equipment.motorista.nome}
                        </div>
                    ` : ''}
                    <div class="equipamento-actions">
                        <button class="btn btn-sm btn-primary" onclick="sistema.openContatoModal('${equipment.codigo}')">
                            <i class="fas fa-phone"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="sistema.editMotorista('${equipment.codigo}')">
                            <i class="fas fa-user-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
            ${this.createApontamentosTable(equipment)}
        `;
        
        return card;
    }

    /**
     * Criar tabela de apontamentos
     */
    createApontamentosTable(equipment) {
        if (!equipment.apontamentos || equipment.apontamentos.length === 0) {
            return `
                <div class="apontamentos-tabela">
                    <div style="padding: 20px; text-align: center; color: var(--text-muted);">
                        <i class="fas fa-info-circle"></i>
                        Nenhum apontamento registrado
                    </div>
                </div>
            `;
        }
        
        const rows = equipment.apontamentos.map(apt => {
            const tempoClass = this.getTempoClass(apt.tempo);
            return `
                <tr>
                    <td>${equipment.codigo}</td>
                    <td>${apt.categoria}</td>
                    <td>${equipment.primeiroRegistro || '-'}</td>
                    <td>${apt.inicio}</td>
                    <td>${apt.fim}</td>
                    <td class="tempo-cell ${tempoClass}">${apt.tempo}</td>
                </tr>
            `;
        }).join('');
        
        return `
            <div class="apontamentos-tabela">
                <table class="apontamentos-table">
                    <thead>
                        <tr>
                            <th>Vaga</th>
                            <th>Categoria Registro</th>
                            <th>Primeiro Registro</th>
                            <th>Início Registro</th>
                            <th>Final Registro</th>
                            <th>Tempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Obter classe CSS para tempo
     */
    getTempoClass(tempo) {
        const [horas, minutos] = tempo.split(':').map(Number);
        const totalMinutos = horas * 60 + minutos;
        
        if (totalMinutos > STATUS_CONFIG.criterios.maxTempoAtencao) {
            return 'tempo-critico';
        }
        if (totalMinutos > STATUS_CONFIG.criterios.maxTempoNormal) {
            return 'tempo-atencao';
        }
        return 'tempo-normal';
    }

    /**
     * Atualizar resumo de status
     */
    updateStatusSummary() {
        if (!this.elements.resumoStatus) return;
        
        const stats = this.calculateStatusStats();
        
        this.elements.resumoStatus.innerHTML = `
            <span class="status-count critico">Críticos: <strong>${stats.CRITICO}</strong></span>
            <span class="status-count tardio">Tardios: <strong>${stats.TARDIO}</strong></span>
            <span class="status-count poucos">Poucos: <strong>${stats.POUCOS}</strong></span>
            <span class="status-count ok">OK: <strong>${stats.OK}</strong></span>
        `;
    }

    /**
     * Calcular estatísticas de status
     */
    calculateStatusStats() {
        const stats = { CRITICO: 0, TARDIO: 0, POUCOS: 0, OK: 0 };
        
        this.equipamentos.forEach(eq => {
            stats[eq.status] = (stats[eq.status] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * Aplicar filtros na interface
     */
    applyFilters() {
        if (this.elements.filtroTipo) {
            this.elements.filtroTipo.value = this.filtros.tipo;
        }
        if (this.elements.filtroStatus) {
            this.elements.filtroStatus.value = this.filtros.status;
        }
    }

    /**
     * Atualizar estado dos filtros
     */
    updateFiltersState() {
        this.applyFilters();
        this.saveData();
    }

    /**
     * Atualizar data atual no header
     */
    updateCurrentDate() {
        if (this.elements.dataAtual) {
            const today = new Date();
            const formatted = today.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            this.elements.dataAtual.textContent = formatted;
        }
    }

    /**
     * Configurar auto-update
     */
    setupAutoUpdate() {
        if (!CONFIG.AUTO_REFRESH) return;
        
        this.autoUpdateInterval = setInterval(() => {
            this.log('🔄 Auto-update executado');
            this.loadEquipmentData();
        }, CONFIG.UPDATE_INTERVAL);
        
        this.log(`⏰ Auto-update configurado (${CONFIG.UPDATE_INTERVAL / 60000}min)`);
    }

    /**
     * Refresh manual dos dados
     */
    async refreshData() {
        this.log('🔄 Refresh manual iniciado');
        await this.loadEquipmentData();
        this.updateInterface();
    }

    /**
     * Abrir modal de motoristas
     */
    openMotoristaModal() {
        this.populateVagasSelect();
        this.updateMotoristasList();
        this.showModal('modal-motoristas');
    }

    /**
     * Abrir modal de contato
     */
    openContatoModal(vaga) {
        const equipment = this.equipamentos.get(vaga);
        if (!equipment) return;
        
        this.currentContactVaga = vaga;
        this.populateContatoInfo(equipment);
        this.showModal('modal-contato');
    }

    /**
     * Mostrar/esconder loading
     */
    showLoading(show) {
        if (this.elements.loading) {
            this.elements.loading.style.display = show ? 'flex' : 'none';
        }
        this.isLoading = show;
    }

    /**
     * Mostrar modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    /**
     * Fechar modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    /**
     * Fechar todos os modais
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            this.closeModal(modal.id);
        });
    }

    /**
     * Formatar telefone
     */
    formatPhone(phone) {
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    }

    /**
     * Verificar se há mudanças não salvas
     */
    hasUnsavedChanges() {
        // Implementar lógica para detectar mudanças não salvas
        return false;
    }

    /**
     * Mostrar erro
     */
    showError(message) {
        console.error('❌', message);
        // Implementar notificação visual de erro
        alert('Erro: ' + message);
    }

    /**
     * Logging methods
     */
    log(message) {
        if (CONFIG.DEBUG_MODE && CONFIG.CONSOLE_LOGS) {
            console.log(message);
        }
    }

    logWarn(message) {
        if (CONFIG.DEBUG_MODE && CONFIG.CONSOLE_LOGS) {
            console.warn(message);
        }
    }

    logError(message, error) {
        console.error(message, error);
    }

    /**
     * Métodos públicos para controle externo
     */
    getStatus() {
        return {
            isLoading: this.isLoading,
            equipamentos: this.equipamentos.size,
            motoristas: this.motoristas.size,
            contatos: this.contatos.size,
            ultimaAtualizacao: this.ultimaAtualizacao,
            filtros: this.filtros
        };
    }

    pause() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
            this.log('⏸️ Auto-update pausado');
        }
    }

    resume() {
        if (!this.autoUpdateInterval && CONFIG.AUTO_REFRESH) {
            this.setupAutoUpdate();
            this.log('▶️ Auto-update retomado');
        }
    }
}

// ============================================================================
// FUNÇÕES GLOBAIS PARA USO NOS TEMPLATES
// ============================================================================

/**
 * Fechar modal
 */
function fecharModal(modalId) {
    if (window.sistema) {
        window.sistema.closeModal(modalId);
    }
}

/**
 * Salvar motorista
 */
function salvarMotorista() {
    if (window.motoristaManager) {
        window.motoristaManager.salvarMotorista();
    }
}

/**
 * Limpar formulário de motorista
 */
function limparFormMotorista() {
    if (window.motoristaManager) {
        window.motoristaManager.limparForm();
    }
}

/**
 * Salvar contato
 */
function salvarContato() {
    if (window.contatoManager) {
        window.contatoManager.salvarContato();
    }
}

/**
 * Marcar como contatado
 */
function marcarContatado() {
    if (window.contatoManager) {
        window.contatoManager.marcarContatado();
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Criar instância global do sistema
        window.sistema = new SistemaMonitoramento();
        
        // Disponibilizar comandos úteis no console
        if (CONFIG.DEBUG_MODE) {
            window.pausarSistema = () => window.sistema.pause();
            window.retomarSistema = () => window.sistema.resume();
            window.statusSistema = () => window.sistema.getStatus();
            window.atualizarDados = () => window.sistema.refreshData();
        }
        
    } catch (error) {
        console.error('❌ Erro fatal na inicialização:', error);
        alert('Erro fatal: ' + error.message);
    }
});

// Limpeza antes de sair
window.addEventListener('beforeunload', function() {
    if (window.sistema) {
        window.sistema.pause();
    }
});
