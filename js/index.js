import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUIQqsfAiDxYBExYGXW828-6DFDprNfnQ",
  authDomain: "menu-template-5b0eb.firebaseapp.com",
  projectId: "menu-template-5b0eb",
  storageBucket: "menu-template-5b0eb.firebasestorage.app",
  messagingSenderId: "371601105943",
  appId: "1:371601105943:web:daa1114eea08ee8ecc6852",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];
let currentLang = localStorage.getItem("selectedLanguage") || "ru";
let menuAbortController = null;

const translations = {
  ru: {
    subtitle: "Современная итальянская кухня",
    cartView: "Показать заказ",
    cartTitle: "Ваш заказ",
    total: "Сумма:",
    service: "Обслуживание (10%):",
    totalWithService: "Итого к оплате:",
    instruction: "Покажите этот экран официанту для подтверждения заказа",
    footer: { address: "Алматы, Казахстан", copy: "© 2026 Lumiere" },
  },
  en: {
    subtitle: "Modern Italian Kitchen",
    cartView: "View Order",
    cartTitle: "Your Order",
    total: "Subtotal:",
    service: "Service Fee (10%):",
    totalWithService: "Total to pay:",
    instruction: "Show this screen to the waiter to confirm your order",
    footer: { address: "Almaty, Kazakhstan", copy: "© 2026 Lumiere" },
  },
  kz: {
    subtitle: "Заманауи итальян асханасы",
    cartView: "Тапсырысты көру",
    cartTitle: "Сіздің тапсырысыңыз",
    total: "Тағамдар сомасы:",
    service: "Қызмет көрсету (10%):",
    totalWithService: "Төлеуге:",
    instruction: "Тапсырысты растау үшін осы экранды даяшыға көрсетіңіз",
    footer: { address: "Алматы, Қазақстан", copy: "© 2026 Lumiere" },
  },
};

// --- КОРЗИНА ---

window.toggleCart = function () {
  const modal = document.getElementById("cart-modal");
  const cartNav = document.getElementById("cart-nav");
  if (modal) {
    const isVisible = modal.style.display === "block";
    if (isVisible) {
      modal.style.display = "none";
      document.body.style.overflow = "";
      if (cart.length > 0 && cartNav) cartNav.classList.remove("hidden");
    } else {
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
      if (cartNav) cartNav.classList.add("hidden");
    }
  }
};

