
// NOVO AUTOCOMPLETE + MULTIPLA SELEÇÃO

let produtos = window.PRODUTOS || [];

const input = document.getElementById("clienteItemProduto");
const lista = document.getElementById("autocompleteProdutos");
const selecionados = [];
const selecionadosContainer = document.getElementById("selecionadosContainer");
const listaSelecionados = document.getElementById("listaSelecionados");

// --- Função de busca com descrição completa ---
input.addEventListener("input", () => {
  const termo = input.value.toLowerCase();

  if (!termo) {
    lista.classList.add("hidden");
    return;
  }

  const filtrados = produtos.filter(p =>
    p.descricao.toLowerCase().includes(termo)
  );

  renderLista(filtrados);
});

// --- Renderiza itens no autocomplete ---
function renderLista(arr) {
  lista.innerHTML = "";
  lista.classList.remove("hidden");

  arr.forEach(prod => {
    const div = document.createElement("div");
    div.classList.add("autocomplete-item");

    // Descrição quebrada em até 5 linhas
    const p = document.createElement("p");
    p.textContent = prod.descricao;
    p.style.display = "-webkit-box";
    p.style.webkitLineClamp = "5";
    p.style.webkitBoxOrient = "vertical";
    p.style.overflow = "hidden";

    div.appendChild(p);

    // Ao clicar → adiciona à lista de selecionados
    div.addEventListener("click", () => {
      adicionaSelecionado(prod);
      lista.classList.add("hidden");
      input.value = "";
    });

    lista.appendChild(div);
  });
}

// --- Adiciona item na lista temporária ---
function adicionaSelecionado(prod) {
  selecionados.push(prod);

  selecionadosContainer.classList.remove("hidden");

  const li = document.createElement("li");
  li.classList.add("selecionado-item");
  li.setAttribute("data-id", prod.id);

  li.innerHTML = `
    ${prod.descricao}
    <button class="remove-btn">X</button>
  `;

  li.querySelector(".remove-btn").addEventListener("click", () => {
    removeSelecionado(prod.id, li);
  });

  listaSelecionados.appendChild(li);
}

// --- Remove individual ---
function removeSelecionado(id, elemento) {
  const index = selecionados.findIndex(p => p.id === id);
  if (index !== -1) selecionados.splice(index, 1);

  elemento.remove();

  if (selecionados.length === 0) {
    selecionadosContainer.classList.add("hidden");
  }
}

// --- Botão "Adicionar" envia todos os produtos ---
document.querySelector(".primary").addEventListener("click", () => {
  if (selecionados.length === 0) {
    alert("Selecione ao menos 1 produto.");
    return;
  }

  console.log("Enviar estes produtos:", selecionados);

  // Limpar lista
  selecionados.length = 0;
  listaSelecionados.innerHTML = "";
  selecionadosContainer.classList.add("hidden");

  alert("Produtos adicionados!");
});
