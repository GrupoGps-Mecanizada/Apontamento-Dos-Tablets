/**
 * CONFIGURAÇÕES DO SISTEMA DE MONITORAMENTO USIMINAS
 * Arquivo: /js/config.js
 * 
 * IMPORTANTE: Configure as URLs e parâmetros conforme seu ambiente
 */

// ============================================================================
// CONFIGURAÇÕES PRINCIPAIS
// ============================================================================

const CONFIG = {
    // URL do Google Apps Script (substitua pela sua URL)
    API_URL: 'https://script.google.com/macros/s/SEU_SCRIPT_ID_AQUI/exec',
    
    // Configurações gerais
    VERSION: '2.0.0',
    SYSTEM_NAME: 'Sistema de Monitoramento Usiminas',
    UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutos
    
    // Configurações de horários
    HORA_LIMITE_NORMAL: '07:30',
    HORA_LIMITE_CRITICO: '09:00',
    MIN_REGISTROS: 3,
    
    // Configurações de debug
    DEBUG_MODE: true,
    USE_MOCK_DATA: true, // Mude para false quando conectar com API real
    CONSOLE_LOGS: true,
    
    // Configurações de armazenamento local
    STORAGE_PREFIX: 'usiminas_',
    AUTO_SAVE: true,
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutos
    
    // Configurações de contato
    DEFAULT_PHONE_FORMAT: '(##) #####-####',
    AUTO_PHONE_FORMAT: true,
    
    // Configurações de interface
    AUTO_REFRESH: true,
    SHOW_NOTIFICATIONS: true,
    COMPACT_MODE: false
};

// ============================================================================
// ESTRUTURA DE EQUIPAMENTOS
// ============================================================================

