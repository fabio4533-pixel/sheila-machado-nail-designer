(function () {
  const WHATSAPP_SHEILA = "5547991620794";

  function dataBR(data) {
    if (!data) return "";
    const p = data.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : data;
  }

  // SITE DA CLIENTE
  function configurarAgendamento() {
    const form = document.getElementById("bookingForm");
    if (!form) return;

    let dadosAgendamento = null;

    form.addEventListener("submit", function () {
      dadosAgendamento =
        Object.fromEntries(new FormData(form).entries());
    });

    const status = document.getElementById("status");
    if (!status) return;

    const observer = new MutationObserver(() => {
      const texto = status.textContent.toLowerCase();

      if (
        dadosAgendamento &&
        texto.includes("pedido enviado com sucesso")
      ) {
        const mensagem =
`Olá Sheila! 💅

Acabei de solicitar um agendamento pelo seu site.

Nome: ${dadosAgendamento.client_name}
Serviço: ${dadosAgendamento.service}
Data: ${dataBR(dadosAgendamento.appointment_date)}
Horário: ${dadosAgendamento.appointment_time}`;

        const link =
          `https://wa.me/${WHATSAPP_SHEILA}?text=` +
          encodeURIComponent(mensagem);

        dadosAgendamento = null;

        window.open(link, "_blank");
      }
    });

    observer.observe(status, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // PAINEL ADMINISTRATIVO
  function configurarPainel() {
    const app = document.getElementById("app");
    if (!app) return;

    function adicionarBotoes() {
      document.querySelectorAll(".booking").forEach(card => {

        if (card.dataset.whatsapp === "ok") return;

        const pequenos = [...card.querySelectorAll(".small")];

        const telefoneElemento = pequenos.find(el =>
          /\d{8,}/.test(el.textContent.replace(/\D/g, ""))
        );

        if (!telefoneElemento) return;

        let telefone =
          telefoneElemento.textContent.replace(/\D/g, "");

        if (!telefone.startsWith("55")) {
          telefone = "55" + telefone;
        }

        const acoes = card.querySelector(".actions");
        if (!acoes) return;

        const botao = document.createElement("button");

        botao.type = "button";
        botao.textContent = "Chamar cliente no WhatsApp";
        botao.style.background = "#25D366";

        botao.onclick = function () {
          window.open(
            `https://wa.me/${telefone}`,
            "_blank"
          );
        };

        acoes.appendChild(botao);

        card.dataset.whatsapp = "ok";
      });
    }

    adicionarBotoes();

    new MutationObserver(adicionarBotoes)
      .observe(app, {
        childList: true,
        subtree: true
      });
  }

  function iniciar() {
    configurarAgendamento();
    configurarPainel();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      iniciar
    );
  } else {
    iniciar();
  }
})();
