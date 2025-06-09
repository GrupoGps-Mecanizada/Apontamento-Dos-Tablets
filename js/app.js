/**
 * Monitor Usiminas - JavaScript Principal
 * Sistema de monitoramento em tempo real dos equipamentos
 */

class MonitorUsiminas {
    constructor() {
        // Configurações vindas do config.js
        this.apiUrl = CONFIG_FRONTEND.API_URL;
        this.updateInterval = CONFIG_FRONTEND.UPDATE_INTERVAL;
        this.usarDadosSimulados = CONFIG_FRONTEND.USE_MOCK_DATA;
        this.debugMode = CONFIG_FRONTEND.DEBUG_MODE;
        
        // Estado da aplicação
        this.dados = null;
        this.ultimaAtualizacao = null;
        this.autoUpdateInterval = null;
        this.isLoading = false;
        this.tentativasErro = 0;
        this.maxTentativas = CONFIG_FRONTEND.MAX_RETRIES;
        
        // Lista dos equipamentos base
        this.equipamentosBase = this.carregarEquipamentosBase();
        
        this.init();
    }

    /**
     * Inicialização do sistema
     */
    init() {
        if (this.debugMode) {
            console.log('🚀 Iniciando Monitor Usiminas...');
            this.mostrarInfoSistema();
        }
        
        this.configurarEventos();
        this.carregarDados();
        this.iniciarAutoUpdate();
    }

    /**
     * Configurar event listeners
     */
    configurarEventos() {
        // Botão de atualizar
        const btnAtualizar = document.getElementById('btn-atualizar');
        if (btnAtualizar) {
            btnAtualizar.addEventListener('click', () => {
                this.carregarDados(true);
            });
        }

        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            // F5 ou Ctrl+R para atualizar
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                this.carregarDados(true);
            }
            
