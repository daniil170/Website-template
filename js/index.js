import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// ---------- Firebase ----------
const firebaseConfig = {
  apiKey: "AIzaSyAUIQqsfAiDxYBExYGXW828-6DFDprNfnQ",
  authDomain: "menu-template-5b0eb.firebaseapp.com",
  projectId: "menu-template-5b0eb",
  storageBucket: "menu-template-5b0eb.firebasestorage.app",
  messagingSenderId: "371601105943",
  appId: "1:371601105943:web:daa1114eea08ee8ecc6852",
  measurementId: "G-HPZ4L6058G"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const translations = {
  en: {
    subtitle: "Modern Italian Kitchen",
    categories: {
      "main-dishes": "Main Dishes",
      pizza: "Pizza",
      salads: "Salads",
      desserts: "Desserts",
      drinks: "Drinks"
    },
    footer: {
      address: "Almaty, Kazakhstan",
      copy: "© 2026 Lumiere Restaurant"
    }
  },
  ru: {
    subtitle: "Современная итальянская кухня",
    categories: {
      "main-dishes": "Основные блюда",
      pizza: "Пицца",
      salads: "Салаты",
      desserts: "Десерты",
      drinks: "Напитки"
    },
    footer: {
      address: "Алматы, Казахстан",
      copy: "© 2026 Ресторан Lumiere"
    }
  },
  kz: {
    subtitle: "Заманауи итальян асханасы",
    categories: {
      "main-dishes": "Негізгі тағамдар",
      pizza: "Пицца",
      salads: "Салаттар",
      desserts: "Десерттер",
      drinks: "Сусындар"
    },
    footer: {
      address: "Алматы, Қазақстан",
      copy: "© 2026 Lumiere мейрамханасы"
    }
  }
};

// ---------- Переменная текущего языка ----------
let currentLang = "ru";

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("lang-btn")) {
    const lang = e.target.dataset.lang;
    switchLanguage(lang);

    document.querySelectorAll(".lang-btn").forEach((btn) =>
      btn.classList.remove("active")
    );
    e.target.classList.add("active");

    // Закрываем модальное окно
    const overlay = document.getElementById("welcomeOverlay");
    if (overlay) overlay.style.display = "none";
  }
});

// ---------- Статические переводы заголовков ----------


// ---------- Функция для вложенных ключей ----------
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc && acc[key], obj);
}

// ---------- Переключение языка ----------
function switchLanguage(lang) {
  currentLang = lang;

  // Заголовки категорий
  document.querySelectorAll(".category-title").forEach(title => {
    const id = title.parentElement.id;
    if (translations[lang].categories[id]) {
      title.textContent = translations[lang].categories[id];
    }
  });

  // Статические элементы (subtitle, footer)
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const value = getNestedValue(translations[lang], key);
    if (value) el.textContent = value;
  });

  // Перерисовка меню
  renderAllCategories();
}

// ---------- Рендер всех категорий ----------
const categories = [
  { id: "main-dishes", selector: "#main-dishes .dishes" },
  { id: "pizza", selector: "#pizza .dishes" },
  { id: "salads", selector: "#salads .dishes" },
  { id: "desserts", selector: "#desserts .dishes" },
  { id: "drinks", selector: "#drinks .dishes" }
];

function renderAllCategories() {
  categories.forEach(c => renderMenu(c.id, c.selector));
}

async function loadMenu(category) {
  try {
    const dishesRef = collection(db, "restaurants", "lumiere", "dishes");
    
    const q = query(dishesRef, where("category", "==", category));
    
    const menuSnapshot = await getDocs(q);
    
    if (menuSnapshot.empty) {
      console.warn(`В базе нет блюд для категории: ${category}`);
      return [];
    }

    return menuSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Ошибка при загрузке из Firestore:", error);
    return [];
  }
}

function renderMenu(category, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  loadMenu(category).then(items => {
    container.innerHTML = "";
    items.forEach(item => {
      // Проверка на наличие данных, чтобы не вылетала ошибка
      const name = item.name ? item.name[currentLang] : "Без названия";
      const desc = item.desc ? item.desc[currentLang] : "";
      const price = item.price || "Цена не указана";
      const img = item.img || "https://via.placeholder.com/150";

      const dish = document.createElement("div");
      dish.className = "dish";
      dish.innerHTML = `
        <img src="${img}" alt="${name}">
        <div class="dish-info">
          <h3 class="dish-name">${name}</h3>
          <p class="dish-desc">${desc}</p>
          <span class="dish-price">${price}</span>
        </div>
      `;
      container.appendChild(dish);
    });
  });
}

switchLanguage("ru");