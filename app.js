
const produtos=[
 {nome:"RACAO ULTRALIFE CARNE & ARROZ PREMIUM SPECIAL 15KG EMBALAGEM NOVA"},
 {nome:"MAGNUS SUPER PREMIUM FRANGO 25KG"},
 {nome:"NOVA D+ ADULTO CARNE E CEREAIS 20KG"},
 {nome:"PREDILETTA PREMIUM SPECIAL 25KG"}
];

function normalizar(t){return t.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"");}

const input=document.getElementById("clienteItemProduto");
const box=document.getElementById("autocompleteProdutos");

input.addEventListener("input",()=>{
 const termo=normalizar(input.value);
 if(!termo){box.classList.add("hidden");return;}

 const lista=produtos.filter(p=>normalizar(p.nome).includes(termo));
 if(!lista.length){box.classList.add("hidden");return;}

 box.innerHTML="";
 lista.forEach(prod=>{
   const div=document.createElement("div");
   div.className="autocomplete-item";
   div.innerHTML=`<span>${prod.nome}</span>`;
   div.onclick=()=>{input.value=prod.nome;box.classList.add("hidden");};
   box.appendChild(div);
 });
 box.classList.remove("hidden");
});

document.addEventListener("click",e=>{
 if(!e.target.closest(".autocomplete"))box.classList.add("hidden");
});
