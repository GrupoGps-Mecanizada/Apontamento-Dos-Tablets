/**
 * Monitor Usiminas - Sistema de Monitoramento de Apontamentos
 * Baseado no guia completo do projeto
 */

class MonitorUsiminas {
    constructor() {
        // Configuração da API
        this.apiUrl = 'https://script.google.com/macros/s/SEU_SCRIPT_ID/exec';
        
        // Lista dos equipamentos conforme o guia
        this.equipamentosBase = this.carregarEquipamentosBase();
        
        // Dados atuais
        this.dados = null;
        this.ultimaAtualizacao = null;
        
        // Estado da aplicação
        this.autoUpdateInterval = null;
        this.isLoading = false;
        
        // Configurações
        this.config = {
            autoUpdateInterval: 5 * 60 * 1000, // 5 minutos
            horaLimite: '07:30', // Horário limite para apontamentos
            minRegistros: 3, // Mínimo de registros esperados
            usarDadosSimulados: true // Para desenvolvimento
        };

        this.init();
    }

    /**
     * Inicialização do sistema
     */
    init() {
        console.log('🚀 Iniciando Monitor Usiminas...');
        this.configurarEventos();
        this.carregarDados();
        this.iniciarAutoUpdate();
        
        // Mostrar versão e configurações no console
        this.mostrarInfoSistema();
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
                this.config.usarDadosSimulados = !this.config.usarDadosSimulados;
                console.log(`Dados simulados: ${this.config.usarDadosSimulados ? 'ATIVADO' : 'DESATIVADO'}`);
                this.carregarDados(true);
            }
        });

        // Detectar quando a aba fica visível novamente
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Verificar se os dados estão muito antigos
                if (this.ultimaAtualizacao) {
                    const agora = new Date();
                    const diferenca = agora - this.ultimaAtualizacao;
                    if (diferenca > this.config.autoUpdateInterval) {
                        console.log('🔄 Dados antigos detectados, atualizando...');
                        this.carregarDados();
                    }
                }
            }
        });
    }

    /**
     * Carregar dados dos equipamentos
     */
    async carregarDados(forceUpdate = false) {
        if (this.isLoading && !forceUpdate) {
            console.log('⏳ Carregamento já em andamento...');
            return;
        }

        this.isLoading = true;
        this.mostrarLoader(forceUpdate);

        try {
            let dados;

            if (this.config.usarDadosSimulados) {
                // Usar dados simulados para desenvolvimento
                dados = await this.gerarDadosSimulados();
            } else {
                // Buscar dados reais da API
                dados = await this.buscarDadosAPI();
            }

            this.dados = dados;
            this.ultimaAtualizacao = new Date();
            
            this.renderizarDados(dados);
            this.atualizarTimestamp();
            
            console.log(`✅ Dados carregados com sucesso (${dados.equipamentos.length} equipamentos)`);

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.mostrarErro('Erro ao carregar dados. Tentando novamente em 30 segundos...');
            
            // Tentar novamente em 30 segundos
            setTimeout(() => this.carregarDados(), 30000);
        } finally {
            this.isLoading = false;
            this.esconderLoader();
        }
    }

    /**
     * Buscar dados da API do Google Apps Script
     */
    async buscarDadosAPI() {
        const response = await fetch(this.apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }

        const dados = await response.json();
        
        if (dados.error) {
            throw new Error(`Erro da API: ${dados.error}`);
        }

        return dados;
    }

    /**
     * Gerar dados simulados para desenvolvimento
     */
    async gerarDadosSimulados() {
        // Simular delay da rede
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

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
        this.equipamentosBase.forEach((equip, index) => {
            const statusAleatorio = this.gerarStatusAleatorio();
            const registros = this.gerarRegistrosAleatorios(statusAleatorio);
            
            const equipamento = {
                Codigo: equip.codigo,
                Nome: equip.nome,
                Status: statusAleatorio,
                Total_Registros: registros.total,
                Primeiro_Registro: registros.primeiro,
                Turno: equip.turno,
                Observacao: this.gerarObservacao(statusAleatorio, registros.total)
            };

            equipamentos.push(equipamento);

            // Contar estatísticas
            switch (statusAleatorio) {
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
                horaLimite: this.config.horaLimite,
                minRegistros: this.config.minRegistros
            }
        };
    }

    /**
     * Gerar status aleatório para simulação
     */
    gerarStatusAleatorio() {
        const probabilidades = [
            { status: 'OK', peso: 0.6 },
            { status: 'TARDIO', peso: 0.15 },
            { status: 'POUCOS_REGISTROS', peso: 0.12 },
            { status: 'SEM_REGISTRO', peso: 0.08 },
            { status: 'CRITICO', peso: 0.05 }
        ];

        const random = Math.random();
        let acumulado = 0;

        for (const prob of probabilidades) {
            acumulado += prob.peso;
            if (random <= acumulado) {
                return prob.status;
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
                horaTardio.setHours(7, 30 + Math.random() * 120, Math.random() * 60); // Entre 7:30 e 9:30
                return {
                    total: Math.floor(Math.random() * 6) + 3, // 3-8 registros
                    primeiro: horaTardio.toISOString()
                };
                
            case 'POUCOS_REGISTROS':
                const horaPoucos = new Date(hoje);
                horaPoucos.setHours(6, 30 + Math.random() * 60, Math.random() * 60); // Entre 6:30 e 7:30
                return {
                    total: Math.floor(Math.random() * 2) + 1, // 1-2 registros
                    primeiro: horaPoucos.toISOString()
                };
                
            case 'CRITICO':
                const horaCritico = new Date(hoje);
                horaCritico.setHours(8, 30 + Math.random() * 120, Math.random() * 60); // Após 8:30
                return {
                    total: Math.floor(Math.random() * 3) + 1, // 1-3 registros
                    primeiro: horaCritico.toISOString()
                };
                
            case 'OK':
            default:
                const horaOK = new Date(hoje);
                horaOK.setHours(6, Math.random() * 90, Math.random() * 60); // Entre 6:00 e 7:30
                return {
                    total: Math.floor(Math.random() * 10) + 5, // 5-14 registros
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
        const diferenca = novoValor - valorAtual;
        const duracao = 500; // ms
        const steps = 20;
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
            console.warn(`Container ${containerId} não encontrado`);
            return;
        }

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
        
        const statusTexto = this.formatarStatus(equip.Status);
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

        return card;
    }

    /**
     * Mostrar detalhes de um equipamento em modal
     */
    mostrarDetalhesEquipamento(equip) {
        // TODO: Implementar modal de detalhes
        console.log('Detalhes do equipamento:', equip);
        
        alert(`Equipamento: ${equip.Codigo}\n` +
              `Status: ${this.formatarStatus(equip.Status)}\n` +
              `Registros: ${equip.Total_Registros}\n` +
              `Primeiro: ${equip.Primeiro_Registro ? this.formatarHora(equip.Primeiro_Registro) : 'Nenhum'}\n` +
              `Observação: ${equip.Observacao || 'Nenhuma'}`);
    }

    /**
     * Renderizar lista de alertas
     */
    renderizarAlertas(equipamentos) {
        const container = document.getElementById('lista-alertas');
        if (!container) return;

        // Filtrar apenas equipamentos com problemas
        const problemas = equipamentos.filter(e => e.Status !== 'OK')
            .sort((a, b) => this.obterPrioridadeStatus(b.Status) - this.obterPrioridadeStatus(a.Status));

        // Limpar container
        container.innerHTML = '';

        if (problemas.length === 0) {
            container.innerHTML = this.criarEstadoVazio();
            return;
        }

        // Criar alertas
        problemas.forEach(equip => {
            const alerta = this.criarItemAlerta(equip);
            container.appendChild(alerta);
        });
    }

    /**
     * Obter prioridade numérica do status
     */
    obterPrioridadeStatus(status) {
        const prioridades = {
            'SEM_REGISTRO': 4,
            'CRITICO': 3,
            'POUCOS_REGISTROS': 2,
            'TARDIO': 1
        };
        return prioridades[status] || 0;
    }

    /**
     * Criar item de alerta
     */
    criarItemAlerta(equip) {
        const alerta = document.createElement('div');
        alerta.className = `alerta-item alerta-${this.obterClasseAlerta(equip.Status)}`;

        const icone = this.obterIconeStatus(equip.Status);
        const descricao = equip.Observacao || this.obterDescricaoProblema(equip);

        alerta.innerHTML = `
            <div class="alerta-titulo">
                <i class="${icone}"></i>
                ${equip.Codigo} - ${this.formatarStatus(equip.Status)}
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
     * Iniciar atualização automática
     */
    iniciarAutoUpdate() {
        // Limpar interval anterior se existir
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }

        this.autoUpdateInterval = setInterval(() => {
            console.log('🔄 Atualização automática iniciada');
            this.carregarDados();
        }, this.config.autoUpdateInterval);

        console.log(`⏰ Auto-update configurado para ${this.config.autoUpdateInterval / 60000} minutos`);
    }

    /**
     * Parar atualização automática
     */
    pararAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
            console.log('⏹️ Auto-update parado');
        }
    }

    /**
     * Atualizar timestamp da última atualização
     */
    atualizarTimestamp() {
        const elemento = document.getElementById('ultima-atualizacao');
        if (elemento) {
            const agora = new Date();
            elemento.textContent = `Atualizado: ${agora.toLocaleTimeString('pt-BR')}`;
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
        
        // TODO: Implementar sistema de notificações
        // Por enquanto, usar console e alert em casos críticos
        if (mensagem.includes('crítico') || mensagem.includes('falha')) {
            alert(mensagem);
        }
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
     * Formatadores e utilitários
     */
    formatarStatus(status) {
        const mapa = {
            'OK': '✅ Funcionando',
            'TARDIO': '⚠️ Tardio',
            'SEM_REGISTRO': '❌ Sem Registro',
            'POUCOS_REGISTROS': '🔍 Poucos Registros',
            'CRITICO': '🚨 Crítico'
        };
        return mapa[status] || status;
    }

    obterClasseAlerta(status) {
        const mapa = {
            'SEM_REGISTRO': 'critico',
            'CRITICO': 'critico',
            'TARDIO': 'tardio',
            'POUCOS_REGISTROS': 'poucos'
        };
        return mapa[status] || 'tardio';
    }

    obterIconeStatus(status) {
        const mapa = {
            'SEM_REGISTRO': 'fas fa-exclamation-triangle',
            'CRITICO': 'fas fa-exclamation-circle',
            'TARDIO': 'fas fa-clock',
            'POUCOS_REGISTROS': 'fas fa-search'
        };
        return mapa[status] || 'fas fa-question-circle';
    }

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

    formatarHora(timestamp) {
        if (!timestamp) return '';
        const data = new Date(timestamp);
        return data.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Mostrar informações do sistema no console
     */
    mostrarInfoSistema() {
        console.log(`
🚛 Monitor Usiminas v1.0
════════════════════════
📊 Equipamentos monitorados: ${this.equipamentosBase.length}
⏰ Auto-update: ${this.config.autoUpdateInterval / 60000} min
🕐 Horário limite: ${this.config.horaLimite}
📈 Mín. registros: ${this.config.minRegistros}
🧪 Dados simulados: ${this.config.usarDadosSimulados ? 'SIM' : 'NÃO'}

💡 Atalhos:
   F5 / Ctrl+R: Atualizar dados
   Ctrl+Shift+D: Alternar dados simulados
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

    getConfig() {
        return { ...this.config };
    }

    setConfig(novaConfig) {
        this.config = { ...this.config, ...novaConfig };
        console.log('⚙️ Configuração atualizada:', this.config);
        
        // Reiniciar auto-update se o intervalo mudou
        if (novaConfig.autoUpdateInterval) {
            this.iniciarAutoUpdate();
        }
    }
}

// Disponibilizar globalmente para depuração
window.MonitorUsiminas = MonitorUsiminas;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.monitor = new MonitorUsiminas();
});

// Limpeza quando a página for descarregada
window.addEventListener('beforeunload', () => {
    if (window.monitor) {
        window.monitor.pause();
    }
});
