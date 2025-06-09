/**
 * GERENCIAMENTO DE EQUIPAMENTOS - SISTEMA USIMINAS
 * Arquivo: /js/equipamentos.js
 * 
 * Responsável por processar dados dos equipamentos e gerenciar apontamentos
 */

class EquipmentManager {
    constructor() {
        this.equipamentos = new Map();
        this.historico = new Map();
        this.alertas = new Map();
        
        // Cache para otimização
        this.cache = {
            lastUpdate: null,
            processedData: null,
            statistics: null
        };
    }

    /**
     * Processar dados do CSV fornecido
     */
    processarDadosCSV() {
        const csvData = `"Placa";"Vaga";"Data Registro";"Categoria Demora";"Data Inicial";"Data Final";"Data Atualização";"Tempo Indisponível (HH:MM)"
"DSY6F81";"CAMINHÃO ALTA PRESSÃO - GPS - 01 - 24 HS";"09/06/2025 11:07:20";"Preparação";"09/06/2025 11:05:26";"09/06/2025 11:17:02";"09/06/2025 11:18:30";"00:12"
"DSY6F81";"CAMINHÃO ALTA PRESSÃO - GPS - 01 - 24 HS";"09/06/2025 12:48:32";"Refeição Motorista";"09/06/2025 12:46:23";"09/06/2025 14:28:28";"09/06/2025 14:30:33";"01:42"
"EGC2983";"CAMINHÃO ALTA PRESSÃO - GPS - 02";"09/06/2025 08:23:26";"Abastecimento";"09/06/2025 08:21:34";"09/06/2025 08:31:45";"09/06/2025 08:33:47";"00:10"
"EGC2983";"CAMINHÃO ALTA PRESSÃO - GPS - 02";"09/06/2025 08:33:45";"Documentação";"09/06/2025 08:31:52";"09/06/2025 09:28:55";"09/06/2025 09:29:15";"00:57"`;
        
        return this.parseCSVData(csvData);
    }

