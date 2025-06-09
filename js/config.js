/**
 * CONFIGURAÇÕES DO SISTEMA DE MONITORAMENTO GRUPOGPS
 * Arquivo: /js/config.js
 */

// ============================================================================
// CONFIGURAÇÕES PRINCIPAIS
// ============================================================================

const CONFIG = {
    // URL do Google Apps Script (substitua pela sua URL)
    API_URL: 'https://script.google.com/macros/s/SEU_SCRIPT_ID_AQUI/exec',
    
    // URL da página GaussFleet para extração
    GAUSSFLEET_URL: 'https://usiminas.gaussfleet.com/dashboard',
    
    // Configurações gerais
    VERSION: '2.0.0',
    SYSTEM_NAME: 'Sistema de Monitoramento GrupoGPS',
    UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutos
    
    // Configurações de horários
    HORA_LIMITE_NORMAL: '07:30',
    HORA_LIMITE_CRITICO: '09:00',
    MIN_REGISTROS: 3,
    
    // Configurações de debug
    DEBUG_MODE: true,
    USE_MOCK_DATA: true, // Mude para false quando conectar com API real
    CONSOLE_LOGS: true,
    
    // Configurações da API
    API_TIMEOUT: 30000, // 30 segundos
    API_RETRY_ATTEMPTS: 3,
    API_RETRY_DELAY: 2000, // 2 segundos
    
    // Configurações de armazenamento local
    STORAGE_PREFIX: 'grupogps_',
    AUTO_SAVE: true,
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutos
    
    // Configurações de contato
    DEFAULT_PHONE_FORMAT: '(##) #####-####',
    AUTO_PHONE_FORMAT: true,
    
    // Configurações de interface
    AUTO_REFRESH: true,
    SHOW_NOTIFICATIONS: true,
    COMPACT_MODE: false,
    
    // Configurações de extração de dados
    EXTRACTOR_CONFIG: {
        intervaloExtracaoMinutos: 3,
        intervaloEnvioMinutos: 5,
        metodoEnvio: 'webhook',
        debug: true
    }
};

// ============================================================================
// ESTRUTURA DE EQUIPAMENTOS (CORRIGIDA)
// ============================================================================