            // Ctrl+Shift+D para alternar dados simulados
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                this.alternarDadosSimulados();
            }
        });

        // Detectar quando a aba fica visível novamente
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.ultimaAtualizacao) {
                const agora = new Date();
                const diferenca = agora - this.ultimaAtualizacao;
                if (diferenca > this.updateInterval) {
                    if (this.debugMode) {
                        console.log('🔄 Dados antigos detectados, atualizando...');
                    }
                    this.carregarDados();
                }
            }
        });
    }

    /**
     * Carregar dados dos equipamentos
     */
    async carregarDados(forceUpdate = false) {
        if (this.isLoading && !forceUpdate) {
            if (this.debugMode) {
                console.log('⏳ Carregamento já em andamento...');
            }
            return;
        }

        this.isLoading = true;
        this.mostrarLoader(forceUpdate);

        try {
            let dados;

            if (this.usarDadosSimulados) {
                dados = await this.gerarDadosSimulados();
            } else {
                dados = await this.buscarDadosAPI();
            }

            this.dados = dados;
            this.ultimaAtualizacao = new Date();
            this.tentativasErro = 0;
            
            this.renderizarDados(dados);
            this.atualizarTimestamp();
            
            if (this.debugMode) {
                console.log(`✅ Dados carregados: ${dados.equipamentos.length} equipamentos`);
            }

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.tentativasErro++;
            
            this.mostrarErro(`Erro ao carregar dados (tentativa ${this.tentativasErro}/${this.maxTentativas})`);
            
            if (this.tentativasErro < this.maxTentativas) {
                // Tentar novamente em 30 segundos
                setTimeout(() => this.carregarDados(), 30000);
            } else {
                this.mostrarErro('Máximo de tentativas atingido. Verifique a conexão.');
            }
        } finally {
            this.isLoading = false;
            this.esconderLoader();
        }
    }

    /**
     * Buscar dados da API real
     */
    async buscarDadosAPI() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG_FRONTEND.REQUEST_TIMEOUT);

        try {
            const response = await fetch(this.apiUrl, {
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

            const dados = await response.json();
            
            if (dados.error) {
                throw new Error(`API Error: ${dados.error}`);
            }

            return dados;

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Timeout: A requisição demorou muito para responder');
            }
            throw error;
        }
    }

    /**
     * Gerar dados simulados para desenvolvimento
     */
    async gerarDadosSimulados() {
        // Simular delay da rede
        const delay = MOCK_DATA_CONFIG.SIMULATED_DELAY + 
                     (Math.random() * MOCK_DATA_CONFIG.DELAY_VARIATION) - 
                     (MOCK_DATA_CONFIG.DELAY_VARIATION / 2);
        
        await new Promise(resolve => setTimeout(resolve, delay));

        const agora = new Date();
        const equipamentos = [];
        const estatisticas = {
            total: 24,
            semRegistro: 0,
            tardios: 0,
            poucosRegistros: 0,
            ok: 0,
            criticos: 0
        };

        // Gerar dados para cada equipamento
        this.equipamentosBase.forEach(equip => {
            const status = this.gerarStatusAleatorio();
            const registros = this.gerarRegistrosAleatorios(status);
            
            const equipamento = {
                Codigo: equip.codigo,
                Nome: equip.nome,
                Status: status,
                Total_Registros: registros.total,
                Primeiro_Registro: registros.primeiro,
                Turno: equip.turno,
                Ultima_Atualizacao: agora.toISOString(),
                Observacao: this.gerarObservacao(status, registros.total)
            };

            equipamentos.push(equipamento);

            // Contar estatísticas
            switch (status) {
                case 'SEM_REGISTRO':
                    estatisticas.semRegistro++;
                    break;
                case 'TARDIO':
                    estatisticas.tardios++;
                    break;
                case 'POUCOS_REGISTROS':
                    estatisticas.poucosRegistros++;
                    break;
                case 'CRITICO':
                    estatisticas.criticos++;
                    break;
                case 'OK':
                    estatisticas.ok++;
                    break;
            }
        });

        return {
            equipamentos,
            estatisticas,
            ultimaAtualizacao: agora.toISOString(),
            configuracao: {
                horaLimite: EQUIPAMENTOS_CONFIG.HORA_LIMITE,
                totalEquipamentos: EQUIPAMENTOS_CONFIG.TOTAL_EQUIPAMENTOS
            }
        };
    }

    /**
     * Gerar status aleatório baseado nas probabilidades
     */
    gerarStatusAleatorio() {
        const random = Math.random();
        let acumulado = 0;

        const probabilidades = Object.entries(MOCK_DATA_CONFIG.STATUS_PROBABILITIES);
        
        for (const [status, peso] of probabilidades) {
            acumulado += peso;
            if (random <= acumulado) {
                return status;
            }
        }

        return 'OK';
    }

    /**
     * Gerar registros aleatórios baseados no status
     */
    gerarRegistrosAleatorios(status) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        switch (status) {
            case 'SEM_REGISTRO':
                return { total: 0, primeiro: null };
                
            case 'TARDIO':
                const horaTardio = new Date(hoje);
                horaTardio.setHours(7, 30 + Math.random() * 120, Math.random() * 60);
                return {
                    total: Math.floor(Math.random() * 6) + 3,
                    primeiro: horaTardio.toISOString()
                };
                
            case 'POUCOS_REGISTROS':
                const horaPoucos = new Date(hoje);
                horaPoucos.setHours(6, 30 + Math.random() * 60, Math.random() * 60);
                return {
                    total: Math.floor(Math.random() * 2) + 1,
                    primeiro: horaPoucos.toISOString()
                };
                
            case 'CRITICO':
                const horaCritico = new Date(hoje);
                horaCritico.setHours(8, 30 + Math.random() * 120, Math.random() * 60);
                return {
                    total: Math.floor(Math.random() * 3) + 1,
                    primeiro: horaCritico.toISOString()
                };
                
            case 'OK':
            default:
                const horaOK = new Date(hoje);
                horaOK.setHours(6, Math.random() * 90, Math.random() * 60);
                return {
                    total: Math.floor(Math.random() * 10) + 5,
                    primeiro: horaOK.toISOString()
                };
        }
    }

    /**
     * Gerar observação baseada no status
     */
    gerarObservacao(status, totalRegistros) {
        switch (status) {
            case 'SEM_REGISTRO':
                return 'Nenhum apontamento encontrado';
            case 'TARDIO':
                return 'Primeiro registro após 7:30h';
            case 'POUCOS_REGISTROS':
                return `Apenas ${totalRegistros} apontamento(s)`;
            case 'CRITICO':
                return 'Primeiro registro muito tardio - requer atenção';
            case 'OK':
                return 'Funcionando normalmente';
            default:
                return '';
        }
    }

    /**
     * Renderizar todos os dados na interface
     */
    renderizarDados(dados) {
        this.renderizarEstatisticas(dados.estatisticas);
        this.renderizarEquipamentos(dados.equipamentos);
        this.renderizarAlertas(dados.equipamentos);
    }

    /**
     * Renderizar cards de estatísticas
     */
    renderizarEstatisticas(stats) {
        const elementos = {
            'stat-sem-registro': stats.semRegistro,
            'stat-tardios': stats.tardios,
            'stat-poucos': stats.poucosRegistros,
            'stat-ok': stats.ok
        };

        Object.entries(elementos).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                this.animarNumero(elemento, valor);
            }
        });
    }

    /**
     * Animar mudança de números nos cards
     */
    animarNumero(elemento, novoValor) {
        const valorAtual = parseInt(elemento.textContent) || 0;
        if (valorAtual === novoValor) return;

        const diferenca = novoValor - valorAtual;
        const duracao = UI_CONFIG.ANIMATION_DURATION;
        const steps = 15;
        const stepValue = diferenca / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const valor = Math.round(valorAtual + (stepValue * step));
            elemento.textContent = valor;

            if (step >= steps) {
                clearInterval(timer);
                elemento.textContent = novoValor;
            }
        }, duracao / steps);
    }

    /**
     * Renderizar grid de equipamentos
     */
    renderizarEquipamentos(equipamentos) {
        // Separar por categoria
        const categorias = {
            'AP': equipamentos.filter(e => e.Codigo.startsWith('AP-')),
            'AV': equipamentos.filter(e => e.Codigo.startsWith('AV-')),
            'HP': equipamentos.filter(e => e.Codigo.startsWith('HP-'))
        };

        // Renderizar cada categoria
        Object.entries(categorias).forEach(([prefixo, lista]) => {
            const containerId = `grid-${prefixo.toLowerCase()}`;
            this.renderizarGrupoEquipamentos(containerId, lista);
        });
    }

    /**
     * Renderizar um grupo específico de equipamentos
     */
    renderizarGrupoEquipamentos(containerId, equipamentos) {
        const container = document.getElementById(containerId);
        if (!container) {
            if (this.debugMode) {
                console.warn(`Container ${containerId} não encontrado`);
            }
            return;
        }

        // Ordenar equipamentos por código
        equipamentos.sort((a, b) => a.Codigo.localeCompare(b.Codigo));

        // Limpar container
        container.innerHTML = '';

        // Criar cards dos equipamentos
        equipamentos.forEach(equip => {
            const card = this.criarCardEquipamento(equip);
            container.appendChild(card);
        });
    }

    /**
     * Criar card de um equipamento
     */
    criarCardEquipamento(equip) {
        const card = document.createElement('div');
        card.className = `equipamento-card status-${equip.Status.toLowerCase().replace('_', '-')}`;
        
        const statusTexto = obterLabelStatus(equip.Status);
        const primeiroRegistro = equip.Primeiro_Registro ? 
            this.formatarHora(equip.Primeiro_Registro) : 'Sem registro';

        card.innerHTML = `
            <div class="equipamento-codigo">${equip.Codigo}</div>
            <div class="equipamento-status">${statusTexto}</div>
            <div class="equipamento-info">${equip.Total_Registros} registros</div>
            <div class="equipamento-info">${primeiroRegistro}</div>
        `;

        // Adicionar evento de clique para detalhes
        card.addEventListener('click', () => {
            this.mostrarDetalhesEquipamento(equip);
        });

        // Adicionar animação de entrada
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, Math.random() * 200);

        return card;
    }

    /**
     * Mostrar detalhes de um equipamento
     */
    mostrarDetalhesEquipamento(equip) {
        const detalhes = `
Equipamento: ${equip.Codigo}
Nome: ${equip.Nome}
Status: ${obterLabelStatus(equip.Status)}
Registros: ${equip.Total_Registros}
Primeiro: ${equip.Primeiro_Registro ? this.formatarHora(equip.Primeiro_Registro) : 'Nenhum'}
Turno: ${equip.Turno}
Observação: ${equip.Observacao || 'Nenhuma'}
Última Atualização: ${this.formatarDataHora(equip.Ultima_Atualizacao)}
        `;
        
        if (this.debugMode) {
            console.log('Detalhes do equipamento:', equip);
        }
        
        alert(detalhes);
    }

    /**
     * Renderizar lista de alertas
     */
    renderizarAlertas(equipamentos) {
        const container = document.getElementById('lista-alertas');
        if (!container) return;

        // Filtrar apenas equipamentos com problemas
        const problemas = equipamentos.filter(e => e.Status !== 'OK')
            .sort((a, b) => obterPrioridadeStatus(b.Status) - obterPrioridadeStatus(a.Status));

        // Limpar container
        container.innerHTML = '';

        if (problemas.length === 0) {
            container.innerHTML = this.criarEstadoVazio();
            return;
        }

        // Criar alertas
        problemas.forEach((equip, index) => {
            const alerta = this.criarItemAlerta(equip);
            
            // Animação de entrada escalonada
            alerta.style.opacity = '0';
            alerta.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                alerta.style.transition = 'all 0.3s ease';
                alerta.style.opacity = '1';
                alerta.style.transform = 'translateX(0)';
            }, index * 100);
            
            container.appendChild(alerta);
        });
    }

    /**
     * Criar item de alerta
     */
    criarItemAlerta(equip) {
        const alerta = document.createElement('div');
        
        // Determinar classe do alerta baseada no status
        let classeAlerta = 'alerta-tardio';
        if (equip.Status === 'SEM_REGISTRO' || equip.Status === 'CRITICO') {
            classeAlerta = 'alerta-critico';
        } else if (equip.Status === 'POUCOS_REGISTROS') {
            classeAlerta = 'alerta-poucos';
        }
        
        alerta.className = `alerta-item ${classeAlerta}`;

        const icone = this.obterIconeStatus(equip.Status);
        const descricao = equip.Observacao || this.obterDescricaoProblema(equip);

        alerta.innerHTML = `
            <div class="alerta-titulo">
                <i class="${icone}"></i>
                ${equip.Codigo} - ${obterLabelStatus(equip.Status)}
            </div>
            <div class="alerta-detalhes">${descricao}</div>
            ${equip.Primeiro_Registro ? 
                `<div class="alerta-detalhes">Primeiro registro: ${this.formatarHora(equip.Primeiro_Registro)}</div>` : 
                ''
            }
        `;

        // Adicionar evento de clique
        alerta.addEventListener('click', () => {
            this.mostrarDetalhesEquipamento(equip);
        });

        return alerta;
    }

    /**
     * Criar estado vazio (sem problemas)
     */
    criarEstadoVazio() {
        return `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>Todos os equipamentos estão funcionando normalmente!</h3>
                <p>Nenhum problema detectado nos apontamentos.</p>
            </div>
        `;
    }

    /**
     * Obter ícone do status
     */
    obterIconeStatus(status) {
        const icones = {
            'SEM_REGISTRO': 'fas fa-exclamation-triangle',
            'CRITICO': 'fas fa-exclamation-circle',
            'TARDIO': 'fas fa-clock',
            'POUCOS_REGISTROS': 'fas fa-search',
            'OK': 'fas fa-check-circle'
        };
        return icones[status] || 'fas fa-question-circle';
    }

    /**
     * Obter descrição do problema
     */
    obterDescricaoProblema(equip) {
        switch (equip.Status) {
            case 'SEM_REGISTRO':
                return 'Nenhum apontamento registrado hoje';
            case 'CRITICO':
                return 'Primeiro registro muito tardio - requer atenção imediata';
            case 'TARDIO':
                return 'Primeiro registro feito após 7:30h';
            case 'POUCOS_REGISTROS':
                return `Apenas ${equip.Total_Registros} apontamento(s) registrado(s)`;
            default:
                return 'Status desconhecido';
        }
    }

    /**
     * Iniciar atualização automática
     */
    iniciarAutoUpdate() {
        // Limpar interval anterior se existir
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }

        this.autoUpdateInterval = setInterval(() => {
            if (this.debugMode) {
                console.log('🔄 Atualização automática iniciada');
            }
            this.carregarDados();
        }, this.updateInterval);

        if (this.debugMode) {
            console.log(`⏰ Auto-update configurado para ${this.updateInterval / 60000} minutos`);
        }
    }

    /**
     * Parar atualização automática
     */
    pararAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
            if (this.debugMode) {
                console.log('⏹️ Auto-update parado');
            }
        }
    }

    /**
     * Atualizar timestamp da última atualização
     */
    atualizarTimestamp() {
        const elemento = document.getElementById('ultima-atualizacao');
        if (elemento) {
            const agora = new Date();
            elemento.textContent = `Atualizado: ${agora.toLocaleTimeString(UI_CONFIG.DATE_FORMAT)}`;
        }
    }

    /**
     * Mostrar loader
     */
    mostrarLoader(forceShow = false) {
        const loader = document.getElementById('main-loader');
        if (loader && (forceShow || !this.dados)) {
            loader.style.display = 'block';
        }

        // Atualizar ícone do botão
        const btnIcon = document.querySelector('#btn-atualizar i');
        if (btnIcon) {
            btnIcon.className = 'fas fa-spinner fa-spin';
        }
    }

    /**
     * Esconder loader
     */
    esconderLoader() {
        const loader = document.getElementById('main-loader');
        if (loader) {
            loader.style.display = 'none';
        }

        // Restaurar ícone do botão
        const btnIcon = document.querySelector('#btn-atualizar i');
        if (btnIcon) {
            btnIcon.className = 'fas fa-sync-alt';
        }
    }

    /**
     * Mostrar mensagem de erro
     */
    mostrarErro(mensagem) {
        console.error(mensagem);
        
        // Mostrar notificação visual (simples)
        const alertas = document.getElementById('lista-alertas');
        if (alertas) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alerta-item alerta-critico';
            errorDiv.innerHTML = `
                <div class="alerta-titulo">
                    <i class="fas fa-exclamation-triangle"></i>
                    Erro de Conexão
                </div>
                <div class="alerta-detalhes">${mensagem}</div>
            `;
            
            alertas.insertBefore(errorDiv, alertas.firstChild);
            
            // Remover após 10 segundos
            setTimeout(() => {
                errorDiv.remove();
            }, 10000);
        }
    }

    /**
     * Alternar entre dados reais e simulados
     */
    alternarDadosSimulados() {
        this.usarDadosSimulados = !this.usarDadosSimulados;
        CONFIG_FRONTEND.USE_MOCK_DATA = this.usarDadosSimulados;
        
        console.log(`🎭 Dados simulados: ${this.usarDadosSimulados ? 'ATIVADO' : 'DESATIVADO'}`);
        this.carregarDados(true);
    }

    /**
     * Carregar lista base de equipamentos
     */
    carregarEquipamentosBase() {
        return [
            // ALTA PRESSÃO (12 equipamentos)
            { codigo: 'AP-01', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 01 - 24 HS', turno: '24h' },
            { codigo: 'AP-02', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 02', turno: 'normal' },
            { codigo: 'AP-03', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 03', turno: 'normal' },
            { codigo: 'AP-04', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 04', turno: 'normal' },
            { codigo: 'AP-05', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 05', turno: 'normal' },
            { codigo: 'AP-06', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 06', turno: 'normal' },
            { codigo: 'AP-07', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 07', turno: 'normal' },
            { codigo: 'AP-08', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 08 - 24 HS', turno: '24h' },
            { codigo: 'AP-09', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 09', turno: 'normal' },
            { codigo: 'AP-10', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 10', turno: 'normal' },
            { codigo: 'AP-11', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 11', turno: 'normal' },
            { codigo: 'AP-12', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 12', turno: 'normal' },

            // AUTO VÁCUO (10 equipamentos)
            { codigo: 'AV-01', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 01 - 16 HS', turno: '16h' },
            { codigo: 'AV-02', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 02 - 16 HS', turno: '16h' },
            { codigo: 'AV-03', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 03', turno: 'normal' },
            { codigo: 'AV-04', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 04', turno: 'normal' },
            { codigo: 'AV-05', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 05', turno: 'normal' },
            { codigo: 'AV-06', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 06', turno: 'normal' },
            { codigo: 'AV-07', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 07', turno: 'normal' },
            { codigo: 'AV-08', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 08 - 24 HS', turno: '24h' },
            { codigo: 'AV-09', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 09', turno: 'normal' },
            { codigo: 'AV-10', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 10', turno: 'normal' },

            // HIPER VÁCUO (2 equipamentos)
            { codigo: 'HP-01', nome: 'CAMINHÃO HIPER VÁCUO - GPS - 01', turno: 'normal' },
            { codigo: 'HP-02', nome: 'CAMINHÃO HIPER VÁCUO - GPS - 02', turno: 'normal' }
        ];
    }

    /**
     * Formatadores
     */
    formatarHora(timestamp) {
        if (!timestamp) return '';
        const data = new Date(timestamp);
        return data.toLocaleTimeString(UI_CONFIG.DATE_FORMAT, UI_CONFIG.TIME_FORMAT);
    }

    formatarDataHora(timestamp) {
        if (!timestamp) return '';
        const data = new Date(timestamp);
        return data.toLocaleString(UI_CONFIG.DATE_FORMAT);
    }

    /**
     * Mostrar informações do sistema
     */
    mostrarInfoSistema() {
        console.log(`
🚛 Monitor Usiminas v${CONFIG_FRONTEND.VERSION}
════════════════════════════════════════════════
📊 Equipamentos monitorados: ${this.equipamentosBase.length}
⏰ Auto-update: ${this.updateInterval / 60000} min
🕐 Horário limite: ${EQUIPAMENTOS_CONFIG.HORA_LIMITE}
📈 Timeout: ${CONFIG_FRONTEND.REQUEST_TIMEOUT / 1000}s
🧪 Dados simulados: ${this.usarDadosSimulados ? 'SIM' : 'NÃO'}
🐛 Debug mode: ${this.debugMode ? 'SIM' : 'NÃO'}

💡 Atalhos:
   F5 / Ctrl+R: Atualizar dados
   Ctrl+Shift+D: Alternar dados simulados

🔧 Comandos no console:
   monitor.pause() - Pausar updates
   monitor.resume() - Retomar updates
   monitor.getDados() - Ver dados atuais
   monitor.alternarDadosSimulados() - Trocar modo
        `);
    }

    /**
     * Métodos públicos para controle externo
     */
    pause() {
        this.pararAutoUpdate();
        console.log('⏸️ Monitor pausado');
    }

    resume() {
        this.iniciarAutoUpdate();
        console.log('▶️ Monitor retomado');
    }

    getDados() {
        return this.dados;
    }

    getStatus() {
        return {
            isLoading: this.isLoading,
            ultimaAtualizacao: this.ultimaAtualizacao,
            tentativasErro: this.tentativasErro,
            usarDadosSimulados: this.usarDadosSimulados,
            totalEquipamentos: this.equipamentosBase.length,
            autoUpdateAtivo: !!this.autoUpdateInterval
        };
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Disponibilizar globalmente
window.MonitorUsiminas = MonitorUsiminas;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.monitor = new MonitorUsiminas();
    
    // Disponibilizar comandos de conveniência
    window.pauseMonitor = () => window.monitor.pause();
    window.resumeMonitor = () => window.monitor.resume();
    window.getMonitorStatus = () => window.monitor.getStatus();
    window.forceUpdate = () => window.monitor.carregarDados(true);
});

// Limpeza quando a página for descarregada
window.addEventListener('beforeunload', () => {
    if (window.monitor) {
        window.monitor.pause();
    }
});
