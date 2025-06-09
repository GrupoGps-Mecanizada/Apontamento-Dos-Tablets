/**
 * Configurações do Frontend - Monitor Usiminas
 * 
 * IMPORTANTE: Substitua a URL abaixo pela URL real do seu Google Apps Script
 */

// ============================================================================
// CONFIGURAÇÃO PRINCIPAL
// ============================================================================

const CONFIG_FRONTEND = {
    // SUBSTITUA esta URL pela URL real do seu Google Apps Script
    API_URL: 'https://script.google.com/macros/s/SEU_SCRIPT_ID_AQUI/exec',
    
    // Intervalo de atualização automática (5 minutos)
    UPDATE_INTERVAL: 5 * 60 * 1000,
    
    // Timeout para requisições HTTP (30 segundos)
    REQUEST_TIMEOUT: 30000,
    
    // Número máximo de tentativas em caso de erro
    MAX_RETRIES: 3,
    
    // Modo debug (mostrar logs detalhados no console)
    DEBUG_MODE: true,
    
    // Usar dados simulados (para desenvolvimento/teste)
    USE_MOCK_DATA: true, // Mude para false quando conectar com a API real
    
    // Versão do sistema
    VERSION: '1.0.0'
};

// ============================================================================
// CONFIGURAÇÕES DOS EQUIPAMENTOS
// ============================================================================

const EQUIPAMENTOS_CONFIG = {
    // Horário limite para apontamentos normais
    HORA_LIMITE: '07:30',
    
    // Mínimo de registros esperados por equipamento
    MIN_REGISTROS: 3,
    
    // Total de equipamentos monitorados
    TOTAL_EQUIPAMENTOS: 24,
    
    // Categorias de equipamentos
    CATEGORIAS: {
        'AP': { nome: 'Alta Pressão', total: 12, cor: '#0052cc' },
        'AV': { nome: 'Auto Vácuo', total: 10, cor: '#00b8d9' },
        'HP': { nome: 'Hiper Vácuo', total: 2, cor: '#36b37e' }
    }
};

// ============================================================================
// CONFIGURAÇÕES DE INTERFACE
// ============================================================================

const UI_CONFIG = {
    // Cores dos status
    STATUS_COLORS: {
        'OK': '#00875a',
        'TARDIO': '#ff8b00',
        'SEM_REGISTRO': '#de350b',
        'POUCOS_REGISTROS': '#00b8d9',
        'CRITICO': '#de350b'
    },
    
    // Textos dos status
    STATUS_LABELS: {
        'OK': '✅ Funcionando',
        'TARDIO': '⚠️ Tardio',
        'SEM_REGISTRO': '❌ Sem Registro',
        'POUCOS_REGISTROS': '🔍 Poucos Registros',
        'CRITICO': '🚨 Crítico'
    },
    
    // Prioridades dos status (para ordenação)
    STATUS_PRIORITIES: {
        'SEM_REGISTRO': 4,
        'CRITICO': 3,
        'POUCOS_REGISTROS': 2,
        'TARDIO': 1,
        'OK': 0
    },
    
    // Animações
    ANIMATION_DURATION: 300,
    
    // Formato de data/hora
    DATE_FORMAT: 'pt-BR',
    TIME_FORMAT: { hour: '2-digit', minute: '2-digit' }
};

// ============================================================================
// CONFIGURAÇÕES DE DADOS SIMULADOS (PARA TESTE)
// ============================================================================

const MOCK_DATA_CONFIG = {
    // Probabilidades para geração de status aleatórios
    STATUS_PROBABILITIES: {
        'OK': 0.6,              // 60% chance
        'TARDIO': 0.15,         // 15% chance
        'POUCOS_REGISTROS': 0.12, // 12% chance
        'SEM_REGISTRO': 0.08,   // 8% chance
        'CRITICO': 0.05         // 5% chance
    },
    
    // Delay simulado para requisições (ms)
    SIMULATED_DELAY: 800,
    
    // Variação no delay (±ms)
    DELAY_VARIATION: 400
};

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Validar se as configurações estão corretas
 */