const EQUIPAMENTOS_BASE = {
    // Lista de todos os equipamentos esperados
    lista: [
        // ALTA PRESSÃO (12 equipamentos)
        { codigo: 'AP-01', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 01 - 24 HS', tipo: 'AP', turno: '24h' },
        { codigo: 'AP-02', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 02', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-03', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 03', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-04', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 04', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-05', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 05', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-06', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 06', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-07', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 07', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-08', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 08 - 24 HS', tipo: 'AP', turno: '24h' },
        { codigo: 'AP-09', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 09', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-10', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 10', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-11', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 11', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-12', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 12', tipo: 'AP', turno: 'normal' },

        // AUTO VÁCUO (10 equipamentos)
        { codigo: 'AV-01', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 01 - 16 HS', tipo: 'AV', turno: '16h' },
        { codigo: 'AV-02', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 02 - 16 HS', tipo: 'AV', turno: '16h' },
        { codigo: 'AV-03', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 03', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-04', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 04', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-05', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 05', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-06', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 06', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-07', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 07', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-08', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 08 - 24 HS', tipo: 'AV', turno: '24h' },
        { codigo: 'AV-09', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 09', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-10', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 10', tipo: 'AV', turno: 'normal' },

        // HIPER VÁCUO (2 equipamentos)
        { codigo: 'HP-01', nome: 'CAMINHÃO HIPER VÁCUO - GPS - 01', tipo: 'HP', turno: 'normal' },
        { codigo: 'HP-02', nome: 'CAMINHÃO HIPER VÁCUO - GPS - 02', tipo: 'HP', turno: 'normal' }
    ],
    
    // Categorias de equipamentos
    categorias: {
        'AP': {
            nome: 'Alta Pressão',
            icon: 'fas fa-tint',
            cor: '#1e3a8a',
            total: 12
        },
        'AV': {
            nome: 'Auto Vácuo',
            icon: 'fas fa-wind',
            cor: '#0891b2',
            total: 10
        },
        'HP': {
            nome: 'Hiper Vácuo',
            icon: 'fas fa-fan',
            cor: '#16a34a',
            total: 2
        }
    }
};

// ============================================================================
// CONFIGURAÇÕES DE STATUS (ATUALIZADAS)
// ============================================================================

const STATUS_CONFIG = {
    tipos: {
        'OK': {
            label: 'Normal',
            icon: 'fas fa-check-circle',
            cor: '#16a34a',
            prioridade: 0,
            descricao: 'Funcionando normalmente'
        },
        'TARDIO': {
            label: 'Tardio',
            icon: 'fas fa-clock',
            cor: '#f59e0b',
            prioridade: 1,
            descricao: 'Apontamentos tardios'
        },
        'POUCOS': {
            label: 'Poucos Registros',
            icon: 'fas fa-search',
            cor: '#0891b2',
            prioridade: 2,
            descricao: 'Quantidade insuficiente de registros'
        },
        'CRITICO': {
            label: 'Crítico',
            icon: 'fas fa-exclamation-triangle',
            cor: '#dc2626',
            prioridade: 3,
            descricao: 'Requer atenção imediata'
        }
    },
    
    // Critérios para definição de status (sem primeiro registro)
    criterios: {
        minRegistros: 3,
        maxTempoNormal: 60, // minutos
        maxTempoAtencao: 90, // minutos
        horarioLimite: '07:30',
        horarioCritico: '09:00'
    }
};

// ============================================================================
// DADOS SIMULADOS (ATUALIZADOS)
// ============================================================================

const DADOS_SIMULADOS = {
    enabled: CONFIG.USE_MOCK_DATA,
    
    // Dados baseados na estrutura correta
    equipamentos: {
        'AP-01': {
            codigo: 'AP-01',
            status: 'CRITICO',
            totalApontamentos: 2,
            apontamentos: [
                { categoria: 'Preparação', inicio: '11:05', fim: '11:17', tempo: '00:12' },
                { categoria: 'Refeição Motorista', inicio: '12:46', fim: '14:28', tempo: '01:42' }
            ]
        },
        'AP-02': {
            codigo: 'AP-02',
            status: 'TARDIO',
            totalApontamentos: 8,
            apontamentos: [
                { categoria: 'Abastecimento', inicio: '08:21', fim: '08:31', tempo: '00:10' },
                { categoria: 'Documentação', inicio: '08:31', fim: '09:28', tempo: '00:57' },
                { categoria: 'Bloqueio', inicio: '09:29', fim: '10:00', tempo: '00:32' }
            ]
        }
    }
};

// ============================================================================
// EXTRATOR DE DADOS (NOVO)
// ============================================================================

const EXTRACTOR_CONFIG = {
    // URLs para envio
    webhookUrl: CONFIG.API_URL,
    
    // Seletores para extração
    selectors: {
        agGrid: '.ag-root-wrapper',
        rows: '.ag-row',
        cells: '.ag-cell',
        tableBody: 'tbody tr',
        fallback: 'table tr'
    },
    
    // Campos esperados
    campos: {
        placa: 'Placa',
        vaga: 'Vaga',
        categoria: 'Categoria Demora',
        dataInicial: 'Data Inicial',
        dataFinal: 'Data Final',
        tempo: 'Tempo Indisponível'
    }
};

// ============================================================================
// LÓGICA INTELIGENTE DE STATUS
// ============================================================================

const STATUS_LOGIC = {
    /**
     * Calcular status com base nos apontamentos do dia
     */
    calcularStatus: function(equipamento) {
        if (!equipamento || !equipamento.apontamentos) {
            return 'CRITICO'; // Sem dados
        }
        
        const apontamentos = equipamento.apontamentos;
        const totalRegistros = apontamentos.length;
        
        // Critério 1: Sem registros = CRÍTICO
        if (totalRegistros === 0) {
            return 'CRITICO';
        }
        
        // Critério 2: Poucos registros = POUCOS
        if (totalRegistros < STATUS_CONFIG.criterios.minRegistros) {
            return 'POUCOS';
        }
        
        // Critério 3: Verificar horários tardios
        const registrosTardios = this.verificarRegistrosTardios(apontamentos);
        if (registrosTardios.criticos > 0) {
            return 'CRITICO';
        }
        
        if (registrosTardios.tardios > 0) {
            return 'TARDIO';
        }
        
        // Critério 4: Verificar tempos excessivos
        const temposExcessivos = this.verificarTemposExcessivos(apontamentos);
        if (temposExcessivos > 0) {
            return 'TARDIO';
        }
        
        return 'OK';
    },
    
    /**
     * Verificar registros tardios
     */
    verificarRegistrosTardios: function(apontamentos) {
        const hoje = new Date();
        const limiteNormal = this.criarHorario(STATUS_CONFIG.criterios.horarioLimite);
        const limiteCritico = this.criarHorario(STATUS_CONFIG.criterios.horarioCritico);
        
        let tardios = 0;
        let criticos = 0;
        
        apontamentos.forEach(apt => {
            const horaInicio = this.extrairHora(apt.inicio);
            if (horaInicio) {
                const horarioApt = this.criarHorario(horaInicio);
                
                if (horarioApt > limiteCritico) {
                    criticos++;
                } else if (horarioApt > limiteNormal) {
                    tardios++;
                }
            }
        });
        
        return { tardios, criticos };
    },
    
    /**
     * Verificar tempos excessivos
     */
    verificarTemposExcessivos: function(apontamentos) {
        let excessivos = 0;
        const limiteMinutos = STATUS_CONFIG.criterios.maxTempoAtencao;
        
        apontamentos.forEach(apt => {
            const minutos = this.tempoParaMinutos(apt.tempo);
            if (minutos > limiteMinutos) {
                excessivos++;
            }
        });
        
        return excessivos;
    },
    
    /**
     * Utilitários
     */
    criarHorario: function(horarioStr) {
        const [hora, minuto] = horarioStr.split(':').map(Number);
        const hoje = new Date();
        return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), hora, minuto);
    },
    
    extrairHora: function(timestamp) {
        if (!timestamp) return null;
        if (timestamp.includes(':')) {
            return timestamp.split(' ')[1] || timestamp;
        }
        return null;
    },
    
    tempoParaMinutos: function(tempo) {
        if (!tempo || tempo === '--') return 0;
        const [h, m] = tempo.split(':').map(Number);
        return h * 60 + m;
    }
};

// ============================================================================
// VALIDAÇÕES (ATUALIZADAS)
// ============================================================================

const VALIDATORS = {
    validateConfig: function() {
        const errors = [];
        
        if (CONFIG.API_URL.includes('SEU_SCRIPT_ID_AQUI')) {
            // Não é mais erro crítico, pode usar dados simulados
        }
        
        if (!this.isValidTime(CONFIG.HORA_LIMITE_NORMAL)) {
            errors.push('Horário limite normal inválido');
        }
        
        if (!this.isValidTime(CONFIG.HORA_LIMITE_CRITICO)) {
            errors.push('Horário limite crítico inválido');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    isValidTime: function(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    },
    
    isValidPhone: function(phone) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(phone);
    },
    
    isValidEquipmentCode: function(code) {
        const codeRegex = /^(AP|AV|HP)-\d{2}$/;
        return codeRegex.test(code);
    }
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    CONFIG_UTILS.load();
    
    const validation = VALIDATORS.validateConfig();
    
    if (CONFIG.DEBUG_MODE && CONFIG.CONSOLE_LOGS) {
        console.log('🔧 Sistema de Monitoramento GrupoGPS v' + CONFIG.VERSION);
        console.log('📊 Equipamentos cadastrados:', EQUIPAMENTOS_BASE.lista.length);
        console.log('✅ Configuração válida:', validation.valid);
        
        if (!validation.valid && validation.errors.length > 0) {
            console.warn('⚠️ Avisos de configuração:', validation.errors);
        }
    }
});

// ============================================================================
// EXPORTAÇÕES GLOBAIS
// ============================================================================

window.CONFIG = CONFIG;
window.EQUIPAMENTOS_BASE = EQUIPAMENTOS_BASE;
window.STATUS_CONFIG = STATUS_CONFIG;
window.DADOS_SIMULADOS = DADOS_SIMULADOS;
window.EXTRACTOR_CONFIG = EXTRACTOR_CONFIG;
window.STATUS_LOGIC = STATUS_LOGIC;
window.VALIDATORS = VALIDATORS;
