// URL base da API: só o termo de busca muda a cada consulta
const URL_BASE = "https://pokeapi.co/api/v2/pokemon/";
// Referências aos elementos da página (as "alças" do HTML)
const campoBusca = document.getElementById("campo-busca");
const botaoBuscar = document.getElementById("botao-buscar");
const areaResultado = document.getElementById("resultado");
// ---------- Função principal: consulta a API e monta o cartão ----------
async function buscarPokemon(termo) {
    areaResultado.innerHTML = "<p>Carregando...</p>"; // feedback imediato
    try {
        // 1) Requisição assíncrona
        const resposta = await fetch(URL_BASE + termo);
        // 2) A API respondeu, mas achou o que pedimos? (404 = não achou)
        if (!resposta.ok) throw new Error("nao-encontrado");
        // 3) Converte o corpo da resposta em objeto JavaScript
        const dados = await resposta.json();
        // 4) Extrai as informações mapeadas no Passo 1 (são 5 — mínimo era 3)
        const nome = dados.name;
        const imagem = dados.sprites.front_default;
        const altura = dados.height / 10; // decímetros → metros
        const peso = dados.weight / 10; // hectogramas → kg
        const tipos = dados.types
        .map(t => `<span class="tipo">${t.type.name}</span>`)
        .join("");
        // 5) Monta o HTML do cartão e injeta na página
        areaResultado.innerHTML = `
        <article class="cartao">
            <img src="${imagem}" alt="Imagem de ${nome}">
            <h2>#${dados.id} — ${nome}</h2>
            <p><b>Altura:</b> ${altura} m · <b>Peso:</b> ${peso} kg</p>
            <p>${tipos}</p>
            <button class="btn-favoritar" onclick="salvarFavorito(${dados.numero}, '${dados.nome}', '${dados.imagem}')">Salvar nos favoritos</button>
        </article>`;
    } catch (erro) {
        // Cai aqui em DOIS casos: 404 (lançado acima) ou falha de rede/API fora do ar
        const mensagem = erro.message === "nao-encontrado"
        ? `Nenhum Pokémon encontrado para "<b>${termo}</b>". Confira a grafia e tente de
        novo.`
        : "Não foi possível consultar a PokeAPI agora. Verifique sua conexão e tente novamente.";
        areaResultado.innerHTML = `<div class="erro">${mensagem}</div>`;
    }
}
// ---------- Eventos: clique no botão e tecla Enter ----------
function dispararBusca() {
    const termo = campoBusca.value.toLowerCase().trim();
    if (termo) buscarPokemon(termo);
}
botaoBuscar.addEventListener("click", dispararBusca);
campoBusca.addEventListener("keydown", (e) => {
    if (e.key === "Enter") dispararBusca();
});

// ---------- Conexão com o banco (usa config.js) ----------
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const listaFavoritos = document.getElementById("lista-favoritos");
// ---------- CREATE: salvar o Pokémon exibido como favorito ----------
async function salvarFavorito(numero, nome, imagem) {
    const { error } = await db.from("favoritos").insert({ numero, nome, imagem });
    if (error) {
    // 23505 = violação de UNIQUE: o Pokémon já é favorito
    const msg = error.code === "23505"? `${nome} já está nos seus favoritos!`: "Não foi possível salvar agora. Tente novamente.";
    alert(msg);
    return;
 }
 carregarFavoritos(); // atualiza a lista na tela
}
// ---------- READ: carregar e exibir os favoritos ----------
async function carregarFavoritos() {
const { data, error } = await db.from("favoritos").select("*").order("criado_em", { ascending: false });
if (error) {
    listaFavoritos.innerHTML ='<div class="erro">Não foi possível carregar os favoritos.</div>';
    return;
 }
if (data.length === 0) {
    listaFavoritos.innerHTML = "<p>Nenhum favorito ainda. Busque e salve!</p>";
    return;
 }
 listaFavoritos.innerHTML = data.map(f => `<div class="fav-item">
        <img src="${f.imagem}" alt="${f.nome}">
        <span>#${f.numero} ${f.nome}</span>
        <button onclick="removerFavorito(${f.numero})">✖</button>
    </div>`).join("");
}
// ---------- DELETE: remover um favorito ----------
async function removerFavorito(numero) {
    const { error } = await db.from("favoritos").delete().eq("numero", numero);
    if (error) { alert("Não foi possível remover agora."); return; }
    carregarFavoritos();
}
// ---------- Carrega a lista assim que a página abre ----------
carregarFavoritos();
