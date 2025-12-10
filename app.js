// ---- Navegação ----
const homeView = document.getElementById('homeView');
const clientesView = document.getElementById('clientesView');
const clienteDetalheView = document.getElementById('clienteDetalheView');
const produtosView = document.getElementById('produtosView');
const dadosView = document.getElementById('dadosView');
const configView = document.getElementById('configView');

const btnGoClientes = document.getElementById('btnGoClientes');
const btnGoProdutos = document.getElementById('btnGoProdutos');
const btnGoDados = document.getElementById('btnGoDados');
const btnGoConfig = document.getElementById('btnGoConfig');
const btnBackupAll = document.getElementById('btnBackupAll');
const btnImportBackup = document.getElementById('btnImportBackup');
const backupJsonInput = document.getElementById('backupJsonInput');
const btnHomes = document.querySelectorAll('.btn-home');
const btnVoltarClientes = document.getElementById('btnVoltarClientes');

let clienteSelecionado = null;
let visitaEditandoId = null;
let itensVisitaAtual = [];

function showView(view) {
  homeView.classList.add('hidden');
  clientesView.classList.add('hidden');
  clienteDetalheView.classList.add('hidden');
  produtosView.classList.add('hidden');
  dadosView.classList.add('hidden');
  configView.classList.add('hidden');

  if (view === 'home') homeView.classList.remove('hidden');
  if (view === 'clientes') clientesView.classList.remove('hidden');
  if (view === 'clienteDetalhe') clienteDetalheView.classList.remove('hidden');
  if (view === 'produtos') produtosView.classList.remove('hidden');
  if (view === 'dados') dadosView.classList.remove('hidden');
  if (view === 'config') configView.classList.remove('hidden');
}

btnGoClientes.addEventListener('click', () => showView('clientes'));
btnGoProdutos.addEventListener('click', () => showView('produtos'));
btnGoDados.addEventListener('click', () => showView('dados'));
btnGoConfig.addEventListener('click', () => {
  carregarConfigUI();
  showView('config');
});
btnHomes.forEach(b => b.addEventListener('click', () => showView('home')));
btnVoltarClientes.addEventListener('click', () => {
  clienteSelecionado = null;
  showView('clientes');
});

// ---- Constantes de storage ----
const STORAGE_KEY = 'giro_estoque_lancamentos_v1';
const CLIENTES_KEY = 'giro_estoque_clientes_v1';
const PRODUTOS_KEY = 'giro_estoque_produtos_v1';
const CONFIG_KEY = 'giro_estoque_config_v1';
const LAST_VENDEDOR_KEY = 'giro_estoque_last_vendedor';
const LAST_CLIENTE_KEY = 'giro_estoque_last_cliente';

// ---- Helpers de storage ----
function obterDados() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function salvarDados(dados) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}
function obterClientes() {
  return JSON.parse(localStorage.getItem(CLIENTES_KEY) || '[]');
}
function salvarClientes(clientes) {
  localStorage.setItem(CLIENTES_KEY, JSON.stringify(clientes));
}
function obterProdutos() {
  return JSON.parse(localStorage.getItem(PRODUTOS_KEY) || '[]');
}
function salvarProdutos(produtos) {
  localStorage.setItem(PRODUTOS_KEY, JSON.stringify(produtos));
}
function obterConfig() {
  const padrao = {
    empresa: {
      nome: '',
      logoDataUrl: ''
    },
    vendedores: []
  };
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return padrao;
    const obj = JSON.parse(raw);
    if (!obj.empresa) obj.empresa = { nome: '', logoDataUrl: '' };
    if (!Array.isArray(obj.vendedores)) obj.vendedores = [];
    return obj;
  } catch (e) {
    return padrao;
  }
}
function salvarConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

// ---- Normalizar texto: maiúsculo e sem acento ----
function normalizarMaiusculoSemAcento(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

// ---- Migração de dados antigos para novo formato (multi-produto) ----
function migrarDados() {
  const dados = obterDados();
  let alterou = false;

  dados.forEach((d, idx) => {
    if (!d.id) {
      d.id =
        'V' +
        Date.now().toString(36) +
        '_' +
        idx +
        '_' +
        Math.random().toString(36).slice(2, 7);
      alterou = true;
    }
    if (!d.itens) {
      const produto = d.produto || 'SEM PRODUTO';
      const estoque = d.estoque || '0';
      const sugestao = d.sugestao || '0';
      d.itens = [{ produto, estoque, sugestao }];
      alterou = true;
    }
    if (!d.status) {
      d.status = 'PENDENTE';
      alterou = true;
    }
  });

  if (alterou) {
    salvarDados(dados);
  }
}

// ---- Clientes: UI ----
const listaClientesDL = document.getElementById('listaClientes');
const listaClientesView = document.getElementById('listaClientesView');
const filtroListaClientes = document.getElementById('filtroListaClientes');
const filtroDiasSemVisita = document.getElementById('filtroDiasSemVisita');
const novoClienteNome = document.getElementById('novoClienteNome');
const novoClienteCidade = document.getElementById('novoClienteCidade');
const salvarClienteBtn = document.getElementById('salvarClienteBtn');
const importClientesBtn = document.getElementById('importClientesBtn');
const baixarModeloClientesBtn = document.getElementById('baixarModeloClientesBtn');
const clientesCsvInput = document.getElementById('clientesCsvInput');
const apagarTodosClientesBtn = document.getElementById('apagarTodosClientesBtn');

const clienteDetalheTitulo = document.getElementById('clienteDetalheTitulo');
const clienteDetalheCidade = document.getElementById('clienteDetalheCidade');
const clienteResumo = document.getElementById('clienteResumo');
const clienteProdutosLista = document.getElementById('clienteProdutosLista');
const clienteHistoricoVisitas = document.getElementById('clienteHistoricoVisitas');
const clienteVisVendedor = document.getElementById('clienteVisVendedor');
const clienteVisProxVisita = document.getElementById('clienteVisProxVisita');
const clienteVisStatus = document.getElementById('clienteVisStatus');
const clienteVisObs = document.getElementById('clienteVisObs');
const clienteItemProduto = document.getElementById('clienteItemProduto');
const clienteItemEstoque = document.getElementById('clienteItemEstoque');
const clienteItemSugestao = document.getElementById('clienteItemSugestao');
const clienteAddProdutoBtn = document.getElementById('clienteAddProdutoBtn');
const clienteListaItensVisita = document.getElementById('clienteListaItensVisita');
const clienteNovaVisitaBtn = document.getElementById('clienteNovaVisitaBtn');
const clienteCancelarEdicaoBtn = document.getElementById('clienteCancelarEdicaoBtn');
const clienteVisInfoEdicao = document.getElementById('clienteVisInfoEdicao');
const clienteSugestaoAutoBtn = document.getElementById('clienteSugestaoAutoBtn');
const btnExportarHistoricoCliente = document.getElementById('btnExportarHistoricoCliente');

function atualizarDatalistClientes() {
  const clientes = obterClientes();
  listaClientesDL.innerHTML = '';
  clientes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.nome;
    if (c.cidade) opt.label = `${c.nome} - ${c.cidade}`;
    listaClientesDL.appendChild(opt);
  });
}

// mapa de última visita por produto para um cliente
function obterUltimoPorProdutoCliente(nomeCliente) {
  const dados = obterDados();
  const visitas = dados.filter(v => v.cliente === nomeCliente);
  const mapa = new Map();
  visitas.forEach(v => {
    const itens = v.itens && v.itens.length
      ? v.itens
      : [{ produto: v.produto, estoque: v.estoque, sugestao: v.sugestao }];
    itens.forEach(it => {
      if (!it.produto) return;
      const atual = mapa.get(it.produto);
      if (!atual || (v.timestamp || 0) > atual.timestamp) {
        mapa.set(it.produto, {
          estoque: Number(it.estoque || 0),
          sugestao: Number(it.sugestao || 0),
          timestamp: v.timestamp || 0,
          data: v.data || ''
        });
      }
    });
  });
  return mapa;
}