    /**
     * Parse dos dados CSV
     */
    parseCSVData(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const headers = lines[0].split(';').map(h => h.replace(/"/g, ''));
        const equipamentosData = {};

        for (let i = 1; i < lines.length; i++) {
            const row = this.parseCSVRow(lines[i]);
            if (row.length < headers.length) continue;

            const data = {};
            headers.forEach((header, index) => {
                data[header] = row[index];
            });

            const vaga = this.extrairCodigoVaga(data.Vaga);
            const placa = data.Placa;

            if (!vaga || !placa) continue;

            if (!equipamentosData[vaga]) {
                equipamentosData[vaga] = {
                    vaga: vaga,
                    placa: placa,
                    primeiroRegistro: null,
                    totalApontamentos: 0,
                    apontamentos: [],
                    status: 'OK'
                };
            }

            // Processar apontamento
            const apontamento = {
                categoria: data['Categoria Demora'],
                dataRegistro: data['Data Registro'],
                inicio: this.extrairHora(data['Data Inicial']),
                fim: this.extrairHora(data['Data Final']),
                tempo: data['Tempo Indisponível (HH:MM)']
            };

            equipamentosData[vaga].apontamentos.push(apontamento);
            equipamentosData[vaga].totalApontamentos++;

            // Definir primeiro registro
            const horaRegistro = this.extrairHora(data['Data Registro']);
            if (!equipamentosData[vaga].primeiroRegistro || 
                horaRegistro < equipamentosData[vaga].primeiroRegistro) {
                equipamentosData[vaga].primeiroRegistro = horaRegistro;
            }
        }

        // Calcular status de cada equipamento
        Object.values(equipamentosData).forEach(equip => {
            equip.status = this.calcularStatus(equip);
        });

        return equipamentosData;
    }

    /**
     * Parse de linha CSV considerando aspas e ponto e vírgula
     */
    parseCSVRow(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ';' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * Extrair código da vaga do nome completo
     */
    extrairCodigoVaga(nomeCompleto) {
        if (!nomeCompleto) return null;

        const nome = nomeCompleto.toUpperCase();
        
        // Padrões para cada tipo
        const patterns = [
            { regex: /ALTA PRESSÃO.*GPS\s*-\s*(\d+)/, prefix: 'AP' },
            { regex: /AUTO VÁCUO.*GPS\s*-\s*(\d+)/, prefix: 'AV' },
            { regex: /HIPER VÁCUO.*GPS\s*-\s*(\d+)/, prefix: 'HP' }
        ];

        for (const pattern of patterns) {
            const match = nome.match(pattern.regex);
            if (match) {
                const numero = match[1].padStart(2, '0');
                return `${pattern.prefix}-${numero}`;
            }
        }

        return null;
    }

    /**
     * Extrair hora de timestamp completo
     */
    extrairHora(timestamp) {
        if (!timestamp) return null;
        
        try {
            const parts = timestamp.split(' ');
            if (parts.length > 1) {
                const timePart = parts[1];
                const [hora, minuto] = timePart.split(':');
                return `${hora}:${minuto}`;
            }
        } catch (error) {
            console.warn('Erro ao extrair hora:', timestamp, error);
        }
        
        return null;
    }

    /**
     * Calcular status do equipamento
     */
    calcularStatus(equipamento) {
        // Sem registros
        if (!equipamento.primeiroRegistro || equipamento.totalApontamentos === 0) {
            return 'CRITICO';
        }

        // Poucos registros
        if (equipamento.totalApontamentos <= 2) {
            return 'POUCOS';
        }

        // Verificar horário do primeiro registro
        const primeiroHora = equipamento.primeiroRegistro;
        const horaLimite = CONFIG.HORA_LIMITE_NORMAL; // '07:30'
        const horaCritico = CONFIG.HORA_LIMITE_CRITICO; // '09:00'

        // Converter para minutos para comparação
        const primeiroMinutos = this.horaParaMinutos(primeiroHora);
        const limiteMinutos = this.horaParaMinutos(horaLimite);
        const criticoMinutos = this.horaParaMinutos(horaCritico);

        if (primeiroMinutos >= criticoMinutos) {
            return 'CRITICO';
        }

        if (primeiroMinutos > limiteMinutos) {
            return 'TARDIO';
        }

        // Verificar se há demoras excessivas
        const temDemoraExcessiva = equipamento.apontamentos.some(apt => {
            const tempoMinutos = this.tempoParaMinutos(apt.tempo);
            return tempoMinutos > STATUS_CONFIG.criterios.maxTempoAtencao;
        });

        if (temDemoraExcessiva) {
            return 'TARDIO';
        }

        return 'OK';
    }

    /**
     * Converter hora (HH:MM) para minutos
     */
    horaParaMinutos(hora) {
        if (!hora) return 0;
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
    }

    /**
     * Converter tempo (HH:MM) para minutos
     */
    tempoParaMinutos(tempo) {
        if (!tempo || tempo === '--') return 0;
        const [h, m] = tempo.split(':').map(Number);
        return h * 60 + m;
    }

    /**
     * Obter equipamentos com problemas críticos
     */
    getEquipamentosCriticos() {
        const criticos = [];
        
        this.equipamentos.forEach((equip, vaga) => {
            if (equip.status === 'CRITICO') {
                criticos.push({
                    vaga,
                    ...equip,
                    prioridade: this.calcularPrioridade(equip)
                });
            }
        });

        // Ordenar por prioridade
        return criticos.sort((a, b) => b.prioridade - a.prioridade);
    }

    /**
     * Calcular prioridade do problema
     */
    calcularPrioridade(equipamento) {
        let prioridade = 0;

        // Sem registros = prioridade máxima
        if (!equipamento.primeiroRegistro) {
            prioridade += 100;
        }

        // Registro muito tardio
        if (equipamento.primeiroRegistro) {
            const minutos = this.horaParaMinutos(equipamento.primeiroRegistro);
            const limite = this.horaParaMinutos('09:00');
            if (minutos > limite) {
                prioridade += Math.min(50, (minutos - limite) / 2);
            }
        }

        // Poucos registros
        if (equipamento.totalApontamentos <= 2) {
            prioridade += 30;
        }

        // Demoras excessivas
        equipamento.apontamentos.forEach(apt => {
            const tempoMinutos = this.tempoParaMinutos(apt.tempo);
            if (tempoMinutos > 90) {
                prioridade += Math.min(20, tempoMinutos / 10);
            }
        });

        return Math.round(prioridade);
    }

    /**
     * Analisar padrões de demoras
     */
    analisarPadroesDemoras() {
        const analise = {
            categoriasMaisProblematicas: {},
            horariosPico: {},
            equipamentosMaisProblematicos: {},
            totalTempoPerdido: 0
        };

        this.equipamentos.forEach((equip, vaga) => {
            equip.apontamentos.forEach(apt => {
                const categoria = apt.categoria;
                const tempoMinutos = this.tempoParaMinutos(apt.tempo);
                
                // Categorias mais problemáticas
                if (!analise.categoriasMaisProblematicas[categoria]) {
                    analise.categoriasMaisProblematicas[categoria] = {
                        count: 0,
                        tempoTotal: 0,
                        tempoMedio: 0
                    };
                }
                
                analise.categoriasMaisProblematicas[categoria].count++;
                analise.categoriasMaisProblematicas[categoria].tempoTotal += tempoMinutos;
                
                // Horários pico
                const hora = apt.inicio ? apt.inicio.split(':')[0] : '00';
                analise.horariosPico[hora] = (analise.horariosPico[hora] || 0) + 1;
                
                // Equipamentos mais problemáticos
                if (!analise.equipamentosMaisProblematicos[vaga]) {
                    analise.equipamentosMaisProblematicos[vaga] = {
                        count: 0,
                        tempoTotal: 0
                    };
                }
                
                analise.equipamentosMaisProblematicos[vaga].count++;
                analise.equipamentosMaisProblematicos[vaga].tempoTotal += tempoMinutos;
                
                // Tempo total perdido
                analise.totalTempoPerdido += tempoMinutos;
            });
        });

        // Calcular médias
        Object.values(analise.categoriasMaisProblematicas).forEach(cat => {
            cat.tempoMedio = Math.round(cat.tempoTotal / cat.count);
        });

        return analise;
    }

    /**
     * Gerar relatório de equipamentos
     */
    gerarRelatorio() {
        const stats = this.calcularEstatisticas();
        const criticos = this.getEquipamentosCriticos();
        const analise = this.analisarPadroesDemoras();
        
        return {
            timestamp: new Date().toISOString(),
            resumo: {
                totalEquipamentos: this.equipamentos.size,
                equipamentosOK: stats.OK,
                equipamentosTardios: stats.TARDIO,
                equipamentosPoucos: stats.POUCOS,
                equipamentosCriticos: stats.CRITICO,
                percentualOK: Math.round((stats.OK / this.equipamentos.size) * 100)
            },
            equipamentosCriticos: criticos,
            analiseDetalhada: analise,
            recomendacoes: this.gerarRecomendacoes(analise)
        };
    }

    /**
     * Calcular estatísticas gerais
     */
    calcularEstatisticas() {
        const stats = { OK: 0, TARDIO: 0, POUCOS: 0, CRITICO: 0 };
        
        this.equipamentos.forEach(equip => {
            stats[equip.status]++;
        });
        
        return stats;
    }

    /**
     * Gerar recomendações baseadas na análise
     */
    gerarRecomendacoes(analise) {
        const recomendacoes = [];

        // Recomendações baseadas em categorias problemáticas
        const categorias = Object.entries(analise.categoriasMaisProblematicas)
            .sort((a, b) => b[1].tempoTotal - a[1].tempoTotal)
            .slice(0, 3);

        categorias.forEach(([categoria, dados]) => {
            if (dados.tempoMedio > 60) {
                recomendacoes.push({
                    tipo: 'processo',
                    prioridade: 'alta',
                    categoria: categoria,
                    descricao: `Revisar processo de "${categoria}" - tempo médio de ${dados.tempoMedio} minutos está acima do ideal`,
                    acao: `Padronizar procedimentos para reduzir tempo médio para menos de 30 minutos`
                });
            }
        });

        // Recomendações baseadas em equipamentos problemáticos
        const equipProblematicos = Object.entries(analise.equipamentosMaisProblematicos)
            .filter(([_, dados]) => dados.count > 5)
            .sort((a, b) => b[1].tempoTotal - a[1].tempoTotal)
            .slice(0, 3);

        equipProblematicos.forEach(([vaga, dados]) => {
            recomendacoes.push({
                tipo: 'equipamento',
                prioridade: 'media',
                vaga: vaga,
                descricao: `Equipamento ${vaga} com ${dados.count} demoras totalizando ${Math.round(dados.tempoTotal / 60)}h`,
                acao: `Verificar necessidade de manutenção preventiva ou treinamento específico`
            });
        });

        // Recomendação geral de tempo perdido
        const horasPerdidas = Math.round(analise.totalTempoPerdido / 60 * 100) / 100;
        if (horasPerdidas > 20) {
            recomendacoes.push({
                tipo: 'geral',
                prioridade: 'alta',
                descricao: `Total de ${horasPerdidas}h perdidas em demoras no dia`,
                acao: `Implementar ações corretivas imediatas nos processos mais demorados`
            });
        }

        return recomendacoes;
    }

    /**
     * Validar dados de equipamento
     */
    validarDados(equipamento) {
        const erros = [];

        if (!equipamento.vaga) {
            erros.push('Vaga não informada');
        }

        if (!equipamento.placa) {
            erros.push('Placa não informada');
        }

        if (!Array.isArray(equipamento.apontamentos)) {
            erros.push('Apontamentos devem ser um array');
        }

        // Validar apontamentos
        equipamento.apontamentos?.forEach((apt, index) => {
            if (!apt.categoria) {
                erros.push(`Apontamento ${index + 1}: categoria não informada`);
            }
            
            if (!apt.inicio || !apt.fim) {
                erros.push(`Apontamento ${index + 1}: horários incompletos`);
            }
            
            if (!apt.tempo) {
                erros.push(`Apontamento ${index + 1}: tempo não calculado`);
            }
        });

        return {
            valido: erros.length === 0,
            erros: erros
        };
    }

    /**
     * Exportar dados para CSV
     */
    exportarCSV() {
        const headers = [
            'Vaga', 'Placa', 'Status', 'Primeiro Registro', 'Total Apontamentos',
            'Categoria', 'Início', 'Fim', 'Tempo'
        ];

        let csv = headers.join(',') + '\n';

        this.equipamentos.forEach((equip, vaga) => {
            if (equip.apontamentos.length === 0) {
                csv += [
                    vaga, equip.placa, equip.status, 
                    equip.primeiroRegistro || '', equip.totalApontamentos,
                    '', '', '', ''
                ].join(',') + '\n';
            } else {
                equip.apontamentos.forEach(apt => {
                    csv += [
                        vaga, equip.placa, equip.status,
                        equip.primeiroRegistro || '', equip.totalApontamentos,
                        apt.categoria, apt.inicio, apt.fim, apt.tempo
                    ].join(',') + '\n';
                });
            }
        });

        return csv;
    }

    /**
     * Importar dados do CSV
     */
    importarCSV(csvText) {
        try {
            const dadosProcessados = this.parseCSVData(csvText);
            this.equipamentos.clear();
            
            Object.entries(dadosProcessados).forEach(([vaga, data]) => {
                this.equipamentos.set(vaga, data);
            });

            this.cache.lastUpdate = new Date();
            this.cache.processedData = dadosProcessados;
            
            return {
                sucesso: true,
                equipamentosImportados: this.equipamentos.size,
                timestamp: this.cache.lastUpdate
            };
            
        } catch (error) {
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    /**
     * Obter dados processados (com cache)
     */
    getDadosProcessados() {
        const cacheValido = this.cache.lastUpdate && 
            (Date.now() - this.cache.lastUpdate.getTime()) < CONFIG.CACHE_DURATION;

        if (cacheValido && this.cache.processedData) {
            return this.cache.processedData;
        }

        // Reprocessar dados
        const dados = this.processarDadosCSV();
        this.cache.lastUpdate = new Date();
        this.cache.processedData = dados;

        return dados;
    }

    /**
     * Limpar cache
     */
    limparCache() {
        this.cache = {
            lastUpdate: null,
            processedData: null,
            statistics: null
        };
    }
}

// ============================================================================
// UTILIDADES PARA EQUIPAMENTOS
// ============================================================================

const EquipmentUtils = {
    /**
     * Formatar tempo para exibição
     */
    formatarTempo: function(minutos) {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    },

    /**
     * Calcular tempo total de demoras
     */
    calcularTempoTotal: function(apontamentos) {
        return apontamentos.reduce((total, apt) => {
            const tempoMinutos = this.tempoParaMinutos(apt.tempo);
            return total + tempoMinutos;
        }, 0);
    },

    /**
     * Obter cor do status
     */
    getStatusColor: function(status) {
        const colors = {
            'OK': '#16a34a',
            'TARDIO': '#f59e0b',
            'POUCOS': '#0891b2',
            'CRITICO': '#dc2626'
        };
        return colors[status] || '#64748b';
    },

    /**
     * Obter ícone do status
     */
    getStatusIcon: function(status) {
        const icons = {
            'OK': 'fas fa-check-circle',
            'TARDIO': 'fas fa-clock',
            'POUCOS': 'fas fa-search',
            'CRITICO': 'fas fa-exclamation-triangle'
        };
        return icons[status] || 'fas fa-question-circle';
    },

    /**
     * Verificar se horário está no limite
     */
    isHorarioNoLimite: function(hora, limite = '07:30') {
        if (!hora) return false;
        
        const horaMinutos = this.horaParaMinutos(hora);
        const limiteMinutos = this.horaParaMinutos(limite);
        
        return horaMinutos <= limiteMinutos;
    },

    /**
     * Converter hora para minutos (helper)
     */
    horaParaMinutos: function(hora) {
        if (!hora) return 0;
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
    },

    /**
     * Converter tempo para minutos (helper)
     */
    tempoParaMinutos: function(tempo) {
        if (!tempo || tempo === '--') return 0;
        const [h, m] = tempo.split(':').map(Number);
        return h * 60 + m;
    }
};

// ============================================================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ============================================================================

// Criar instância global quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined') {
        window.EquipmentManager = EquipmentManager;
        window.EquipmentUtils = EquipmentUtils;
        
        // Criar instância global para uso pelo sistema
        window.equipmentManager = new EquipmentManager();
        
        if (CONFIG.DEBUG_MODE) {
            console.log('🔧 EquipmentManager inicializado');
            
            // Comandos de debug disponíveis
            window.processarCSV = () => window.equipmentManager.processarDadosCSV();
            window.gerarRelatorio = () => window.equipmentManager.gerarRelatorio();
            window.exportarCSV = () => window.equipmentManager.exportarCSV();
        }
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EquipmentManager, EquipmentUtils };
}
