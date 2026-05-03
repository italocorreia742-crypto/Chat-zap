import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, where, serverTimestamp, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAHdmvUzkJBqd0nBLL2rWIb30LFEeWtnbw",
    authDomain: "zap-proprio-web.firebaseapp.com",
    projectId: "zap-proprio-web",
    storageBucket: "zap-proprio-web.firebasestorage.app",
    messagingSenderId: "974920784341",
    appId: "1:974920784341:web:8eb8b14928d01a9ed3855c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ====================== VARIÁVEIS ======================
let nome = localStorage.getItem("nome") || prompt("Digite seu nome:");
let meuId = nome ? nome.toLowerCase().replace(/\s/g, '_') : null;
let grupoAtivo = "global";
let tipoAtivo = "grupos";

if (!nome) window.location.reload();
localStorage.setItem("nome", nome);

const dom = {
    mensagens: document.getElementById("mensagens"),
    input: document.getElementById("msgInput"),
    nomeGrupoTop: document.getElementById("nomeGrupoTop"),
    userName: document.getElementById("userName"),
    userCargo: document.getElementById("userCargo"),
    userNameTop: document.getElementById("userNameTop"),
    listaItens: document.getElementById("listaItens"),
    sidebar: document.getElementById("sidebar"),
    tabTitle: document.getElementById("tab-title")
};

// ====================== INICIAR ======================
async function iniciar() {
    const userRef = doc(db, "usuarios", meuId);
    const userDoc = await getDoc(userRef);

    let cargo = "USER";
    if (!userDoc.exists()) {
        await setDoc(userRef, { nome, cargo: "USER", online: true });
    } else {
        cargo = userDoc.data().cargo || "USER";
    }

    dom.userName.textContent = nome;
    dom.userCargo.textContent = cargo;
    dom.userNameTop.textContent = nome;

    escutarCanais();
    escutarMensagens();
}

// ====================== TABS ======================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tipoAtivo = tab.dataset.tab;
        dom.tabTitle.textContent = tab.textContent.toUpperCase();

        if (tipoAtivo === "grupos") escutarCanais();
        else if (tipoAtivo === "conversas") mostrarMensagemVazia("Nenhuma conversa iniciada ainda");
        else if (tipoAtivo === "amigos") carregarAmigos();
    });
});

// ====================== GRUPOS ======================
function escutarCanais() {
    dom.listaItens.innerHTML = "";
    const global = criarItemLista("# global", "global", true);
    dom.listaItens.appendChild(global);

    onSnapshot(collection(db, "canais"), (snap) => {
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.nome === "global") return;
            const item = criarItemLista(`# ${data.nome}`, data.nome);
            dom.listaItens.appendChild(item);
        });
    });
}

function criarItemLista(texto, valor, ativo = false) {
    const div = document.createElement("div");
    div.className = `item ${ativo ? 'active' : ''}`;
    div.textContent = texto;
    div.onclick = () => mudarGrupo(valor);
    div.ondblclick = () => abrirConfigGrupo(valor); // Double click = config do grupo
    return div;
}

window.mudarGrupo = (grupo) => {
    grupoAtivo = grupo;
    dom.nomeGrupoTop.textContent = grupo;
    escutarMensagens();
};

// ====================== AMIGOS (Simulado por enquanto) ======================
function carregarAmigos() {
    dom.listaItens.innerHTML = `
        <div class="item" onclick="iniciarConversaPrivada('João')">👤 João</div>
        <div class="item" onclick="iniciarConversaPrivada('Maria')">👤 Maria</div>
        <div class="item" onclick="iniciarConversaPrivada('Pedro')">👤 Pedro</div>
    `;
}

window.iniciarConversaPrivada = (usuario) => {
    alert(`Iniciando conversa privada com ${usuario} (em breve)`);
    // Futuramente vai mudar para DMs
};

// ====================== MENSAGENS ======================
function escutarMensagens() {
    const q = query(collection(db, "mensagens"), where("grupo", "==", grupoAtivo), orderBy("data", "asc"));

    onSnapshot(q, (snap) => {
        dom.mensagens.innerHTML = "";
        snap.forEach(docSnap => {
            const msg = docSnap.data();
            const div = document.createElement("div");
            div.className = `msg ${msg.nome === nome ? 'eu' : 'outro'}`;
            div.innerHTML = `<b>${msg.nome}</b><span>${msg.texto}</span>`;
            div.ondblclick = () => mostrarOpcoesMensagem(msg, docSnap.id);
            dom.mensagens.appendChild(div);
        });
        dom.mensagens.scrollTop = dom.mensagens.scrollHeight;
    });
}

async function enviarMensagem() {
    const texto = dom.input.value.trim();
    if (!texto) return;

    await addDoc(collection(db, "mensagens"), {
        texto,
        nome,
        grupo: grupoAtivo,
        data: serverTimestamp()
    });
    dom.input.value = "";
}

// ====================== FUNÇÕES EXTRAS ======================
function mostrarMensagemVazia(texto) {
    dom.listaItens.innerHTML = `<div class="item" style="opacity:0.6">${texto}</div>`;
}

function mostrarOpcoesMensagem(msg, msgId) {
    alert(`Opções da mensagem:\n\nDe: ${msg.nome}\n"${msg.texto}"\n\n(Em breve: Apagar, Editar, Reagir...)`);
}

function abrirConfigGrupo(grupo) {
    alert(`Configurações do grupo: #${grupo}\n\n(Cargos, cores, permissões em breve)`);
}

// ====================== EVENTOS ======================
document.getElementById("btnEnviar").addEventListener("click", enviarMensagem);
dom.input.addEventListener("keydown", e => { if (e.key === "Enter") enviarMensagem(); });

document.getElementById("toggleMenu").addEventListener("click", () => dom.sidebar.classList.toggle("open"));
document.getElementById("btnCriar").addEventListener("click", () => document.getElementById("modalGrupo").style.display = "flex");
document.getElementById("btnConfig").addEventListener("click", () => document.getElementById("modalConfig").style.display = "flex");

// Fechar modais
document.querySelectorAll(".fechar").forEach(btn => {
    btn.addEventListener("click", () => document.querySelectorAll(".modal").forEach(m => m.style.display = "none"));
});

iniciar();