// lista de clientes agrupados por cidade + filtro de dias sem visita
function atualizarListaClientesView() {
  const clientes = obterClientes();
  const filtro = filtroListaClientes.value.trim().toUpperCase();
  const diasFiltro = Number(filtroDiasSemVisita.value || '0');
  listaClientesView.innerHTML = '';

  if (!clientes.length) {
    const p = document.createElement('p');
    p.textContent = 'Nenhum cliente cadastrado.';
    listaClientesView.appendChild(p);
    return;
  }

  const dados = obterDados();
  const ultVisitaPorCliente = new Map();
  dados.forEach(v => {
    if (!v.cliente) return;
    const t = v.timestamp || 0;
    const atual = ultVisitaPorCliente.get(v.cliente) || 0;
    if (t > atual) ultVisitaPorCliente.set(v.cliente, t);
  });

  const hoje = new Date();
  const hojeMs = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  const porCidade = new Map();
  clientes.forEach(c => {
    const cidade = c.cidade || 'SEM CIDADE';
    if (!porCidade.has(cidade)) porCidade.set(cidade, []);
    porCidade.get(cidade).push(c);
  });

  Array.from(porCidade.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .forEach(([cidade, lista]) => {
      let cidadeTemCliente = false;

      lista
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach(c => {
          const textoBusca = (c.nome + ' ' + (c.cidade || '')).toUpperCase();
          if (filtro && !textoBusca.includes(filtro)) return;

          if (diasFiltro > 0) {
            const lastTs = ultVisitaPorCliente.get(c.nome) || 0;
            if (lastTs > 0) {
              const diffDias = (hojeMs - lastTs) / (24 * 60 * 60 * 1000);
              if (diffDias < diasFiltro) {
                return;
              }
            }
          }

          if (!cidadeTemCliente) {
            const cidadeTitulo = document.createElement('p');
            cidadeTitulo.style.fontWeight = '600';
            cidadeTitulo.style.marginTop = '8px';
            cidadeTitulo.textContent = cidade;
            listaClientesView.appendChild(cidadeTitulo);
            cidadeTemCliente = true;
          }

          const linha = document.createElement('div');
          linha.className = 'linha-cliente';

          const spanNome = document.createElement('span');
          spanNome.className = 'linha-cliente-nome';
          spanNome.textContent = `• ${c.nome}`;
          spanNome.addEventListener('click', () => {
            abrirClienteDetalhe(c);
          });

          const btnEditar = document.createElement('button');
          btnEditar.textContent = 'Editar';
          btnEditar.className = 'secondary small';
          btnEditar.addEventListener('click', () => {
            const novoNome = prompt('Editar nome do cliente:', c.nome);
            if (!novoNome) return;
            const novoCidade = prompt('Editar cidade do cliente:', c.cidade || '');
            const nomeNorm = normalizarMaiusculoSemAcento(novoNome);
            const cidadeNorm = normalizarMaiusculoSemAcento(novoCidade || '');

            const todos = obterClientes();
            const outros = todos.filter(x => x.nome !== c.nome || x.cidade !== c.cidade);
            outros.push({ nome: nomeNorm, cidade: cidadeNorm });
            outros.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            salvarClientes(outros);
            atualizarDatalistClientes();

            const dadosAtual = obterDados();
            dadosAtual.forEach(v => {
              if (v.cliente === c.nome) {
                v.cliente = nomeNorm;
              }
            });
            salvarDados(dadosAtual);

            atualizarListaClientesView();
            carregarLancamentos();
            alert('Cliente atualizado.');
          });

          const btnExcluir = document.createElement('button');
          btnExcluir.textContent = 'Excluir';
          btnExcluir.className = 'danger small';
          btnExcluir.addEventListener('click', () => {
            excluirCliente(c.nome);
          });

          linha.appendChild(spanNome);
          linha.appendChild(btnEditar);
          linha.appendChild(btnExcluir);
          listaClientesView.appendChild(linha);
        });
    });

  if (!listaClientesView.children.length) {
    const p = document.createElement('p');
    p.textContent = 'Nenhum cliente encontrado com os filtros atuais.';
    listaClientesView.appendChild(p);
  }
}

salvarClienteBtn.addEventListener('click', () => {
  const nome = normalizarMaiusculoSemAcento(novoClienteNome.value);
  const cidade = normalizarMaiusculoSemAcento(novoClienteCidade.value);

  if (!nome) {
    alert('Preencha o nome do cliente.');
    return;
  }

  const atuais = obterClientes();
  const mapa = new Map();
  atuais.forEach(c => {
    mapa.set(c.nome + '|' + (c.cidade || ''), c);
  });

  mapa.set(nome + '|' + cidade, { nome, cidade });

  const final = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  salvarClientes(final);
  atualizarDatalistClientes();
  atualizarListaClientesView();

  novoClienteNome.value = '';
  novoClienteCidade.value = '';
  alert('Cliente salvo com sucesso.');
});

filtroListaClientes.addEventListener('input', atualizarListaClientesView);
filtroDiasSemVisita.addEventListener('input', atualizarListaClientesView);

// Importar CSV genérico
function parseCsv(text) {
  const linhas = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  const resultado = [];
  for (let i = 0; i < linhas.length; i++) {
    const partes = linhas[i].split(/[;,]/).map(p => p.trim());
    if (!partes.length) continue;
    resultado.push(partes);
  }
  return resultado;
}

// Importar clientes CSV
importClientesBtn.addEventListener('click', () => {
  clientesCsvInput.click();
});

clientesCsvInput.addEventListener('change', () => {
  const file = clientesCsvInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const texto = reader.result;
    const linhas = parseCsv(texto);
    const novos = [];

    linhas.forEach((cols, index) => {
      if (!cols[0]) return;
      let nome = cols[0];
      let cidade = cols[1] || '';

      if (index === 0 && nome.toLowerCase().includes('nome')) return;

      nome = normalizarMaiusculoSemAcento(nome);
      cidade = normalizarMaiusculoSemAcento(cidade);

      novos.push({ nome, cidade });
    });

    if (!novos.length) {
      alert('Não encontrei clientes válidos no CSV.');
      return;
    }

    const atuais = obterClientes();
    const mapa = new Map();
    atuais.forEach(c => {
      mapa.set(c.nome + '|' + (c.cidade || ''), c);
    });
    novos.forEach(c => {
      mapa.set(c.nome + '|' + (c.cidade || ''), c);
    });

    const final = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    salvarClientes(final);
    atualizarDatalistClientes();
    atualizarListaClientesView();

    alert(`Importei ${novos.length} clientes (sem duplicar os existentes).`);
    clientesCsvInput.value = '';
  };
  reader.readAsText(file, 'utf-8');
});

baixarModeloClientesBtn.addEventListener('click', () => {
  const linhas = [
    'nome;cidade',
    'Pet Shop Alegria;Quirinopolis',
    'Bicho Feliz;Goiania'
  ];
  const csvContent = linhas.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_clientes.csv';
  a.click();
  URL.revokeObjectURL(url);
});

apagarTodosClientesBtn.addEventListener('click', () => {
  if (!confirm('Tem certeza que deseja apagar TODOS os clientes deste aparelho?')) return;
  localStorage.removeItem(CLIENTES_KEY);
  atualizarDatalistClientes();
  atualizarListaClientesView();
  alert('Todos os clientes foram apagados deste aparelho.');
});

function excluirCliente(clienteNome) {
  if (!confirm(`Apagar cliente ${clienteNome} e todas as visitas dele?`)) return;
  const clientes = obterClientes().filter(c => c.nome !== clienteNome);
  salvarClientes(clientes);

  const dados = obterDados().filter(v => v.cliente !== clienteNome);
  salvarDados(dados);

  atualizarDatalistClientes();
  atualizarListaClientesView();
  carregarLancamentos();

  if (clienteSelecionado && clienteSelecionado.nome === clienteNome) {
    clienteSelecionado = null;
    showView('clientes');
  }
}

