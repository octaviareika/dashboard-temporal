// Serviço de Integração com o HidroWebService da ANA (Agência Nacional de Águas)
// Documentação: https://www.ana.gov.br/hidrowebservice/swagger-ui/index.html

const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? '/api-ana'
  : 'https://www.ana.gov.br/hidrowebservice';


// Estações telemétricas reais da Bacia do Vale do Rio Doce (ANA)
// Estações telemétricas REAIS e ATIVAS do Sistema de Alerta do Rio Doce (CPRM / SGB / ANA)
export const ESTACOES_VALE_RIO_DOCE = [
  {
    id: '56850000',
    codigo: '56850000',
    nome: 'Estação Governador Valadares',
    tipo: 'pluviosidade',
    lat: -18.8547,
    lng: -41.9442,
    bacia: 'Bacia do Rio Doce',
    rio: 'Rio Doce',
    municipio: 'Governador Valadares',
    uf: 'MG',
    status: 'Estação Telemétrica SAH Doce'
  },
  {
    id: '56994500',
    codigo: '56994500',
    nome: 'Estação Colatina (Ponte)',
    tipo: 'pluviosidade',
    lat: -19.5389,
    lng: -40.6306,
    bacia: 'Bacia do Rio Doce',
    rio: 'Rio Doce',
    municipio: 'Colatina',
    uf: 'ES',
    status: 'Estação Telemétrica SAH Doce'
  },
  {
    id: '56661000',
    codigo: '56661000',
    nome: 'Estação Nova Era Telemétrica',
    tipo: 'pluviosidade',
    lat: -19.7660,
    lng: -43.0330,
    bacia: 'Bacia do Rio Doce',
    rio: 'Rio Piracicaba',
    municipio: 'Nova Era',
    uf: 'MG',
    status: 'Estação Telemétrica SAH Doce'
  },
  {
    id: '56110005',
    codigo: '56110005',
    nome: 'Estação Ponte Nova Jusante',
    tipo: 'pluviosidade',
    lat: -20.3839,
    lng: -42.9028,
    bacia: 'Bacia do Rio Doce',
    rio: 'Rio Piranga (Alto Doce)',
    municipio: 'Ponte Nova',
    uf: 'MG',
    status: 'Estação Telemétrica SAH Doce'
  },
  {
    id: '56696000',
    codigo: '56696000',
    nome: 'Estação Mário de Carvalho (Cel. Fabriciano / Ipatinga)',
    tipo: 'pluviosidade',
    lat: -19.5247,
    lng: -42.6442,
    bacia: 'Bacia do Rio Doce',
    rio: 'Rio Piracicaba',
    municipio: 'Coronel Fabriciano / Timóteo',
    uf: 'MG',
    status: 'Estação Telemétrica SAH Doce'
  },
  {
    id: '56920000',
    codigo: '56920000',
    nome: 'Estação Tumiritinga',
    tipo: 'pluviosidade',
    lat: -18.9750,
    lng: -41.6500,
    bacia: 'Bacia do Rio Doce',
    rio: 'Rio Doce',
    municipio: 'Tumiritinga',
    uf: 'MG',
    status: 'Estação Telemétrica SAH Doce'
  },
  {
    id: '56719998',
    codigo: '56719998',
    nome: 'Estação Belo Oriente (Cenibra)',
    tipo: 'pluviosidade',
    lat: -19.3280,
    lng: -42.3980,
    bacia: 'Bacia do Rio Doce',
    rio: 'Rio Doce',
    municipio: 'Belo Oriente',
    uf: 'MG',
    status: 'Estação Telemétrica SAH Doce'
  }
];

export const ESTACOES_DEMO_MG = ESTACOES_VALE_RIO_DOCE;

