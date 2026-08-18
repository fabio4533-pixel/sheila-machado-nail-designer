(function () {
  const ENDPOINT =
    "https://fzpffyouubmbxfwycywg.supabase.co/functions/v1/nail-bookings";

  const PRICES = {
    "Blindagem + cimentinho + esmaltação": 90,
    "Esmaltação em gel": 80,
    "Blindagem (sem pintar)": 60,
    "Aplicação de Alongamento F1": 130,
    "Alongamento F1": 130,
    "Manutenção (já pintada)": 100,
    "Manutenção": 100,
    "Reposição de unha": 10,
    "Remoção": 80
  };

  function getPrice(service) {
    const texto = String(service || "");

    const match = texto.match(
      /R\$\s*([\d.]+,\d{2})/
    );

    if (match) {
      return Number(
        match[1]
          .replace(/\./g, "")
          .replace(",", ".")
      );
    }

    return PRICES[texto] || 0;
  }

  function dinheiro(valor) {
    return Number(valor || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );
  }

  function inicioSemana(data) {
    const d = new Date(data);
    const dia = d.getDay();

    const diff =
      d.getDate() -
      dia +
      (dia === 0 ? -6 : 1);

    d.setDate(diff);
    d.setHours(0, 0, 0, 0);

    return d;
  }

  function fimSemana(data) {
    const inicio = inicioSemana(data);

    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    fim.setHours(23, 59, 59, 999);

    return fim;
  }

  async function carregarAgendamentos() {
    const pin =
      sessionStorage.getItem("nail_pin") || "";

    if (!pin) return [];

    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "list",
        pin: pin
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados.error ||
        "Erro ao carregar faturamento."
      );
    }

    return dados.bookings || [];
  }

  function criarPainelFaturamento() {
    const app =
      document.getElementById("app");

    if (!app) return;

    if (
      document.getElementById(
        "financeDashboard"
      )
    ) {
      return;
    }

    const painel =
      document.createElement("div");

    painel.id = "financeDashboard";
    painel.className = "panel";

    painel.innerHTML = `
      <div class="top">
        <div>
          <h2>Faturamento</h2>
          <div class="small">
            Calculado pelos atendimentos concluídos
          </div>
        </div>
        <button onclick="carregarFaturamento()">
          Atualizar
        </button>
      </div>

      <div class="cards" style="margin-top:18px">
        <div class="metric">
          <b id="fatHoje">R$ 0,00</b>
          <span>Hoje</span>
        </div>

        <div class="metric">
          <b id="fatSemana">R$ 0,00</b>
          <span>Esta semana</span>
        </div>

        <div class="metric">
          <b id="fatMes">R$ 0,00</b>
          <span>Este mês</span>
        </div>
      </div>

      <div style="margin-top:22px">
        <div class="top">
          <button id="mesAnterior">
            ←
          </button>

          <h3 id="tituloMes"
              style="margin:0">
          </h3>

          <button id="mesSeguinte">
            →
          </button>
        </div>

        <div
          id="calendarioFaturamento"
          style="
            display:grid;
            grid-template-columns:
              repeat(7,1fr);
            gap:8px;
            margin-top:14px;
          ">
        </div>
      </div>
    `;

    const blocos =
      app.querySelectorAll(".panel");

    if (blocos.length) {
      app.insertBefore(
        painel,
        blocos[blocos.length - 1]
      );
    } else {
      app.appendChild(painel);
    }
  }

  let mesAtual = new Date();

  function montarCalendario(
    agendamentos
  ) {
    const calendario =
      document.getElementById(
        "calendarioFaturamento"
      );

    const titulo =
      document.getElementById(
        "tituloMes"
      );

    if (!calendario || !titulo) return;

    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

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

    const diasSemana = [
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb",
      "Dom"
    ];

    diasSemana.forEach(dia => {
      const el =
        document.createElement("div");

      el.style.fontWeight = "800";
      el.style.fontSize = "12px";
      el.style.textAlign = "center";
      el.style.color = "#7d6b71";

      el.textContent = dia;

      calendario.appendChild(el);
    });

    const primeiroDia =
      new Date(ano, mes, 1);

    let deslocamento =
      primeiroDia.getDay();

    deslocamento =
      deslocamento === 0
        ? 6
        : deslocamento - 1;

    for (
      let i = 0;
      i < deslocamento;
      i++
    ) {
      calendario.appendChild(
        document.createElement("div")
      );
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
        String(mes + 1).padStart(2, "0") +
        "-" +
        String(dia).padStart(2, "0");

      const totalDia =
        agendamentos
          .filter(
            x =>
              x.status === "concluido" &&
              x.appointment_date ===
                dataISO
          )
          .reduce(
            (soma, x) =>
              soma +
              getPrice(x.service),
            0
          );

      const card =
        document.createElement("div");

      card.style.border =
        "1px solid #eadde1";
      card.style.borderRadius =
        "14px";
      card.style.padding =
        "10px";
      card.style.minHeight =
        "72px";
      card.style.background =
        "#fff";

      card.innerHTML = `
        <div
          style="
            font-weight:800;
            color:#5d2638;
          ">
          ${dia}
        </div>

        <div
          style="
            font-size:12px;
            margin-top:8px;
            color:#7d6b71;
          ">
          ${totalDia
            ? dinheiro(totalDia)
            : ""}
        </div>
      `;

      calendario.appendChild(card);
    }
  }

  async function carregarFaturamento() {
    try {
      criarPainelFaturamento();

      const agendamentos =
        await carregarAgendamentos();

      const concluidos =
        agendamentos.filter(
          x =>
            x.status === "concluido"
        );

      const agora = new Date();

      const hojeISO =
        agora.toISOString().slice(0, 10);

      const totalHoje =
        concluidos
          .filter(
            x =>
              x.appointment_date ===
                hojeISO
          )
          .reduce(
            (soma, x) =>
              soma +
              getPrice(x.service),
            0
          );

      const inicio =
        inicioSemana(agora);

      const fim =
        fimSemana(agora);

      const totalSemana =
        concluidos
          .filter(x => {
            const data =
              new Date(
                x.appointment_date +
                "T12:00:00"
              );

            return (
              data >= inicio &&
              data <= fim
            );
          })
          .reduce(
            (soma, x) =>
              soma +
              getPrice(x.service),
            0
          );

      const totalMes =
        concluidos
          .filter(x => {
            const [
              ano,
              mes
            ] =
              x.appointment_date
                .split("-")
                .map(Number);

            return (
              ano ===
                agora.getFullYear() &&
              mes ===
                agora.getMonth() + 1
            );
          })
          .reduce(
            (soma, x) =>
              soma +
              getPrice(x.service),
            0
          );

      document.getElementById(
        "fatHoje"
      ).textContent =
        dinheiro(totalHoje);

      document.getElementById(
        "fatSemana"
      ).textContent =
        dinheiro(totalSemana);

      document.getElementById(
        "fatMes"
      ).textContent =
        dinheiro(totalMes);

      montarCalendario(
        agendamentos
      );

      document.getElementById(
        "mesAnterior"
      ).onclick = function () {
        mesAtual =
          new Date(
            mesAtual.getFullYear(),
            mesAtual.getMonth() - 1,
            1
          );

        montarCalendario(
          agendamentos
        );
      };

      document.getElementById(
        "mesSeguinte"
      ).onclick = function () {
        mesAtual =
          new Date(
            mesAtual.getFullYear(),
            mesAtual.getMonth() + 1,
            1
          );

        montarCalendario(
          agendamentos
        );
      };

    } catch (erro) {
      console.error(erro);
    }
  }

  window.carregarFaturamento =
    carregarFaturamento;

  function iniciar() {
    criarPainelFaturamento();

    const pin =
      sessionStorage.getItem(
        "nail_pin"
      );

    if (pin) {
      setTimeout(
        carregarFaturamento,
        500
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
