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
        <div class="detalhe-item">
          <div>
            <b>
              ${
                x.full_day
                  ? "Dia inteiro bloqueado"
                  : "Horário bloqueado: " +
                    esc(x.block_time)
              }
            </b>

            <div class="small">
              Indisponível
            </div>
          </div>

          <button
            class="danger"
            onclick="
              desbloquearCalendario(
                ${x.id}
              )
            "
          >
            Desbloquear
          </button>
        </div>
      `);
    });

    agenda
      .filter(
        x =>
          x.status ===
            "confirmado" ||
          x.status ===
            "pendente"
      )
      .forEach(x => {

        const status =
          x.status ===
          "confirmado"
            ? "Confirmado"
            : "Pendente";

        itens.push(`
          <div class="detalhe-item">
            <div>
              <b>
                ${esc(x.client_name)}
              </b>

              <div class="small">
                ${esc(x.service)}
              </div>

              <div class="small">
                Horário:
                ${esc(
                  x.appointment_time
                )}
              </div>
            </div>

            <span class="tag">
              ${status}
            </span>
          </div>
        `);
      });

    if (!itens.length) {
      html += `
        <div class="dia-livre-msg">
          Dia totalmente livre.
        </div>
      `;
    } else {
      html += itens.join("");
    }

    detalhes.innerHTML = html;
  }

  async function desbloquear(id) {
    const confirmar =
      confirm(
        "Deseja desbloquear?"
      );

    if (!confirmar) return;

    try {
      await api({
        action: "unblock",
        id
      });

      await carregarCalendarioBloqueios();

      if (
        typeof loadBlocks ===
        "function"
      ) {
        loadBlocks();
      }

    } catch (erro) {
      alert(
        erro.message ||
        "Não foi possível desbloquear."
      );
    }
  }

  async function carregarCalendarioBloqueios() {
    try {
      criarPainel();

      const resultados =
        await Promise.all([
          api({
            action:
              "list_blocks"
          }),

          api({
            action: "list"
          })
        ]);

      const bloqueios =
        resultados[0].blocks || [];

      const agendamentos =
        (
          resultados[1].bookings ||
          []
        ).filter(
          x =>
            x.status ===
              "confirmado" ||
            x.status ===
              "pendente"
        );

      montarCalendario(
        bloqueios,
        agendamentos
      );

      document.getElementById(
        "bloqMesAnterior"
      ).onclick = () => {

        mesAtual =
          new Date(
            mesAtual.getFullYear(),
            mesAtual.getMonth() - 1,
            1
          );

        montarCalendario(
          bloqueios,
          agendamentos
        );
      };

      document.getElementById(
        "bloqMesSeguinte"
      ).onclick = () => {

        mesAtual =
          new Date(
            mesAtual.getFullYear(),
            mesAtual.getMonth() + 1,
            1
          );

        montarCalendario(
          bloqueios,
          agendamentos
        );
      };

    } catch (erro) {
      console.error(
        "Calendário:",
        erro
      );
    }
  }

  window
    .carregarCalendarioBloqueios =
      carregarCalendarioBloqueios;

  window
    .desbloquearCalendario =
      desbloquear;

  const estilo =
    document.createElement(
      "style"
    );

  estilo.textContent = `
    #calendarioBloqueiosPanel {
      overflow:hidden;
    }

    .legenda-cal {
      display:flex;
      flex-wrap:wrap;
      gap:8px 14px;
      margin:15px 0;
      font-size:12px;
      color:#7d6b71;
    }

    .nav-cal {
      display:flex;
      align-items:center;
      justify-content:
        space-between;
      gap:10px;
      margin:15px 0;
    }

    .nav-cal h3 {
      flex:1;
      text-align:center;
      margin:0;
      color:#5d2638;
      text-transform:
        capitalize;
    }

    .calendario-grid {
      display:grid;
      grid-template-columns:
        repeat(
          7,
          minmax(0,1fr)
        );
      gap:6px;
      width:100%;
    }

    .cal-cabecalho {
      text-align:center;
      font-size:11px;
      font-weight:800;
      color:#7d6b71;
      padding:5px 0;
    }

    .cal-dia {
      min-width:0;
      min-height:78px;
      padding:9px 6px;
      border:
        1px solid #eadde1;
      border-radius:12px;
      background:#fff;
      cursor:pointer;
      transition:
        transform .15s ease;
    }

    .cal-dia:hover {
      transform:
        translateY(-2px);
    }

    .cal-dia b {
      display:block;
      color:#5d2638;
      font-size:14px;
    }

    .cal-dia span {
      display:block;
      margin-top:8px;
      font-size:10px;
      line-height:1.25;
      color:#7d6b71;
      overflow-wrap:anywhere;
    }

    .cal-confirmado {
      background:#edf7f2;
      border-color:#b8ddcc;
    }

    .cal-ocupado {
      background:#fff7e8;
      border-color:#ead3a2;
    }

    .cal-bloqueado {
      background:#f7dfe6;
      border-color:#ddb4c0;
    }

    .detalhes-cal {
      margin-top:20px;
    }

    .detalhe-item {
      display:flex;
      justify-content:
        space-between;
      align-items:center;
      gap:12px;
      padding:13px;
      margin-bottom:9px;
      background:#fff;
      border:
        1px solid #eadde1;
      border-radius:14px;
    }

    .dia-livre-msg {
      padding:14px;
      border-radius:14px;
      background:#f8f5f6;
      color:#7d6b71;
      font-size:13px;
    }

    @media (
      max-width:600px
    ) {
      #calendarioBloqueiosPanel {
        padding:
          16px 10px !important;
      }

      .calendario-grid {
        gap:4px;
      }

      .cal-dia {
        min-height:64px;
        padding:7px 3px;
        border-radius:9px;
      }

      .cal-dia b {
        font-size:12px;
      }

      .cal-dia span {
        font-size:8px;
        margin-top:6px;
      }

      .cal-cabecalho {
        font-size:9px;
      }

      .nav-cal h3 {
        font-size:17px;
      }

      .detalhe-item {
        flex-wrap:wrap;
      }

      .detalhe-item button {
        width:100%;
      }
    }
  `;

  document.head.appendChild(
    estilo
  );

  function iniciar() {
    criarPainel();

    if (
      sessionStorage.getItem(
        "nail_pin"
      )
    ) {
      setTimeout(
        carregarCalendarioBloqueios,
        400
      );
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      iniciar
    );
  } else {
    iniciar();
  }
})();
