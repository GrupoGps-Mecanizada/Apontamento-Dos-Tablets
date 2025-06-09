/**
 * FUNÇÕES UTILITÁRIAS - SISTEMA USIMINAS
 * Arquivo: /js/utils.js
 * 
 * Funções auxiliares e utilitários para todo o sistema
 */

// ============================================================================
// UTILITÁRIOS DE DATA E HORA
// ============================================================================

const DateUtils = {
    /**
     * Formatar data para exibição
     */
    formatDate: function(date, format = 'dd/mm/yyyy') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        
        switch (format) {
            case 'dd/mm/yyyy':
                return `${day}/${month}/${year}`;
            case 'dd/mm/yyyy hh:mm':
                return `${day}/${month}/${year} ${hours}:${minutes}`;
            case 'dd/mm/yyyy hh:mm:ss':
                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            case 'hh:mm':
                return `${hours}:${minutes}`;
            case 'hh:mm:ss':
                return `${hours}:${minutes}:${seconds}`;
            case 'yyyy-mm-dd':
                return `${year}-${month}-${day}`;
            case 'iso':
                return d.toISOString();
            default:
                return d.toLocaleString('pt-BR');
        }
    },

    /**
     * Obter diferença entre duas datas em minutos
     */
    diffInMinutes: function(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return 0;
        }
        
        return Math.round((endDate - startDate) / (1000 * 60));
    },

    /**
     * Verificar se é hoje
     */
    isToday: function(date) {
        const today = new Date();
        const checkDate = new Date(date);
        
        return today.getFullYear() === checkDate.getFullYear() &&
               today.getMonth() === checkDate.getMonth() &&
               today.getDate() === checkDate.getDate();
    },

    /**
     * Obter início do dia
     */
    getStartOfDay: function(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    /**
     * Obter fim do dia
     */
    getEndOfDay: function(date = new Date()) {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    },

    /**
     * Converter tempo HH:MM para minutos
     */
    timeToMinutes: function(timeString) {
        if (!timeString || timeString === '--') return 0;
        
        const parts = timeString.split(':');
        if (parts.length !== 2) return 0;
        
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        
        return hours * 60 + minutes;
    },

    /**
     * Converter minutos para tempo HH:MM
     */
    minutesToTime: function(minutes) {
        if (typeof minutes !== 'number' || minutes < 0) return '00:00';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    },

    /**
     * Obter timestamp atual formatado
     */
    getCurrentTimestamp: function() {
        return this.formatDate(new Date(), 'dd/mm/yyyy hh:mm:ss');
    }
};

// ============================================================================
// UTILITÁRIOS DE STRING
// ============================================================================

const StringUtils = {
    /**
     * Capitalizar primeira letra
     */
    capitalize: function(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Capitalizar cada palavra
     */
    titleCase: function(str) {
        if (!str) return '';
        return str.toLowerCase().split(' ')
            .map(word => this.capitalize(word))
            .join(' ');
    },

    /**
     * Remover acentos
     */
    removeAccents: function(str) {
        if (!str) return '';
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    /**
     * Limpar string para comparação
     */
    clean: function(str) {
        if (!str) return '';
        return this.removeAccents(str).toLowerCase().trim();
    },

    /**
     * Truncar string
     */
    truncate: function(str, maxLength = 50, suffix = '...') {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    },

    /**
     * Validar se string contém apenas números
     */
    isNumeric: function(str) {
        return /^\d+$/.test(str);
    },

    /**
     * Formatar telefone brasileiro
     */
    formatPhone: function(phone) {
        if (!phone) return '';
        
        const numbers = phone.replace(/\D/g, '');
        
        if (numbers.length === 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (numbers.length === 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    },

    /**
     * Gerar slug
     */
    slugify: function(str) {
        if (!str) return '';
        
        return this.removeAccents(str)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    },

    /**
     * Validar email
     */
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Escapar HTML
     */
    escapeHtml: function(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// ============================================================================
// UTILITÁRIOS DE ARRAY
// ============================================================================

const ArrayUtils = {
    /**
     * Remover duplicatas
     */
    unique: function(array, key = null) {
        if (!Array.isArray(array)) return [];
        
        if (key) {
            const seen = new Set();
            return array.filter(item => {
                const value = typeof key === 'function' ? key(item) : item[key];
                if (seen.has(value)) {
                    return false;
                }
                seen.add(value);
                return true;
            });
        }
        
        return [...new Set(array)];
    },

    /**
     * Agrupar por chave
     */
    groupBy: function(array, key) {
        if (!Array.isArray(array)) return {};
        
        return array.reduce((groups, item) => {
            const value = typeof key === 'function' ? key(item) : item[key];
            if (!groups[value]) {
                groups[value] = [];
            }
            groups[value].push(item);
            return groups;
        }, {});
    },

    /**
     * Ordenar por múltiplas chaves
     */
    sortBy: function(array, ...keys) {
        if (!Array.isArray(array)) return [];
        
        return array.sort((a, b) => {
            for (const key of keys) {
                let aVal, bVal;
                
                if (typeof key === 'function') {
                    aVal = key(a);
                    bVal = key(b);
                } else if (typeof key === 'string') {
                    aVal = a[key];
                    bVal = b[key];
                } else {
                    continue;
                }
                
                if (aVal < bVal) return -1;
                if (aVal > bVal) return 1;
            }
            return 0;
        });
    },

    /**
     * Encontrar por ID
     */
    findById: function(array, id, idKey = 'id') {
        if (!Array.isArray(array)) return null;
        return array.find(item => item[idKey] === id) || null;
    },

    /**
     * Remover por ID
     */
    removeById: function(array, id, idKey = 'id') {
        if (!Array.isArray(array)) return [];
        return array.filter(item => item[idKey] !== id);
    },

    /**
     * Chunks/páginas
     */
    chunk: function(array, size) {
        if (!Array.isArray(array) || size <= 0) return [];
        
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};

// ============================================================================
// UTILITÁRIOS DE OBJETO
// ============================================================================

const ObjectUtils = {
    /**
     * Deep clone
     */
    clone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.clone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.clone(obj[key]);
            }
        }
        return cloned;
    },

    /**
     * Merge profundo
     */
    deepMerge: function(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return this.deepMerge(target, ...sources);
    },

    /**
     * Verificar se é objeto
     */
    isObject: function(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },

    /**
     * Obter valor aninhado
     */
    get: function(obj, path, defaultValue = null) {
        if (!obj || !path) return defaultValue;
        
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result === null || result === undefined || !(key in result)) {
                return defaultValue;
            }
            result = result[key];
        }
        
        return result;
    },

    /**
     * Definir valor aninhado
     */
    set: function(obj, path, value) {
        if (!obj || !path) return obj;
        
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || !this.isObject(current[key])) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
        return obj;
    },

    /**
     * Limpar propriedades vazias
     */
    clean: function(obj) {
        const cleaned = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (value !== null && value !== undefined && value !== '') {
                    cleaned[key] = this.isObject(value) ? this.clean(value) : value;
                }
            }
        }
        
        return cleaned;
    }
};