// ---- Detalhe do cliente ----
function renderizarItensVisitaAtual() {
  clienteListaItensVisita.innerHTML = '';
  if (!itensVisitaAtual.length) {
    const p = document.createElement('p');
    p.textContent = 'Nenhum produto adicionado ainda.';
    p.style.fontSize = '12px';
    p.style.color = '#6b7280';
    clienteListaItensVisita.appendChild(p);
    return;
  }

  const mapaUltimo = clienteSelecionado
    ? obterUltimoPorProdutoCliente(clienteSelecionado.nome)
    : new Map();

  itensVisitaAtual.forEach((it, index) => {
    const linha = document.createElement('div');
    linha.className = 'item-visita';

    const info = document.createElement('div');
    info.className = 'item-visita-info';

    const descr = document.createElement('div');
    descr.className = 'prod-descricao';
    descr.textContent = it.produto || 'SEM PRODUTO';

    const ultimo = mapaUltimo.get(it.produto);
    const numsAnterior = document.createElement('div');
    numsAnterior.className = 'prod-numeros-anterior';
    if (ultimo) {
      numsAnterior.textContent =
        `Última visita: Estoque ${ultimo.estoque} • Venda ${ultimo.sugestao} (${ultimo.data || 'data não informada'})`;
    } else {
      numsAnterior.textContent = 'Última visita: sem histórico.';
    }

    const numsAtual = document.createElement('div');
    numsAtual.className = 'prod-numeros';
    numsAtual.textContent =
      `Atual: Estoque ${it.estoque || '0'} • Venda ${it.sugestao || '0'}`;

    info.appendChild(descr);
    info.appendChild(numsAnterior);
    info.appendChild(numsAtual);

    const edit = document.createElement('div');
    edit.className = 'item-visita-edit';

    const estInput = document.createElement('input');
    estInput.type = 'number';
    estInput.inputMode = 'numeric';
    estInput.min = '0';
    estInput.value = it.estoque || '0';
    estInput.placeholder = 'Estoque';
    estInput.addEventListener('input', e => {
      let v = parseInt(e.target.value || '0', 10);
      if (isNaN(v) || v < 0) v = 0;
      e.target.value = v;
      itensVisitaAtual[index].estoque = String(v);
      numsAtual.textContent =
        `Atual: Estoque ${itensVisitaAtual[index].estoque} • Venda ${itensVisitaAtual[index].sugestao}`;
    });

    const sugInput = document.createElement('input');
    sugInput.type = 'number';
    sugInput.inputMode = 'numeric';
    sugInput.min = '0';
    sugInput.value = it.sugestao || '0';
    sugInput.placeholder = 'Venda';
    sugInput.addEventListener('input', e => {
      let v = parseInt(e.target.value || '0', 10);
      if (isNaN(v) || v < 0) v = 0;
      e.target.value = v;
      itensVisitaAtual[index].sugestao = String(v);
      numsAtual.textContent =
        `Atual: Estoque ${itensVisitaAtual[index].estoque} • Venda ${itensVisitaAtual[index].sugestao}`;
    });

    const btnRem = document.createElement('button');
    btnRem.className = 'danger small';
    btnRem.textContent = 'Remover';
    btnRem.addEventListener('click', () => {
      itensVisitaAtual.splice(index, 1);
      renderizarItensVisitaAtual();
    });

    edit.appendChild(estInput);
    edit.appendChild(sugInput);
    edit.appendChild(btnRem);

    linha.appendChild(info);
    linha.appendChild(edit);
    clienteListaItensVisita.appendChild(linha);
  });
}

function resetFormularioVisitaCliente() {
  visitaEditandoId = null;
  clienteVisVendedor.value = '';
  clienteVisProxVisita.value = '';
  clienteVisStatus.value = 'PENDENTE';
  clienteVisObs.value = '';
  clienteItemProduto.value = '';
  clienteItemEstoque.value = '';
  clienteItemSugestao.value = '';
  clienteNovaVisitaBtn.textContent = 'Salvar visita';
  clienteCancelarEdicaoBtn.classList.add('hidden');
  clienteVisInfoEdicao.textContent = '';

  itensVisitaAtual = [];
  if (clienteSelecionado) {
    const dados = obterDados();
    const visitas = dados.filter(d => d.cliente === clienteSelecionado.nome);
    const produtosSet = new Set();
    visitas.forEach(v => {
      const itens = v.itens && v.itens.length
        ? v.itens
        : [{ produto: v.produto, estoque: v.estoque, sugestao: v.sugestao }];
      itens.forEach(it => {
        if (it.produto) produtosSet.add(it.produto);
      });
    });
    itensVisitaAtual = Array.from(produtosSet).map(prod => ({
      produto: prod,
      estoque: '0',
      sugestao: '0'
    }));
  }
  renderizarItensVisitaAtual();
}

function abrirClienteDetalhe(cliente) {
  clienteSelecionado = cliente;
  clienteDetalheTitulo.textContent = cliente.nome;
  clienteDetalheCidade.textContent = cliente.cidade ? `Cidade: ${cliente.cidade}` : 'Cidade não informada';
  resetFormularioVisitaCliente();
  atualizarClienteDetalhe();
  showView('clienteDetalhe');
}

clienteAddProdutoBtn.addEventListener('click', () => {
  const prod = normalizarMaiusculoSemAcento(clienteItemProduto.value);
  let est = parseInt(clienteItemEstoque.value || '0', 10);
  let sug = parseInt(clienteItemSugestao.value || '0', 10);
  if (isNaN(est) || est < 0) est = 0;
  if (isNaN(sug) || sug < 0) sug = 0;

  if (!prod) {
    alert('Preencha o produto para adicionar.');
    return;
  }

  itensVisitaAtual.push({ produto: prod, estoque: String(est), sugestao: String(sug) });
  clienteItemProduto.value = '';
  clienteItemEstoque.value = '';
  clienteItemSugestao.value = '';
  renderizarItensVisitaAtual();
});

function atualizarResumoCliente(visitas) {
  if (!clienteSelecionado) {
    clienteResumo.textContent = '';
    return;
  }
  if (!visitas.length) {
    clienteResumo.textContent = 'Nenhuma visita registrada ainda para este cliente.';
    return;
  }
  const totalVisitas = visitas.length;
  let totalSacos = 0;
  let ultimoTs = 0;
  let ultimoData = '';

  visitas.forEach(v => {
    const itens = v.itens && v.itens.length
      ? v.itens
      : [{ produto: v.produto, estoque: v.estoque, sugestao: v.sugestao }];
    itens.forEach(it => {
      totalSacos += Number(it.sugestao || 0);
    });
    if ((v.timestamp || 0) > ultimoTs) {
      ultimoTs = v.timestamp || 0;
      ultimoData = v.data || '';
    }
  });

  let diasDesde = '';
  if (ultimoTs) {
    const hoje = new Date();
    const hojeMs = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    const diffDias = Math.round((hojeMs - ultimoTs) / (24 * 60 * 60 * 1000));
    diasDesde = diffDias >= 0 ? diffDias : 0;
  }

  clienteResumo.innerHTML =
    `<strong>Resumo do cliente:</strong><br>` +
    `• Visitas registradas: ${totalVisitas}<br>` +
    `• Total vendido (sacos): ${totalSacos}<br>` +
    (ultimoData
      ? `• Última visita: ${ultimoData} (${diasDesde} dia(s) atrás)`
      : '• Última visita: sem registro.');
}

