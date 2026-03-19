const translations = {
  ru: {
    subtitle: "Современная итальянская кухня",
    btnMenu: "Смотреть меню",
    street: "пр. Назарбаева, 123",
  },
  en: {
    subtitle: "Modern Italian Kitchen",
    btnMenu: "View Menu",
    street: "123 Nazarbayev Ave",
  },
  kz: {
    subtitle: "Заманауи итальяндық асхана",
    btnMenu: "Мәзірді көру",
    street: "Назарбаев даңғылы, 123",
  },
};

// Функция: выбрать язык и войти
function selectAndEnter(lang) {
  // 1. Сохраняем язык в localStorage для index.html
  localStorage.setItem("selectedLanguage", lang);

  // 2. Обновляем тексты на текущей странице
  updateUI(lang);

  // 3. Прячем модальное окно
  const modal = document.getElementById("welcome-modal");
  if (modal) {
    modal.classList.add("modal-hidden"); // CSS уберет прозрачность
    sessionStorage.setItem("welcomeShown", "true"); // Запомним, что вошли

    // Через 500мс полностью убираем, чтобы не мешал кликам
    setTimeout(() => {
      modal.style.display = "none";
    }, 500);
  }
}

// Функция обновления текста
function updateUI(lang) {
  const data = translations[lang];

  const sub = document.getElementById("hero-subtitle");
  const btn = document.getElementById("btn-menu");
  const str = document.getElementById("loc-street");

  if (sub) sub.innerText = data.subtitle;
  if (btn) btn.innerText = data.btnMenu;
  if (str) str.innerText = data.street;

  // Подсветка активного языка в углу
  document
    .querySelectorAll(".lang-switcher span")
    .forEach((s) => s.classList.remove("active"));
  const activeBtn = document.getElementById("btn-" + lang);
  if (activeBtn) activeBtn.classList.add("active");
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  // Восстанавливаем язык или ставим RU
  const savedLang = localStorage.getItem("selectedLanguage") || "ru";
  updateUI(savedLang);

  // Скрываем модалку, если уже заходили
  if (sessionStorage.getItem("welcomeShown") === "true") {
    const modal = document.getElementById("welcome-modal");
    if (modal) modal.style.display = "none";
  }
});
