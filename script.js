// ====================== SCRIPT.JS - MVOID CHAT ELITE ======================

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
let nome = localStorage.getItem("nome") || prompt("Digite seu nome para entrar:");
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

        if (tipoAtivo === "grupos") {
            escutarCanais();
        } else {
            dom.listaItens.innerHTML = `<div class="item">Em breve - ${tab.textContent}</div>`;
        }
    });
});

// ====================== GRUPOS ======================
function escutarCanais() {
    dom.listaItens.innerHTML = "";

    // Global
    const globalDiv = criarItem("# global", "global", true);
    dom.listaItens.appendChild(globalDiv);

    onSnapshot(collection(db, "canais"), (snap) => {
        snap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.nome === "global") return;
            const item = criarItem(`# ${data.nome}`, data.nome);
            dom.listaItens.appendChild(item);
        });
    });
}

function criarItem(texto, nomeGrupo, ativo = false) {
    const div = document.createElement("div");
    div.className = `item ${ativo ? 'active' : ''}`;
    div.innerHTML = `<span>${texto}</span>`;
    div.onclick = () => mudarGrupo(nomeGrupo);
    return div;
}

window.mudarGrupo = (novoGrupo) => {
    grupoAtivo = novoGrupo;
    dom.nomeGrupoTop.textContent = novoGrupo;
    escutarMensagens();
};

// ====================== MENSAGENS ======================
function escutarMensagens() {
    const q = query(
        collection(db, "mensagens"),
        where("grupo", "==", grupoAtivo),
        orderBy("data", "asc")
    );

    onSnapshot(q, (snap) => {
        dom.mensagens.innerHTML = "";
        snap.forEach((docSnap) => {
            const msg = docSnap.data();
            const div = document.createElement("div");
            div.className = `msg ${msg.nome === nome ? 'eu' : 'outro'}`;
            div.innerHTML = `<b>${msg.nome}</b><span>${msg.texto}</span>`;
            dom.mensagens.appendChild(div);
        });
        dom.mensagens.scrollTop = dom.mensagens.scrollHeight;
    });
}

async function enviarMensagem() {
    const texto = dom.input.value.trim();
    if (!texto) return;
    if (texto.length > 500) return alert("Mensagem muito longa!");

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
        alert("Erro ao enviar!");
    }
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

// Modais
document.getElementById("confirmarGrupo").addEventListener("click", async () => {
    const nomeNovo = document.getElementById("novoNomeGrupo").value.trim().toLowerCase();
    if (nomeNovo) {
        await addDoc(collection(db, "canais"), { nome: nomeNovo });
        document.getElementById("modalGrupo").style.display = "none";
        document.getElementById("novoNomeGrupo").value = "";
    }
});

document.getElementById("btnConfig").addEventListener("click", () => {
    document.getElementById("modalConfig").style.display = "flex";
});

document.querySelectorAll(".fechar").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".modal").forEach(m => m.style.display = "none");
    });
});

document.getElementById("btnLogout").addEventListener("click", () => {
    if (confirm("Deseja sair da conta?")) {
        localStorage.clear();
        window.location.reload();
    }
});

// Iniciar aplicação
iniciar();