function atualizarClienteDetalhe() {
  if (!clienteSelecionado) return;
  const dados = obterDados();
  const visitas = dados.filter(d => d.cliente === clienteSelecionado.nome);

  atualizarResumoCliente(visitas);

  const produtosSet = new Map();
  visitas.forEach(v => {
    const itens = v.itens && v.itens.length
      ? v.itens
      : [{ produto: v.produto, estoque: v.estoque, sugestao: v.sugestao }];
    itens.forEach(it => {
      const prod = it.produto || 'SEM PRODUTO';
      if (!produtosSet.has(prod)) produtosSet.set(prod, 0);
      produtosSet.set(prod, produtosSet.get(prod) + 1);
    });
  });

  clienteProdutosLista.innerHTML = '';
  if (!produtosSet.size) {
    const p = document.createElement('p');
    p.textContent = 'Nenhum produto registrado ainda para este cliente.';
    clienteProdutosLista.appendChild(p);
  } else {
    Array.from(produtosSet.entries()).forEach(([nome, qtd]) => {
      const p = document.createElement('p');
      p.textContent = `${nome} • ${qtd} visita(s)`;
      clienteProdutosLista.appendChild(p);
    });
  }

  clienteHistoricoVisitas.innerHTML = '';
  if (!visitas.length) {
    const p = document.createElement('p');
    p.textContent = 'Nenhuma visita registrada ainda.';
    clienteHistoricoVisitas.appendChild(p);
  } else {
    visitas
      .slice()
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .forEach(v => {
        const div = document.createElement('div');
        div.className = 'lancamento';

        const topo = document.createElement('div');
        topo.className = 'linha-topo';

        const status = v.status || 'PENDENTE';
        let statusText = 'Pendente';
        let statusClass = 'badge-status-pendente';
        if (status === 'FECHOU') {
          statusText = 'Fechou pedido';
          statusClass = 'badge-status-fechou';
        } else if (status === 'NAO_FECHOU') {
          statusText = 'Não fechou';
          statusClass = 'badge-status-nao-fechou';
        }

        topo.innerHTML = `
          <span>${clienteSelecionado.nome}</span>
          <span class="badge badge-vendedor">${v.vendedor || 'SEM VENDEDOR'}</span>
        `;
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge ${statusClass}`;
        statusBadge.textContent = statusText;
        topo.appendChild(statusBadge);

        const btnPdf = document.createElement('button');
        btnPdf.className = 'secondary small';
        btnPdf.textContent = 'PDF';
        btnPdf.addEventListener('click', () => exportarVisitaPdf(clienteSelecionado, v));
        topo.appendChild(btnPdf);

        const meio = document.createElement('div');
        meio.className = 'linha-meio';

        const itens = v.itens && v.itens.length
          ? v.itens
          : [{ produto: v.produto, estoque: v.estoque, sugestao: v.sugestao }];
        itens.forEach(it => {
          const linha = document.createElement('div');
          linha.className = 'item-visita';
          const info = document.createElement('div');
          info.className = 'item-visita-info';

          const descr = document.createElement('div');
          descr.className = 'prod-descricao';
          descr.textContent = it.produto || 'SEM PRODUTO';

          const estoqueNum = Number(it.estoque || 0);
          const estoqueClasse = estoqueNum <= 3 ? 'estoque-baixo' : '';
          const estoqueLabelExtra = estoqueNum <= 3 ? ' (baixo)' : '';

          const nums = document.createElement('div');
          nums.className = 'prod-numeros';
          nums.innerHTML = `Estoque: <span class="${estoqueClasse}">${it.estoque}</span>${estoqueLabelExtra} • Venda: <strong>${it.sugestao}</strong>`;

          info.appendChild(descr);
          info.appendChild(nums);
          linha.appendChild(info);
          meio.appendChild(linha);
        });

        const obs = document.createElement('div');
        obs.className = 'obs';
        obs.textContent = v.obs || '';

        const data = document.createElement('div');
        data.className = 'data';
        data.textContent = v.data || '';

        const acoes = document.createElement('div');
        acoes.className = 'acoes-visita';
        const btnEditarVis = document.createElement('button');
        btnEditarVis.className = 'secondary small';
        btnEditarVis.textContent = 'Editar';
        btnEditarVis.addEventListener('click', () => iniciarEdicaoVisita(v));

        const btnExcluirVis = document.createElement('button');
        btnExcluirVis.className = 'danger small';
        btnExcluirVis.textContent = 'Excluir';
        btnExcluirVis.addEventListener('click', () => excluirVisita(v.id));

        acoes.appendChild(btnEditarVis);
        acoes.appendChild(btnExcluirVis);

        div.appendChild(topo);
        div.appendChild(meio);
        if (v.obs) div.appendChild(obs);
        if (v.proxVisita) {
          const prox = document.createElement('div');
          prox.className = 'prox-visita';
          prox.textContent = `Próxima visita: ${v.proxVisita}`;
          div.appendChild(prox);
        }
        div.appendChild(data);
        div.appendChild(acoes);

        clienteHistoricoVisitas.appendChild(div);
      });
  }
}

function iniciarEdicaoVisita(visita) {
  visitaEditandoId = visita.id;
  const itens = visita.itens && visita.itens.length
    ? visita.itens
    : [{ produto: visita.produto, estoque: visita.estoque, sugestao: visita.sugestao }];
  itensVisitaAtual = itens.map(it => ({
    produto: it.produto || '',
    estoque: String(Math.max(0, Number(it.estoque || 0))),
    sugestao: String(Math.max(0, Number(it.sugestao || 0)))
  }));
  clienteVisVendedor.value = visita.vendedor || '';
  clienteVisProxVisita.value = visita.proxVisita || '';
  clienteVisStatus.value = visita.status || 'PENDENTE';
  clienteVisObs.value = visita.obs || '';
  clienteNovaVisitaBtn.textContent = 'Salvar alterações da visita';
  clienteCancelarEdicaoBtn.classList.remove('hidden');
  clienteVisInfoEdicao.textContent = 'Editando visita existente. Após salvar, o histórico será atualizado.';
  renderizarItensVisitaAtual();
}

clienteCancelarEdicaoBtn.addEventListener('click', () => {
  resetFormularioVisitaCliente();
});

clienteSugestaoAutoBtn.addEventListener('click', () => {
  if (!clienteSelecionado) {
    alert('Nenhum cliente selecionado.');
    return;
  }
  if (!itensVisitaAtual.length) {
    alert('Nenhum produto na visita para sugerir quantidade.');
    return;
  }

  const dados = obterDados();
  const visitas = dados.filter(v => v.cliente === clienteSelecionado.nome);
  const ultimoPorProduto = new Map();

  visitas.forEach(v => {
    const itens = v.itens && v.itens.length
      ? v.itens
      : [{ produto: v.produto, estoque: v.estoque, sugestao: v.sugestao }];
    itens.forEach(it => {
      if (!it.produto) return;
      const atual = ultimoPorProduto.get(it.produto);
      if (!atual || (v.timestamp || 0) > atual.timestamp) {
        ultimoPorProduto.set(it.produto, {
          estoque: Number(it.estoque || 0),
          sugestao: Number(it.sugestao || 0),
          timestamp: v.timestamp || 0
        });
      }
    });
  });

  const hoje = new Date();
  const hojeMs = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();

  itensVisitaAtual.forEach(it => {
    const prev = ultimoPorProduto.get(it.produto);
    if (!prev) return;
    const estAtual = Math.max(0, Number(it.estoque || 0));
    const estAnterior = Math.max(0, prev.estoque);
    const vendaAnterior = Math.max(0, prev.sugestao);

    const baseMedia = (estAnterior + vendaAnterior + estAtual) / 3;

    let fatorDias = 1;
    if (prev.timestamp) {
      let diasEntre = (hojeMs - prev.timestamp) / (24 * 60 * 60 * 1000);
      if (diasEntre < 0) diasEntre = 0;
      fatorDias = 1 + (diasEntre / 30) * 0.3;
      if (fatorDias < 0.8) fatorDias = 0.8;
      if (fatorDias > 1.8) fatorDias = 1.8;
    }

    const sugestaoCalc = Math.round(baseMedia * fatorDias);
    const finalSug = Math.max(0, sugestaoCalc);

    it.sugestao = String(finalSug);
  });

  renderizarItensVisitaAtual();
  alert('Sugestão calculada com base na visita anterior (estoque + venda) e número de dias até hoje.');
});

clienteNovaVisitaBtn.addEventListener('click', () => {
  if (!clienteSelecionado) {
    alert('Nenhum cliente selecionado.');
    return;
  }

  if (!itensVisitaAtual.length) {
    alert('Adicione pelo menos um produto na visita.');
    return;
  }

  const vendedor = normalizarMaiusculoSemAcento(clienteVisVendedor.value);
  const proxVisita = clienteVisProxVisita.value;
  const status = clienteVisStatus.value || 'PENDENTE';
  const obs = clienteVisObs.value.trim();

  itensVisitaAtual.forEach(it => {
    let e = Number(it.estoque || 0);
    let s = Number(it.sugestao || 0);
    if (isNaN(e) || e < 0) e = 0;
    if (isNaN(s) || s < 0) s = 0;
    it.estoque = String(e);
    it.sugestao = String(s);
  });

  const dados = obterDados();

  if (visitaEditandoId) {
    const idx = dados.findIndex(v => v.id === visitaEditandoId);
    if (idx === -1) {
      alert('Não encontrei a visita para editar.');
    } else {
      const visita = dados[idx];
      visita.vendedor = vendedor || 'SEM VENDEDOR';
      visita.cliente = clienteSelecionado.nome;
      visita.itens = itensVisitaAtual.map(it => ({
        produto: it.produto,
        estoque: it.estoque,
        sugestao: it.sugestao
      }));
      const primeiro = visita.itens[0];
      visita.produto = primeiro.produto;
      visita.estoque = primeiro.estoque;
      visita.sugestao = primeiro.sugestao;
      visita.obs = obs;
      visita.proxVisita = proxVisita || '';
      visita.status = status;
      visita.data = new Date().toLocaleString('pt-BR');
      visita.timestamp = Date.now();
      dados[idx] = visita;
      salvarDados(dados);
      if (vendedor) localStorage.setItem(LAST_VENDEDOR_KEY, vendedor);
      localStorage.setItem(LAST_CLIENTE_KEY, clienteSelecionado.nome);
      alert('Visita atualizada para este cliente.');
    }
  } else {
    const nova = {
      id:
        'V' +
        Date.now().toString(36) +
        '_' +
        Math.random().toString(36).slice(2, 7),
      vendedor: vendedor || 'SEM VENDEDOR',
      cliente: clienteSelecionado.nome,
      itens: itensVisitaAtual.map(it => ({
        produto: it.produto,
        estoque: it.estoque,
        sugestao: it.sugestao
      })),
      obs,
      data: new Date().toLocaleString('pt-BR'),
      timestamp: Date.now(),
      status
    };
    const primeiro = nova.itens[0];
    nova.produto = primeiro.produto;
    nova.estoque = primeiro.estoque;
    nova.sugestao = primeiro.sugestao;
    if (proxVisita) nova.proxVisita = proxVisita;

    dados.push(nova);
    salvarDados(dados);
    if (vendedor) localStorage.setItem(LAST_VENDEDOR_KEY, vendedor);
    localStorage.setItem(LAST_CLIENTE_KEY, clienteSelecionado.nome);
    alert('Visita salva para este cliente.');
  }

  resetFormularioVisitaCliente();
  atualizarClienteDetalhe();
  carregarLancamentos();
});

function excluirVisita(id) {
  if (!confirm('Deseja realmente excluir esta visita?')) return;
  let dados = obterDados();
  const antes = dados.length;
  dados = dados.filter(v => v.id !== id);
  salvarDados(dados);
  if (visitaEditandoId === id) {
    resetFormularioVisitaCliente();
  }
  atualizarClienteDetalhe();
  carregarLancamentos();
  if (dados.length < antes) {
    alert('Visita excluída.');
  }
}

// ---- Exportar PDF (visita e histórico) ----
function abrirJanelaPdf(titulo, htmlInterno) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('O navegador bloqueou a abertura da janela de impressão. Libere pop-ups para este site.');
    return;
  }
  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${titulo}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 16px; }
          h1, h2, h3 { margin: 0 0 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 13px; }
          th { background: #f3f4f6; }
          .meta { font-size: 13px; margin-bottom: 8px; }
          .empresa-header { margin-bottom: 12px; }
          .empresa-header img { max-height: 60px; display:block; margin-bottom:8px; }
        </style>
      </head>
      <body>
        ${htmlInterno}
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

function obterInfoEmpresaEVendedor(visita) {
  const cfg = obterConfig();
  const vendedorNome = visita.vendedor || 'SEM VENDEDOR';
  let empresaGlobal = (cfg.empresa && cfg.empresa.nome) || '';
  let logo = (cfg.empresa && cfg.empresa.logoDataUrl) || '';
  let empresaDoVendedor = '';

  if (Array.isArray(cfg.vendedores)) {
    const cad = cfg.vendedores.find(v => v.nome === vendedorNome);
    if (cad) {
      empresaDoVendedor = cad.empresa || '';
    }
  }

  const empresaFinal = empresaDoVendedor || empresaGlobal;

  return {
    vendedorNome,
    empresaNome: empresaFinal,
    logoDataUrl: logo
  };
}

function exportarVisitaPdf(cliente, visita) {
  if (!cliente || !visita) return;
  const itens = visita.itens && visita.itens.length
    ? visita.itens
    : [{ produto: visita.produto, estoque: visita.estoque, sugestao: visita.sugestao }];

  const info = obterInfoEmpresaEVendedor(visita);

  let html = '<div class="empresa-header">';
  if (info.logoDataUrl) {
    html += `<img src="${info.logoDataUrl}" alt="Logo da empresa" />`;
  }
  if (info.empresaNome) {
    html += `<h1>${info.empresaNome}</h1>`;
  } else {
    html += `<h1>Relatório de visita</h1>`;
  }
  html += '</div>';

  html += `
    <h2>Visita - ${cliente.nome}</h2>
    <div class="meta">
      <div><strong>Cidade:</strong> ${cliente.cidade || 'N/D'}</div>
      <div><strong>Data registro:</strong> ${visita.data || 'N/D'}</div>
      <div><strong>Vendedor:</strong> ${info.vendedorNome}</div>
      <div><strong>Status:</strong> ${visita.status || 'PENDENTE'}</div>
      <div><strong>Próxima visita:</strong> ${visita.proxVisita || 'N/D'}</div>
    </div>
    <h3>Produtos da visita</h3>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Estoque</th>
          <th>Venda</th>
        </tr>
      </thead>
      <tbody>
  `;

  itens.forEach(it => {
    html += `
      <tr>
        <td>${it.produto || ''}</td>
        <td>${it.estoque || 0}</td>
        <td>${it.sugestao || 0}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  if (visita.obs) {
    html += `<h3>Observações</h3><p>${(visita.obs || '').replace(/\n/g, '<br>')}</p>`;
  }

  abrirJanelaPdf(`Visita - ${cliente.nome}`, html);
}

btnExportarHistoricoCliente.addEventListener('click', () => {
  if (!clienteSelecionado) {
    alert('Nenhum cliente selecionado.');
    return;
  }
  const dados = obterDados();
  const visitas = dados.filter(v => v.cliente === clienteSelecionado.nome);
  if (!visitas.length) {
    alert('Este cliente ainda não possui visitas para exportar.');
    return;
  }

  let html = '';
  const primeiraVisita = visitas[0];
  const info = obterInfoEmpresaEVendedor(primeiraVisita || { vendedor: '' });

  html += '<div class="empresa-header">';
  if (info.logoDataUrl) {
    html += `<img src="${info.logoDataUrl}" alt="Logo da empresa" />`;
  }
  if (info.empresaNome) {
    html += `<h1>${info.empresaNome}</h1>`;
  } else {
    html += `<h1>Histórico de visitas</h1>`;
  }
  html += '</div>';

  html += `
    <h2>Histórico de visitas - ${clienteSelecionado.nome}</h2>
    <div class="meta">
      <div><strong>Cidade:</strong> ${clienteSelecionado.cidade || 'N/D'}</div>
      <div><strong>Total de visitas:</strong> ${visitas.length}</div>
    </div>
  `;

  visitas
    .slice()
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .forEach((vis, idx) => {
      const itens = vis.itens && vis.itens.length
        ? vis.itens
        : [{ produto: vis.produto, estoque: vis.estoque, sugestao: vis.sugestao }];

      html += `
        <h3>Visita ${idx + 1}</h3>
        <div class="meta">
          <div><strong>Data registro:</strong> ${vis.data || 'N/D'}</div>
          <div><strong>Vendedor:</strong> ${vis.vendedor || 'N/D'}</div>
          <div><strong>Status:</strong> ${vis.status || 'PENDENTE'}</div>
          <div><strong>Próxima visita:</strong> ${vis.proxVisita || 'N/D'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Estoque</th>
              <th>Venda</th>
            </tr>
          </thead>
          <tbody>
      `;

      itens.forEach(it => {
        html += `
          <tr>
            <td>${it.produto || ''}</td>
            <td>${it.estoque || 0}</td>
            <td>${it.sugestao || 0}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      if (vis.obs) {
        html += `<p><strong>Obs:</strong> ${(vis.obs || '').replace(/\n/g, '<br>')}</p>`;
      }
    });

  abrirJanelaPdf(`Historico - ${clienteSelecionado.nome}`, html);
});

// ---- Produtos: UI ----
const listaProdutosDL = document.getElementById('listaProdutos');
const listaProdutosView = document.getElementById('listaProdutosView');
const filtroListaProdutos = document.getElementById('filtroListaProdutos');
const novoProdutoNome = document.getElementById('novoProdutoNome');
const salvarProdutoBtn = document.getElementById('salvarProdutoBtn');
const importProdutosBtn = document.getElementById('importProdutosBtn');
const baixarModeloProdutosBtn = document.getElementById('baixarModeloProdutosBtn');
const produtosCsvInput = document.getElementById('produtosCsvInput');
const apagarTodosProdutosBtn = document.getElementById('apagarTodosProdutosBtn');

function atualizarDatalistProdutos() {
  const produtos = obterProdutos();
  listaProdutosDL.innerHTML = '';
  produtos.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.nome;
    listaProdutosDL.appendChild(opt);
  });
}

function atualizarListaProdutosView() {
  const produtos = obterProdutos();
  const filtro = filtroListaProdutos.value.trim().toUpperCase();
  listaProdutosView.innerHTML = '';

  if (!produtos.length) {
    const p = document.createElement('p');
    p.textContent = 'Nenhum produto cadastrado.';
    listaProdutosView.appendChild(p);
    return;
  }

  produtos
    .filter(p => {
      if (!filtro) return true;
      return p.nome.toUpperCase().includes(filtro);
    })
    .forEach(p => {
      const linha = document.createElement('div');
      linha.className = 'linha-produto';

      const span = document.createElement('span');
      span.className = 'linha-produto-nome';
      span.textContent = `• ${p.nome}`;

      const btnExcluir = document.createElement('button');
      btnExcluir.textContent = 'Excluir';
      btnExcluir.className = 'danger small';
      btnExcluir.addEventListener('click', () => {
        if (!confirm(`Excluir produto ${p.nome} da base? (Histórico permanece)`)) return;
        const todos = obterProdutos().filter(x => x.nome !== p.nome);
        salvarProdutos(todos);
        atualizarDatalistProdutos();
        atualizarListaProdutosView();
        alert('Produto excluído da base.');
      });

      linha.appendChild(span);
      linha.appendChild(btnExcluir);
      listaProdutosView.appendChild(linha);
    });
}

salvarProdutoBtn.addEventListener('click', () => {
  const nome = normalizarMaiusculoSemAcento(novoProdutoNome.value);

  if (!nome) {
    alert('Preencha o nome do produto.');
    return;
  }

  const atuais = obterProdutos();
  const mapa = new Map();
  atuais.forEach(p => mapa.set(p.nome, p));

  mapa.set(nome, { nome });
  const final = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  salvarProdutos(final);
  atualizarDatalistProdutos();
  atualizarListaProdutosView();

  novoProdutoNome.value = '';
  alert('Produto salvo com sucesso.');
});

filtroListaProdutos.addEventListener('input', atualizarListaProdutosView);

importProdutosBtn.addEventListener('click', () => {
  produtosCsvInput.click();
});

produtosCsvInput.addEventListener('change', () => {
  const file = produtosCsvInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const texto = reader.result;
    const linhas = parseCsv(texto);
    const novos = [];

    linhas.forEach((cols, index) => {
      if (!cols[0]) return;
      let nome = cols[0];

      if (index === 0 && nome.toLowerCase().includes('nome')) return;

      nome = normalizarMaiusculoSemAcento(nome);
      novos.push({ nome });
    });

    if (!novos.length) {
      alert('Não encontrei produtos válidos no CSV.');
      return;
    }

    const atuais = obterProdutos();
    const mapa = new Map();
    atuais.forEach(p => mapa.set(p.nome, p));
    novos.forEach(p => mapa.set(p.nome, p));

    const final = Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    salvarProdutos(final);
    atualizarDatalistProdutos();
    atualizarListaProdutosView();

    alert(`Importei ${novos.length} produtos (sem duplicar os existentes).`);
    produtosCsvInput.value = '';
  };
  reader.readAsText(file, 'utf-8');
});

baixarModeloProdutosBtn.addEventListener('click', () => {
  const linhas = [
    'nome',
    'RACAO MAGNUS 25KG',
    'FORMULA NATURAL 15KG'
  ];
  const csvContent = linhas.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo_produtos.csv';
  a.click();
  URL.revokeObjectURL(url);
});

apagarTodosProdutosBtn.addEventListener('click', () => {
  if (!confirm('Tem certeza que deseja apagar TODOS os produtos deste aparelho?')) return;
  localStorage.removeItem(PRODUTOS_KEY);
  atualizarDatalistProdutos();
  atualizarListaProdutosView();
  alert('Todos os produtos foram apagados deste aparelho.');
});

// ---- DADOS / GIRO GERAL ----
const salvarBtn = document.getElementById('salvarBtn');
const limparBtn = document.getElementById('limparBtn');
const listaDiv = document.getElementById('listaLancamentos');
const filtroClienteDados = document.getElementById('filtroCliente');
const filtroVendedorDados = document.getElementById('filtroVendedor');
const resumoInfo = document.getElementById('resumoInfo');
const exportarCsvBtn = document.getElementById('exportarCsvBtn');
const copiarResumoBtn = document.getElementById('copiarResumoBtn');

const usarUltimoVendedorBtn = document.getElementById('usarUltimoVendedorBtn');
const usarUltimoClienteBtn = document.getElementById('usarUltimoClienteBtn');
const duplicarUltimoBtn = document.getElementById('duplicarUltimoBtn');

const resumoVendedoresDiv = document.getElementById('resumoVendedores');
const resumoCidadesDiv = document.getElementById('resumoCidades');
const resumoProdutosDiv = document.getElementById('resumoProdutos');

const dateFilterButtons = document.querySelectorAll('.date-filter');

let currentDateFilter = 'all';

function atualizarResumoGeral(dadosFiltrados) {
  if (!dadosFiltrados.length) {
    resumoInfo.textContent = 'Nenhum lançamento na lista atual.';
    return;
  }

  let totalLinhas = 0;
  let totalSugestao = 0;
  const clientesUnicos = new Set();
  const vendedoresUnicos = new Set();

  dadosFiltrados.forEach(vis => {
    const itens = vis.itens && vis.itens.length
      ? vis.itens
      : [{ produto: vis.produto, estoque: vis.estoque, sugestao: vis.sugestao }];
    itens.forEach(() => {
      totalLinhas += 1;
    });
    itens.forEach(it => {
      totalSugestao += Number(it.sugestao || 0);
    });
    clientesUnicos.add(vis.cliente);
    vendedoresUnicos.add(vis.vendedor);
  });

  resumoInfo.textContent =
    `${totalLinhas} linhas de produto • ${clientesUnicos.size} clientes • ${vendedoresUnicos.size} vendedores • Total sugerido: ${totalSugestao} sacos`;
}

function atualizarSubResumos(dadosFiltrados) {
  const mapVend = new Map();
  const mapCid = new Map();
  const mapProd = new Map();

  const clientes = obterClientes();
  const clientesPorNome = new Map();
  clientes.forEach(c => clientesPorNome.set(c.nome, c));

  dadosFiltrados.forEach(vis => {
    const itens = vis.itens && vis.itens.length
      ? vis.itens
      : [{ produto: vis.produto, estoque: vis.estoque, sugestao: vis.sugestao }];

    const vendedor = vis.vendedor || 'SEM VENDEDOR';
    let totalVisVend = mapVend.get(vendedor) || { totalSugestao: 0, qtd: 0 };
    itens.forEach(it => {
      totalVisVend.totalSugestao += Number(it.sugestao || 0);
      totalVisVend.qtd += 1;
    });
    mapVend.set(vendedor, totalVisVend);

    const cliInfo = clientesPorNome.get(vis.cliente);
    const cidade = (cliInfo && cliInfo.cidade) ? cliInfo.cidade : 'SEM CIDADE';
    let totalCid = mapCid.get(cidade) || { totalSugestao: 0, qtd: 0 };
    itens.forEach(it => {
      totalCid.totalSugestao += Number(it.sugestao || 0);
      totalCid.qtd += 1;
    });
    mapCid.set(cidade, totalCid);

    itens.forEach(it => {
      const prod = it.produto || 'SEM PRODUTO';
      let totalProd = mapProd.get(prod) || { totalSugestao: 0, qtd: 0 };
      totalProd.totalSugestao += Number(it.sugestao || 0);
      totalProd.qtd += 1;
      mapProd.set(prod, totalProd);
    });
  });

  function preencherResumo(div, mapa) {
    div.innerHTML = '';
    if (!mapa.size) {
      const p = document.createElement('p');
      p.textContent = 'Sem dados.';
      div.appendChild(p);
      return;
    }
    const itens = Array.from(mapa.entries()).sort((a, b) => b[1].totalSugestao - a[1].totalSugestao);
    itens.forEach(([chave, info]) => {
      const p = document.createElement('p');
      p.textContent = `${chave}: ${info.totalSugestao} sacos sugeridos (${info.qtd} linha(s))`;
      div.appendChild(p);
    });
  }

  preencherResumo(resumoVendedoresDiv, mapVend);
  preencherResumo(resumoCidadesDiv, mapCid);
  preencherResumo(resumoProdutosDiv, mapProd);
}

function aplicarFiltros(dados) {
  const filtroC = filtroClienteDados.value.trim().toUpperCase();
  const filtroV = filtroVendedorDados.value.trim().toUpperCase();

  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioHoje = hoje.getTime();
  const fimHoje = inicioHoje + 24 * 60 * 60 * 1000;

  const inicioOntem = inicioHoje - 24 * 60 * 60 * 1000;
  const fimOntem = inicioHoje;

  const diaSemana = hoje.getDay();
  const diffSegunda = (diaSemana === 0 ? 6 : diaSemana - 1);
  const inicioSemana = inicioHoje - diffSegunda * 24 * 60 * 60 * 1000;

  return dados.filter(item => {
    const cli = (item.cliente || '').toUpperCase();
    const vend = (item.vendedor || '').toUpperCase();

    if (filtroC && !cli.includes(filtroC)) return false;
    if (filtroV && !vend.includes(filtroV)) return false;

    if (!item.timestamp) return true;

    const t = item.timestamp;
    if (currentDateFilter === 'today') {
      if (t < inicioHoje || t >= fimHoje) return false;
    } else if (currentDateFilter === 'yesterday') {
      if (t < inicioOntem || t >= fimOntem) return false;
    } else if (currentDateFilter === 'week') {
      if (t < inicioSemana || t >= fimHoje) return false;
    }
    return true;
  });
}

function carregarLancamentos() {
  const dados = obterDados();
  const filtrados = aplicarFiltros(dados);
  atualizarResumoGeral(filtrados);
  atualizarSubResumos(filtrados);
  renderizarLista(filtrados);
}

function renderizarLista(dadosFiltrados) {
  listaDiv.innerHTML = '';

  if (!dadosFiltrados.length) {
    const vazio = document.createElement('p');
    vazio.textContent = 'Nenhum lançamento na lista atual.';
    vazio.style.fontSize = '13px';
    vazio.style.color = '#6b7280';
    listaDiv.appendChild(vazio);
    return;
  }

  const clientes = obterClientes();
  const clientesPorNome = new Map();
  clientes.forEach(c => clientesPorNome.set(c.nome, c));

  dadosFiltrados.slice().reverse().forEach(vis => {
    const div = document.createElement('div');
    div.className = 'lancamento';

    const cliInfo = clientesPorNome.get(vis.cliente);
    const cidade = cliInfo && cliInfo.cidade ? ` (${cliInfo.cidade})` : '';

    const topo = document.createElement('div');
    topo.className = 'linha-topo';

    const status = vis.status || 'PENDENTE';
    let statusText = 'Pendente';
    let statusClass = 'badge-status-pendente';
    if (status === 'FECHOU') {
      statusText = 'Fechou pedido';
      statusClass = 'badge-status-fechou';
    } else if (status === 'NAO_FECHOU') {
      statusText = 'Não fechou';
      statusClass = 'badge-status-nao-fechou';
    }

    topo.innerHTML = `
      <span>${vis.cliente || 'SEM CLIENTE'}${cidade}</span>
      <span class="badge badge-vendedor">${vis.vendedor || 'SEM VENDEDOR'}</span>
    `;
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${statusClass}`;
    statusBadge.textContent = statusText;
    topo.appendChild(statusBadge);

    const meio = document.createElement('div');
    meio.className = 'linha-meio';
    const itens = vis.itens && vis.itens.length
      ? vis.itens
      : [{ produto: vis.produto, estoque: vis.estoque, sugestao: vis.sugestao }];
    itens.forEach(it => {
      const linha = document.createElement('div');
      linha.className = 'item-visita';
      const info = document.createElement('div');
      info.className = 'item-visita-info';

      const descr = document.createElement('div');
      descr.className = 'prod-descricao';
      descr.textContent = it.produto || 'SEM PRODUTO';

      const estoqueNum = Number(it.estoque || 0);
      const estoqueClasse = estoqueNum <= 3 ? 'estoque-baixo' : '';
      const estoqueLabelExtra = estoqueNum <= 3 ? ' (baixo)' : '';

      const nums = document.createElement('div');
      nums.className = 'prod-numeros';
      nums.innerHTML = `Estoque: <span class="${estoqueClasse}">${it.estoque}</span>${estoqueLabelExtra} • Venda: <strong>${it.sugestao}</strong>`;

      info.appendChild(descr);
      info.appendChild(nums);
      linha.appendChild(info);
      meio.appendChild(linha);
    });

    const obs = document.createElement('div');
    obs.className = 'obs';
    obs.textContent = vis.obs || '';

    const data = document.createElement('div');
    data.className = 'data';
    data.textContent = vis.data || '';

    const acoes = document.createElement('div');
    acoes.className = 'acoes-visita';
    const btnExcluirVis = document.createElement('button');
    btnExcluirVis.className = 'danger small';
    btnExcluirVis.textContent = 'Excluir';
    btnExcluirVis.addEventListener('click', () => excluirVisita(vis.id));
    acoes.appendChild(btnExcluirVis);

    div.appendChild(topo);
    div.appendChild(meio);
    if (vis.obs) div.appendChild(obs);
    if (vis.proxVisita) {
      const prox = document.createElement('div');
      prox.className = 'prox-visita';
      prox.textContent = `Próxima visita: ${vis.proxVisita}`;
      div.appendChild(prox);
    }
    div.appendChild(data);
    div.appendChild(acoes);

    listaDiv.appendChild(div);
  });
}

// Salvar lançamento geral (modo rápido)
salvarBtn.addEventListener('click', () => {
  const vendedor = normalizarMaiusculoSemAcento(document.getElementById('vendedor').value);
  const cliente = normalizarMaiusculoSemAcento(document.getElementById('cliente').value);
  const produto = normalizarMaiusculoSemAcento(document.getElementById('produto').value);
  let estoque = parseInt(document.getElementById('estoque').value || '0', 10);
  let sugestao = parseInt(document.getElementById('sugestao').value || '0', 10);
  if (isNaN(estoque) || estoque < 0) estoque = 0;
  if (isNaN(sugestao) || sugestao < 0) sugestao = 0;
  const proxVisita = document.getElementById('proxVisita').value;
  const obs = document.getElementById('obs').value.trim();

  if (!cliente || !produto) {
    alert('Preencha pelo menos Cliente e Produto.');
    return;
  }

  const dados = obterDados();

  const novo = {
    id:
      'V' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).slice(2, 7),
    vendedor: vendedor || 'SEM VENDEDOR',
    cliente,
    itens: [{
      produto,
      estoque: String(estoque),
      sugestao: String(sugestao)
    }],
    produto,
    estoque: String(estoque),
    sugestao: String(sugestao),
    obs,
    data: new Date().toLocaleString('pt-BR'),
    timestamp: Date.now(),
    status: 'PENDENTE'
  };

  if (proxVisita) novo.proxVisita = proxVisita;

  dados.push(novo);
  salvarDados(dados);

  if (vendedor) localStorage.setItem(LAST_VENDEDOR_KEY, vendedor);
  localStorage.setItem(LAST_CLIENTE_KEY, cliente);

  document.getElementById('vendedor').value = '';
  document.getElementById('cliente').value = '';
  document.getElementById('produto').value = '';
  document.getElementById('estoque').value = '';
  document.getElementById('sugestao').value = '';
  document.getElementById('proxVisita').value = '';
  document.getElementById('obs').value = '';

  carregarLancamentos();
});

limparBtn.addEventListener('click', () => {
  if (confirm('Tem certeza que deseja apagar TODOS os lançamentos deste aparelho?')) {
    localStorage.removeItem(STORAGE_KEY);
    carregarLancamentos();
  }
});

filtroClienteDados.addEventListener('input', carregarLancamentos);
filtroVendedorDados.addEventListener('input', carregarLancamentos);

// Date filters
dateFilterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    dateFilterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDateFilter = btn.dataset.filter || 'all';
    carregarLancamentos();
  });
});

// Exportar CSV (uma linha por produto da visita)
exportarCsvBtn.addEventListener('click', () => {
  const dados = obterDados();
  const filtrados = aplicarFiltros(dados);
  if (!filtrados.length) {
    alert('Não há lançamentos na lista atual para exportar.');
    return;
  }

  const header = ['Vendedor', 'Cliente', 'Produto', 'Estoque', 'Venda', 'Status', 'Obs', 'Data', 'ProxVisita'];
  const linhas = [header.join(';')];

  filtrados.forEach(vis => {
    const itens = vis.itens && vis.itens.length
      ? vis.itens
      : [{ produto: vis.produto, estoque: vis.estoque, sugestao: vis.sugestao }];
    itens.forEach(it => {
      const linha = [
        vis.vendedor,
        vis.cliente,
        it.produto,
        it.estoque,
        it.sugestao,
        vis.status || 'PENDENTE',
        (vis.obs || '').replace(/\r?\n/g, ' '),
        vis.data,
        vis.proxVisita || ''
      ].map(campo => `"${String(campo).replace(/"/g, '""')}"`);
      linhas.push(linha.join(';'));
    });
  });

  const csvContent = linhas.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'giro_estoque_lista_atual.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// Copiar resumo (últimas 20 linhas de produto)
copiarResumoBtn.addEventListener('click', async () => {
  const dados = obterDados();
  const filtrados = aplicarFiltros(dados);
  if (!filtrados.length) {
    alert('Não há lançamentos na lista atual para resumir.');
    return;
  }

  const linhasItens = [];
  filtrados.forEach(vis => {
    const itens = vis.itens && vis.itens.length
      ? vis.itens
      : [{ produto: vis.produto, estoque: vis.estoque, sugestao: vis.sugestao }];
    itens.forEach(it => {
      linhasItens.push({
        cliente: vis.cliente,
        produto: it.produto,
        estoque: it.estoque,
        sugestao: it.sugestao,
        vendedor: vis.vendedor,
        proxVisita: vis.proxVisita,
        data: vis.data,
        status: vis.status || 'PENDENTE'
      });
    });
  });

  const ultimas = linhasItens.slice(-20).reverse();

  let texto = '*Resumo giro de estoque*\n\n';
  ultimas.forEach(item => {
    const statusTxt =
      item.status === 'FECHOU'
        ? 'Fechou'
        : item.status === 'NAO_FECHOU'
        ? 'Não fechou'
        : 'Pendente';
    texto += `• Cliente: ${item.cliente} | Prod: ${item.produto} | Est: ${item.estoque} | Venda: ${item.sugestao} | Vend: ${item.vendedor} | Status: ${statusTxt}`;
    if (item.proxVisita) texto += ` | Próx: ${item.proxVisita}`;
    texto += ` | ${item.data}\n`;
  });

  try {
    await navigator.clipboard.writeText(texto);
    alert('Resumo copiado. Agora é só colar no WhatsApp.');
  } catch (e) {
    alert('Não foi possível copiar automaticamente. Verifique permissões do navegador.');
  }
});

// Quick actions
usarUltimoVendedorBtn.addEventListener('click', () => {
  const ultimo = localStorage.getItem(LAST_VENDEDOR_KEY);
  if (!ultimo) {
    alert('Ainda não há vendedor salvo.');
    return;
  }
  document.getElementById('vendedor').value = ultimo;
});

usarUltimoClienteBtn.addEventListener('click', () => {
  const ultimo = localStorage.getItem(LAST_CLIENTE_KEY);
  if (!ultimo) {
    alert('Ainda não há cliente salvo.');
    return;
  }
  document.getElementById('cliente').value = ultimo;
});

duplicarUltimoBtn.addEventListener('click', () => {
  const dados = obterDados();
  if (!dados.length) {
    alert('Ainda não há lançamentos para duplicar.');
    return;
  }
  const ult = dados[dados.length - 1];
  const itens = ult.itens && ult.itens.length
    ? ult.itens
    : [{ produto: ult.produto, estoque: ult.estoque, sugestao: ult.sugestao }];
  const primeiro = itens[0];
  document.getElementById('vendedor').value = ult.vendedor || '';
  document.getElementById('cliente').value = ult.cliente || '';
  document.getElementById('produto').value = primeiro.produto || '';
  document.getElementById('estoque').value = primeiro.estoque || '';
  document.getElementById('sugestao').value = primeiro.sugestao || '';
  document.getElementById('proxVisita').value = ult.proxVisita || '';
  document.getElementById('obs').value = ult.obs || '';
});

// ---- Backup geral ----
btnBackupAll.addEventListener('click', () => {
  const backup = {
    criado_em: new Date().toISOString(),
    clientes: obterClientes(),
    produtos: obterProdutos(),
    lancamentos: obterDados(),
    config: obterConfig()
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });

  const agora = new Date();
  const nomeArquivo =
    `backup_giro_estoque_` +
    `${agora.getFullYear()}` +
    `${String(agora.getMonth() + 1).padStart(2, '0')}` +
    `${String(agora.getDate()).padStart(2, '0')}_` +
    `${String(agora.getHours()).padStart(2, '0')}` +
    `${String(agora.getMinutes()).padStart(2, '0')}.json`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
});

btnImportBackup.addEventListener('click', () => {
  backupJsonInput.click();
});

backupJsonInput.addEventListener('change', () => {
  const file = backupJsonInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (obj.clientes) salvarClientes(obj.clientes);
      if (obj.produtos) salvarProdutos(obj.produtos);
      if (obj.lancamentos) salvarDados(obj.lancamentos);
      if (obj.config) salvarConfig(obj.config);

      atualizarDatalistClientes();
      atualizarDatalistProdutos();
      atualizarListaClientesView();
      atualizarListaProdutosView();
      carregarLancamentos();
      alert('Backup importado com sucesso para este aparelho.');
    } catch (e) {
      alert('Não foi possível importar o backup. Verifique se o arquivo é um JSON válido.');
    }
    backupJsonInput.value = '';
  };
  reader.readAsText(file, 'utf-8');
});

