(function () {
  const API = "https://fzpffyouubmbxfwycywg.supabase.co/functions/v1/nail-bookings";

  async function consultarHorarios() {
    const form = document.getElementById("bookingForm");
    if (!form) return;

    const data = form.querySelector('[name="appointment_date"]');
    const horario = form.querySelector('[name="appointment_time"]');
    const status = document.getElementById("status");

    if (!data || !horario || !data.value) return;

    horario.disabled = true;
    horario.innerHTML = '<option value="">Carregando...</option>';

    try {
      const resposta = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "availability",
          appointment_date: data.value
        })
      });

      const resultado = await resposta.json();

      if (!resposta.ok) throw new Error();

      if (resultado.full_day) {
        horario.innerHTML =
          '<option value="">Dia indisponível</option>';
        horario.disabled = true;

        if (status) {
          status.textContent =
            "Esta data está bloqueada. Escolha outro dia.";
        }
        return;
      }

      const horarios = resultado.times || [];

      if (!horarios.length) {
        horario.innerHTML =
          '<option value="">Sem horários disponíveis</option>';
        horario.disabled = true;

        if (status) {
          status.textContent =
            "Não há horários disponíveis nesta data.";
        }
        return;
      }

      horario.innerHTML =
        '<option value="">Selecione</option>' +
        horarios
          .map(h => `<option value="${h}">${h}</option>`)
          .join("");

      horario.disabled = false;

      if (status) status.textContent = "";

    } catch (erro) {
      horario.innerHTML =
        '<option value="">Erro ao carregar horários</option>';

      if (status) {
        status.textContent =
          "Não foi possível consultar os horários.";
      }
    }
  }

  function iniciar() {
    const form = document.getElementById("bookingForm");
    if (!form) return;

    const data = form.querySelector('[name="appointment_date"]');
    const horario = form.querySelector('[name="appointment_time"]');

    if (!data || !horario) return;

    horario.innerHTML =
      '<option value="">Selecione a data primeiro</option>';
    horario.disabled = true;

    data.addEventListener("change", consultarHorarios);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
