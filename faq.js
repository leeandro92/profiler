(function () {
  const categories = [
    {
      title: "Seguridad",
      icon: "🔐",
      questions: [
        {
          question: "¿Mis datos están protegidos?",
          answer: "Sí, utilizamos autenticación segura y reglas de seguridad para proteger la información de los usuarios.",
        },
        {
          question: "¿Cómo funciona el login?",
          answer: "El sistema utiliza autenticación segura para garantizar acceso únicamente a usuarios autorizados.",
        },
      ],
    },
    {
      title: "Sistema",
      icon: "☁️",
      questions: [
        {
          question: "¿Cómo funciona la plataforma?",
          answer: "La plataforma funciona mediante un sistema online conectado a una base de datos segura, permitiendo guardar y administrar información en tiempo real.",
        },
        {
          question: "¿Dónde se guardan los datos?",
          answer: "Los datos se almacenan de forma segura utilizando Firebase Firestore y servicios en la nube.",
        },
        {
          question: "¿La información se actualiza automáticamente?",
          answer: "Sí, los cambios realizados se sincronizan en tiempo real para todos los usuarios autorizados.",
        },
        {
          question: "¿Qué tecnologías utiliza esta página?",
          answer: "La plataforma fue desarrollada con tecnologías modernas como HTML, CSS, JavaScript y Firebase.",
        },
      ],
    },
    {
      title: "Compatibilidad",
      icon: "📱",
      questions: [
        {
          question: "¿La plataforma funciona en celulares?",
          answer: "Sí, el sistema es totalmente responsive y compatible con celulares, tablets y computadoras.",
        },
        {
          question: "¿Necesito instalar algo?",
          answer: "No, la plataforma funciona directamente desde el navegador.",
        },
        {
          question: "¿Puedo acceder desde cualquier lugar?",
          answer: "Sí, al ser una plataforma web podés ingresar desde cualquier dispositivo con internet.",
        },
      ],
    },
    {
      title: "Usuarios",
      icon: "👤",
      questions: [
        {
          question: "¿Necesito crear una cuenta?",
          answer: "Sí, algunas funciones requieren iniciar sesión para acceder de forma segura a las herramientas personalizadas.",
        },
        {
          question: "¿Puedo recuperar mi cuenta?",
          answer: "Sí, podés restablecer tu contraseña desde el login.",
        },
        {
          question: "¿Puedo borrar mis datos?",
          answer: "Sí, podés solicitar la eliminación de tu información.",
        },
        {
          question: "¿La plataforma seguirá agregando funciones?",
          answer: "El sistema se encuentra en constante actualización para mejorar la experiencia y agregar nuevas herramientas.",
        },
      ],
    },
  ];

  function createFooterFaq(footerIndex) {
    const section = document.createElement("section");
    section.className = "footer-faq";
    section.setAttribute("aria-labelledby", `footerFaqTitle${footerIndex}`);

    const header = document.createElement("div");
    header.className = "footer-faq__header";
    header.innerHTML = `
      <span class="footer-faq__badge">FAQ</span>
      <h2 id="footerFaqTitle${footerIndex}">Preguntas Frecuentes</h2>
      <p>Todo lo que necesitás saber sobre la plataforma.</p>
    `;

    const grid = document.createElement("div");
    grid.className = "footer-faq__grid";

    categories.forEach((category, categoryIndex) => {
      const card = document.createElement("article");
      card.className = "footer-faq__category";

      const title = document.createElement("h3");
      title.innerHTML = `<span>${category.icon}</span>${category.title}`;
      card.appendChild(title);

      category.questions.forEach((item, questionIndex) => {
        const faqId = `footerFaq${footerIndex}-${categoryIndex}-${questionIndex}`;
        const faqItem = document.createElement("div");
        faqItem.className = "footer-faq__item";

        const button = document.createElement("button");
        button.className = "footer-faq__question";
        button.type = "button";
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-controls", faqId);
        button.innerHTML = `<span>${item.question}</span><span class="footer-faq__plus" aria-hidden="true"></span>`;

        const answer = document.createElement("div");
        answer.className = "footer-faq__answer";
        answer.id = faqId;
        answer.setAttribute("aria-hidden", "true");
        answer.innerHTML = `<p>${item.answer}</p>`;

        faqItem.append(button, answer);
        card.appendChild(faqItem);
      });

      grid.appendChild(card);
    });

    const support = document.createElement("div");
    support.className = "footer-faq__support";
    support.innerHTML = `
      <div>
        <h3>¿No encontraste tu respuesta?</h3>
        <p>Podés comunicarte con soporte para recibir ayuda personalizada.</p>
      </div>
      <a class="footer-faq__support-button" href="mailto:lean-nieto.92@hotmail.com">Contactar soporte</a>
    `;

    section.append(header, grid, support);
    return section;
  }

  function closeFaqItem(item) {
    const button = item.querySelector(".footer-faq__question");
    const answer = item.querySelector(".footer-faq__answer");
    if (!button || !answer) return;

    item.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    answer.setAttribute("aria-hidden", "true");
    answer.style.maxHeight = "0px";
  }

  function openFaqItem(item) {
    const button = item.querySelector(".footer-faq__question");
    const answer = item.querySelector(".footer-faq__answer");
    if (!button || !answer) return;

    item.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    answer.setAttribute("aria-hidden", "false");
    answer.style.maxHeight = `${answer.scrollHeight}px`;
  }

  function setupFooterFaq(footer, footerIndex) {
    if (footer.querySelector(".footer-faq")) return;

    footer.appendChild(createFooterFaq(footerIndex));
    footer.addEventListener("click", (event) => {
      const button = event.target.closest(".footer-faq__question");
      if (!button || !footer.contains(button)) return;

      const currentItem = button.closest(".footer-faq__item");
      const isOpen = currentItem.classList.contains("is-open");

      footer.querySelectorAll(".footer-faq__item.is-open").forEach(closeFaqItem);
      if (!isOpen) openFaqItem(currentItem);
    });
  }

  function initFooterFaqs() {
    document.querySelectorAll(".app-footer").forEach(setupFooterFaq);
  }

  window.addEventListener("resize", () => {
    document.querySelectorAll(".footer-faq__item.is-open .footer-faq__answer").forEach((answer) => {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFooterFaqs);
  } else {
    initFooterFaqs();
  }
})();