// ---- CONFIG: VENDEDORES / EMPRESA ----
const empresaNomeInput = document.getElementById('empresaNome');
const empresaLogoBtn = document.getElementById('empresaLogoBtn');
const empresaLogoInput = document.getElementById('empresaLogoInput');
const empresaLogoPreview = document.getElementById('empresaLogoPreview');
const salvarEmpresaBtn = document.getElementById('salvarEmpresaBtn');

const novoVendedorNomeInput = document.getElementById('novoVendedorNome');
const novoVendedorEmpresaInput = document.getElementById('novoVendedorEmpresa');
const salvarVendedorBtn = document.getElementById('salvarVendedorBtn');
const listaVendedoresView = document.getElementById('listaVendedoresView');

function carregarConfigUI() {
  const cfg = obterConfig();
  empresaNomeInput.value = cfg.empresa && cfg.empresa.nome ? cfg.empresa.nome : '';
  if (cfg.empresa && cfg.empresa.logoDataUrl) {
    empresaLogoPreview.src = cfg.empresa.logoDataUrl;
    empresaLogoPreview.classList.remove('hidden');
  } else {
    empresaLogoPreview.src = '';
    empresaLogoPreview.classList.add('hidden');
  }

  atualizarListaVendedoresConfig();
}

function atualizarListaVendedoresConfig() {
  const cfg = obterConfig();
  listaVendedoresView.innerHTML = '';

  if (!cfg.vendedores || !cfg.vendedores.length) {
    const p = document.createElement('p');
    p.textContent = 'Nenhum vendedor cadastrado.';
    listaVendedoresView.appendChild(p);
    return;
  }

  cfg.vendedores.forEach((v, index) => {
    const linha = document.createElement('div');
    linha.className = 'linha-cliente';
    const span = document.createElement('span');
    span.className = 'linha-cliente-nome';
    span.textContent = `• ${v.nome} (${v.empresa || 'SEM EMPRESA'})`;

    const btnDel = document.createElement('button');
    btnDel.className = 'danger small';
    btnDel.textContent = 'Excluir';
    btnDel.addEventListener('click', () => {
      const cfgAtual = obterConfig();
      cfgAtual.vendedores.splice(index, 1);
      salvarConfig(cfgAtual);
      atualizarListaVendedoresConfig();
    });

    linha.appendChild(span);
    linha.appendChild(btnDel);
    listaVendedoresView.appendChild(linha);
  });
}