// Função auxiliar para encontrar token em qualquer formato retornado pela ANA
function extrairToken(data) {
  if (!data) return null;

  // Se o próprio data for uma string JWT
  if (typeof data === 'string' && data.length > 20) {
    return data;
  }

  const chaves = [
    'tokenautenticacao',
    'token',
    'access_token',
    'accessToken',
    'Token',
    'AccessToken',
    'tokenAcesso',
    'jwt',
    'JWT',
    'tokenDeAcesso',
    'authorization',
    'Authorization'
  ];

  // Procura diretamente no objeto raiz
  for (const chave of chaves) {
    if (data[chave] && typeof data[chave] === 'string') {
      return data[chave];
    }
  }

  // Procura dentro de data.items
  const items = data.items;
  if (items) {
    if (typeof items === 'string') {
      return items;
    }

    if (typeof items === 'object' && items !== null) {
      if (Array.isArray(items) && items.length > 0) {
        if (typeof items[0] === 'string') return items[0];
        if (typeof items[0] === 'object' && items[0] !== null) {
          return extrairToken(items[0]);
        }
      }

      for (const chave of chaves) {
        if (items[chave] && typeof items[chave] === 'string') {
          return items[chave];
        }
      }

      // Procura por qualquer string típica de JWT (iniciando com eyJ ou com mais de 30 caracteres)
      for (const valor of Object.values(items)) {
        if (typeof valor === 'string' && (valor.startsWith('eyJ') || valor.length > 30)) {
          return valor;
        }
      }
    }
  }

  return null;
}

async function parseResponseJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    if (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<title>')) {
      const matchTitle = text.match(/<title>([^<]*)<\/title>/i);
      const title = matchTitle ? matchTitle[1].trim() : '';
      throw new Error(`A API da ANA retornou erro ${response.status}${title ? ` (${title})` : ''}. O servidor pode estar instável ou a rota indisponível.`);
    }
    throw new Error(`Resposta não reconhecida da API da ANA (HTTP ${response.status}).`);
  }
}

/**
 * Obtém o Bearer Token do HidroWeb através do endpoint de OAuth v1
 * @param {string} usuario Identificador/Usuário cadastrado na ANA
 * @param {string} senha Senha de acesso
 * @returns {Promise<string>} Token de autorização
 */
export async function getHidroWebToken(usuario, senha) {
  if (!usuario || !senha) {
    throw new Error('Identificador e senha são obrigatórios.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/EstacoesTelemetricas/OAUth/v1`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Identificador': usuario.trim(),
        'Senha': senha,
      },
    });

    const data = await parseResponseJson(response);

    const isSuccess = response.ok && (
      data.code === 200 ||
      data.code === '200' ||
      data.status === 'OK' ||
      data.status === '200 OK' ||
      data.message === 'Sucesso' ||
      !data.code
    );

    if (isSuccess) {
      const token = extrairToken(data);
      if (token) {
        return token;
      }

      if (data.items) {
        if (typeof data.items === 'string') return data.items;
        const firstStr = Object.values(data.items).find(v => typeof v === 'string' && v.length > 10);
        if (firstStr) return firstStr;
        return JSON.stringify(data.items);
      }

      return 'token-autenticado-ana';
    }

    const mensagemErro = data.message && data.message !== 'Sucesso'
      ? data.message
      : (data.erro || 'Falha ao autenticar com as credenciais informadas.');
    throw new Error(mensagemErro);
  } catch (error) {
    console.error('Erro na requisição de autenticação HidroWeb:', error.message);
    throw error;
  }
}

let tokenEmMemoria = null;

/**
 * Obtém automaticamente o token HidroWeb usando as credenciais configuradas (.env)
 * com cache em memória para evitar requisições repetidas de autenticação.
 */
export async function obterTokenPadrao() {
  if (tokenEmMemoria) return tokenEmMemoria;
  const usuario = (import.meta.env.VITE_ANA_IDENTIFICADOR || '').trim();
  const senha = (import.meta.env.VITE_ANA_SENHA || '').trim();
  if (!usuario || !senha) {
    throw new Error('Credenciais da ANA não configuradas. Preencha o arquivo .env.');
  }
  const token = await getHidroWebToken(usuario, senha);
  tokenEmMemoria = token;
  return token;
}


/**
 * Consulta o inventário completo de estações cadastradas na base HIDRO por UF
 * @param {string} token Bearer token obtido na autenticação
 * @param {string} uf Sigla do estado (padrão: MG)
 * @returns {Promise<Array>} Lista de estações normalizadas para o Leaflet
 */
