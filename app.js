
// Simulação de produtos longos
const produtos = [
  {nome:"RACAO ULTRALIFE CARNE & ARROZ PREMIUM SPECIAL 15KG EMBALAGEM NOVA 2025"},
  {nome:"MAGNUS SUPER PREMIUM FRANGO 25KG ADULTO"},
  {nome:"NOVA D+ ADULTO CARNE E CEREAIS 20KG LINHA ATUALIZADA"},
  {nome:"PREDILETTA PREMIUM SPECIAL CARNE 25KG"}
];

function normalizar(t){return t.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"");}

const inputProd = document.getElementById("clienteItemProduto");
const boxProd = document.getElementById("autocompleteProdutos");

inputProd.addEventListener("input", () => {
  const termo = normalizar(inputProd.value);
  if (!termo) { boxProd.classList.add("hidden"); return; }

  const lista = produtos.filter(p=>normalizar(p.nome).includes(termo));

  if (!lista.length){ boxProd.classList.add("hidden"); return; }

  boxProd.innerHTML = "";
  lista.forEach(prod=>{
    const div = document.createElement("div");
    div.className = "autocomplete-item";
    div.innerHTML = `<span>${prod.nome}</span>`;
    div.onclick = ()=>{ inputProd.value=prod.nome; boxProd.classList.add("hidden"); };
    boxProd.appendChild(div);
  });

  boxProd.classList.remove("hidden");
});

document.addEventListener("click", e=>{
  if (!e.target.closest(".autocomplete")) boxProd.classList.add("hidden");
});
