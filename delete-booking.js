(function () {
  const ENDPOINT =
    "https://fzpffyouubmbxfwycywg.supabase.co/functions/v1/nail-bookings";

  async function excluirAgendamento(id, card) {
    const pin = sessionStorage.getItem("nail_pin") || "";

    if (!pin) {
      alert("Entre novamente no painel.");
      return;
    }

    const confirmar = confirm(
      "Excluir este agendamento permanentemente?"
    );

    if (!confirmar) return;

    try {
      const resposta = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "delete",
          id: id,
          pin: pin
        })
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.error || "Não foi possível excluir."
        );
      }

      card.remove();

      if (typeof loadBookings === "function") {
        loadBookings();
      }
    } catch (erro) {
      alert(
        erro.message ||
        "Não foi possível excluir o agendamento."
      );
    }
  }

  function adicionarBotoes() {
    const agendamentos =
      document.querySelectorAll("#list .booking");

    agendamentos.forEach(card => {

      if (card.dataset.deleteEnhanced === "1") {
        return;
      }

      const tag = card.querySelector(".tag");

      const status =
        String(tag?.textContent || "")
          .trim()
          .toLowerCase();

      if (
        status !== "pendente" &&
        status !== "cancelado"
      ) {
        card.dataset.deleteEnhanced = "1";
        return;
      }

      const acoes = card.querySelector(".actions");

      if (!acoes) return;

      let id = null;

      acoes.querySelectorAll("button").forEach(botao => {
        const onclick =
          botao.getAttribute("onclick") || "";

        const encontrou =
          onclick.match(/setStatus\((\d+),/);

        if (encontrou && !id) {
          id = Number(encontrou[1]);
        }
      });

      if (!id) return;

      const botaoExcluir =
        document.createElement("button");

      botaoExcluir.type = "button";
      botaoExcluir.textContent = "Excluir";
      botaoExcluir.className = "danger";

      botaoExcluir.onclick = function () {
        excluirAgendamento(id, card);
      };

      acoes.appendChild(botaoExcluir);

      card.dataset.deleteEnhanced = "1";
    });
  }

  function iniciar() {
    const lista = document.getElementById("list");

    if (!lista) return;

    adicionarBotoes();

    const observer =
      new MutationObserver(adicionarBotoes);

    observer.observe(lista, {
      childList: true,
      subtree: true
    });
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
