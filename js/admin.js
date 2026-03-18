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
  measurementId: "G-HPZ4L6058G",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const addForm = document.getElementById("addDishForm");

// --- 1. ПРЕДПРОСМОТР ФОТО ---
document.getElementById("dishImgFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const previewContainer = document.getElementById("previewContainer");
  const previewImg = document.getElementById("imgPreview");

  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      previewImg.src = event.target.result;
      previewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    previewContainer.style.display = "none";
  }
});

// --- 2. ЗАЩИТА И ЗАГРУЗКА ДАННЫХ ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.body.style.display = "block";
    loadAdminMenu();
    loadCategoriesToSelect();
    loadAdminCategories();
  } else {
    window.location.href = "auth.html";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => (window.location.href = "auth.html"));
});

// --- 3. ДОБАВЛЕНИЕ БЛЮДА ---
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("dishImgFile").files[0];
  if (!file) return alert("Выберите файл!");

  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Загрузка...";

    const storageRef = ref(storage, "dishes/" + Date.now() + "_" + file.name);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    const newDish = {
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
      category: document.getElementById("dishCategory").value, // Тут будет RU строка
      createdAt: new Date(),
    };

    await addDoc(collection(db, "restaurants", "lumiere", "dishes"), newDish);
    alert("Блюдо успешно добавлено!");
    addForm.reset();
    document.getElementById("previewContainer").style.display = "none";
    loadAdminMenu();
  } catch (error) {
    console.error("Ошибка:", error);
    alert("Ошибка при сохранении.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Опубликовать в меню";
  }
});

// --- 4. ЗАГРУЗКА КАТЕГОРИЙ В SELECT ---
async function loadCategoriesToSelect() {
  const select = document.getElementById("dishCategory");
  if (!select) return;

  try {
    // Сортируем по дате создания, чтобы порядок был логичным
    const q = query(
      collection(db, "restaurants", "lumiere", "categories"),
      orderBy("createdAt", "asc"),
    );
    const querySnapshot = await getDocs(q);

    select.innerHTML =
      '<option value="" disabled selected>Выберите категорию</option>';

    querySnapshot.forEach((docSnap) => {
      const categoryData = docSnap.data();
      // Извлекаем RU название. Если в базе Map, берем .ru, если строка - саму строку.
      const catRu =
        typeof categoryData.name === "object"
          ? categoryData.name.ru
          : categoryData.name;

      const option = document.createElement("option");
      option.value = catRu; // Сохраняем строку RU как ключ связи
      option.textContent = catRu;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Ошибка загрузки категорий в select:", error);
  }
}

// --- 5. СПИСОК БЛЮД И УДАЛЕНИЕ ---
async function loadAdminMenu() {
  const listContainer = document.getElementById("adminDishList");
  if (!listContainer) return;
  listContainer.innerHTML = "Загрузка...";

  try {
    const q = query(
      collection(db, "restaurants", "lumiere", "dishes"),
      orderBy("createdAt", "desc"),
    );
    const querySnapshot = await getDocs(q);
    listContainer.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const dish = docSnap.data();
      const id = docSnap.id;
      const dishName = typeof dish.name === "object" ? dish.name.ru : dish.name;

      const item = document.createElement("div");
      item.className = "admin-dish-item";
      item.innerHTML = `
        <span>${dishName} (${dish.price}₸)</span>
        <button onclick="deleteDish('${id}')" class="delete-btn">Удалить</button>
      `;
      listContainer.appendChild(item);
    });
  } catch (e) {
    listContainer.innerHTML = "Ошибка загрузки списка блюд.";
  }
}

window.deleteDish = async (id) => {
  if (!confirm("Удалить это блюдо?")) return;
  try {
    const dishRef = doc(db, "restaurants", "lumiere", "dishes", id);
    const dishSnap = await getDoc(dishRef);
    if (dishSnap.exists()) {
      const imageUrl = dishSnap.data().img;
      if (imageUrl && imageUrl.includes("firebasestorage")) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef).catch(() =>
          console.log("Файл не найден в Storage"),
        );
      }
    }
    await deleteDoc(dishRef);
    loadAdminMenu();
  } catch (error) {
    console.error(error);
  }
};

// --- 6. ДОБАВЛЕНИЕ КАТЕГОРИИ ---
document.getElementById("saveCatBtn").addEventListener("click", async () => {
  const nameRu = document.getElementById("newCatRu").value.trim();
  const nameEn = document.getElementById("newCatEn").value.trim();
  const nameKz = document.getElementById("newCatKz").value.trim();

  if (!nameRu || !nameEn || !nameKz) return alert("Заполните все языки!");

  try {
    await addDoc(collection(db, "restaurants", "lumiere", "categories"), {
      name: { ru: nameRu, en: nameEn, kz: nameKz },
      createdAt: new Date(),
    });

    alert("Категория добавлена!");
    document.getElementById("newCatRu").value = "";
    document.getElementById("newCatEn").value = "";
    document.getElementById("newCatKz").value = "";

    loadAdminCategories();
    loadCategoriesToSelect();
  } catch (e) {
    console.error(e);
  }
});

// --- 7. СПИСОК КАТЕГОРИЙ И УДАЛЕНИЕ ---
async function loadAdminCategories() {
  const listContainer = document.getElementById("adminCategoryList");
  if (!listContainer) return;

  try {
    const q = query(
      collection(db, "restaurants", "lumiere", "categories"),
      orderBy("createdAt", "asc"),
    );
    const querySnapshot = await getDocs(q);
    listContainer.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const cat = docSnap.data();
      const id = docSnap.id;
      const catName = typeof cat.name === "object" ? cat.name.ru : cat.name;

      const item = document.createElement("div");
      item.className = "admin-cat-item";
      item.style =
        "display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; align-items: center;";
      item.innerHTML = `
        <strong>${catName}</strong>
        <button onclick="deleteCategory('${id}')" style="color: white; background: #ff4d4d; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Удалить</button>
      `;
      listContainer.appendChild(item);
    });
  } catch (e) {
    console.error(e);
  }
}

window.deleteCategory = async (id) => {
  if (
    !confirm("Удалить категорию? Блюда останутся, но могут скрыться из меню.")
  )
    return;
  try {
    await deleteDoc(doc(db, "restaurants", "lumiere", "categories", id));
    loadAdminCategories();
    loadCategoriesToSelect();
  } catch (e) {
    console.error(e);
  }
};
