/**
 * GERENCIAMENTO DE MOTORISTAS E CONTATOS - SISTEMA USIMINAS
 * Arquivo: /js/motoristas.js
 * 
 * Responsável por gerenciar motoristas, contatos e justificativas
 */

class MotoristaManager {
    constructor() {
        this.motoristas = new Map();
        this.contatos = new Map();
        this.historico = new Map();
        
        // Elementos DOM
        this.elements = {};
        
        this.init();
    }

    /**
     * Inicialização
     */
    init() {
        this.setupDOMElements();
        this.loadSavedData();
        this.setupEventListeners();
    }

    /**
     * Configurar elementos DOM
     */
    setupDOMElements() {
        this.elements = {
            // Modal motoristas
            motoristaVaga: document.getElementById('motorista-vaga'),
            motoristaNome: document.getElementById('motorista-nome'),
            motoristaTelefone: document.getElementById('motorista-telefone'),
            motoristaRadio: document.getElementById('motorista-radio'),
            motoristasLista: document.getElementById('motoristas-lista'),
            
            // Modal contato
            contatoInfo: document.getElementById('contato-info'),
            problemaTipo: document.getElementById('problema-tipo'),
            horarioContato: document.getElementById('horario-contato'),
            justificativa: document.getElementById('justificativa'),
            acaoTomada: document.getElementById('acao-tomada'),
            observacoes: document.getElementById('observacoes'),
            historicoContatos: document.getElementById('historico-contatos')
        };
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Auto-format telefone
        if (this.elements.motoristaTelefone) {
            this.elements.motoristaTelefone.addEventListener('input', (e) => {
                e.target.value = this.formatPhone(e.target.value);
            });
        }

        // Auto-complete nomes
        if (this.elements.motoristaNome) {
            this.elements.motoristaNome.addEventListener('input', (e) => {
                this.handleNameAutocomplete(e);
            });
        }

        // Validação em tempo real
        Object.values(this.elements).forEach(element => {
            if (element && element.tagName) {
                element.addEventListener('blur', () => {
                    this.validateField(element);
                });
            }
        });
    }

    /**
     * Carregar dados salvos
     */
    loadSavedData() {
        try {
            // Carregar motoristas
            const motoristasData = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'motoristas');
            if (motoristasData) {
                const motoristas = JSON.parse(motoristasData);
                Object.entries(motoristas).forEach(([vaga, data]) => {
                    this.motoristas.set(vaga, {
                        ...data,
                        dataCadastro: new Date(data.dataCadastro || Date.now())
                    });
                });
            }

            // Carregar contatos
            const contatosData = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'contatos');
            if (contatosData) {
                const contatos = JSON.parse(contatosData);
                Object.entries(contatos).forEach(([id, data]) => {
                    this.contatos.set(id, {
                        ...data,
                        timestamp: new Date(data.timestamp)
                    });
                });
            }

