(function () {
  const ENDPOINT = "https://fzpffyouubmbxfwycywg.supabase.co/functions/v1/nail-bookings";
  let mesAtual = new Date();

  async function api(payload) {
    const pin = sessionStorage.getItem("nail_pin") || "";

    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, pin })
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Erro ao carregar bloqueios.");
    return data;
  }

  function criarPainel() {
    const app = document.getElementById("app");
    if (!app || document.getElementById("calendarioBloqueiosPanel")) return;

    const painel = document.createElement("div");
    painel.id = "calendarioBloqueiosPanel";
    painel.className = "panel";

    painel.innerHTML = `
      <div class="top">
        <div>
          <h2>Calendário de disponibilidade</h2>
          <div class="small">Clique em um dia para ver os bloqueios</div>
        </div>
        <button onclick="carregarCalendarioBloqueios()">Atualizar</button>
      </div>

      <div class="top" style="margin-top:18px">
        <button id="bloqMesAnterior">←</button>
        <h3 id="bloqTituloMes" style="margin:0"></h3>
        <button id="bloqMesSeguinte">→</button>
      </div>

      <div id="calendarioBloqueios"
        style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:14px">
      </div>

      <div id="detalhesBloqueios" style="margin-top:18px"></div>
    `;

    app.insertBefore(painel, app.firstChild.nextSibling);
  }

  function montarCalendario(bloqueios) {
    const calendario = document.getElementById("calendarioBloqueios");
    const titulo = document.getElementById("bloqTituloMes");

    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

    titulo.textContent = new Date(ano, mes, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    });

    calendario.innerHTML = "";

    ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].forEach(dia => {
      const el = document.createElement("div");
      el.style.fontWeight = "800";
      el.style.fontSize = "12px";
      el.style.textAlign = "center";
      el.textContent = dia;
      calendario.appendChild(el);
    });

    let deslocamento = new Date(ano, mes, 1).getDay();
    deslocamento = deslocamento === 0 ? 6 : deslocamento - 1;

    for (let i = 0; i < deslocamento; i++) {
      calendario.appendChild(document.createElement("div"));
    }

    const totalDias = new Date(ano, mes + 1, 0).getDate();

    for (let dia = 1; dia <= totalDias; dia++) {
      const dataISO =
        `${ano}-${String(mes + 1).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;

      const bloqueiosDia = bloqueios.filter(x => x.block_date === dataISO);
      const diaInteiro = bloqueiosDia.some(x => x.full_day);
      const horarios = bloqueiosDia.filter(x => !x.full_day);

      const card = document.createElement("div");
      card.style.border = "1px solid #eadde1";
      card.style.borderRadius = "14px";
      card.style.padding = "10px";
      card.style.minHeight = "82px";
      card.style.cursor = "pointer";
      card.style.background = diaInteiro ? "#f7dfe6" : horarios.length ? "#fff7f0" : "#fff";

      const resumo = diaInteiro
        ? "Dia bloqueado"
        : horarios.length
        ? `${horarios.length} horário(s) bloqueado(s)`
        : "Livre";

      card.innerHTML = `
        <div style="font-weight:800;color:#5d2638">${dia}</div>
        <div style="font-size:11px;margin-top:8px;color:#7d6b71">${resumo}</div>
      `;

      card.onclick = () => mostrarDetalhes(dataISO, bloqueiosDia);
      calendario.appendChild(card);
    }
  }

  function mostrarDetalhes(dataISO, bloqueios) {
    const detalhes = document.getElementById("detalhesBloqueios");
    const [ano, mes, dia] = dataISO.split("-");

    if (!bloqueios.length) {
      detalhes.innerHTML = `<h3>${dia}/${mes}/${ano}</h3><div class="small">Nenhum bloqueio neste dia.</div>`;
      return;
    }

    detalhes.innerHTML = `
      <h3>Bloqueios de ${dia}/${mes}/${ano}</h3>
      ${bloqueios.map(x => `
        <div style="background:#fff;border:1px solid #eadde1;border-radius:14px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <b>${x.full_day ? "Dia inteiro" : x.block_time}</b>
            <div class="small">${x.full_day ? "Folga / dia bloqueado" : "Horário indisponível"}</div>
          </div>
          <button class="danger" onclick="desbloquearCalendario(${x.id})">Desbloquear</button>
        </div>
      `).join("")}
    `;
  }

  async function desbloquear(id) {
    if (!confirm("Deseja desbloquear?")) return;

    await api({ action: "unblock", id });
    await carregarCalendarioBloqueios();

    if (typeof loadBlocks === "function") loadBlocks();
  }

  async function carregarCalendarioBloqueios() {
    criarPainel();

    const data = await api({ action: "list_blocks" });
    const bloqueios = data.blocks || [];

    montarCalendario(bloqueios);

    document.getElementById("bloqMesAnterior").onclick = () => {
      mesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1);
      montarCalendario(bloqueios);
    };

    document.getElementById("bloqMesSeguinte").onclick = () => {
      mesAtual = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1);
      montarCalendario(bloqueios);
    };
  }

  window.carregarCalendarioBloqueios = carregarCalendarioBloqueios;
  window.desbloquearCalendario = desbloquear;

  function iniciar() {
    criarPainel();

    if (sessionStorage.getItem("nail_pin")) {
      setTimeout(carregarCalendarioBloqueios, 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
