/**
 * CONFIGURAÇÕES DO SISTEMA DE MONITORAMENTO GRUPOGPS
 * Arquivo: /js/config.js
 */

// ============================================================================
// CONFIGURAÇÕES PRINCIPAIS
// ============================================================================

const CONFIG = {
    // !!! ATENÇÃO: ATUALIZE ESTA URL COM A SUA URL DE IMPLANTAÇÃO DO GOOGLE APPS SCRIPT !!!
    API_URL: 'https://script.google.com/macros/s/AKfycbwluIO7K7K_keeuBvO-7on-Oo_ZK0AAPqC1LIcRWdWr3ZtMflN3sfdOYhvy5Q_bPtw/exec',

    GAUSSFLEET_URL: 'https://usiminas.gaussfleet.com/dashboard',

    VERSION: '2.1.0', // Versão atualizada
    SYSTEM_NAME: 'Sistema de Monitoramento GrupoGPS',
    UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutos

    HORA_LIMITE_NORMAL: '07:30',
    HORA_LIMITE_CRITICO: '09:00',
    MIN_REGISTROS: 3,

    DEBUG_MODE: true,
    USE_MOCK_DATA: false, // DEFINA COMO false PARA USAR A API REAL
    CONSOLE_LOGS: true,

    API_TIMEOUT: 30000, // 30 segundos
    API_RETRY_ATTEMPTS: 2, // Reduzido para testes mais rápidos, pode aumentar
    API_RETRY_DELAY: 3000, // 3 segundos

    STORAGE_PREFIX: 'grupogps_v2_', // Prefixo pode ser atualizado para nova versão
    AUTO_SAVE: true,
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutos

    DEFAULT_PHONE_FORMAT: '(##) #####-####',
    AUTO_PHONE_FORMAT: true,

    AUTO_REFRESH: true,
    SHOW_NOTIFICATIONS: true,
    COMPACT_MODE: false,
};

// ============================================================================
// ESTRUTURA DE EQUIPAMENTOS
// ============================================================================