window.addToCart = function (name, price, event) {
  const existingItem = cart.find((item) => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  updateCartUI();

  if (event && event.target) {
    const dishCard = event.target.closest(".dish");
    const imgToFly = dishCard?.querySelector(".dish-img");
    if (imgToFly) animateFly(imgToFly);
  }

  const cartNav = document.getElementById("cart-nav");
  const modal = document.getElementById("cart-modal");
  if (cartNav && (!modal || modal.style.display !== "block")) {
    cartNav.classList.remove("hidden");
    cartNav.classList.remove("cart-bump");
    void cartNav.offsetWidth;
    cartNav.classList.add("cart-bump");
  }
};

function animateFly(originImg) {
  const cartNav = document.getElementById("cart-nav");
  if (!cartNav) return;
  const flyImg = originImg.cloneNode(true);
  const rect = originImg.getBoundingClientRect();
  const cartRect = cartNav.getBoundingClientRect();

  flyImg.classList.add("fly-item");
  flyImg.style.position = "fixed";
  flyImg.style.top = `${rect.top}px`;
  flyImg.style.left = `${rect.left}px`;
  flyImg.style.width = `${rect.width}px`;
  flyImg.style.height = `${rect.height}px`;
  flyImg.style.zIndex = "10001";

  document.body.appendChild(flyImg);

  requestAnimationFrame(() => {
    const targetX = cartRect.left + cartRect.width / 2;
    const targetY = cartRect.top + cartRect.height / 2;
    flyImg.style.top = `${targetY}px`;
    flyImg.style.left = `${targetX}px`;
    flyImg.style.width = `40px`;
    flyImg.style.height = `40px`;
    flyImg.style.borderRadius = `50%`;
    flyImg.style.opacity = `0.2`;
    flyImg.style.transform = `translate(-50%, -50%) rotate(720deg) scale(0.1)`;
  });

  setTimeout(() => flyImg.remove(), 900);
}

window.changeQuantity = function (index, delta) {
  if (!cart[index]) return;
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  updateCartUI();
};

function updateCartUI() {
  const langData = translations[currentLang];
  const itemsList = document.getElementById("cart-items-list");
  const cartNav = document.getElementById("cart-nav");
  const modal = document.getElementById("cart-modal");
  if (!itemsList) return;

  if (cart.length === 0) {
    itemsList.innerHTML = `<p style="text-align:center; padding:20px; color:#888;">Корзина пуста / Empty</p>`;
    if (cartNav) cartNav.classList.add("hidden");
    if (modal && modal.style.display === "block") {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
    return;
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const serviceCharge = Math.round(subtotal * 0.1);
  const finalTotal = subtotal + serviceCharge;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (document.getElementById("cart-count"))
    document.getElementById("cart-count").innerText = totalItems;
  if (document.getElementById("cart-total"))
    document.getElementById("cart-total").innerText = `${finalTotal} ₸`;

  let html = cart
    .map(
      (item, index) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">${item.price} ₸</span>
      </div>
      <div class="cart-controls">
        <button class="qty-btn" onclick="changeQuantity(${index}, -1)">–</button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
      </div>
    </div>
  `,
    )
    .join("");

  html += `
    <div class="cart-summary-details">
      <div class="summary-line"><span>${langData.total}</span><span>${subtotal} ₸</span></div>
      <div class="summary-line service-fee"><span>${langData.service}</span><span>${serviceCharge} ₸</span></div>
      <div class="summary-line grand-total"><span>${langData.totalWithService}</span><span>${finalTotal} ₸</span></div>
    </div>
  `;
  itemsList.innerHTML = html;
}

// --- ДИНАМИЧЕСКОЕ МЕНЮ ---

async function initDynamicMenu() {
  if (menuAbortController) menuAbortController.abort();
  menuAbortController = new AbortController();
  const signal = menuAbortController.signal;

  const nav = document.getElementById("dynamic-nav");
  const container = document.getElementById("menu-container");
  if (!nav || !container) return;

  // Чистим перед рендером, чтобы не было дублей
  nav.innerHTML = "";
  container.innerHTML = "";

  try {
    const catSnapshot = await getDocs(
      collection(db, "restaurants", "lumiere", "categories"),
    );
    if (signal.aborted) return;

    for (const catDoc of catSnapshot.docs) {
      if (signal.aborted) return;
      const cat = catDoc.data();
      const id = catDoc.id;
      const name =
        typeof cat.name === "object"
          ? cat.name[currentLang] || cat.name["ru"]
          : cat.name;
      const ruName = typeof cat.name === "object" ? cat.name["ru"] : cat.name;

      const link = document.createElement("a");
      link.href = `#${id}`;
      link.textContent = name;
      nav.appendChild(link);

      const section = document.createElement("section");
      section.id = id;
      section.className = "menu-category show";
      section.innerHTML = `<h2 class="category-title">${name}</h2><div class="dishes" id="list-${id}"></div>`;
      container.appendChild(section);

      await renderDishes(ruName, `list-${id}`, signal);
    }
  } catch (e) {
    if (e.name !== "AbortError") console.error("Menu Error:", e);
  }
}

async function renderDishes(categoryRuName, listId, signal) {
  const listContainer = document.getElementById(listId);
  if (!listContainer) return;

  const q = query(
    collection(db, "restaurants", "lumiere", "dishes"),
    where("category", "==", categoryRuName),
  );

  const querySnapshot = await getDocs(q);
  if (signal?.aborted) return;

  listContainer.innerHTML = "";

  querySnapshot.forEach((doc, index) => {
    if (signal?.aborted) return;
    const d = doc.data();
    const dName =
      typeof d.name === "object" ? d.name[currentLang] || d.name["ru"] : d.name;
    const dDesc =
      typeof d.description === "object"
        ? d.description[currentLang] || d.description["ru"]
        : d.description;

    const el = document.createElement("div");
    el.className = "dish";
    el.innerHTML = `
      <div class="img-container">
        <div id="skel-${doc.id}" class="image-loading-skeleton"></div>
        <img src="${d.img || "assets/images/placeholder.jpg"}" class="dish-img hidden-load" onload="this.previousElementSibling.remove(); this.classList.add('loaded'); this.classList.remove('hidden-load');">
      </div>
      <div class="dish-info">
        <h3 class="dish-name">${dName}</h3>
        <p class="dish-desc">${dDesc}</p>
        <span class="dish-price">${d.price || 0} ₸</span>
      </div>
      <button class="add-btn" onclick="addToCart('${dName.replace(/'/g, "\\'")}', ${d.price || 0}, event)">+</button>
    `;
    listContainer.appendChild(el);
    setTimeout(() => {
      if (!signal.aborted) el.classList.add("show");
    }, index * 60);
  });
}

function applyTranslations() {
  const data = translations[currentLang];
  if (!data) return;

  const mapping = {
    "[data-i18n='subtitle']": data.subtitle,
    "[data-i18n='footer.address']": data.footer.address,
    "[data-i18n='footer.copy']": data.footer.copy,
    "[data-i18n='cart.view']": data.cartView,
    "[data-i18n='cart.title']": data.cartTitle,
  };
  for (let s in mapping) {
    const el = document.querySelector(s);
    if (el) el.textContent = mapping[s];
  }
}

// --- ИНИЦИАЛИЗАЦИЯ ЯЗЫКОВЫХ КНОПОК ---

function updateLangButtonsUI() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
}

// --- ИНИЦИАЛИЗАЦИЯ ---

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("lang-btn")) {
    const selected = e.target.dataset.lang;

    // Если язык тот же и окно уже было - игнорим
    if (selected === currentLang && sessionStorage.getItem("welcomeShown"))
      return;

    currentLang = selected;
    localStorage.setItem("selectedLanguage", currentLang);

    applyTranslations();
    updateCartUI();
    initDynamicMenu();
    updateLangButtonsUI();

    const overlay = document.getElementById("welcomeOverlay");
    if (overlay) overlay.style.display = "none";
    sessionStorage.setItem("welcomeShown", "true");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Скрываем приветствие, если уже заходили
  if (sessionStorage.getItem("welcomeShown") === "true") {
    const overlay = document.getElementById("welcomeOverlay");
    if (overlay) overlay.style.display = "none";
  }

  // Применяем визуальное состояние кнопок языка
  updateLangButtonsUI();

  applyTranslations();
  initDynamicMenu();
  updateCartUI();

  const cartNav = document.getElementById("cart-nav");
  if (cartNav) cartNav.onclick = window.toggleCart;
});