// ============================================================================
// UTILITÁRIOS DE NÚMERO
// ============================================================================

const NumberUtils = {
    /**
     * Formatar número com separadores
     */
    format: function(number, decimals = 0, separator = '.', delimiter = ',') {
        if (isNaN(number)) return '0';
        
        const fixed = Number(number).toFixed(decimals);
        const parts = fixed.split('.');
        
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, delimiter);
        
        return parts.join(separator);
    },

    /**
     * Converter para porcentagem
     */
    toPercent: function(value, total, decimals = 1) {
        if (!total || total === 0) return '0%';
        
        const percent = (value / total) * 100;
        return this.format(percent, decimals) + '%';
    },

    /**
     * Limitar valor entre min e max
     */
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Gerar número aleatório
     */
    random: function(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Verificar se é número válido
     */
    isValid: function(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }
};

// ============================================================================
// UTILITÁRIOS DE DOM
// ============================================================================

const DOMUtils = {
    /**
     * Selecionar elemento
     */
    $: function(selector) {
        return document.querySelector(selector);
    },

    /**
     * Selecionar todos os elementos
     */
    $$: function(selector) {
        return Array.from(document.querySelectorAll(selector));
    },

    /**
     * Criar elemento
     */
    create: function(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Adicionar atributos
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Adicionar filhos
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    },

    /**
     * Mostrar/esconder elemento
     */
    toggle: function(element, show = null) {
        if (!element) return;
        
        if (show === null) {
            show = element.style.display === 'none';
        }
        
        element.style.display = show ? '' : 'none';
    },

    /**
     * Adicionar classe
     */
    addClass: function(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    },

    /**
     * Remover classe
     */
    removeClass: function(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    },

    /**
     * Alternar classe
     */
    toggleClass: function(element, className) {
        if (element && className) {
            element.classList.toggle(className);
        }
    },

    /**
     * Verificar se tem classe
     */
    hasClass: function(element, className) {
        return element && className && element.classList.contains(className);
    },

    /**
     * Obter posição do elemento
     */
    getPosition: function(element) {
        if (!element) return { top: 0, left: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height
        };
    },

    /**
     * Animar elemento
     */
    animate: function(element, properties, duration = 300, easing = 'ease') {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            const transitions = Object.entries(properties)
                .map(([prop, value]) => `${prop} ${duration}ms ${easing}`)
                .join(', ');
            
            element.style.transition = transitions;
            
            Object.entries(properties).forEach(([prop, value]) => {
                element.style[prop] = value;
            });
            
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    }
};

// ============================================================================
// UTILITÁRIOS DE STORAGE
// ============================================================================