const EQUIPAMENTOS_BASE = {
    // Lista de todos os equipamentos esperados
    lista: [
        // ALTA PRESSÃO (AP)
        { codigo: 'AP-01', placa: 'DSY6F81', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 01 - 24 HS', tipo: 'AP', turno: '24h' },
        { codigo: 'AP-02', placa: 'EGC2983', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 02', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-03', placa: 'EZS8764', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 03', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-04', placa: 'EAM3262', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 04', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-05', placa: 'DSY6475', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 05', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-06', placa: 'DSY6472', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 06', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-07', placa: 'EGC2978', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 07', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-08', placa: 'EGC2985', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 08 - 24 HS', tipo: 'AP', turno: '24h' },
        { codigo: 'AP-09', placa: 'EAM3256', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 09', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-10', placa: 'EOF5C06', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 10', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-11', placa: 'PUB2F80', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 11', tipo: 'AP', turno: 'normal' },
        { codigo: 'AP-12', placa: 'EZS8765', nome: 'CAMINHÃO ALTA PRESSÃO - GPS - 12', tipo: 'AP', turno: 'normal' },
        
        // AUTO VÁCUO (AV)
        { codigo: 'AV-02', placa: 'ALY5322', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 02 - 16 HS', tipo: 'AV', turno: '16h' },
        { codigo: 'AV-02-B', placa: 'EAM3257', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 02 - 16 HS', tipo: 'AV', turno: '16h' },
        { codigo: 'AV-03', placa: 'HJS1097', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 03', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-04', placa: 'EGC2979', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 04', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-05', placa: 'FSA3D71', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 05', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-06', placa: 'DYB7210', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 06', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-07', placa: 'DSY6473', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 07', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-08', placa: 'ANF-2676', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 08 - 24 HS', tipo: 'AV', turno: '24h' },
        { codigo: 'AV-09', placa: 'EAM3251', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 09', tipo: 'AV', turno: 'normal' },
        { codigo: 'AV-10', placa: 'DSY6577', nome: 'CAMINHÃO AUTO VÁCUO - GPS - 10', tipo: 'AV', turno: 'normal' },
        
        // HIPER VÁCUO (HP)
        { codigo: 'HP-01', placa: 'DSY6471', nome: 'CAMINHÃO HIPER VÁCUO - GPS - 01', tipo: 'HP', turno: 'normal' },
        { codigo: 'HP-02', placa: 'FMD2200', nome: 'CAMINHÃO HIPER VÁCUO - GPS - 02', tipo: 'HP', turno: 'normal' }
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
// CONFIGURAÇÕES DE STATUS
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
            descricao: 'Primeiro registro após horário limite'
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
    
    // Critérios para definição de status
    criterios: {
        horarioLimite: '07:30',
        horarioCritico: '09:00',
        minRegistros: 3,
        maxTempoNormal: 60, // minutos
        maxTempoAtencao: 90 // minutos
    }
};

// ============================================================================
// DADOS SIMULADOS (PARA DESENVOLVIMENTO)
// ============================================================================

const DADOS_SIMULADOS = {
    // Configurações para geração de dados de teste
    enabled: CONFIG.USE_MOCK_DATA,
    
    // Dados baseados no CSV fornecido
    equipamentos: {
        'AP-01': {
            placa: 'DSY6F81',
            primeiroRegistro: '11:07',
            status: 'CRITICO',
            totalApontamentos: 2,
            apontamentos: [
                { categoria: 'Preparação', inicio: '11:05', fim: '11:17', tempo: '00:12' },
                { categoria: 'Refeição Motorista', inicio: '12:46', fim: '14:28', tempo: '01:42' }
            ]
        },
        'AP-02': {
            placa: 'EGC2983',
            primeiroRegistro: '08:23',
            status: 'CRITICO',
            totalApontamentos: 10,
            apontamentos: [
                { categoria: 'Abastecimento', inicio: '08:21', fim: '08:31', tempo: '00:10' },
                { categoria: 'Documentação', inicio: '08:31', fim: '09:28', tempo: '00:57' },
                { categoria: 'Bloqueio', inicio: '09:29', fim: '10:00', tempo: '00:32' },
                { categoria: 'Aguardando Área', inicio: '10:00', fim: '10:34', tempo: '00:34' },
                { categoria: 'Documentação', inicio: '10:39', fim: '11:04', tempo: '00:25' },
                { categoria: 'Documentação', inicio: '11:12', fim: '11:59', tempo: '00:48' },
                { categoria: 'Refeição Motorista', inicio: '13:07', fim: '14:13', tempo: '01:05' },
                { categoria: 'Aguardando Área', inicio: '15:36', fim: '16:04', tempo: '00:27' },
                { categoria: 'Abastecimento', inicio: '16:06', fim: '16:14', tempo: '00:09' },
                { categoria: 'Documentação', inicio: '16:15', fim: '16:22', tempo: '00:08' }
            ]
        },
        'AP-03': {
            placa: 'EZS8764',
            primeiroRegistro: '09:02',
            status: 'TARDIO',
            totalApontamentos: 5,
            apontamentos: [
                { categoria: 'Documentação', inicio: '09:01', fim: '10:33', tempo: '01:32' },
                { categoria: 'Refeição Motorista', inicio: '10:41', fim: '11:49', tempo: '01:08' },
                { categoria: 'Abastecimento', inicio: '12:08', fim: '12:33', tempo: '00:25' },
                { categoria: 'Bloqueio', inicio: '12:55', fim: '14:11', tempo: '01:16' },
                { categoria: 'Bloqueio', inicio: '14:42', fim: '15:27', tempo: '00:46' }
            ]
        }
        // Adicione mais equipamentos conforme necessário
    },
    
    // Motoristas exemplo
    motoristas: {
        'AP-01': { nome: 'João Silva', telefone: '(31) 99999-1001', radio: 'Canal 1' },
        'AP-02': { nome: 'Maria Santos', telefone: '(31) 99999-1002', radio: 'Canal 2' },
        'AP-03': { nome: 'Pedro Oliveira', telefone: '(31) 99999-1003', radio: 'Canal 3' }
    }
};

// ============================================================================
// CONFIGURAÇÕES DE PROBLEMAS E JUSTIFICATIVAS
// ============================================================================

const PROBLEMAS_CONFIG = {
    tipos: [
        { valor: 'registro-tardio', label: 'Registro Tardio', icon: 'fas fa-clock' },
        { valor: 'poucos-registros', label: 'Poucos Registros', icon: 'fas fa-search' },
        { valor: 'sem-registro', label: 'Sem Registro', icon: 'fas fa-exclamation-triangle' },
        { valor: 'demora-excessiva', label: 'Demora Excessiva', icon: 'fas fa-hourglass-half' },
        { valor: 'equipamento', label: 'Problema no Equipamento', icon: 'fas fa-wrench' },
        { valor: 'documentacao', label: 'Problema de Documentação', icon: 'fas fa-file-alt' },
        { valor: 'area', label: 'Problema de Área/Acesso', icon: 'fas fa-road' },
        { valor: 'outro', label: 'Outro', icon: 'fas fa-question-circle' }
    ],
    
    acoes: [
        { valor: 'orientacao', label: 'Orientação Fornecida', cor: '#0891b2' },
        { valor: 'treinamento', label: 'Treinamento Necessário', cor: '#f59e0b' },
        { valor: 'manutencao', label: 'Manutenção Solicitada', cor: '#dc2626' },
        { valor: 'sem-acao', label: 'Sem Ação Necessária', cor: '#16a34a' },
        { valor: 'acompanhamento', label: 'Acompanhamento Próximo', cor: '#8b5cf6' },
        { valor: 'escalacao', label: 'Escalado para Supervisão', cor: '#ef4444' }
    ]
};

// ============================================================================
// CONFIGURAÇÕES DE INTERFACE
// ============================================================================

const UI_CONFIG = {
    // Animações
    animationDuration: 300,
    
    // Formato de data/hora
    dateFormat: 'pt-BR',
    timeFormat: { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    },
    
    // Paginação
    itemsPerPage: 50,
    
    // Auto-complete
    autoComplete: true,
    
    // Temas
    theme: 'light', // light, dark, auto
    
    // Notificações
    notifications: {
        duration: 5000,
        position: 'top-right',
        sound: false
    },
    
    // Tabelas
    tableOptions: {
        sortable: true,
        filterable: true,
        exportable: true
    }
};

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

const VALIDATORS = {
    /**
     * Validar configurações básicas
     */
    validateConfig: function() {
        const errors = [];
        
        // Verificar URL da API
        if (CONFIG.API_URL.includes('SEU_SCRIPT_ID_AQUI')) {
            errors.push('URL da API não foi configurada');
        }
        
        // Verificar configurações de horário
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
    
    /**
     * Validar formato de horário
     */
    isValidTime: function(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    },
    
    /**
     * Validar telefone
     */
    isValidPhone: function(phone) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(phone);
    },
    
    /**
     * Validar código de equipamento
     */
    isValidEquipmentCode: function(code) {
        const codeRegex = /^(AP|AV|HP)-\d{2}(-[A-Z])?$/;
        return codeRegex.test(code);
    }
};

// ============================================================================
// UTILITÁRIOS DE CONFIGURAÇÃO
// ============================================================================

const CONFIG_UTILS = {
    /**
     * Obter configuração por chave
     */
    get: function(key) {
        const keys = key.split('.');
        let value = CONFIG;
        
        for (const k of keys) {
            if (value && value.hasOwnProperty(k)) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    },
    
    /**
     * Definir configuração
     */
    set: function(key, value) {
        const keys = key.split('.');
        let obj = CONFIG;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        
        // Salvar no localStorage se habilitado
        if (CONFIG.AUTO_SAVE) {
            this.save();
        }
    },
    
    /**
     * Salvar configurações no localStorage
     */
    save: function() {
        try {
            localStorage.setItem(CONFIG.STORAGE_PREFIX + 'config', JSON.stringify(CONFIG));
        } catch (error) {
            console.warn('Não foi possível salvar configurações:', error);
        }
    },
    
    /**
     * Carregar configurações do localStorage
     */
    load: function() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_PREFIX + 'config');
            if (saved) {
                const parsedConfig = JSON.parse(saved);
                Object.assign(CONFIG, parsedConfig);
                return true;
            }
        } catch (error) {
            console.warn('Não foi possível carregar configurações:', error);
        }
        return false;
    },
    
    /**
     * Reset para configurações padrão
     */
    reset: function() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CONFIG.STORAGE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        
        // Recarregar página para aplicar configurações padrão
        window.location.reload();
    }
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Carregar configurações salvas ao carregar o script
document.addEventListener('DOMContentLoaded', function() {
    // Carregar configurações do localStorage
    CONFIG_UTILS.load();
    
    // Validar configurações
    const validation = VALIDATORS.validateConfig();
    
    if (CONFIG.DEBUG_MODE && CONFIG.CONSOLE_LOGS) {
        console.log('🔧 Sistema de Monitoramento Usiminas v' + CONFIG.VERSION);
        console.log('📊 Equipamentos cadastrados:', EQUIPAMENTOS_BASE.lista.length);
        console.log('✅ Configuração válida:', validation.valid);
        
        if (!validation.valid) {
            console.warn('⚠️ Problemas de configuração:', validation.errors);
        }
        
        console.log('💡 Comandos disponíveis no console:');
        console.log('   CONFIG_UTILS.get("chave") - Obter configuração');
        console.log('   CONFIG_UTILS.set("chave", valor) - Definir configuração');
        console.log('   CONFIG_UTILS.reset() - Reset configurações');
    }
});

// ============================================================================
// EXPORTAÇÕES GLOBAIS
// ============================================================================

// Disponibilizar globalmente
window.CONFIG = CONFIG;
window.EQUIPAMENTOS_BASE = EQUIPAMENTOS_BASE;
window.STATUS_CONFIG = STATUS_CONFIG;
window.DADOS_SIMULADOS = DADOS_SIMULADOS;
window.PROBLEMAS_CONFIG = PROBLEMAS_CONFIG;
window.UI_CONFIG = UI_CONFIG;
window.VALIDATORS = VALIDATORS;
window.CONFIG_UTILS = CONFIG_UTILS;