export async function carregarEstacoesHidroweb(token, uf = 'MG') {
  const ufSanitizada = (uf || 'MG').toUpperCase().trim().slice(0, 2);

  try {
    const queryParam = encodeURIComponent('Unidade Federativa');
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/EstacoesTelemetricas/HidroInventarioEstacoes/v1?${queryParam}=${ufSanitizada}&siglaUF=${ufSanitizada}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': authHeader
      }
    });

    const data = await parseResponseJson(response);

    if (!response.ok) {
      throw new Error(data.message || `Erro ${response.status} ao carregar estações`);
    }

    let lista = [];
    if (Array.isArray(data.items)) {
      lista = data.items;
    } else if (Array.isArray(data)) {
      lista = data;
    } else if (data.items && typeof data.items === 'object') {
      lista = Object.values(data.items);
    }

    const estacoesMapeadas = lista
      .filter(item => {
        const lat = parseFloat(item.Latitude ?? item.latitude);
        const lng = parseFloat(item.Longitude ?? item.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(item => {
        const tipoOriginal = (item.Tipo_Estacao || item.tipoEstacao || '').trim();
        const isTelemetrica = String(item.Tipo_Estacao_Telemetrica) === '1' || String(item.tipoEstacaoTelemetrica) === '1';

        // Normalização de tipo de sensor para o filtro
        let tipo = 'pluviometrica';
        if (tipoOriginal.toLowerCase().includes('fluvio')) {
          tipo = 'fluviometrica';
        } else if (tipoOriginal.toLowerCase().includes('pluvio')) {
          tipo = 'pluviometrica';
        }

        const codigo = String(item.codigoestacao || item.CodigoEstacao || item.codigo || '');

        return {
          id: codigo || String(Math.random()),
          codigo: codigo,
          nome: item.Estacao_Nome || item.NomeEstacao || item.nomeEstacao || item.Nome || 'Estação HidroWeb',
          tipo: tipo,
          tipoOriginal: tipoOriginal,
          isTelemetrica: isTelemetrica,
          lat: parseFloat(item.Latitude ?? item.latitude),
          lng: parseFloat(item.Longitude ?? item.longitude),
          bacia: item.Bacia_Nome || item.NomeBacia || item.bacia || 'Bacia do Rio Doce',
          rio: item.Rio_Nome || item.NomeRio || item.rio || 'Rio Doce',
          municipio: item.Municipio_Nome || item.NomeMunicipio || item.municipio || '',
          uf: item.UF_Estacao || item.SiglaUF || item.uf || ufSanitizada,
          operando: String(item.Operando) === '1',
          status: isTelemetrica ? 'Estação Telemétrica (Tempo Real)' : 'Estação Convencional'
        };
      });

    // Filtra especificamente as estações do Vale do Rio Doce / Região Metropolitana
    const estacoesDoce = estacoesMapeadas.filter(item => {
      const bacia = (item.bacia || '').toLowerCase();
      const rio = (item.rio || '').toLowerCase();
      const mun = (item.municipio || '').toLowerCase();
      return bacia.includes('doce') || rio.includes('doce') || rio.includes('piracicaba') || rio.includes('piranga') || rio.includes('suaçuí') || rio.includes('casca') || ['governador valadares', 'ipatinga', 'coronel fabriciano', 'timóteo', 'caratinga', 'aimorés', 'resplendor', 'colatina', 'linhares', 'ponte nova', 'nova era', 'belo horizonte', 'betim', 'contagem'].some(c => mun.includes(c));
    });

    if (estacoesDoce.length > 0) return estacoesDoce;
    return estacoesMapeadas.length > 0 ? estacoesMapeadas : ESTACOES_VALE_RIO_DOCE;
  } catch (error) {
    console.warn('Não foi possível carregar do HidroWeb online, mantendo estações do Vale do Rio Doce:', error.message);
    return ESTACOES_VALE_RIO_DOCE;
  }
}

/**
 * Consulta série telemétrica adotada recente da estação (chuva, nível, vazão)
 * Parâmetros oficiais exigidos pelo HidroWebService:
 * - Código da Estação (ex: 56850000)
 * - Tipo Filtro Data: 'DATA_LEITURA'
 * - Range Intervalo de busca: 'DIAS_30' ou 'DIAS_7'
 * @param {string} token Bearer token
 * @param {string|number} codigoEstacao Código da estação
 * @param {string} range Intervalo de busca (DIAS_30, DIAS_7, etc.)
 */
/**
 * Consulta série telemétrica adotada recente da estação (chuva, nível, vazão)
 * Parâmetros técnicos oficiais: codEstacao, dataInicio/dataFim ou range
 */
/**
 * Consulta série telemétrica adotada recente da estação (chuva, nível, vazão)
 * Utiliza os parâmetros aceitos pela API da ANA sem misturar chaves conflitantes.
 */
export async function buscarTelemetriaEstacao(token, codigoEstacao, range = 'DIAS_7') {
  if (!token || !codigoEstacao) return [];

  try {
    const estacaoLimpa = String(codigoEstacao).trim();

    // Monta os parâmetros exatamente como registrados no serviço da ANA
    const queryParams = new URLSearchParams();
    queryParams.set('Código da Estação', estacaoLimpa);
    queryParams.set('Tipo Filtro Data', 'DATA_LEITURA');
    queryParams.set('Range Intervalo de busca', range);

    const url = `${API_BASE_URL}/EstacoesTelemetricas/HidroinfoanaSerieTelemetricaAdotada/v1?${queryParams.toString()}`;
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      console.warn(`API ANA retornou status ${response.status} para a estação ${estacaoLimpa}`);
      return [];
    }

    const data = await parseResponseJson(response);
    
    // Normaliza retorno: a API pode retornar um array direto ou um objeto com .items
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && typeof data.items === 'object') return Object.values(data.items);
    
    return [];
  } catch (error) {
    console.warn('Erro ao buscar série telemétrica adotada:', error.message);
    return [];
  }
}

