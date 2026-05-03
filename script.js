import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, where, serverTimestamp, doc, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let nome = localStorage.getItem("nome") || prompt("Digite seu nome para entrar no chat:");
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
        else if (tipo === "conversas") mostrarVazio("Nenhuma conversa iniciada ainda.");
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
    div.ondblclick = () => alert(`Configurações do grupo: ${texto} (em desenvolvimento)`);
    return div;
}

window.mudarGrupo = (grupo) => {
    grupoAtivo = grupo;
    dom.nomeGrupoTop.textContent = grupo;
    escutarMensagens();
};

// ====================== AMIGOS ======================
function carregarAmigos() {
    dom.listaItens.innerHTML = `
        <div class="item" onclick="iniciarDM('João')">👤 João Silva</div>
        <div class="item" onclick="iniciarDM('Maria')">👤 Maria Santos</div>
        <div class="item" onclick="iniciarDM('Pedro')">👤 Pedro Costa</div>
    `;
}

window.iniciarDM = (usuario) => {
    alert(`Abrindo conversa privada com ${usuario}... (em breve)`);
};

function mostrarVazio(texto) {
    dom.listaItens.innerHTML = `<div class="item" style="opacity:0.5; text-align:center; padding:30px;">${texto}</div>`;
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
            div.ondblclick = () => mostrarOpcoesMsg(msg, docSnap.id);
            dom.mensagens.appendChild(div);
        });
        dom.mensagens.scrollTop = dom.mensagens.scrollHeight;
    });
}

async function enviarMensagem() {
    const texto = dom.input.value.trim();
    if (!texto) return;

    try {
        await addDoc(collection(db, "mensagens"), {
            texto: texto,
            nome: nome,
            grupo: grupoAtivo,
            data: serverTimestamp()
        });
        dom.input.value = "";
    } catch (e) {
        console.error(e);
        alert("Erro ao enviar mensagem");
    }
}

function mostrarOpcoesMsg(msg, id) {
    const acao = confirm(`Mensagem de ${msg.nome}:\n\n"${msg.texto}"\n\nO que deseja fazer?\n\nOK = Reagir ❤️\nCancelar = Fechar`);
    if (acao) alert("Reação adicionada! (em breve)");
}

// ====================== EVENTOS ======================
document.getElementById("btnEnviar").addEventListener("click", enviarMensagem);
dom.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enviarMensagem();
});

document.getElementById("toggleMenu").addEventListener("click", () => {
    dom.sidebar.classList.toggle("open");
});

document.getElementById("btnCriar").addEventListener("click", () => {
    document.getElementById("modalGrupo").style.display = "flex";
});

document.getElementById("confirmarGrupo").addEventListener("click", async () => {
    const nomeGrupo = document.getElementById("novoNomeGrupo").value.trim().toLowerCase();
    if (nomeGrupo) {
        await addDoc(collection(db, "canais"), { nome: nomeGrupo });
        document.getElementById("modalGrupo").style.display = "none";
        document.getElementById("novoNomeGrupo").value = "";
    }
});

document.getElementById("btnConfig").addEventListener("click", () => {
    alert("Configurações do usuário (em desenvolvimento)");
});

// Fechar modais
document.querySelectorAll(".fechar").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".modal").forEach(m => m.style.display = "none");
    });
});

iniciar();
