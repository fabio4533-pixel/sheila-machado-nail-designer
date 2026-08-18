(function () {
  const ENDPOINT =
    "https://fzpffyouubmbxfwycywg.supabase.co/functions/v1/nail-bookings";

  let mesAtual = new Date();

  async function api(payload) {
    const pin =
      sessionStorage.getItem("nail_pin") || "";

    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...payload,
        pin
      })
    });

    const data = await r.json();

    if (!r.ok) {
      throw new Error(
        data.error || "Erro ao carregar dados."
      );
    }

    return data;
  }

  function esc(v) {
    return String(v ?? "").replace(
      /[&<>"']/g,
      m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m])
    );
  }

  function criarPainel() {
    const app =
      document.getElementById("app");

    if (
      !app ||
      document.getElementById(
        "calendarioBloqueiosPanel"
      )
    ) return;

    const painel =
      document.createElement("div");

    painel.id =
      "calendarioBloqueiosPanel";

    painel.className = "panel";

    painel.innerHTML = `
      <div class="top">
        <div>
          <h2>Calendário de disponibilidade</h2>

          <div class="small">
            Bloqueios e agendamentos
          </div>
        </div>

        <button
          onclick="carregarCalendarioBloqueios()"
        >
          Atualizar
        </button>
      </div>

      <div class="legenda-cal">
        <span>⚪ Livre</span>
        <span>🟡 Ocupado</span>
        <span>🟢 Confirmado</span>
        <span>🔴 Dia bloqueado</span>
      </div>

      <div class="nav-cal">
        <button id="bloqMesAnterior">
          ←
        </button>

        <h3 id="bloqTituloMes"></h3>

        <button id="bloqMesSeguinte">
          →
        </button>
      </div>

      <div
        id="calendarioBloqueios"
        class="calendario-grid"
      ></div>

      <div
        id="detalhesBloqueios"
        class="detalhes-cal"
      ></div>
    `;

    app.insertBefore(
      painel,
      app.firstChild.nextSibling
    );
  }

  function montarCalendario(
    bloqueios,
    agendamentos
  ) {
    const calendario =
      document.getElementById(
        "calendarioBloqueios"
      );

    const titulo =
      document.getElementById(
        "bloqTituloMes"
      );

    if (!calendario || !titulo) return;

    const ano =
      mesAtual.getFullYear();

    const mes =
      mesAtual.getMonth();

    titulo.textContent =
      new Date(
        ano,
        mes,
        1
      ).toLocaleDateString(
        "pt-BR",
        {
          month: "long",
          year: "numeric"
        }
      );

    calendario.innerHTML = "";

    [
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb",
      "Dom"
    ].forEach(nome => {

      const cab =
        document.createElement("div");

      cab.className =
        "cal-cabecalho";

      cab.textContent = nome;

      calendario.appendChild(cab);
    });

    let primeiro =
      new Date(
        ano,
        mes,
        1
      ).getDay();

    primeiro =
      primeiro === 0
        ? 6
        : primeiro - 1;

    for (
      let i = 0;
      i < primeiro;
      i++
    ) {
      const vazio =
        document.createElement("div");

      vazio.className =
        "cal-vazio";

      calendario.appendChild(vazio);
    }

    const totalDias =
      new Date(
        ano,
        mes + 1,
        0
      ).getDate();

    for (
      let dia = 1;
      dia <= totalDias;
      dia++
    ) {
      const dataISO =
        `${ano}-` +
        String(mes + 1)
          .padStart(2, "0") +
        "-" +
        String(dia)
          .padStart(2, "0");

      const bloqueiosDia =
        bloqueios.filter(
          x =>
            x.block_date ===
            dataISO
        );

      const agendaDia =
        agendamentos.filter(
          x =>
            x.appointment_date ===
            dataISO
        );

      const diaInteiro =
        bloqueiosDia.some(
          x => x.full_day
        );

      const horariosBloqueados =
        bloqueiosDia.filter(
          x => !x.full_day
        );

      const confirmados =
        agendaDia.filter(
          x =>
            x.status ===
            "confirmado"
        );

      const pendentes =
        agendaDia.filter(
          x =>
            x.status ===
            "pendente"
        );

      const card =
        document.createElement("div");

      card.className =
        "cal-dia";

      let resumo = "Livre";

      if (diaInteiro) {
        card.classList.add(
          "cal-bloqueado"
        );

        resumo =
          "Dia bloqueado";

      } else if (
        confirmados.length
      ) {
        card.classList.add(
          "cal-confirmado"
        );

        resumo =
          confirmados.length === 1
            ? "1 confirmado"
            : `${confirmados.length} confirmados`;

      } else if (
        pendentes.length ||
        horariosBloqueados.length
      ) {
        card.classList.add(
          "cal-ocupado"
        );

        const qtd =
          pendentes.length +
          horariosBloqueados.length;

        resumo =
          qtd === 1
            ? "1 ocupado"
            : `${qtd} ocupados`;
      }

      card.innerHTML = `
        <b>${dia}</b>

        <span>
          ${resumo}
        </span>
      `;

      card.onclick = () => {
        mostrarDetalhes(
          dataISO,
          bloqueiosDia,
          agendaDia
        );
      };

      calendario.appendChild(
        card
      );
    }
  }

  function mostrarDetalhes(
    dataISO,
    bloqueios,
    agenda
  ) {
    const detalhes =
      document.getElementById(
        "detalhesBloqueios"
      );

    const [
      ano,
      mes,
      dia
    ] = dataISO.split("-");

    let html = `
      <h3>
        Agenda de
        ${dia}/${mes}/${ano}
      </h3>
    `;

    const itens = [];

    bloqueios.forEach(x => {

      itens.push(`
        <div class="det