/**
 * Converte medições retornadas pela API da ANA (HidroinfoanaSerieTelemetricaAdotada)
 * em pontos reais para o gráfico, sem dados mockados
 */
export function formatarMedicoesTelemetricas(items) {
  if (!items) return [];
  const lista = Array.isArray(items) ? items : (typeof items === 'object' ? Object.values(items) : []);

  return lista
    .map(item => {
      const dataHoraStr = item.Data_Hora_Medicao || item.DataHoraMedicao || item.DataHora || item.dataHora || item.Data_Atualizacao || '';
      let dataFormatada = dataHoraStr;
      if (dataHoraStr) {
        try {
          const d = new Date(dataHoraStr.replace(' ', 'T'));
          if (!isNaN(d.getTime())) {
            dataFormatada = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          }
        } catch {
          // fallback
        }
      }

      const chuva = parseFloat(item.Chuva_Adotada ?? item.Chuva ?? item.chuva ?? item.Precipitacao);
      const vazao = parseFloat(item.Vazao_Adotada ?? item.Vazao ?? item.vazao);
      const nivel = parseFloat(item.Cota_Adotada ?? item.Nivel ?? item.nivel ?? item.Cota);

      return {
        dataHoraOriginal: dataHoraStr,
        dataFormatada,
        chuva: !isNaN(chuva) ? chuva : null,
        vazao: !isNaN(vazao) ? vazao : null,
        nivel: !isNaN(nivel) ? nivel : null,
      };
    })
    .filter(p => p.dataHoraOriginal)
    .sort((a, b) => new Date(a.dataHoraOriginal) - new Date(b.dataHoraOriginal));
}

/**
 * Converte e enriquece os dados de chuva retornados pelo HidroinfoanaSerieTelemetricaAdotada
 * para exibição em gráficos e cards analíticos de monitoramento.
 */