salvarEmpresaBtn.addEventListener('click', () => {
  const cfg = obterConfig();
  cfg.empresa.nome = empresaNomeInput.value.trim();
  salvarConfig(cfg);
  alert('Dados da empresa salvos.');
});

empresaLogoBtn.addEventListener('click', () => {
  empresaLogoInput.click();
});

empresaLogoInput.addEventListener('change', () => {
  const file = empresaLogoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const cfg = obterConfig();
    cfg.empresa.logoDataUrl = reader.result;
    salvarConfig(cfg);
    empresaLogoPreview.src = reader.result;
    empresaLogoPreview.classList.remove('hidden');
    alert('Logo da empresa salva.');
    empresaLogoInput.value = '';
  };
  reader.readAsDataURL(file);
});

salvarVendedorBtn.addEventListener('click', () => {
  const nome = normalizarMaiusculoSemAcento(novoVendedorNomeInput.value);
  const empresaVend = normalizarMaiusculoSemAcento(novoVendedorEmpresaInput.value);

  if (!nome) {
    alert('Preencha o nome do vendedor.');
    return;
  }

  const cfg = obterConfig();
  if (!Array.isArray(cfg.vendedores)) cfg.vendedores = [];

  const existe = cfg.vendedores.find(v => v.nome === nome);
  if (existe) {
    existe.empresa = empresaVend || existe.empresa;
  } else {
    cfg.vendedores.push({ nome, empresa: empresaVend });
  }

  salvarConfig(cfg);
  novoVendedorNomeInput.value = '';
  novoVendedorEmpresaInput.value = '';
  atualizarListaVendedoresConfig();
  alert('Vendedor salvo.');
});

// Inicialização
function inicializar() {
  migrarDados();
  atualizarDatalistClientes();
  atualizarDatalistProdutos();
  atualizarListaClientesView();
  atualizarListaProdutosView();
  carregarLancamentos();
  showView('home');
}

inicializar();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(console.error);
}
