import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Твой конфиг (ОБЯЗАТЕЛЬНО СКОПИРУЙ СВОЙ ИЗ INDEX.JS)
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

// 2. Поиск элементов в твоем HTML
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const mainBtn = document.getElementById("mainAuthBtn");
const toggleLink = document.getElementById("toggle-link");
const authTitle = document.getElementById("auth-title");
const forgotBtn = document.getElementById("forgot-password");
const errorMsg = document.getElementById("error-message");

let isLoginMode = true; // По умолчанию мы в режиме "Вход"

// 3. Переключатель "Вход / Регистрация"
toggleLink.addEventListener("click", () => {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? "Вход в систему" : "Регистрация";
    mainBtn.textContent = isLoginMode ? "Войти" : "Создать аккаунт";
    toggleLink.textContent = isLoginMode ? "Зарегистрироваться" : "Уже есть аккаунт?";
    errorMsg.textContent = ""; // Чистим ошибки при переключении
});

// 4. Главная функция (Вход или Регистрация)
mainBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        errorMsg.textContent = "Заполните все поля!";
        return;
    }

    try {
        if (isLoginMode) {
            // ВХОД
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Вход выполнен успешно!");
        } else {
            // РЕГИСТРАЦИЯ
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("Аккаунт создан!");
        }
        // Если всё ок — перекидываем в админку
        window.location.href = "admin.html"; 
    } catch (error) {
        // Красивая обработка типичных ошибок
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMsg.textContent = "Эта почта уже занята.";
                break;
            case 'auth/weak-password':
                errorMsg.textContent = "Пароль должен быть минимум 6 символов.";
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMsg.textContent = "Неверная почта или пароль.";
                break;
            default:
                errorMsg.textContent = "Ошибка: " + error.message;
        }
    }
});

// 5. Функция "Забыли пароль"
forgotBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    if (!email) {
        errorMsg.textContent = "Сначала введите Email!";
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("Инструкция по сбросу пароля отправлена на почту.");
    } catch (error) {
        errorMsg.textContent = "Ошибка сброса: " + error.message;
    }
});