import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey:    "AIzaSyAFhwTMjDcFLvMqmaqvLi9i4grB6Q4NPwY",
  authDomain: "dashboard-maxime.firebaseapp.com",
  projectId: "dashboard-maxime",
  appId:     "1:922707066056:web:4b1a5107c16b7ddd56f9fd",
};

const ALLOWED_EMAIL = "contact@venatus-consulting.com"; // 

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

export function checkAuth(onSuccess) {
  onAuthStateChanged(auth, (user) => {
    if (user && user.email === ALLOWED_EMAIL) {
      document.getElementById("auth-screen")?.remove();
      onSuccess();
    } else if (user) {
      signOut(auth);
      showAuthScreen("❌ Accès refusé. Ce compte n'est pas autorisé.");
    } else {
      showAuthScreen();
    }
  });
}

export function showAuthScreen(error = "") {
  let screen = document.getElementById("auth-screen");
  if (!screen) {
    screen = document.createElement("div");
    screen.id = "auth-screen";
    document.body.appendChild(screen);
  }
  screen.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-logo">💎</div>
        <div class="auth-title">Venatus CRM</div>
        <div class="auth-sub">Connexion requise</div>
        ${error ? `<div class="auth-error">${error}</div>` : ""}
        <button class="auth-btn" id="google-signin">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Se connecter avec Google
        </button>
      </div>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #auth-screen {
      position: fixed; inset: 0; z-index: 9999;
      background: #080810;
      display: flex; align-items: center; justify-content: center;
    }
    .auth-wrap { width: 100%; display: flex; align-items: center; justify-content: center; }
    .auth-card {
      background: #0d0d1a;
      border: 1px solid #2a2a45;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      width: 340px;
    }
    .auth-logo  { font-size: 40px; margin-bottom: 12px; }
    .auth-title { font-size: 22px; font-weight: 700; color: #e0e0ff; margin-bottom: 6px; }
    .auth-sub   { font-size: 14px; color: #555; margin-bottom: 24px; }
    .auth-error {
      background: rgba(239,83,80,0.1);
      border: 1px solid rgba(239,83,80,0.3);
      border-radius: 8px;
      padding: 10px;
      color: #ef5350;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .auth-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 12px;
      background: white; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; color: #333;
      cursor: pointer; transition: opacity 0.2s;
    }
    .auth-btn:hover { opacity: 0.9; }
  `;
  document.head.appendChild(style);

  document.getElementById("google-signin").addEventListener("click", () => {
    signInWithPopup(auth, provider).catch(err => {
      showAuthScreen("❌ Erreur de connexion : " + err.message);
    });
  });
}

export function addSignOutButton() {
  const btn = document.createElement("button");
  btn.textContent = "Déconnexion";
  btn.style.cssText = `
    position: fixed; bottom: 16px; left: 16px;
    background: #1a1a2e; border: 1px solid #2a2a45;
    border-radius: 8px; padding: 8px 14px;
    color: #555; font-size: 12px; cursor: pointer;
    transition: all 0.2s; z-index: 100;
  `;
  btn.onmouseover = () => btn.style.color = "#e0e0ff";
  btn.onmouseout  = () => btn.style.color = "#555";
  btn.onclick     = () => signOut(auth).then(() => location.reload());
  document.body.appendChild(btn);
}
