import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUIQqsfAiDxYBExYGXW828-6DFDprNfnQ",
  authDomain: "menu-template-5b0eb.firebaseapp.com",
  projectId: "menu-template-5b0eb",
  storageBucket: "menu-template-5b0eb.firebasestorage.app",
  messagingSenderId: "371601105943",
  appId: "1:371601105943:web:daa1114eea08ee8ecc6852",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentFilter = "all";

// --- ПРОВЕРКА АВТОРИЗАЦИИ ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.body.classList.add("auth-success");
    loadAdminMenu();
    loadCategoriesToSelect();
    loadAdminCategories();
  } else {
    window.location.href = "auth.html";
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => (window.location.href = "auth.html"));
});

// --- ДОБАВЛЕНИЕ БЛЮДА ---
document
  .getElementById("addDishForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = document.getElementById("dishImgFile").files[0];
    if (!file) return alert("Выберите файл!");

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Публикация...';

      const storageRef = ref(storage, "dishes/" + Date.now() + "_" + file.name);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "restaurants", "lumiere", "dishes"), {
        name: {
          ru: document.getElementById("dishNameRu").value.trim(),
          en: document.getElementById("dishNameEn").value.trim(),
          kz: document.getElementById("dishNameKz").value.trim(),
        },
        description: {
          ru: document.getElementById("dishDescRu").value.trim(),
          en: document.getElementById("dishDescEn").value.trim(),
          kz: document.getElementById("dishDescKz").value.trim(),
        },
        price: Number(document.getElementById("dishPrice").value),
        img: downloadURL,
        category: document.getElementById("dishCategory").value,
        createdAt: new Date(),
      });

      alert("Блюдо успешно добавлено!");
      e.target.reset();
      document.getElementById("previewContainer").classList.remove("show");
      loadAdminMenu();
    } catch (error) {
      console.error(error);
      alert("Ошибка при добавлении");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

// --- РЕДАКТИРОВАНИЕ БЛЮДА (ОБНОВЛЕННО) ---
document
  .getElementById("editDishForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector(".btn-save-changes");
    const originalText = submitBtn.innerHTML;
    const id = document.getElementById("editDishId").value;
    const docRef = doc(db, "restaurants", "lumiere", "dishes", id);

    try {
      // Включаем анимацию загрузки
      submitBtn.disabled = true;
      submitBtn.classList.add("loading");
      submitBtn.innerHTML = '<span class="spinner"></span> Сохранение...';

      await updateDoc(docRef, {
        "name.ru": document.getElementById("editNameRu").value.trim(),
        "name.en": document.getElementById("editNameEn").value.trim(),
        "name.kz": document.getElementById("editNameKz").value.trim(),
        "description.ru": document.getElementById("editDescRu").value.trim(),
        "description.en": document.getElementById("editDescEn").value.trim(),
        "description.kz": document.getElementById("editDescKz").value.trim(),
        price: Number(document.getElementById("editPrice").value),
        category: document.getElementById("editCategory").value,
      });

      // Успешно сохранено
      document.getElementById("editModal").style.display = "none";
      loadAdminMenu();
    } catch (err) {
      console.error("Ошибка обновления:", err);
      alert("Не удалось сохранить изменения.");
    } finally {
      // Возвращаем кнопку в исходное состояние
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
      submitBtn.innerHTML = originalText;
    }
  });

// --- ЗАГРУЗКА КАТЕГОРИЙ В SELECT ---
async function loadCategoriesToSelect() {
  const selects = [
    document.getElementById("dishCategory"),
    document.getElementById("editCategory"),
  ];
  const q = query(
    collection(db, "restaurants", "lumiere", "categories"),
    orderBy("createdAt", "asc"),
  );
  const querySnapshot = await getDocs(q);

  selects.forEach((select) => {
    if (!select) return;
    select.innerHTML =
      '<option value="" disabled selected>Выберите категорию</option>';
    querySnapshot.forEach((docSnap) => {
      const catRu = docSnap.data().name.ru;
      const option = document.createElement("option");
      option.value = catRu;
      option.textContent = catRu;
      select.appendChild(option);
    });
  });
}