export function formatarDadosPrecipitacao(items) {
  if (!items) {
    return {
      medicoes: [],
      dadosDiarios: [],
      estatisticas: {
        totalChuva: 0,
        maximaChuva: 0,
        momentoMaxima: null,
        ultimaLeitura: null,
        totalLeituras: 0,
      }
    };
  }

  const lista = Array.isArray(items) ? items : (typeof items === 'object' ? Object.values(items) : []);

  // Ordenar cronologicamente crescente
  const ordenados = lista
    .map(item => {
      const dataHoraStr = item.Data_Hora_Medicao || item.DataHoraMedicao || item.DataHora || item.dataHora || item.Data_Atualizacao || '';
      const chuvaVal = parseFloat(item.Chuva_Adotada ?? item.Chuva ?? item.chuva ?? item.Precipitacao);
      const chuva = !isNaN(chuvaVal) && chuvaVal >= 0 ? chuvaVal : 0;

      return {
        itemOriginal: item,
        dataHoraStr,
        chuva,
      };
    })
    .filter(p => Boolean(p.dataHoraStr))
    .sort((a, b) => {
      const ta = new Date(a.dataHoraStr.replace(' ', 'T')).getTime();
      const tb = new Date(b.dataHoraStr.replace(' ', 'T')).getTime();
      return ta - tb;
    });

  let acumulado = 0;
  let maximaChuva = 0;
  let momentoMaxima = null;

  // Agrupamento diário
  const agrupamentoDiario = {};

  const medicoes = ordenados.map(({ dataHoraStr, chuva }) => {
    acumulado += chuva;
    if (chuva > maximaChuva) {
      maximaChuva = chuva;
      momentoMaxima = dataHoraStr;
    }

    let dataFormatada = dataHoraStr;
    let diaLabel = '';
    let horaLabel = '';

    try {
      const d = new Date(dataHoraStr.replace(' ', 'T'));
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        dataFormatada = `${dd}/${mm} ${hh}:${min}`;
        diaLabel = `${dd}/${mm}`;
        horaLabel = `${hh}:${min}`;

        // Chave YYYY-MM-DD para agrupamento
        const ano = d.getFullYear();
        const chaveDia = `${ano}-${mm}-${dd}`;
        if (!agrupamentoDiario[chaveDia]) {
          agrupamentoDiario[chaveDia] = {
            diaChave: chaveDia,
            dia: diaLabel,
            chuvaTotal: 0,
            leituras: 0,
          };
        }
        agrupamentoDiario[chaveDia].chuvaTotal += chuva;
        agrupamentoDiario[chaveDia].leituras += 1;
      }
    } catch {
      // fallback
    }

    return {
      dataHoraOriginal: dataHoraStr,
      dataFormatada,
      dia: diaLabel,
      hora: horaLabel,
      chuva: Number(chuva.toFixed(2)),
      chuvaAcumulada: Number(acumulado.toFixed(2)),
    };
  });

  const dadosDiarios = Object.values(agrupamentoDiario).map(d => ({
    ...d,
    chuvaTotal: Number(d.chuvaTotal.toFixed(2)),
  }));

  const ultimaMedicao = medicoes.length > 0 ? medicoes[medicoes.length - 1] : null;

  return {
    medicoes,
    dadosDiarios,
    estatisticas: {
      totalChuva: Number(acumulado.toFixed(2)),
      maximaChuva: Number(maximaChuva.toFixed(2)),
      momentoMaxima,
      ultimaLeitura: ultimaMedicao,
      totalLeituras: medicoes.length,
    }
  };
}

/**
 * Busca a série telemétrica de precipitação recente de uma estação automática
 * @param {Object} opcoes
 * @param {string|number} opcoes.codigoEstacao Código telemétrico da estação (ex: 56850000)
 * @param {string} [opcoes.range='DIAS_7'] Intervalo (HORA_24, DIAS_7, DIAS_14, DIAS_30)
 * @param {string} [opcoes.token] Token JWT (se omitido, usa credenciais padrão)
 */
export async function buscarSeriePrecipitacao({ codigoEstacao, range = 'DIAS_7', token = null }) {
  try {
    const authToken = token || await obterTokenPadrao();
    const items = await buscarTelemetriaEstacao(authToken, codigoEstacao, range);

    // Se a estação não tem registros no período (comum em estações só fluviométricas)
    if (!items || items.length === 0) {
      return {
        sucesso: true,
        codigoEstacao,
        range,
        medicoes: [],
        dadosDiarios: [],
        estatisticas: {
          totalChuva: 0,
          maximaChuva: 0,
          momentoMaxima: null,
          ultimaLeitura: null,
          totalLeituras: 0,
        }
      };
    }

    const resultado = formatarDadosPrecipitacao(items);
    return {
      sucesso: true,
      codigoEstacao,
      range,
      ...resultado,
    };
  } catch (error) {
    console.error('Erro ao buscar dados de precipitação recente:', error);
    return {
      sucesso: false,
      codigoEstacao,
      range,
      erro: error.message || 'Falha na comunicação com a API HidroWeb.',
      medicoes: [],
      dadosDiarios: [],
      estatisticas: {
        totalChuva: 0,
        maximaChuva: 0,
        momentoMaxima: null,
        ultimaLeitura: null,
        totalLeituras: 0,
      }
    };
  }
}