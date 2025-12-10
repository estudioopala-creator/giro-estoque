// Sistema pronto para receber lista de produtos em window.PRODUTOS = ["produto", "produto2", ...];

window.PRODUTOS = window.PRODUTOS || [];

const input = document.getElementById("clienteItemProduto");
const lista = document.getElementById("autocompleteProdutos");
const selecionados = [];
const selecionadosContainer = document.getElementById("selecionadosContainer");
const listaSelecionados = document.getElementById("listaSelecionados");

// Busca produtos
input.addEventListener("input", () => {
  const termo = input.value.toLowerCase();
  if (!termo) { lista.classList.add("hidden"); return; }

  const filtrados = window.PRODUTOS.filter(p =>
    p.toLowerCase().includes(termo)
  );

  renderLista(filtrados);
});

function renderLista(arr) {
  lista.innerHTML = "";
  lista.classList.remove("hidden");

  arr.forEach(nome => {
    const div = document.createElement("div");
    div.classList.add("autocomplete-item");

    const p = document.createElement("p");
    p.textContent = nome;
    p.style.display = "-webkit-box";
    p.style.webkitLineClamp = "5";
    p.style.webkitBoxOrient = "vertical";
    p.style.overflow = "hidden";

    div.appendChild(p);

    div.addEventListener("click", () => {
      adicionaSelecionado(nome);
      lista.classList.add("hidden");
      input.value = "";
    });

    lista.appendChild(div);
  });
}

function adicionaSelecionado(nome) {
  selecionados.push(nome);
  selecionadosContainer.classList.remove("hidden");

  const li = document.createElement("li");
  li.classList.add("selecionado-item");
  li.innerHTML = `${nome} <button class="remove-btn">X</button>`;

  li.querySelector(".remove-btn").addEventListener("click", () => {
    const index = selecionados.indexOf(nome);
    if (index !== -1) selecionados.splice(index, 1);
    li.remove();
    if (selecionados.length === 0) selecionadosContainer.classList.add("hidden");
  });

  listaSelecionados.appendChild(li);
}

document.querySelector(".primary").addEventListener("click", () => {
  if (selecionados.length === 0) { alert("Selecione ao menos 1 produto."); return; }

  console.log("Produtos adicionados:", selecionados);

  selecionados.length = 0;
  listaSelecionados.innerHTML = "";
  selecionadosContainer.classList.add("hidden");

  alert("Produtos adicionados!");
});