const EQUIPAMENTOS_BASE = {
    lista: [
        // ALTA PRESSÃO (12 equipamentos)
        { codigo: 'AP-01', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 01 - 24 HS', tipo: 'AP', turno: '24h', placaOriginal: 'DSY6F81' },
        { codigo: 'AP-02', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 02', tipo: 'AP', turno: 'normal', placaOriginal: 'EGC2983' },
        { codigo: 'AP-03', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 03', tipo: 'AP', turno: 'normal', placaOriginal: 'EZS8764' },
        { codigo: 'AP-04', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 04', tipo: 'AP', turno: 'normal', placaOriginal: 'EAM3262' },
        { codigo: 'AP-05', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 05', tipo: 'AP', turno: 'normal', placaOriginal: 'DSY6475' },
        { codigo: 'AP-06', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 06', tipo: 'AP', turno: 'normal', placaOriginal: 'DSY6472' },
        { codigo: 'AP-07', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 07', tipo: 'AP', turno: 'normal', placaOriginal: 'EGC2978' },
        { codigo: 'AP-08', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 08 - 24 HS', tipo: 'AP', turno: '24h', placaOriginal: 'EGC2985' },
        { codigo: 'AP-09', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 09', tipo: 'AP', turno: 'normal', placaOriginal: 'EAM3256' },
        { codigo: 'AP-10', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 10', tipo: 'AP', turno: 'normal', placaOriginal: 'EOF5C06' },
        { codigo: 'AP-11', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 11', tipo: 'AP', turno: 'normal', placaOriginal: 'PUB2F80' },
        { codigo: 'AP-12', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 12', tipo: 'AP', turno: 'normal', placaOriginal: 'EZS8765' },

        // AUTO VÁCUO (10 equipamentos - ajustado para evitar duplicidade de placa AV-01 e AV-05)
        { codigo: 'AV-01', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 01 - 16 HS', tipo: 'AV', turno: '16h', placaOriginal: 'FSA3D71' }, // Assumindo que esta é a placa correta para AV-01
        { codigo: 'AV-02', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 02 - 16 HS', tipo: 'AV', turno: '16h', placaOriginal: 'ALY5322' },
        { codigo: 'AV-02-B', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 02 - 16 HS (B)', tipo: 'AV', turno: '16h', placaOriginal: 'EAM3257' }, // Nome diferenciado para AV-02-B
        { codigo: 'AV-03', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 03', tipo: 'AV', turno: 'normal', placaOriginal: 'HJS1097' },
        { codigo: 'AV-04', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 04', tipo: 'AV', turno: 'normal', placaOriginal: 'EGC2979' },
        { codigo: 'AV-05', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 05', tipo: 'AV', turno: 'normal', placaOriginal: 'GHI0123' }, // PLACA FICTÍCIA - PRECISA SER VERIFICADA/CORRIGIDA, FSA3D71 já usada
        { codigo: 'AV-06', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 06', tipo: 'AV', turno: 'normal', placaOriginal: 'DYB7210' },
        { codigo: 'AV-07', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 07', tipo: 'AV', turno: 'normal', placaOriginal: 'DSY6473' },
        { codigo: 'AV-08', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 08 - 24 HS', tipo: 'AV', turno: '24h', placaOriginal: 'ANF-2676' },
        { codigo: 'AV-09', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 09', tipo: 'AV', turno: 'normal', placaOriginal: 'EAM3251' },
        { codigo: 'AV-10', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 10', tipo: 'AV', turno: 'normal', placaOriginal: 'DSY6577' },

        // HIPER VÁCUO (2 equipamentos)
        { codigo: 'HP-01', nome: 'CAMINHÃO HIPER VÁCUO - GPS - 01', tipo: 'HP', turno: 'normal', placaOriginal: 'DSY6471' },
        { codigo: 'HP-02', nome: 'CAMINHÃO HIPER VÁCUO - GPS - 02', tipo: 'HP', turno: 'normal', placaOriginal: 'FMD2200' }
    ],
    categorias: {
        'AP': { nome: 'Alta Pressão', icon: 'fas fa-tint', cor: '#1e3a8a', total: 12 },
        'AV': { nome: 'Auto Vácuo', icon: 'fas fa-wind', cor: '#0891b2', total: 11 }, // Ajustado para 11 devido a AV-02-B
        'HP': { nome: 'Hiper Vácuo', icon: 'fas fa-fan', cor: '#16a34a', total: 2 }
    }
};

// ============================================================================
// CONFIGURAÇÕES DE STATUS
// ============================================================================
const STATUS_CONFIG = {
    tipos: {
        'OK': { label: 'Normal', icon: 'fas fa-check-circle', cor: '#16a34a', prioridade: 0, descricao: 'Funcionando normalmente' },
        'TARDIO': { label: 'Tardio', icon: 'fas fa-clock', cor: '#f59e0b', prioridade: 1, descricao: 'Apontamentos tardios' },
        'POUCOS': { label: 'Poucos Registros', icon: 'fas fa-search', cor: '#0891b2', prioridade: 2, descricao: 'Quantidade insuficiente de registros' },
        'CRITICO': { label: 'Crítico', icon: 'fas fa-exclamation-triangle', cor: '#dc2626', prioridade: 3, descricao: 'Requer atenção imediata' }
    },
    criterios: {
        minRegistros: 3,
        maxTempoNormal: 60, // minutos (usado em app.js getTempoClass)
        maxTempoAtencao: 90, // minutos (usado em app.js getTempoClass e STATUS_LOGIC)
        horarioLimite: '07:30', // Usado por STATUS_LOGIC
        horarioCritico: '09:00'  // Usado por STATUS_LOGIC
    }
};

// ============================================================================
// DADOS SIMULADOS (MOCK DATA)
// ============================================================================
const DADOS_SIMULADOS = {
    // enabled: CONFIG.USE_MOCK_DATA, // 'enabled' não é usado, CONFIG.USE_MOCK_DATA controla diretamente
    equipamentos: { // Chave deve ser 'equipamentos' para corresponder ao app.js
        'AP-01': {
            vaga: 'AP-01', // Adicionado 'vaga' para consistência com o objeto processado
            placa: EQUIPAMENTOS_BASE.lista.find(e=>e.codigo==='AP-01').placaOriginal,
            nome: EQUIPAMENTOS_BASE.lista.find(e=>e.codigo==='AP-01').nome,
            tipo: 'AP',
            status: 'CRITICO',
            primeiroRegistro: '11:05',
            totalApontamentos: 2,
            apontamentos: [
                { categoria: 'Preparação', inicio: '11:05', fim: '11:17', tempo: '00:12' },
                { categoria: 'Refeição Motorista', inicio: '12:46', fim: '14:28', tempo: '01:42' }
            ]
        },
        'AP-02': {
            vaga: 'AP-02',
            placa: EQUIPAMENTOS_BASE.lista.find(e=>e.codigo==='AP-02').placaOriginal,
            nome: EQUIPAMENTOS_BASE.lista.find(e=>e.codigo==='AP-02').nome,
            tipo: 'AP',
            status: 'TARDIO',
            primeiroRegistro: '08:21',
            totalApontamentos: 3, // Ajustado para 3 para ser > minRegistros para teste
            apontamentos: [
                { categoria: 'Abastecimento', inicio: '08:21', fim: '08:31', tempo: '00:10' },
                { categoria: 'Documentação', inicio: '08:31', fim: '09:28', tempo: '00:57' },
                { categoria: 'Bloqueio', inicio: '09:29', fim: '10:00', tempo: '00:32' }
            ]
        },
         'AV-01': {
            vaga: 'AV-01',
            placa: EQUIPAMENTOS_BASE.lista.find(e=>e.codigo==='AV-01').placaOriginal,
            nome: EQUIPAMENTOS_BASE.lista.find(e=>e.codigo==='AV-01').nome,
            tipo: 'AV',
            status: 'OK',
            primeiroRegistro: '07:15',
            totalApontamentos: 5,
            apontamentos: [
                { categoria: 'Checklist', inicio: '07:15', fim: '07:25', tempo: '00:10' },
                { categoria: 'Deslocamento', inicio: '07:25', fim: '07:55', tempo: '00:30' },
            ]
        }
        // Adicionar mais dados simulados para outros equipamentos e status conforme necessário
    }
};

// ============================================================================
// LÓGICA INTELIGENTE DE STATUS (para frontend, se necessário, ou referência)
// ============================================================================
const STATUS_LOGIC = {
    calcularStatus: function(equipamentoData) { // Recebe dados do equipamento da API
        if (!equipamentoData) return 'CRITICO'; // Sem dados da API

        const { apontamentos, totalApontamentos, primeiroRegistro } = equipamentoData;

        if (!primeiroRegistro && totalApontamentos === 0) { // Verifica se primeiroRegistro é null/undefined E não há apontamentos
             return 'CRITICO'; // Sem apontamentos registrados
        }
        if (totalApontamentos < STATUS_CONFIG.criterios.minRegistros) {
            return 'POUCOS';
        }

        // Lógica de horário tardio (baseada no primeiroRegistro)
        if (primeiroRegistro) { // Só calcula se primeiroRegistro existir
            const horaPrimeiro = parseInt(primeiroRegistro.split(':')[0], 10);
            const minPrimeiro = parseInt(primeiroRegistro.split(':')[1], 10);

            const horaCritica = parseInt(STATUS_CONFIG.criterios.horarioCritico.split(':')[0], 10);
            const minCritica = parseInt(STATUS_CONFIG.criterios.horarioCritico.split(':')[1], 10);

            const horaTardia = parseInt(STATUS_CONFIG.criterios.horarioLimite.split(':')[0], 10); // horarioLimite é o tardio
            const minTardia = parseInt(STATUS_CONFIG.criterios.horarioLimite.split(':')[1], 10);

            if (horaPrimeiro > horaCritica || (horaPrimeiro === horaCritica && minPrimeiro >= minCritica)) {
                return 'CRITICO';
            }
            if (horaPrimeiro > horaTardia || (horaPrimeiro === horaTardia && minPrimeiro > minTardia)) { // > e não >= para tardio
                return 'TARDIO';
            }
        } else if (totalApontamentos > 0 && totalApontamentos < STATUS_CONFIG.criterios.minRegistros) {
            // Se tem alguns apontamentos mas não o suficiente, e não tem `primeiroRegistro` (improvável se totalApontamentos > 0)
            // pode ser 'POUCOS' ou manter a lógica acima.
            // Aqui, se não tiver primeiroRegistro mas tiver apontamentos, já foi pego por POUCOS se < minRegistros.
            // Se tiver >= minRegistros mas sem primeiroRegistro, seria uma inconsistência de dados.
        }


        // Lógica de tempo excessivo nos apontamentos individuais
        if (apontamentos && apontamentos.length > 0) {
            const temTempoExcessivo = apontamentos.some(apt => {
                if (!apt.tempo || apt.tempo === '--') return false;
                const [h, m] = apt.tempo.split(':').map(Number);
                const tempoEmMinutos = h * 60 + m;
                return tempoEmMinutos > STATUS_CONFIG.criterios.maxTempoAtencao;
            });
            if (temTempoExcessivo) {
                // Poderia ser um status 'ATENCAO_TEMPO' ou agravar para 'TARDIO'
                // Por simplicidade, pode-se considerar 'TARDIO' se não for crítico por horário.
                // return 'TARDIO'; // Cuidado para não sobrescrever um CRITICO de horário
            }
        }
        return 'OK';
    },
    // Funções utilitárias como criarHorario, extrairHora, tempoParaMinutos já existem no app.js ou utils.js
    // Elas podem ser mantidas lá para uso geral.
};

// ============================================================================
// VALIDAÇÕES
// ============================================================================
const VALIDATORS = {
    validateConfig: function() {
        const errors = [];
        if (CONFIG.API_URL.includes('SUA_NOVA_URL_DE_IMPLANTAÇÃO_DO_APPS_SCRIPT_AQUI') && !CONFIG.USE_MOCK_DATA) {
            errors.push('API_URL não configurada e USE_MOCK_DATA é false.');
        }
        if (!this.isValidTime(CONFIG.HORA_LIMITE_NORMAL)) errors.push('HORA_LIMITE_NORMAL inválida.');
        if (!this.isValidTime(CONFIG.HORA_LIMITE_CRITICO)) errors.push('HORA_LIMITE_CRITICO inválida.');
        return { valid: errors.length === 0, errors: errors };
    },
    isValidTime: function(time) { return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time); },
    isValidPhone: function(phone) { return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phone); },
    isValidEquipmentCode: function(code) { return /^(AP|AV|HP)-\d{2}(-B)?$/.test(code); } // Adicionado (-B)? para AV-02-B
};

// ============================================================================
// INICIALIZAÇÃO (REMOVIDO CONFIG_UTILS.load())
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    // CONFIG_UTILS.load(); // REMOVIDO
    const validation = VALIDATORS.validateConfig();
    if (CONFIG.DEBUG_MODE && CONFIG.CONSOLE_LOGS) {
        console.groupCollapsed('🔧 Configurações Iniciais do Sistema');
        console.log('Sistema de Monitoramento GrupoGPS v' + CONFIG.VERSION);
        console.log('Modo Debug:', CONFIG.DEBUG_MODE);
        console.log('Usando Dados Simulados:', CONFIG.USE_MOCK_DATA);
        console.log('API URL:', CONFIG.API_URL);
        console.log('Equipamentos Base Cadastrados:', EQUIPAMENTOS_BASE.lista.length);
        console.log('Configuração Válida:', validation.valid);
        if (!validation.valid && validation.errors.length > 0) {
            console.warn('⚠️ Avisos de Configuração:', validation.errors);
        }
        console.groupEnd();
    }
    if (!validation.valid && !CONFIG.USE_MOCK_DATA) {
         // Poderia mostrar um alerta visual para o usuário
         console.error("‼️ ERRO DE CONFIGURAÇÃO: Verifique a API_URL ou os horários definidos. O sistema pode não funcionar corretamente.");
    }
});

// ============================================================================
// EXPORTAÇÕES GLOBAIS
// ============================================================================
window.CONFIG = CONFIG;
window.EQUIPAMENTOS_BASE = EQUIPAMENTOS_BASE;
window.STATUS_CONFIG = STATUS_CONFIG;
window.DADOS_SIMULADOS = DADOS_SIMULADOS;
// window.EXTRACTOR_CONFIG_FRONTEND = EXTRACTOR_CONFIG_FRONTEND; // Se você tiver essa constante
window.STATUS_LOGIC = STATUS_LOGIC; // Expondo a lógica de status do frontend
window.VALIDATORS = VALIDATORS;
