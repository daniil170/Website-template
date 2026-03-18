import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// ---------- Firebase Config ----------
const firebaseConfig = {
  apiKey: "AIzaSyAUIQqsfAiDxYBExYGXW828-6DFDprNfnQ",
  authDomain: "menu-template-5b0eb.firebaseapp.com",
  projectId: "menu-template-5b0eb",
  storageBucket: "menu-template-5b0eb.firebasestorage.app",
  messagingSenderId: "371601105943",
  appId: "1:371601105943:web:daa1114eea08ee8ecc6852",
  measurementId: "G-HPZ4L6058G",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// ---------- Translations (Статика) ----------
const translations = {
  ru: {
    subtitle: "Современная итальянская кухня",
    footer: {
      address: "Алматы, Казахстан",
      copy: "© 2026 Ресторан Lumiere",
    },
  },
  en: {
    subtitle: "Modern Italian Kitchen",
    footer: {
      address: "Almaty, Kazakhstan",
      copy: "© 2026 Lumiere Restaurant",
    },
  },
  kz: {
    subtitle: "Заманауи итальян асханасы",
    footer: {
      address: "Алматы, Қазақстан",
      copy: "© 2026 Lumiere мейрамханасы",
    },
  },
};

let currentLang = localStorage.getItem("language") || "ru";

// ---------- 1. Функция перевода статических текстов ----------
function applyTranslations() {
  const langData = translations[currentLang];

  const subtitle = document.querySelector("[data-i18n='subtitle']");
  if (subtitle) subtitle.textContent = langData.subtitle;

  const address = document.querySelector("[data-i18n='footer.address']");
  if (address) address.textContent = langData.footer.address;

  const copy = document.querySelector("[data-i18n='footer.copy']");
  if (copy) copy.textContent = langData.footer.copy;
}

// ---------- 2. Загрузка блюд из Firebase ----------
async function loadMenu(categoryName) {
  try {
    const dishesRef = collection(db, "restaurants", "lumiere", "dishes");
    const q = query(dishesRef, where("category", "==", categoryName));
    const menuSnapshot = await getDocs(q);
    return menuSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Ошибка при загрузке блюд:", error);
    return [];
  }
}

// ---------- 3. Отрисовка карточек блюд (С АНИМАЦИЕЙ) ----------
function renderMenu(categoryRuName, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  loadMenu(categoryRuName).then((items) => {
    container.innerHTML = "";
    if (items.length === 0) {
      container.innerHTML = `<p style="color: gray; font-style: italic; text-align: center; width: 100%;">Пока пусто...</p>`;
      return;
    }

    // Создаем "наблюдателя" для плавного появления
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // Добавляем небольшую задержку для эффекта "лесенки"
            setTimeout(() => {
              entry.target.classList.add("visible");
            }, index * 100);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    items.forEach((item) => {
      const name =
        typeof item.name === "object"
          ? item.name[currentLang] || item.name["ru"]
          : item.name;
      const desc =
        typeof item.description === "object"
          ? item.description[currentLang] || item.description["ru"]
          : item.description;
      const price = item.price || "---";
      const img = item.img || "https://via.placeholder.com/150";

      const dishElement = document.createElement("div");
      dishElement.className = "dish"; // Класс для CSS
      dishElement.innerHTML = `
        <img src="${img}" alt="${name}">
        <div class="dish-info">
          <h3 class="dish-name">${name}</h3>
          <p class="dish-desc">${desc}</p>
          <span class="dish-price">${price} ₸</span>
        </div>
      `;
      container.appendChild(dishElement);
      observer.observe(dishElement); // Начинаем следить за элементом
    });
  });
}

// ---------- 4. Динамическая сборка всего меню и навигации ----------
async function initDynamicMenu() {
  const nav = document.getElementById("dynamic-nav");
  const container = document.getElementById("menu-container");
  if (!nav || !container) return;

  try {
    const catSnapshot = await getDocs(
      collection(db, "restaurants", "lumiere", "categories"),
    );

    nav.innerHTML = "";
    container.innerHTML = "";

    catSnapshot.forEach((catDoc) => {
      const categoryData = catDoc.data();
      const categoryId = catDoc.id;

      const categoryDisplayName =
        typeof categoryData.name === "object"
          ? categoryData.name[currentLang] || categoryData.name["ru"]
          : categoryData.name;
      const categoryRuValue =
        typeof categoryData.name === "object"
          ? categoryData.name["ru"]
          : categoryData.name;

      const navLink = document.createElement("a");
      navLink.href = `#${categoryId}`;
      navLink.textContent = categoryDisplayName;
      nav.appendChild(navLink);

      const section = document.createElement("section");
      section.id = categoryId;
      section.className = "menu-category";
      section.innerHTML = `
        <h2 class="category-title">${categoryDisplayName}</h2>
        <div class="dishes" id="dishes-${categoryId}"></div>
      `;
      container.appendChild(section);

      renderMenu(categoryRuValue, `#dishes-${categoryId}`);
    });
  } catch (error) {
    console.error("Ошибка динамической загрузки меню:", error);
  }
}

// ---------- 5. Переключение языка ----------
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("language", lang);

  applyTranslations();
  initDynamicMenu();
}

// ---------- 6. Обработка кликов ----------
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("lang-btn")) {
    const lang = e.target.dataset.lang;
    switchLanguage(lang);

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    const overlay = document.getElementById("welcomeOverlay");
    if (overlay) overlay.style.display = "none";
  }
});

// ---------- СТАРТ ПРИЛОЖЕНИЯ ----------
document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
  initDynamicMenu();
});