function validarConfiguracoes() {
    const problemas = [];
    
    // Verificar URL da API
    if (CONFIG_FRONTEND.API_URL.includes('SEU_SCRIPT_ID_AQUI')) {
        problemas.push('❌ URL da API não foi configurada (ainda contém SEU_SCRIPT_ID_AQUI)');
    }
    
    // Verificar se URL da API é válida
    try {
        new URL(CONFIG_FRONTEND.API_URL);
    } catch (error) {
        problemas.push('❌ URL da API inválida');
    }
    
    // Verificar se intervalo de atualização é válido
    if (CONFIG_FRONTEND.UPDATE_INTERVAL < 60000) {
        problemas.push('⚠️ Intervalo de atualização muito baixo (mínimo recomendado: 1 minuto)');
    }
    
    // Mostrar problemas encontrados
    if (problemas.length > 0) {
        console.warn('🔧 PROBLEMAS DE CONFIGURAÇÃO DETECTADOS:');
        problemas.forEach(problema => console.warn(problema));
        
        if (CONFIG_FRONTEND.API_URL.includes('SEU_SCRIPT_ID_AQUI')) {
            console.warn('💡 Para corrigir, substitua SEU_SCRIPT_ID_AQUI pela URL real do seu Google Apps Script');
        }
        
        return false;
    }
    
    console.log('✅ Configurações validadas com sucesso');
    return true;
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS DE CONFIGURAÇÃO
// ============================================================================

/**
 * Obter cor do status
 */
function obterCorStatus(status) {
    return UI_CONFIG.STATUS_COLORS[status] || '#8993a4';
}

/**
 * Obter label do status
 */
function obterLabelStatus(status) {
    return UI_CONFIG.STATUS_LABELS[status] || status;
}

/**
 * Obter prioridade do status
 */
function obterPrioridadeStatus(status) {
    return UI_CONFIG.STATUS_PRIORITIES[status] || 0;
}

/**
 * Verificar se está em modo de desenvolvimento
 */
function isModoDevelopment() {
    return CONFIG_FRONTEND.DEBUG_MODE || 
           CONFIG_FRONTEND.USE_MOCK_DATA || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
}

/**
 * Atualizar configuração da API
 */
function configurarAPI(novaUrl) {
    CONFIG_FRONTEND.API_URL = novaUrl;
    CONFIG_FRONTEND.USE_MOCK_DATA = false;
    
    console.log('✅ URL da API atualizada:', novaUrl);
    console.log('✅ Modo simulado desativado');
    
    // Salvar no localStorage para persistir
    try {
        localStorage.setItem('monitor_usiminas_api_url', novaUrl);
    } catch (error) {
        console.warn('⚠️ Não foi possível salvar configuração no localStorage');
    }
}

/**
 * Carregar configuração salva (se existir)
 */
function carregarConfiguracaoSalva() {
    try {
        const urlSalva = localStorage.getItem('monitor_usiminas_api_url');
        if (urlSalva && !urlSalva.includes('SEU_SCRIPT_ID_AQUI')) {
            CONFIG_FRONTEND.API_URL = urlSalva;
            CONFIG_FRONTEND.USE_MOCK_DATA = false;
            console.log('✅ Configuração carregada do localStorage');
        }
    } catch (error) {
        console.warn('⚠️ Não foi possível carregar configuração do localStorage');
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Carregar configuração salva quando o script carrega
carregarConfiguracaoSalva();

// Validar configurações quando o script carrega
document.addEventListener('DOMContentLoaded', function() {
    if (CONFIG_FRONTEND.DEBUG_MODE) {
        console.log('🔧 CONFIGURAÇÕES DO SISTEMA:');
        console.log('API URL:', CONFIG_FRONTEND.API_URL);
        console.log('Modo Debug:', CONFIG_FRONTEND.DEBUG_MODE);
        console.log('Dados Simulados:', CONFIG_FRONTEND.USE_MOCK_DATA);
        console.log('Versão:', CONFIG_FRONTEND.VERSION);
        console.log('Update Interval:', CONFIG_FRONTEND.UPDATE_INTERVAL / 60000, 'minutos');
        
        // Mostrar comandos úteis
        console.log('\n💡 COMANDOS ÚTEIS NO CONSOLE:');
        console.log('configurarAPI("https://script.google.com/...") - Configurar URL da API');
        console.log('validarConfiguracoes() - Validar configurações');
        console.log('CONFIG_FRONTEND - Ver todas as configurações');
    }
    
    validarConfiguracoes();
});

// ============================================================================
// EXPORTAR CONFIGURAÇÕES (para uso global)
// ============================================================================

// Disponibilizar configurações globalmente
window.CONFIG_FRONTEND = CONFIG_FRONTEND;
window.EQUIPAMENTOS_CONFIG = EQUIPAMENTOS_CONFIG;
window.UI_CONFIG = UI_CONFIG;
window.MOCK_DATA_CONFIG = MOCK_DATA_CONFIG;

// Disponibilizar funções utilitárias globalmente
window.configurarAPI = configurarAPI;
window.validarConfiguracoes = validarConfiguracoes;
window.obterCorStatus = obterCorStatus;
window.obterLabelStatus = obterLabelStatus;
window.obterPrioridadeStatus = obterPrioridadeStatus;
window.isModoDevelopment = isModoDevelopment;