// --- ОСНОВНАЯ ФУНКЦИЯ: ТЕКУЩЕЕ МЕНЮ ---
async function loadAdminMenu() {
  const listContainer = document.getElementById("adminDishList");
  const filterContainer = document.getElementById("dynamicFilters");
  if (!listContainer) return;

  try {
    const q = query(
      collection(db, "restaurants", "lumiere", "dishes"),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);
    const groupedDishes = {};

    querySnapshot.forEach((docSnap) => {
      const dish = docSnap.data();
      const cat = dish.category || "Без категории";
      if (!groupedDishes[cat]) groupedDishes[cat] = [];
      groupedDishes[cat].push({ id: docSnap.id, ...dish });
    });

    if (filterContainer) {
      filterContainer.innerHTML = "";
      Object.keys(groupedDishes).forEach((catName) => {
        const btn = document.createElement("button");
        btn.textContent = catName;
        btn.className = `filter-btn ${currentFilter === catName ? "active" : ""}`;
        btn.onclick = () => {
          currentFilter = catName;
          loadAdminMenu();
        };
        filterContainer.appendChild(btn);
      });

      const allBtn = document.querySelector('[data-category="all"]');
      if (allBtn) {
        allBtn.classList.toggle("active", currentFilter === "all");
        allBtn.onclick = () => {
          currentFilter = "all";
          loadAdminMenu();
        };
      }
    }

    listContainer.innerHTML = "";
    for (const [categoryName, dishes] of Object.entries(groupedDishes)) {
      if (currentFilter !== "all" && currentFilter !== categoryName) continue;

      const categorySection = document.createElement("div");
      categorySection.className = "admin-menu-section";
      categorySection.innerHTML = `<h3 class="category-header">${categoryName}</h3>`;

      dishes.forEach((dish) => {
        const item = document.createElement("div");
        item.className = "admin-dish-item";
        item.innerHTML = `
            <div class="dish-info-text">
                <span class="dish-name">${dish.name.ru}</span>
                <span class="dish-price">${dish.price} ₸</span>
            </div>
            <div class="dish-actions">
                <button onclick="openEditModal('${dish.id}')" class="btn-edit">Изменить</button>
                <button onclick="deleteDish('${dish.id}')" class="btn-delete">Удалить</button>
            </div>
        `;
        categorySection.appendChild(item);
      });
      listContainer.appendChild(categorySection);
    }
  } catch (e) {
    console.error(e);
  }
}

// --- МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ ---
window.openEditModal = async (id) => {
  const docRef = doc(db, "restaurants", "lumiere", "dishes", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("editDishId").value = id;
    document.getElementById("editNameRu").value = data.name.ru || "";
    document.getElementById("editNameEn").value = data.name.en || "";
    document.getElementById("editNameKz").value = data.name.kz || "";
    document.getElementById("editDescRu").value = data.description.ru || "";
    document.getElementById("editDescEn").value = data.description.en || "";
    document.getElementById("editDescKz").value = data.description.kz || "";
    document.getElementById("editPrice").value = data.price || "";
    document.getElementById("editCategory").value = data.category || "";

    document.getElementById("editModal").style.display = "block";
  }
};

document.getElementById("closeEditModal")?.addEventListener("click", () => {
  document.getElementById("editModal").style.display = "none";
});

window.onclick = (event) => {
  const modal = document.getElementById("editModal");
  if (event.target == modal) modal.style.display = "none";
};

// --- УПРАВЛЕНИЕ КАТЕГОРИЯМИ ---
document.getElementById("saveCatBtn")?.addEventListener("click", async () => {
  const nameRu = document.getElementById("newCatRu").value.trim();
  if (!nameRu) return;
  await addDoc(collection(db, "restaurants", "lumiere", "categories"), {
    name: {
      ru: nameRu,
      en: document.getElementById("newCatEn").value.trim(),
      kz: document.getElementById("newCatKz").value.trim(),
    },
    createdAt: new Date(),
  });
  loadAdminCategories();
  loadCategoriesToSelect();
});

async function loadAdminCategories() {
  const listContainer = document.getElementById("adminCategoryList");
  if (!listContainer) return;
  const q = query(
    collection(db, "restaurants", "lumiere", "categories"),
    orderBy("createdAt", "asc"),
  );
  const querySnapshot = await getDocs(q);
  listContainer.innerHTML = "";
  querySnapshot.forEach((docSnap) => {
    const item = document.createElement("div");
    item.className = "category-manage-item";
    item.innerHTML = `
        <strong>${docSnap.data().name.ru}</strong>
        <button onclick="deleteCategory('${docSnap.id}')" class="btn-delete-cat">Удалить</button>
    `;
    listContainer.appendChild(item);
  });
}

// --- УДАЛЕНИЕ ---
window.deleteDish = async (id) => {
  if (!confirm("Удалить блюдо?")) return;
  const dishRef = doc(db, "restaurants", "lumiere", "dishes", id);
  const dishSnap = await getDoc(dishRef);
  if (dishSnap.exists()) {
    const imageUrl = dishSnap.data().img;
    if (imageUrl?.includes("firebasestorage")) {
      await deleteObject(ref(storage, imageUrl)).catch(() => {});
    }
  }
  await deleteDoc(dishRef);
  loadAdminMenu();
};

window.deleteCategory = async (id) => {
  if (!confirm("Удалить категорию?")) return;
  await deleteDoc(doc(db, "restaurants", "lumiere", "categories", id));
  loadAdminCategories();
  loadCategoriesToSelect();
  loadAdminMenu();
};
