import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, where, serverTimestamp, doc, setDoc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
        
        const tipo = tab.dataset.tab;
        dom.tabTitle.textContent = tab.textContent.toUpperCase();

        if (tipo === "grupos") escutarCanais();
        else if (tipo === "conversas") mostrarVazio("Nenhuma conversa iniciada.");
        else if (tipo === "amigos") carregarAmigos();
    });
});

// ====================== GRUPOS ======================
function escutarCanais() {
    dom.listaItens.innerHTML = "";
    
    const globalItem = criarItem("# global", "global", true);
    dom.listaItens.appendChild(globalItem);

    onSnapshot(collection(db, "canais"), (snap) => {
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.nome === "global") return;
            const item = criarItem(`# ${data.nome}`, data.nome);
            dom.listaItens.appendChild(item);
        });
    });
}

function criarItem(texto, valor, ativo = false) {
    const div = document.createElement("div");
    div.className = `item ${ativo ? 'active' : ''}`;
    div.textContent = texto;
    div.onclick = () => mudarGrupo(valor);
    div.ondblclick = () => abrirOpcoesGrupo(texto, valor);
    return div;
}

window.mudarGrupo = (grupo) => {
    grupoAtivo = grupo;
    dom.nomeGrupoTop.textContent = grupo;
    escutarMensagens();
};

// ====================== AMIGOS (Puxando do Firebase) ======================
async function carregarAmigos() {
    dom.listaItens.innerHTML = "<div class='item' style='opacity:0.6'>Carregando usuários...</div>";

    const snapshot = await getDocs(collection(db, "usuarios"));
    dom.listaItens.innerHTML = "";

    snapshot.forEach(docSnap => {
        const user = docSnap.data();
        if (user.nome === nome) return; // não mostrar si mesmo

        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `👤 ${user.nome}`;
        div.onclick = () => alert(`Abrir conversa com ${user.nome} (em breve)`);
        dom.listaItens.appendChild(div);
    });

    if (dom.listaItens.children.length === 0) {
        dom.listaItens.innerHTML = "<div class='item' style='opacity:0.6'>Nenhum outro usuário online no momento.</div>";
    }
}

// ====================== MENSAGENS ======================
function escutarMensagens() {
    const q = query(
        collection(db, "mensagens"),
        where("grupo", "==", grupoAtivo),
        orderBy("data", "asc")
    );

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
        texto: texto,
        nome: nome,
        grupo: grupoAtivo,
        data: serverTimestamp()
    });
    dom.input.value = "";
}

// ====================== OPÇÕES ======================
function mostrarOpcoesMensagem(msg, msgId) {
    const opcoes = confirm(`Mensagem de ${msg.nome}:\n\n"${msg.texto}"\n\nOK = Reagir com ❤️\nCancelar = Fechar`);
    if (opcoes) alert("❤️ Reação enviada!");
}

function abrirOpcoesGrupo(nomeGrupo, valor) {
    alert(`Opções do grupo: ${nomeGrupo}\n\n1. Configurações\n2. Membros\n3. Cargos\n(Em breve mais opções)`);
}

function mostrarVazio(texto) {
    dom.listaItens.innerHTML = `<div class="item" style="opacity:0.6;text-align:center;padding:40px 20px;">${texto}</div>`;
}

// ====================== EVENTOS ======================
document.getElementById("btnEnviar").addEventListener("click", enviarMensagem);
dom.input.addEventListener("keydown", e => { if (e.key === "Enter") enviarMensagem(); });

document.getElementById("toggleMenu").addEventListener("click", () => dom.sidebar.classList.toggle("open"));
document.getElementById("btnCriar").addEventListener("click", () => document.getElementById("modalGrupo").style.display = "flex");

document.getElementById("confirmarGrupo").addEventListener("click", async () => {
    const nomeGrupo = document.getElementById("novoNomeGrupo").value.trim().toLowerCase();
    if (nomeGrupo) {
        await addDoc(collection(db, "canais"), { nome: nomeGrupo });
        document.getElementById("modalGrupo").style.display = "none";
        document.getElementById("novoNomeGrupo").value = "";
    }
});

document.getElementById("btnConfig").addEventListener("click", () => {
    alert("Configurações do Perfil\n\nNome: " + nome);
});

document.querySelectorAll(".fechar").forEach(btn => {
    btn.addEventListener("click", () => document.querySelectorAll(".modal").forEach(m => m.style.display = "none"));
});

iniciar();
