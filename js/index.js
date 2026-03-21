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

// --- ФУНКЦИИ КОРЗИНЫ ---

window.toggleCart = function () {
  const modal = document.getElementById("cart-modal");
  if (modal) {
    const isVisible = modal.style.display === "block";
    modal.style.display = isVisible ? "none" : "block";
    document.body.style.overflow = isVisible ? "" : "hidden";
  }
};

window.addToCart = function (name, price) {
  const existingItem = cart.find((item) => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  updateCartUI();
  const cartNav = document.getElementById("cart-nav");
  if (cartNav) cartNav.classList.remove("hidden");
};

window.changeQuantity = function (index, delta) {
  if (!cart[index]) return;
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  updateCartUI();
};

function updateCartUI() {
  const langData = translations[currentLang];
  const itemsList = document.getElementById("cart-items-list");
  if (!itemsList) return;

  if (cart.length === 0) {
    itemsList.innerHTML = `<p style="text-align:center; padding:20px; color:#888;">Корзина пуста / Empty</p>`;
    document.getElementById("cart-nav")?.classList.add("hidden");
    const modal = document.getElementById("cart-modal");
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "";
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
  const instructionEl = document.querySelector(".cart-instruction");
  if (instructionEl) instructionEl.textContent = langData.instruction;
}

// --- ЛОГИКА МЕНЮ ---

async function initDynamicMenu() {
  const nav = document.getElementById("dynamic-nav");
  const container = document.getElementById("menu-container");
  if (!nav || !container) return;

  nav.innerHTML = "";
  container.innerHTML = "";

  try {
    const catSnapshot = await getDocs(
      collection(db, "restaurants", "lumiere", "categories"),
    );

    // Используем for...of для последовательной загрузки, чтобы избежать багов с порядком
    for (const catDoc of catSnapshot.docs) {
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

      await renderDishes(ruName, `list-${id}`);
    }
  } catch (e) {
    console.error("Firebase Error:", e);
  }
}

async function renderDishes(categoryRuName, listId) {
  const listContainer = document.getElementById(listId);
  if (!listContainer) return;

  listContainer.innerHTML = ""; // ОЧИЩАЕМ перед рендером, чтобы не было дублей

  const q = query(
    collection(db, "restaurants", "lumiere", "dishes"),
    where("category", "==", categoryRuName),
  );
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc, index) => {
    const d = doc.data();
    const dName =
      typeof d.name === "object" ? d.name[currentLang] || d.name["ru"] : d.name;
    const dDesc =
      typeof d.description === "object"
        ? d.description[currentLang] || d.description["ru"]
        : d.description;
    const dPrice = d.price || 0;
    const skeletonId = `skel-${doc.id}`;

    const el = document.createElement("div");
    el.className = "dish";
    el.innerHTML = `
      <div class="img-container">
        <div id="${skeletonId}" class="image-loading-skeleton"></div>
        <img src="${d.img || "assets/images/placeholder.jpg"}" 
             alt="${dName}" 
             class="dish-img hidden-load"
             onload="const skel=document.getElementById('${skeletonId}'); if(skel) skel.remove(); this.classList.add('loaded'); this.classList.remove('hidden-load');">
      </div>
      <div class="dish-info">
        <h3 class="dish-name">${dName}</h3>
        <p class="dish-desc">${dDesc}</p>
        <span class="dish-price">${dPrice} ₸</span>
      </div>
      <button class="add-btn" onclick="addToCart('${dName.replace(/'/g, "\\'")}', ${dPrice})">+</button>
    `;
    listContainer.appendChild(el);
    setTimeout(() => el.classList.add("visible", "show"), index * 100);
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
    ".cart-instruction": data.instruction,
  };
  for (let selector in mapping) {
    const el = document.querySelector(selector);
    if (el) el.textContent = mapping[selector];
  }
}

// --- СОБЫТИЯ ---

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("lang-btn")) {
    currentLang = e.target.dataset.lang;
    localStorage.setItem("selectedLanguage", currentLang);
    applyTranslations();
    updateCartUI();
    initDynamicMenu(); // Перерисовываем меню на новом языке

    document
      .querySelectorAll(".lang-btn")
      .forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.lang === currentLang),
      );

    const overlay = document.getElementById("welcomeOverlay");
    if (overlay) overlay.style.display = "none";
    sessionStorage.setItem("welcomeShown", "true");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("welcomeShown") === "true") {
    const overlay = document.getElementById("welcomeOverlay");
    if (overlay) overlay.style.display = "none";
  }
  applyTranslations();
  initDynamicMenu();
  updateCartUI();
  const cartNav = document.getElementById("cart-nav");
  if (cartNav) cartNav.onclick = window.toggleCart;
});