            // Carregar histórico
            const historicoData = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'historico');
            if (historicoData) {
                const historico = JSON.parse(historicoData);
                Object.entries(historico).forEach(([vaga, dados]) => {
                    this.historico.set(vaga, dados.map(item => ({
                        ...item,
                        timestamp: new Date(item.timestamp)
                    })));
                });
            }

            this.log(`📋 Dados carregados: ${this.motoristas.size} motoristas, ${this.contatos.size} contatos`);

        } catch (error) {
            this.logError('Erro ao carregar dados salvos:', error);
        }
    }

    /**
     * Salvar dados
     */
    saveData() {
        try {
            // Salvar motoristas
            const motoristasObj = Object.fromEntries(this.motoristas);
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'motoristas', JSON.stringify(motoristasObj));

            // Salvar contatos
            const contatosObj = Object.fromEntries(this.contatos);
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'contatos', JSON.stringify(contatosObj));

            // Salvar histórico
            const historicoObj = Object.fromEntries(this.historico);
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'historico', JSON.stringify(historicoObj));

            this.log('💾 Dados salvos com sucesso');

        } catch (error) {
            this.logError('Erro ao salvar dados:', error);
        }
    }

    /**
     * Adicionar/Editar motorista
     */
    salvarMotorista() {
        try {
            const vaga = this.elements.motoristaVaga?.value?.trim();
            const nome = this.elements.motoristaNome?.value?.trim();
            const telefone = this.elements.motoristaTelefone?.value?.trim();
            const radio = this.elements.motoristaRadio?.value?.trim();

            // Validação
            const validation = this.validateMotorista({ vaga, nome, telefone, radio });
            if (!validation.valid) {
                this.showValidationErrors(validation.errors);
                return false;
            }

            // Criar/atualizar motorista
            const motorista = {
                vaga: vaga,
                nome: nome,
                telefone: telefone,
                radio: radio || '',
                dataCadastro: this.motoristas.has(vaga) ? 
                    this.motoristas.get(vaga).dataCadastro : new Date(),
                dataAtualizacao: new Date(),
                ativo: true
            };

            this.motoristas.set(vaga, motorista);
            
            // Salvar dados
            this.saveData();
            
            // Atualizar interface
            this.updateMotoristasList();
            this.limparForm();
            
            // Notificar sucesso
            this.showSuccess(`Motorista ${nome} ${this.motoristas.has(vaga) ? 'atualizado' : 'cadastrado'} com sucesso!`);
            
            // Atualizar sistema principal se disponível
            if (window.sistema) {
                window.sistema.updateInterface();
            }

            return true;

        } catch (error) {
            this.logError('Erro ao salvar motorista:', error);
            this.showError('Erro ao salvar motorista: ' + error.message);
            return false;
        }
    }

    /**
     * Validar dados do motorista
     */
    validateMotorista(data) {
        const errors = [];

        if (!data.vaga) {
            errors.push('Vaga é obrigatória');
        } else if (!VALIDATORS.isValidEquipmentCode(data.vaga)) {
            errors.push('Código da vaga inválido (ex: AP-01, AV-02, HP-01)');
        }

        if (!data.nome || data.nome.length < 2) {
            errors.push('Nome deve ter pelo menos 2 caracteres');
        }

        if (!data.telefone) {
            errors.push('Telefone é obrigatório');
        } else if (!VALIDATORS.isValidPhone(data.telefone)) {
            errors.push('Formato de telefone inválido (ex: (31) 99999-9999)');
        }

        // Verificar se já existe outro motorista para esta vaga
        const existing = this.motoristas.get(data.vaga);
        if (existing && existing.nome !== data.nome) {
            errors.push(`Já existe um motorista cadastrado para ${data.vaga}: ${existing.nome}`);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Remover motorista
     */
    removerMotorista(vaga) {
        if (!vaga) return false;

        const motorista = this.motoristas.get(vaga);
        if (!motorista) {
            this.showError('Motorista não encontrado');
            return false;
        }

        if (confirm(`Confirma a remoção do motorista ${motorista.nome} da vaga ${vaga}?`)) {
            this.motoristas.delete(vaga);
            this.saveData();
            this.updateMotoristasList();
            
            if (window.sistema) {
                window.sistema.updateInterface();
            }

            this.showSuccess(`Motorista ${motorista.nome} removido com sucesso`);
            return true;
        }

        return false;
    }

    /**
     * Editar motorista
     */
    editarMotorista(vaga) {
        const motorista = this.motoristas.get(vaga);
        if (!motorista) {
            this.showError('Motorista não encontrado');
            return;
        }

        // Preencher formulário
        if (this.elements.motoristaVaga) this.elements.motoristaVaga.value = motorista.vaga;
        if (this.elements.motoristaNome) this.elements.motoristaNome.value = motorista.nome;
        if (this.elements.motoristaTelefone) this.elements.motoristaTelefone.value = motorista.telefone;
        if (this.elements.motoristaRadio) this.elements.motoristaRadio.value = motorista.radio || '';

        // Desabilitar campo vaga (não pode alterar)
        if (this.elements.motoristaVaga) {
            this.elements.motoristaVaga.disabled = true;
        }
    }

    /**
     * Limpar formulário
     */
    limparForm() {
        const campos = ['motoristaVaga', 'motoristaNome', 'motoristaTelefone', 'motoristaRadio'];
        
        campos.forEach(campo => {
            if (this.elements[campo]) {
                this.elements[campo].value = '';
                this.elements[campo].disabled = false;
                this.elements[campo].classList.remove('error', 'success');
            }
        });

        this.clearValidationErrors();
    }

    /**
     * Atualizar lista de motoristas
     */
    updateMotoristasList() {
        if (!this.elements.motoristasLista) return;

        const motoristas = Array.from(this.motoristas.values())
            .sort((a, b) => a.vaga.localeCompare(b.vaga));

        if (motoristas.length === 0) {
            this.elements.motoristasLista.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-users" style="font-size: 2em; margin-bottom: 10px; opacity: 0.3;"></i>
                    <p>Nenhum motorista cadastrado</p>
                </div>
            `;
            return;
        }

        const html = motoristas.map(motorista => `
            <div class="motorista-item" data-vaga="${motorista.vaga}">
                <div class="motorista-dados">
                    <div class="motorista-nome">
                        <strong>${motorista.vaga}</strong> - ${motorista.nome}
                    </div>
                    <div class="motorista-detalhes">
                        <i class="fas fa-phone"></i> ${motorista.telefone}
                        ${motorista.radio ? `<i class="fas fa-radio" style="margin-left: 15px;"></i> ${motorista.radio}` : ''}
                        <span style="margin-left: 15px; font-size: 0.8em; color: var(--text-muted);">
                            Cadastrado: ${motorista.dataCadastro.toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>
                <div class="motorista-actions">
                    <button class="btn btn-sm btn-primary" onclick="motoristaManager.editarMotorista('${motorista.vaga}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="sistema.openContatoModal('${motorista.vaga}')" title="Contatar">
                        <i class="fas fa-phone"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="motoristaManager.removerMotorista('${motorista.vaga}')" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.elements.motoristasLista.innerHTML = html;
    }

    /**
     * Popular select de vagas
     */
    populateVagasSelect() {
        if (!this.elements.motoristaVaga) return;

        const vagas = EQUIPAMENTOS_BASE.lista
            .map(eq => ({ codigo: eq.codigo, nome: `${eq.codigo} - ${eq.placa}` }))
            .sort((a, b) => a.codigo.localeCompare(b.codigo));

        let options = '<option value="">Selecione a vaga...</option>';
        
        vagas.forEach(vaga => {
            const motorista = this.motoristas.get(vaga.codigo);
            const label = motorista ? `${vaga.nome} (${motorista.nome})` : vaga.nome;
            options += `<option value="${vaga.codigo}">${label}</option>`;
        });

        this.elements.motoristaVaga.innerHTML = options;
    }

    /**
     * Registrar contato
     */
    registrarContato(dados) {
        try {
            const contato = {
                id: this.generateId(),
                vaga: dados.vaga,
                timestamp: new Date(),
                problemaIdentificado: dados.problemaIdentificado || '',
                justificativa: dados.justificativa || '',
                acaoTomada: dados.acaoTomada || '',
                observacoes: dados.observacoes || '',
                operador: dados.operador || 'Sistema',
                status: 'registrado'
            };

            // Validar contato
            const validation = this.validateContato(contato);
            if (!validation.valid) {
                this.showValidationErrors(validation.errors);
                return false;
            }

            // Salvar contato
            this.contatos.set(contato.id, contato);

            // Adicionar ao histórico da vaga
            this.addToHistorico(dados.vaga, contato);

            // Salvar dados
            this.saveData();

            this.log(`📞 Contato registrado para ${dados.vaga}`);
            return contato;

        } catch (error) {
            this.logError('Erro ao registrar contato:', error);
            this.showError('Erro ao registrar contato: ' + error.message);
            return false;
        }
    }

    /**
     * Validar dados do contato
     */
    validateContato(contato) {
        const errors = [];

        if (!contato.vaga) {
            errors.push('Vaga é obrigatória');
        }

        if (!contato.problemaIdentificado) {
            errors.push('Tipo de problema deve ser selecionado');
        }

        if (!contato.justificativa || contato.justificativa.length < 10) {
            errors.push('Justificativa deve ter pelo menos 10 caracteres');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Adicionar ao histórico
     */
    addToHistorico(vaga, contato) {
        if (!this.historico.has(vaga)) {
            this.historico.set(vaga, []);
        }

        const historico = this.historico.get(vaga);
        historico.unshift(contato); // Adicionar no início

        // Manter apenas os últimos 50 registros
        if (historico.length > 50) {
            this.historico.set(vaga, historico.slice(0, 50));
        }
    }

    /**
     * Obter histórico de contatos
     */
    getHistorico(vaga) {
        return this.historico.get(vaga) || [];
    }

    /**
     * Popular informações do contato
     */
    populateContatoInfo(vaga) {
        if (!this.elements.contatoInfo) return;

        const equipment = window.sistema?.equipamentos?.get(vaga);
        const motorista = this.motoristas.get(vaga);

        if (!equipment) {
            this.elements.contatoInfo.innerHTML = '<p>Equipamento não encontrado</p>';
            return;
        }

        const statusConfig = STATUS_CONFIG.tipos[equipment.status];
        const ultimosContatos = this.getHistorico(vaga).slice(0, 3);

        this.elements.contatoInfo.innerHTML = `
            <div class="contato-detalhes">
                <div class="contato-item">
                    <div class="contato-label">Equipamento</div>
                    <div class="contato-valor">${equipment.codigo} - ${equipment.placa}</div>
                </div>
                <div class="contato-item">
                    <div class="contato-label">Status</div>
                    <div class="contato-valor">
                        <span class="status-badge ${equipment.status.toLowerCase()}">
                            <i class="${statusConfig.icon}"></i>
                            ${statusConfig.label}
                        </span>
                    </div>
                </div>
                <div class="contato-item">
                    <div class="contato-label">Apontamentos</div>
                    <div class="contato-valor">${equipment.totalApontamentos} registros</div>
                </div>
                <div class="contato-item">
                    <div class="contato-label">Primeiro Registro</div>
                    <div class="contato-valor">${equipment.primeiroRegistro || 'Não informado'}</div>
                </div>
                ${motorista ? `
                    <div class="contato-item">
                        <div class="contato-label">Motorista</div>
                        <div class="contato-valor">
                            <strong>${motorista.nome}</strong><br>
                            <i class="fas fa-phone"></i> ${motorista.telefone}
                            ${motorista.radio ? `<br><i class="fas fa-radio"></i> ${motorista.radio}` : ''}
                        </div>
                    </div>
                ` : `
                    <div class="contato-item">
                        <div class="contato-label">Motorista</div>
                        <div class="contato-valor" style="color: var(--warning-color);">
                            <i class="fas fa-exclamation-triangle"></i> Não cadastrado
                        </div>
                    </div>
                `}
            </div>
            
            ${ultimosContatos.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h4 style="margin-bottom: 10px; color: var(--text-secondary);">Últimos Contatos</h4>
                    ${ultimosContatos.map(contato => `
                        <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 0.9em;">
                            <strong>${contato.timestamp.toLocaleString('pt-BR')}</strong><br>
                            ${contato.problemaIdentificado} - ${contato.acaoTomada}<br>
                            <em>${contato.justificativa.substring(0, 100)}${contato.justificativa.length > 100 ? '...' : ''}</em>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        // Configurar horário atual
        if (this.elements.horarioContato) {
            const now = new Date();
            const formatted = now.toISOString().slice(0, 16);
            this.elements.horarioContato.value = formatted;
        }
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
     * Auto-complete de nomes
     */
    handleNameAutocomplete(event) {
        const input = event.target.value.toLowerCase();
        if (input.length < 2) return;

        // Lista de nomes comuns para sugestão
        const nomesComuns = [
            'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza',
            'José Ferreira', 'Antônio Lima', 'Francisco Pereira', 'Paulo Almeida', 'Luiz Barbosa',
            'Marcos Roberto', 'Eduardo Cardoso', 'Rafael Martins', 'Fernando Castro', 'Bruno Rocha'
        ];

        const suggestions = nomesComuns.filter(nome => 
            nome.toLowerCase().includes(input)
        );

        // Implementar dropdown de sugestões se necessário
        if (suggestions.length > 0 && CONFIG.DEBUG_MODE) {
            console.log('Sugestões:', suggestions);
        }
    }

    /**
     * Validar campo em tempo real
     */
    validateField(field) {
        if (!field || !field.value) return;

        field.classList.remove('error', 'success');
        
        let isValid = true;
        
        switch (field.id) {
            case 'motorista-telefone':
                isValid = VALIDATORS.isValidPhone(field.value);
                break;
            case 'motorista-nome':
                isValid = field.value.length >= 2;
                break;
            case 'motorista-vaga':
                isValid = VALIDATORS.isValidEquipmentCode(field.value);
                break;
        }

        field.classList.add(isValid ? 'success' : 'error');
    }

    /**
     * Mostrar erros de validação
     */
    showValidationErrors(errors) {
        const message = 'Corrija os seguintes problemas:\n\n' + errors.join('\n');
        alert(message);
    }

    /**
     * Limpar erros de validação
     */
    clearValidationErrors() {
        Object.values(this.elements).forEach(element => {
            if (element && element.classList) {
                element.classList.remove('error', 'success');
            }
        });
    }

    /**
     * Gerar ID único
     */
    generateId() {
        return 'contato_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Obter estatísticas de contatos
     */
    getContatosStats() {
        const stats = {
            totalContatos: this.contatos.size,
            contatosHoje: 0,
            contatosSemana: 0,
            problemasMaisComuns: {},
            acoesMaisComuns: {},
            equipamentosMaisContatados: {}
        };

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const semanaAtras = new Date(hoje);
        semanaAtras.setDate(semanaAtras.getDate() - 7);

        this.contatos.forEach(contato => {
            const dataContato = new Date(contato.timestamp);
            dataContato.setHours(0, 0, 0, 0);

            // Contatos hoje
            if (dataContato.getTime() === hoje.getTime()) {
                stats.contatosHoje++;
            }

            // Contatos na semana
            if (dataContato >= semanaAtras) {
                stats.contatosSemana++;
            }

            // Problemas mais comuns
            const problema = contato.problemaIdentificado;
            stats.problemasMaisComuns[problema] = (stats.problemasMaisComuns[problema] || 0) + 1;

            // Ações mais comuns
            const acao = contato.acaoTomada;
            stats.acoesMaisComuns[acao] = (stats.acoesMaisComuns[acao] || 0) + 1;

            // Equipamentos mais contatados
            const vaga = contato.vaga;
            stats.equipamentosMaisContatados[vaga] = (stats.equipamentosMaisContatados[vaga] || 0) + 1;
        });

        return stats;
    }

    /**
     * Exportar dados de contatos
     */
    exportarContatos() {
        const contatos = Array.from(this.contatos.values())
            .sort((a, b) => b.timestamp - a.timestamp);

        const csv = [
            ['Data/Hora', 'Vaga', 'Motorista', 'Problema', 'Justificativa', 'Ação', 'Observações'].join(','),
            ...contatos.map(contato => {
                const motorista = this.motoristas.get(contato.vaga)?.nome || 'Não cadastrado';
                return [
                    contato.timestamp.toLocaleString('pt-BR'),
                    contato.vaga,
                    motorista,
                    contato.problemaIdentificado,
                    `"${contato.justificativa.replace(/"/g, '""')}"`,
                    contato.acaoTomada,
                    `"${contato.observacoes.replace(/"/g, '""')}"`
                ].join(',');
            })
        ].join('\n');

        return csv;
    }

    /**
     * Logging methods
     */
    log(message) {
        if (CONFIG.DEBUG_MODE && CONFIG.CONSOLE_LOGS) {
            console.log(`[MotoristaManager] ${message}`);
        }
    }

    logError(message, error) {
        console.error(`[MotoristaManager] ${message}`, error);
    }

    showSuccess(message) {
        console.log('✅', message);
        // Implementar notificação visual de sucesso
    }

    showError(message) {
        console.error('❌', message);
        alert('Erro: ' + message);
    }
}

// ============================================================================
// GERENCIADOR DE CONTATOS
// ============================================================================

class ContatoManager {
    constructor(motoristaManager) {
        this.motoristaManager = motoristaManager;
        this.currentVaga = null;
        this.elements = {};
        
        this.init();
    }

    init() {
        this.setupDOMElements();
    }

    setupDOMElements() {
        this.elements = {
            problemaTipo: document.getElementById('problema-tipo'),
            horarioContato: document.getElementById('horario-contato'),
            justificativa: document.getElementById('justificativa'),
            acaoTomada: document.getElementById('acao-tomada'),
            observacoes: document.getElementById('observacoes')
        };
    }

    /**
     * Definir vaga atual para contato
     */
    setCurrentVaga(vaga) {
        this.currentVaga = vaga;
        this.motoristaManager.populateContatoInfo(vaga);
    }

    /**
     * Salvar contato completo
     */
    salvarContato() {
        if (!this.currentVaga) {
            alert('Nenhuma vaga selecionada');
            return false;
        }

        const dados = {
            vaga: this.currentVaga,
            problemaIdentificado: this.elements.problemaTipo?.value || '',
            justificativa: this.elements.justificativa?.value || '',
            acaoTomada: this.elements.acaoTomada?.value || '',
            observacoes: this.elements.observacoes?.value || '',
            operador: 'Sistema'
        };

        const contato = this.motoristaManager.registrarContato(dados);
        
        if (contato) {
            this.limparFormContato();
            alert('Contato registrado com sucesso!');
            
            if (window.sistema) {
                window.sistema.closeModal('modal-contato');
            }
            
            return true;
        }

        return false;
    }

    /**
     * Marcar apenas como contatado (sem detalhes)
     */
    marcarContatado() {
        if (!this.currentVaga) {
            alert('Nenhuma vaga selecionada');
            return false;
        }

        const dados = {
            vaga: this.currentVaga,
            problemaIdentificado: 'contato-simples',
            justificativa: 'Contato realizado - sem detalhes registrados',
            acaoTomada: 'sem-acao',
            observacoes: 'Marcado como contatado pelo sistema',
            operador: 'Sistema'
        };

        const contato = this.motoristaManager.registrarContato(dados);
        
        if (contato) {
            alert('Marcado como contatado!');
            
            if (window.sistema) {
                window.sistema.closeModal('modal-contato');
                window.sistema.updateInterface();
            }
            
            return true;
        }

        return false;
    }

    /**
     * Limpar formulário de contato
     */
    limparFormContato() {
        Object.values(this.elements).forEach(element => {
            if (element && element.value !== undefined) {
                element.value = '';
            }
        });
    }
}

// ============================================================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ============================================================================

// Criar instâncias globais quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined') {
        window.MotoristaManager = MotoristaManager;
        window.ContatoManager = ContatoManager;
        
        // Criar instâncias globais
        window.motoristaManager = new MotoristaManager();
        window.contatoManager = new ContatoManager(window.motoristaManager);
        
        if (CONFIG.DEBUG_MODE) {
            console.log('👥 MotoristaManager e ContatoManager inicializados');
            
            // Comandos de debug
            window.exportarMotoristas = () => {
                const data = Object.fromEntries(window.motoristaManager.motoristas);
                console.log('Motoristas:', data);
                return data;
            };
            
            window.exportarContatos = () => window.motoristaManager.exportarContatos();
            window.statsContatos = () => window.motoristaManager.getContatosStats();
        }
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MotoristaManager, ContatoManager };
}