const StorageUtils = {
    /**
     * Salvar no localStorage
     */
    set: function(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(CONFIG.STORAGE_PREFIX + key, serialized);
            return true;
        } catch (error) {
            console.warn('Erro ao salvar no localStorage:', error);
            return false;
        }
    },

    /**
     * Obter do localStorage
     */
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Erro ao ler do localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Remover do localStorage
     */
    remove: function(key) {
        try {
            localStorage.removeItem(CONFIG.STORAGE_PREFIX + key);
            return true;
        } catch (error) {
            console.warn('Erro ao remover do localStorage:', error);
            return false;
        }
    },

    /**
     * Limpar todos os dados do sistema
     */
    clear: function() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CONFIG.STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.warn('Erro ao limpar localStorage:', error);
            return false;
        }
    },

    /**
     * Obter tamanho usado
     */
    getSize: function() {
        let total = 0;
        
        for (const key in localStorage) {
            if (key.startsWith(CONFIG.STORAGE_PREFIX)) {
                total += localStorage[key].length;
            }
        }
        
        return Math.round(total / 1024 * 100) / 100; // KB
    }
};

// ============================================================================
// UTILITÁRIOS DE ARQUIVO
// ============================================================================

const FileUtils = {
    /**
     * Download de arquivo
     */
    download: function(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    },

    /**
     * Ler arquivo como texto
     */
    readAsText: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            
            reader.readAsText(file);
        });
    },

    /**
     * Validar tipo de arquivo
     */
    isValidType: function(file, allowedTypes) {
        if (!file || !allowedTypes) return false;
        
        return allowedTypes.some(type => {
            if (type.includes('/')) {
                return file.type === type;
            } else {
                return file.name.toLowerCase().endsWith('.' + type.toLowerCase());
            }
        });
    },

    /**
     * Formatar tamanho do arquivo
     */
    formatSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// ============================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// ============================================================================

const ValidationUtils = {
    /**
     * Validar campo obrigatório
     */
    required: function(value) {
        return value !== null && value !== undefined && String(value).trim() !== '';
    },

    /**
     * Validar comprimento mínimo
     */
    minLength: function(value, min) {
        return String(value || '').length >= min;
    },

    /**
     * Validar comprimento máximo
     */
    maxLength: function(value, max) {
        return String(value || '').length <= max;
    },

    /**
     * Validar padrão (regex)
     */
    pattern: function(value, regex) {
        return regex.test(String(value || ''));
    },

    /**
     * Validar telefone brasileiro
     */
    phone: function(value) {
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return phoneRegex.test(String(value || ''));
    },

    /**
     * Validar código de equipamento
     */
    equipmentCode: function(value) {
        const codeRegex = /^(AP|AV|HP)-\d{2}(-[A-Z])?$/;
        return codeRegex.test(String(value || ''));
    },

    /**
     * Validar horário (HH:MM)
     */
    time: function(value) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(String(value || ''));
    }
};

// ============================================================================
// UTILITÁRIOS DE DEBUG
// ============================================================================

const DebugUtils = {
    /**
     * Log condicional
     */
    log: function(...args) {
        if (CONFIG.DEBUG_MODE && CONFIG.CONSOLE_LOGS) {
            console.log('[Utils]', ...args);
        }
    },

    /**
     * Cronômetro
     */
    time: function(label) {
        if (CONFIG.DEBUG_MODE) {
            console.time(label);
        }
    },

    /**
     * Fim do cronômetro
     */
    timeEnd: function(label) {
        if (CONFIG.DEBUG_MODE) {
            console.timeEnd(label);
        }
    },

    /**
     * Dump de objeto
     */
    dump: function(obj, label = 'Object') {
        if (CONFIG.DEBUG_MODE) {
            console.group(label);
            console.log(obj);
            console.groupEnd();
        }
    },

    /**
     * Stack trace
     */
    trace: function() {
        if (CONFIG.DEBUG_MODE) {
            console.trace();
        }
    }
};

// ============================================================================
// EXPORTAÇÃO GLOBAL
// ============================================================================

// Disponibilizar utilitários globalmente
if (typeof window !== 'undefined') {
    window.DateUtils = DateUtils;
    window.StringUtils = StringUtils;
    window.ArrayUtils = ArrayUtils;
    window.ObjectUtils = ObjectUtils;
    window.NumberUtils = NumberUtils;
    window.DOMUtils = DOMUtils;
    window.StorageUtils = StorageUtils;
    window.FileUtils = FileUtils;
    window.ValidationUtils = ValidationUtils;
    window.DebugUtils = DebugUtils;
    
    // Aliases convenientes
    window.$ = DOMUtils.$;
    window.$$ = DOMUtils.$$;
    
    if (CONFIG?.DEBUG_MODE) {
        console.log('🔧 Utils carregados e disponíveis globalmente');
    }
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DateUtils,
        StringUtils,
        ArrayUtils,
        ObjectUtils,
        NumberUtils,
        DOMUtils,
        StorageUtils,
        FileUtils,
        ValidationUtils,
        DebugUtils
    };
}
