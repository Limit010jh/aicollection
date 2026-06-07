/**
 * OmniChat AI - Active Application Engine
 * Premium JS logic handling OAuth simulation, n8n webhook API transactions,
 * rich Markdown rendering, dynamic styling, and localStorage database state.
 */

// ==========================================
// Application State
// ==========================================
const state = {
    user: null,          // { name, email, avatar, provider }
    settings: {
        themeMode: 'dark',
        n8nUrl: 'https://limit22274.app.n8n.cloud/webhook/9b0d7602-dd81-44eb-90aa-da2f91a47734',
        n8nAuthHeader: '',
        googleClientId: ''
    },
    activeChatId: null,
    chats: [],           // Array of { id, title, model, timestamp, messages: [{role, content}] }
    currentModel: 'gpt', // 'gpt' | 'gemini' | 'claude'
    isGenerating: false,
    sidebarActive: false
};

let attachedImageBase64 = null; // This variable will temporarily store the image code

// Mock Profiles for quick/demo login
const DEFAULT_USERS = [
    { email: 'alex.mercer@gmail.com', password: 'password123', name: 'Alex Mercer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80' },
    { email: 'sarah.connor@cyberdyne.io', password: 'password123', name: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
    { email: 'wopr@norad.mil', password: 'password123', name: 'David Lightman', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80' }
];

let authMode = 'signin'; // 'signin' | 'signup'

// Fallback Mock Responses for each AI Brand
const MOCK_RESPONSES = {
    gpt: [
        "**Hello! I am ChatGPT.** I see you haven't connected a live n8n webhook URL yet. To enable dynamic API completions, click **Settings & API** in the sidebar. \n\nHere is a quick code template demonstrating how you can route webhooks in n8n:\n\n```javascript\n// n8n Webhook Response Node Example\nreturn {\n  body: {\n    output: \"Hello! I received your message: \" + $json.message,\n    model: $json.model,\n    chatId: $json.chatId\n  }\n};\n```",
        "Here are three recommendations to optimize web application assets:\n1. **Use Next-Gen Formats**: Convert images to WebP/AVIF.\n2. **Code Splitting**: Utilize dynamic imports in framework bundlers.\n3. **Caching Policies**: Define robust Cache-Control headers on CDN nodes.",
        "To debug a memory leak in Node.js, follow this sequence:\n- Generate a heap snapshot using `--inspect` flags.\n- Compare snapshots in Chrome DevTools to find growing instances.\n- Look for unclosed event listeners or global scope variables."
    ],
    gemini: [
        "Welcome! I am **Gemini**, Google's multimodal model. 🌟 It looks like we are running in local demo mode. Connect me to an **n8n Webhook** in settings, and we can trigger database updates, Gmail automation, or custom API lookups.\n\nLet's write a simple SVG loader element:\n\n```xml\n<svg width=\"38\" height=\"38\" viewBox=\"0 0 38 38\" stroke=\"#4285f4\">\n    <g fill=\"none\" fill-rule=\"evenodd\">\n        <circle cx=\"19\" cy=\"19\" r=\"18\" stroke-opacity=\".2\" stroke-width=\"2\"/>\n        <path d=\"M36 18c0-9.94-8.06-18-18-18\">\n            <animateTransform attributeName=\"transform\" type=\"rotate\" from=\"0 19 19\" to=\"360 19 19\" dur=\"1s\" repeatCount=\"indefinite\"/>\n        </path>\n    </g>\n</svg>\n```",
        "Exploring machine learning? The three major styles are:\n* **Supervised Learning**: Model trains on labeled datasets.\n* **Unsupervised Learning**: Clustering patterns without initial labels.\n* **Reinforcement Learning**: Agent learns via action rewards in environments."
    ],
    claude: [
        "Greetings. I am **Claude** by Anthropic. I am designed to offer helpful, harmless, and honest analytical support. Currently, I am operating on the local fallback engine because no n8n integration has been configured. \n\nHere is an analysis of REST vs GraphQL query paradigms:\n\n| Attribute | REST API | GraphQL |\n| :--- | :--- | :--- |\n| **Data Fetching** | Over-fetching common (fixed endpoints) | Precise query shape defined by client |\n| **Network Overhead** | Multiple round-trips for nested relations | Single query returns deep nested models |\n| **Type Safety** | Requires external schemas (OpenAPI) | Built-in strongly typed schema system |\n| **Caching** | Excellent (leveraging native HTTP caches) | Complex (queries typically use POST requests) |",
        "Regarding software clean architecture, always structure your code around the **Dependency Rule**: source code dependencies should only point inwards towards high-level policies (core entities/use cases), isolating external frameworks."
    ],
    vision: [
        "Please select and upload an image using the attachment button (paperclip) or select 'إرسال الصور' tab to choose a file. Once attached, your image will be sent in base64 format to your configured n8n webhook!",
        "I am ready to process your images. Make sure to attach an image before sending. The payload will include the image data under the `image` field.",
        "Vision Mode Activated: You can now send images to your n8n workflow for optical character recognition (OCR), object detection, or visual content analysis."
    ]
};

// ==========================================
// Initializations & DOM Event Bindings
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    loadUserSession();
    initTheme();
    initGoogleAuth();
    
    // Bind General UI Events
    bindUIEvents();
    
    // Check if user session already existed
    if (state.user) {
        showApp();
    } else {
        showAuth();
    }
});

// ==========================================
// Authentication Logic
// ==========================================
function loadUserSession() {
    try {
        const storedUser = localStorage.getItem('omnichat_user');
        if (storedUser) {
            state.user = JSON.parse(storedUser);
        }
    } catch (e) {
        console.error("Failed to load user session", e);
    }
}

// ==========================================
// Google Authentication
// ==========================================
function initGoogleAuth() {
    const clientId = state.settings.googleClientId;
    const signinDiv = document.getElementById("google-signin-div");
    const mockBtn = document.getElementById("btn-google-mock");
    if (!signinDiv || !mockBtn) return;

    if (clientId && window.google) {
        mockBtn.style.display = "none";
        signinDiv.style.display = "block";
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleLoginCallback
            });
            google.accounts.id.renderButton(signinDiv, {
                theme: "outline", size: "large", width: "100%"
            });
        } catch (err) {
            console.error("Google SDK init failed:", err);
            signinDiv.style.display = "none";
            mockBtn.style.display = "flex";
        }
    } else {
        signinDiv.style.display = "none";
        mockBtn.style.display = "flex";
    }
}

function handleGoogleLoginCallback(response) {
    try {
        const payload = decodeJwt(response.credential);
        state.user = {
            name: payload.name || "Google User",
            email: payload.email,
            avatar: payload.picture || "",
            provider: 'google'
        };
        localStorage.setItem('omnichat_user', JSON.stringify(state.user));
        showToast(`Welcome, ${state.user.name}!`, "success");
        showApp();
    } catch (e) {
        console.error("Google credential decode failed", e);
        showToast("Google Sign-In failed. Try again or use Demo mode.", "error");
    }
}

function decodeJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        window.atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
    );
    return JSON.parse(jsonPayload);
}

function triggerSimulatedGoogleLogin() {
    // Show a brief loading overlay then log in a simulated Google user
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position:fixed;inset:0;z-index:9999;
        background:rgba(0,0,0,0.55);
        backdrop-filter:blur(6px);
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        gap:1rem;
    `;
    overlay.innerHTML = `
        <div style="
            background:#fff;border-radius:16px;padding:2rem 2.5rem;
            display:flex;flex-direction:column;align-items:center;gap:1rem;
            box-shadow:0 24px 48px rgba(0,0,0,0.3);
        ">
            <svg viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <p style="margin:0;font-family:system-ui,sans-serif;font-size:0.95rem;color:#3c4043;font-weight:600;">Connecting to Google...</p>
            <div style="
                width:36px;height:36px;border-radius:50%;
                border:3px solid #e8eaed;border-top-color:#4285F4;
                animation:g-spin 0.8s linear infinite;
            "></div>
        </div>
        <style>@keyframes g-spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
        document.body.removeChild(overlay);
        state.user = {
            name: "Google User",
            email: "google.user@gmail.com",
            avatar: "https://lh3.googleusercontent.com/a/default-user=s100",
            provider: 'google-sim'
        };
        localStorage.setItem('omnichat_user', JSON.stringify(state.user));
        showToast(`Signed in as ${state.user.name}`, "success");
        showApp();
    }, 1600);
}

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById("auth-email");
    const passwordInput = document.getElementById("auth-password");
    const nameInput = document.getElementById("auth-name");
    
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const name = nameInput.value.trim();
    
    if (!email || !password) {
        showToast("Please fill in all required fields.", "error");
        return;
    }
    
    // Load registered users from localStorage
    let registeredUsers = [];
    try {
        const stored = localStorage.getItem('omnichat_registered_users');
        if (stored) {
            registeredUsers = JSON.parse(stored);
        }
    } catch (err) {
        console.error("Failed to load registered users", err);
    }
    
    if (authMode === 'signup') {
        if (!name) {
            showToast("Please enter your name.", "error");
            return;
        }
        
        // Check if user already exists
        const userExistsDefault = DEFAULT_USERS.some(u => u.email === email);
        const userExistsRegistered = registeredUsers.some(u => u.email === email);
        
        if (userExistsDefault || userExistsRegistered) {
            showToast("Email address is already registered.", "warning");
            return;
        }
        
        // Add new user
        const newUser = {
            email: email,
            password: password,
            name: name,
            avatar: ''
        };
        
        registeredUsers.push(newUser);
        localStorage.setItem('omnichat_registered_users', JSON.stringify(registeredUsers));
        
        // Log in the new user
        state.user = {
            name: newUser.name,
            email: newUser.email,
            avatar: newUser.avatar,
            provider: 'email'
        };
        
        localStorage.setItem('omnichat_user', JSON.stringify(state.user));
        showToast(`Account created! Welcome, ${state.user.name}`, "success");
        showApp();
        
        // Reset form
        emailInput.value = "";
        passwordInput.value = "";
        nameInput.value = "";
    } else {
        // Sign In mode
        // Look up user in defaults
        let user = DEFAULT_USERS.find(u => u.email === email);
        
        // Look up in registered users
        if (!user) {
            user = registeredUsers.find(u => u.email === email);
        }
        
        if (!user || user.password !== password) {
            showToast("Invalid email or password.", "error");
            return;
        }
        
        // Log in
        state.user = {
            name: user.name,
            email: user.email,
            avatar: user.avatar || "",
            provider: 'email'
        };
        
        localStorage.setItem('omnichat_user', JSON.stringify(state.user));
        showToast(`Welcome back, ${state.user.name}!`, "success");
        showApp();
        
        // Reset form
        emailInput.value = "";
        passwordInput.value = "";
    }
}

function toggleAuthMode() {
    const nameGroup = document.getElementById("group-name");
    const nameInput = document.getElementById("auth-name");
    const submitBtn = document.getElementById("btn-auth-submit");
    const toggleText = document.getElementById("form-toggle-text");
    const toggleBtn = document.getElementById("btn-form-toggle");
    
    if (authMode === 'signin') {
        authMode = 'signup';
        nameGroup.style.display = "flex";
        nameInput.required = true;
        submitBtn.querySelector("span").textContent = "Create Account";
        toggleText.textContent = "Already have an account?";
        toggleBtn.textContent = "Sign In";
    } else {
        authMode = 'signin';
        nameGroup.style.display = "none";
        nameInput.required = false;
        submitBtn.querySelector("span").textContent = "Sign In";
        toggleText.textContent = "Don't have an account?";
        toggleBtn.textContent = "Create Account";
    }
}

function triggerDemoLogin() {
    state.user = {
        name: "Demo User",
        email: "demo@omnichat.ai",
        avatar: "",
        provider: "demo"
    };
    localStorage.setItem('omnichat_user', JSON.stringify(state.user));
    showToast("Entered in guest demo mode", "success");
    showApp();
}

function logout() {
    state.user = null;
    localStorage.removeItem('omnichat_user');
    
    // Transition UI
    const app = document.getElementById("app-container");
    const auth = document.getElementById("auth-container");
    
    app.classList.remove("active");
    setTimeout(() => {
        auth.classList.remove("hidden");
        showToast("Successfully logged out", "info");
    }, 300);
}

// ==========================================
// Page Navigation & Styling Toggles
// ==========================================
function showApp() {
    const auth = document.getElementById("auth-container");
    const app = document.getElementById("app-container");
    
    auth.classList.add("hidden");
    app.classList.add("active");
    
    // Populate profile widget details
    const nameEl = document.getElementById("profile-name");
    const emailEl = document.getElementById("profile-email");
    const avatarImg = document.getElementById("profile-avatar");
    const avatarFallback = document.getElementById("profile-avatar-fallback");
    
    nameEl.textContent = state.user.name;
    emailEl.textContent = state.user.email;
    
    if (state.user.avatar) {
        avatarImg.src = state.user.avatar;
        avatarImg.style.display = "block";
        avatarFallback.style.display = "none";
    } else {
        avatarImg.style.display = "none";
        avatarFallback.style.display = "flex";
        avatarFallback.textContent = state.user.name.charAt(0).toUpperCase();
    }
    
    // Load conversations and rebuild sidebar
    loadChats();
    updateSidebarChats();
    resetChatView();
    updateN8nIndicator();
}

function showAuth() {
    const auth = document.getElementById("auth-container");
    const app = document.getElementById("app-container");
    auth.classList.remove("hidden");
    app.classList.remove("active");
}

function initTheme() {
    document.documentElement.setAttribute('data-theme', state.settings.themeMode);
    
    // Sync settings modal buttons
    const darkCard = document.getElementById("theme-card-dark");
    const lightCard = document.getElementById("theme-card-light");
    
    if (state.settings.themeMode === 'light') {
        darkCard.classList.remove("active");
        lightCard.classList.add("active");
        document.getElementById("btn-theme-toggle").innerHTML = `<i class="fa-solid fa-sun"></i>`;
    } else {
        darkCard.classList.add("active");
        lightCard.classList.remove("active");
        document.getElementById("btn-theme-toggle").innerHTML = `<i class="fa-solid fa-moon"></i>`;
    }
    
    // Apply initial model accent theme
    applyModelAccent();
}

function toggleThemeMode() {
    const newMode = state.settings.themeMode === 'dark' ? 'light' : 'dark';
    state.settings.themeMode = newMode;
    saveSettings();
    initTheme();
}

function changeModelTheme(modelName) {
    state.currentModel = modelName;
    
    // Switch active tabs
    const tabs = document.querySelectorAll(".model-tab");
    tabs.forEach(tab => {
        if (tab.getAttribute("data-model") === modelName) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });
    
    applyModelAccent();
    
    // Update input placeholder to match theme tone
    const input = document.getElementById("chat-input");
    if (modelName === 'gpt') {
        input.placeholder = "Ask ChatGPT anything...";
    } else if (modelName === 'gemini') {
        input.placeholder = "Supercharge your thinking with Gemini...";
    } else if (modelName === 'claude') {
        input.placeholder = "Discuss complex tasks with Claude...";
    } else if (modelName === 'vision') {
        input.placeholder = "Upload and send images for analysis...";
    }
}

function applyModelAccent() {
    const root = document.documentElement;
    if (state.currentModel === 'gpt') {
        root.style.setProperty('--accent-color', 'var(--gpt-accent)');
        root.style.setProperty('--accent-gradient', 'var(--gpt-gradient)');
        root.style.setProperty('--accent-glow', 'var(--gpt-glow)');
    } else if (state.currentModel === 'gemini') {
        root.style.setProperty('--accent-color', 'var(--gemini-accent)');
        root.style.setProperty('--accent-gradient', 'var(--gemini-gradient)');
        root.style.setProperty('--accent-glow', 'var(--gemini-glow)');
    } else if (state.currentModel === 'claude') {
        root.style.setProperty('--accent-color', 'var(--claude-accent)');
        root.style.setProperty('--accent-gradient', 'var(--claude-gradient)');
        root.style.setProperty('--accent-glow', 'var(--claude-glow)');
    } else if (state.currentModel === 'vision') {
        root.style.setProperty('--accent-color', 'var(--vision-accent)');
        root.style.setProperty('--accent-gradient', 'var(--vision-gradient)');
        root.style.setProperty('--accent-glow', 'var(--vision-glow)');
    }
}

// ==========================================
// settings Operations
// ==========================================
function loadSettings() {
    try {
        const storedSettings = localStorage.getItem('omnichat_settings');
        if (storedSettings) {
            state.settings = { ...state.settings, ...JSON.parse(storedSettings) };
        }
        // Fallback default url if empty in storage
        if (!state.settings.n8nUrl) {
            state.settings.n8nUrl = 'https://limit22274.app.n8n.cloud/webhook/9b0d7602-dd81-44eb-90aa-da2f91a47734';
        }
    } catch (e) {
        console.error("Failed to load settings from storage", e);
    }
}

function saveSettings() {
    localStorage.setItem('omnichat_settings', JSON.stringify(state.settings));
}

function openSettingsModal() {
    const modal = document.getElementById("settings-modal");
    
    // Bind inputs to state values
    document.getElementById("setting-n8n-url").value = state.settings.n8nUrl;
    document.getElementById("setting-auth-header").value = state.settings.n8nAuthHeader;
    document.getElementById("setting-google-client-id").value = state.settings.googleClientId || '';
    
    // Themes visual configuration
    const darkCard = document.getElementById("theme-card-dark");
    const lightCard = document.getElementById("theme-card-light");
    if (state.settings.themeMode === 'light') {
        darkCard.classList.remove("active");
        lightCard.classList.add("active");
    } else {
        darkCard.classList.add("active");
        lightCard.classList.remove("active");
    }
    
    modal.classList.add("active");
}

function closeSettingsModal() {
    const modal = document.getElementById("settings-modal");
    modal.classList.remove("active");
}

function saveSettingsFromModal() {
    const n8nUrlVal = document.getElementById("setting-n8n-url").value.trim();
    const authVal = document.getElementById("setting-auth-header").value.trim();
    const googleIdVal = document.getElementById("setting-google-client-id").value.trim();
    
    // Save to settings state
    state.settings.n8nUrl = n8nUrlVal;
    state.settings.n8nAuthHeader = authVal;
    
    const oldGoogleId = state.settings.googleClientId;
    state.settings.googleClientId = googleIdVal;
    
    saveSettings();
    closeSettingsModal();
    
    updateN8nIndicator();
    showToast("Settings saved successfully", "success");
    
    // Re-init Google button if Client ID changed
    if (oldGoogleId !== googleIdVal) {
        initGoogleAuth();
    }
}

function updateN8nIndicator() {
    const badge = document.getElementById("n8n-status-badge");
    const badgeText = document.getElementById("n8n-status-text");
    const footerWebhook = document.getElementById("footer-webhook-display");
    
    if (state.settings.n8nUrl) {
        badge.classList.remove("mock-mode");
        badgeText.textContent = "n8n Connected";
        
        // Truncate webhook display on footer
        try {
            const urlObj = new URL(state.settings.n8nUrl);
            footerWebhook.textContent = urlObj.hostname + (urlObj.pathname.length > 15 ? urlObj.pathname.substring(0, 15) + '...' : urlObj.pathname);
        } catch (e) {
            footerWebhook.textContent = "Live Webhook Set";
        }
    } else {
        badge.classList.add("mock-mode");
        badgeText.textContent = "Simulation Mode";
        footerWebhook.textContent = "Not Configured (Demo Mockup)";
    }
}

// ==========================================
// Local Database Chats Operations
// ==========================================
function loadChats() {
    try {
        const storedChats = localStorage.getItem('omnichat_chats');
        if (storedChats) {
            state.chats = JSON.parse(storedChats);
        } else {
            state.chats = [];
        }
    } catch (e) {
        console.error("Failed to load local conversations", e);
        state.chats = [];
    }
}

function saveChats() {
    localStorage.setItem('omnichat_chats', JSON.stringify(state.chats));
}

function createNewChatSession() {
    const newChat = {
        id: 'chat_' + Date.now(),
        title: 'New Conversation',
        model: state.currentModel,
        timestamp: Date.now(),
        messages: []
    };
    
    state.chats.unshift(newChat);
    saveChats();
    
    state.activeChatId = newChat.id;
    updateSidebarChats();
    loadActiveConversation();
    
    // Automatically close sidebar on mobile
    toggleMobileSidebar(false);
    
    // Focus input
    document.getElementById("chat-input").focus();
}

function deleteChatSession(chatId, event) {
    if (event) event.stopPropagation();
    
    state.chats = state.chats.filter(c => c.id !== chatId);
    saveChats();
    
    if (state.activeChatId === chatId) {
        state.activeChatId = null;
        resetChatView();
    }
    
    updateSidebarChats();
}

function selectChatSession(chatId) {
    state.activeChatId = chatId;
    
    // Fetch model theme of target chat to update styling
    const selected = state.chats.find(c => c.id === chatId);
    if (selected && selected.model) {
        changeModelTheme(selected.model);
    }
    
    updateSidebarChats();
    loadActiveConversation();
    toggleMobileSidebar(false);
}

let cachedEmptyState = null;

function updateSidebarChats() {
    const listContainer = document.getElementById("chat-history-list");
    let emptyState = document.getElementById("history-empty-state");
    
    if (emptyState) {
        cachedEmptyState = emptyState;
    } else {
        emptyState = cachedEmptyState;
    }
    
    // Keep header title, remove prior list nodes
    const headerTitle = listContainer.querySelector(".history-section-title");
    listContainer.innerHTML = '';
    listContainer.appendChild(headerTitle);
    
    if (state.chats.length === 0) {
        if (emptyState) {
            emptyState.style.display = "block";
            listContainer.appendChild(emptyState);
        }
        return;
    }
    
    if (emptyState) {
        emptyState.style.display = "none";
    }
    
    state.chats.forEach(chat => {
        const item = document.createElement("div");
        item.className = `history-item ${chat.id === state.activeChatId ? 'active' : ''}`;
        item.setAttribute("data-id", chat.id);
        item.addEventListener("click", () => selectChatSession(chat.id));
        
        let iconClass = "fa-regular fa-comment";
        if (chat.model === 'gemini') iconClass = "fa-solid fa-star";
        if (chat.model === 'claude') iconClass = "fa-solid fa-feather";
        if (chat.model === 'vision') iconClass = "fa-solid fa-image";
        
        item.innerHTML = `
            <div class="history-item-left">
                <i class="${iconClass}"></i>
                <span class="history-item-title">${escapeHTML(chat.title)}</span>
            </div>
            <div class="history-actions">
                <button type="button" class="history-action-btn delete-btn" title="Delete conversation">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
        
        // Attach event listener specifically to the inner delete button
        item.querySelector(".delete-btn").addEventListener("click", (e) => deleteChatSession(chat.id, e));
        
        listContainer.appendChild(item);
    });
}

// ==========================================
// Conversation rendering & Markdown helper
// ==========================================
function resetChatView() {
    const welcome = document.getElementById("chat-welcome-state");
    const msgsContainer = document.getElementById("chat-messages-container");
    
    // Clear all children except empty welcome state
    Array.from(msgsContainer.children).forEach(child => {
        if (child.id !== "chat-welcome-state") {
            msgsContainer.removeChild(child);
        }
    });
    
    welcome.style.display = "flex";
    
    // Reset welcome prompt titles
    const modelWords = { gpt: "ChatGPT", gemini: "Gemini", claude: "Claude", vision: "Vision" };
    document.getElementById("welcome-title").textContent = `How can I help you today with ${modelWords[state.currentModel]}?`;
}

function loadActiveConversation() {
    const welcome = document.getElementById("chat-welcome-state");
    const msgsContainer = document.getElementById("chat-messages-container");
    
    // Clear all past messages elements on screen
    Array.from(msgsContainer.children).forEach(child => {
        if (child.id !== "chat-welcome-state") {
            msgsContainer.removeChild(child);
        }
    });
    
    const activeChat = state.chats.find(c => c.id === state.activeChatId);
    if (!activeChat || activeChat.messages.length === 0) {
        welcome.style.display = "flex";
        // Reset welcome prompt titles
        const modelWords = { gpt: "ChatGPT", gemini: "Gemini", claude: "Claude", vision: "Vision" };
        document.getElementById("welcome-title").textContent = `How can I help you today with ${modelWords[state.currentModel]}?`;
        return;
    }
    
    welcome.style.display = "none";
    
    // Render message history items
    activeChat.messages.forEach(msg => {
        appendMessageBubble(msg.role, msg.content, false, msg.image);
    });
    
    scrollToBottom();
}

function appendMessageBubble(role, content, animate = true, image = null) {
    const msgsContainer = document.getElementById("chat-messages-container");
    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper ${role}`;
    
    let avatarContent = "";
    if (role === 'user') {
        if (state.user && state.user.avatar) {
            avatarContent = `<img src="${state.user.avatar}" class="msg-avatar">`;
        } else {
            const initial = state.user ? state.user.name.charAt(0).toUpperCase() : "U";
            avatarContent = `<div class="msg-avatar">${initial}</div>`;
        }
    } else {
        let aiIcon = "fa-solid fa-cube";
        if (state.currentModel === 'gemini') aiIcon = "fa-solid fa-star";
        if (state.currentModel === 'claude') aiIcon = "fa-solid fa-feather";
        if (state.currentModel === 'vision') aiIcon = "fa-solid fa-image";
        avatarContent = `<div class="msg-avatar"><i class="${aiIcon}"></i></div>`;
    }
    
    const authorName = role === 'user' ? (state.user ? state.user.name : "You") : getAIModelLabel();
    const formattedHtml = role === 'user' ? escapeHTML(content).replace(/\n/g, '<br>') : parseMarkdown(content);
    
    let imageHtml = "";
    if (image) {
        imageHtml = `<div class="bubble-image-wrapper"><img src="${image}" class="bubble-image"></div>`;
    }
    
    wrapper.innerHTML = `
        ${avatarContent}
        <div class="message-bubble-container">
            <span class="msg-author">${authorName}</span>
            <div class="message-bubble">
                ${imageHtml}
                <div>${formattedHtml}</div>
            </div>
            <div class="msg-actions">
                <button type="button" class="msg-action-btn copy-msg-btn" title="Copy text to clipboard">
                    <i class="fa-regular fa-copy"></i> Copy
                </button>
            </div>
        </div>
    `;
    
    // Copy function handler
    wrapper.querySelector(".copy-msg-btn").addEventListener("click", () => {
        navigator.clipboard.writeText(content).then(() => {
            showToast("Message content copied to clipboard", "success");
        }).catch(err => {
            console.error("Failed to copy message", err);
            showToast("Failed to copy message content", "error");
        });
    });
    
    // Add copy triggers for custom code block structures inside AI response
    if (role === 'assistant') {
        const copyCodeBtns = wrapper.querySelectorAll('.code-copy-btn');
        copyCodeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const codeBlock = btn.closest('.code-block-wrapper').querySelector('code');
                navigator.clipboard.writeText(codeBlock.textContent).then(() => {
                    btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
                    setTimeout(() => {
                        btn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
                    }, 2000);
                });
            });
        });
    }
    
    msgsContainer.appendChild(wrapper);
    if (animate) {
        scrollToBottom();
    }
}

function getAIModelLabel() {
    if (state.currentModel === 'gpt') return "ChatGPT Pro";
    if (state.currentModel === 'gemini') return "Gemini 3.5";
    if (state.currentModel === 'claude') return "Claude 3.5 Sonnet";
    if (state.currentModel === 'vision') return "Vision Model / إرسال الصور";
    return "AI Assistant";
}

function scrollToBottom() {
    const msgsContainer = document.getElementById("chat-messages-container");
    msgsContainer.scrollTo({
        top: msgsContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// ==========================================
// Robust Regular Expression Markdown Parser
// ==========================================
function parseMarkdown(markdown) {
    // 1. Escape HTML first to prevent XSS injection
    let html = escapeHTML(markdown);
    
    // 2. Format code blocks block ```lang ... ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    html = html.replace(codeBlockRegex, (match, lang, code) => {
        const displayLang = lang || 'code';
        return `
            <div class="code-block-wrapper">
                <div class="code-header">
                    <span class="code-lang">${displayLang}</span>
                    <button class="code-copy-btn"><i class="fa-regular fa-copy"></i> Copy</button>
                </div>
                <pre><code class="language-${displayLang}">${code.trim()}</code></pre>
            </div>
        `;
    });
    
    // 3. Simple table renderer | Col 1 | Col 2 | ...
    const tableRegex = /((?:\|[^\n]+\|\r?\n?)+)/g;
    html = html.replace(tableRegex, (match) => {
        const lines = match.trim().split('\n');
        if (lines.length < 2) return match;
        
        let tableHtml = '<div style="overflow-x:auto; margin:0.75rem 0;"><table style="width:100%; border-collapse:collapse; font-size:0.9em; border: 1px solid var(--border-color);">';
        
        lines.forEach((line, index) => {
            const cols = line.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
            
            // Check if divider line (e.g. |:---:|:---|)
            if (cols.every(col => col.startsWith(':') || col.startsWith('-') || col.endsWith(':'))) {
                return;
            }
            
            tableHtml += '<tr style="border-bottom: 1px solid var(--border-color);">';
            cols.forEach(col => {
                const cellTag = index === 0 ? 'th' : 'td';
                const cellStyle = index === 0 
                    ? 'padding:8px 12px; background:var(--bg-surface-hover); font-weight:600; text-align:left;' 
                    : 'padding:8px 12px;';
                tableHtml += `<${cellTag} style="${cellStyle}">${col}</${cellTag}>`;
            });
            tableHtml += '</tr>';
        });
        
        tableHtml += '</table></div>';
        return tableHtml;
    });

    // 4. Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 5. Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 6. Bullet lists: starting with * or -
    const bulletListRegex = /^(?:\*|-)\s+([^\n]+)/gm;
    html = html.replace(bulletListRegex, '<li>$1</li>');
    // Wrap lists in ul container
    html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
        // Only wrap consecutive lists
        return `<ul>${match}</ul>`;
    });
    // Remove duplicate nested tags that regex wrapper can cause
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // 7. Paragraphs - split by double newlines, wrap in <p> unless it's a structural tag
    const paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<div') || trimmed.startsWith('<ul') || trimmed.startsWith('<table') || trimmed.startsWith('<ol')) {
            return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('');
    
    return html;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================
// Transactions & Webhook API Transactions
// ==========================================
async function sendMessage() {
    if (state.isGenerating) return;
    
    const input = document.getElementById("chat-input");
    const messageText = input.value.trim();
    if (!messageText && !attachedImageBase64) return;
    
    // Cache the attached image and reset/clear image UI inputs immediately
    const currentImage = attachedImageBase64;
    attachedImageBase64 = null;
    const imageInput = document.getElementById("image-upload-input") || document.getElementById("imageInput");
    if (imageInput) {
        imageInput.value = "";
    }
    const previewContainer = document.getElementById("image-preview-container");
    if (previewContainer) {
        previewContainer.style.display = "none";
    }
    const previewImg = document.getElementById("image-preview");
    if (previewImg) {
        previewImg.src = "";
    }
    
    // Clear Input immediately, disable Send Button
    input.value = "";
    input.style.height = "24px";
    document.getElementById("btn-send").disabled = true;
    
    // Create new session if no conversation is active
    if (!state.activeChatId) {
        createNewChatSession();
        // Since createNewChatSession sets state.activeChatId and resets screen, we find the active conversation
    }
    
    const activeChat = state.chats.find(c => c.id === state.activeChatId);
    if (!activeChat) return;
    
    // 1. Add user message to local state model
    const userMessage = { role: 'user', content: messageText };
    if (currentImage) {
        userMessage.image = currentImage;
    }
    activeChat.messages.push(userMessage);
    
    // If it's the first message, rename chat title
    if (activeChat.title === 'New Conversation') {
        const titleText = messageText || "Image Attachment";
        activeChat.title = titleText.length > 28 ? titleText.substring(0, 25) + "..." : titleText;
        updateSidebarChats();
    }
    
    activeChat.timestamp = Date.now();
    saveChats();
    
    // 2. Hide welcome screen panel if visible, and append bubble
    document.getElementById("chat-welcome-state").style.display = "none";
    appendMessageBubble('user', messageText, true, currentImage);
    
    // 3. Display typing thinking bubble
    const msgsContainer = document.getElementById("chat-messages-container");
    const typingBubble = document.createElement("div");
    typingBubble.className = "message-wrapper assistant typing-indicator-wrapper";
    
    let aiIcon = "fa-solid fa-cube";
    if (state.currentModel === 'gemini') aiIcon = "fa-solid fa-star";
    if (state.currentModel === 'claude') aiIcon = "fa-solid fa-feather";
    if (state.currentModel === 'vision') aiIcon = "fa-solid fa-image";
    
    typingBubble.innerHTML = `
        <div class="msg-avatar"><i class="${aiIcon}"></i></div>
        <div class="message-bubble-container">
            <span class="msg-author">${getAIModelLabel()}</span>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        </div>
    `;
    msgsContainer.appendChild(typingBubble);
    scrollToBottom();
    
    state.isGenerating = true;
    
    let responseText = "";
    
    // Check if webhook is configured
    if (state.settings.n8nUrl) {
        try {
            // Prepare payload
            const payload = {
                message: messageText,
                image: currentImage, // sends raw base64 string or null if no image was uploaded
                chatId: activeChat.id,
                model: state.currentModel,
                user: {
                    name: state.user.name,
                    email: state.user.email
                },
                history: activeChat.messages.slice(0, -1) // Excluding the current user prompt
            };
            
            const headers = {
                'Content-Type': 'application/json'
            };
            if (state.settings.n8nAuthHeader) {
                headers['Authorization'] = state.settings.n8nAuthHeader;
            }
            
            const response = await fetch(state.settings.n8nUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Server returned HTTP status ${response.status}`);
            }
            
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                
                // Parse standard keys from n8n response models
                if (data.output) responseText = data.output;
                else if (data.text) responseText = data.text;
                else if (data.response) responseText = data.response;
                else if (data.message) responseText = data.message;
                else if (typeof data === 'string') responseText = data;
                else if (Array.isArray(data) && data.length > 0) {
                    const firstItem = data[0];
                    responseText = firstItem.output || firstItem.text || firstItem.response || JSON.stringify(firstItem);
                } else {
                    responseText = JSON.stringify(data);
                }
            } else {
                responseText = await response.text();
            }
            
        } catch (error) {
            console.error("n8n Transaction Failure:", error);
            let errMsg = error.message;
            if (error.message.includes("Failed to fetch") || error.name === "TypeError" || error.message.includes("NetworkError")) {
                errMsg = "Network Error. Please verify that your n8n workflow is toggled to 'Active', or use the '-test' webhook URL if testing.";
            }
            showToast(`Webhook API Failure: ${errMsg}. Loaded local fallback.`, "error");
            responseText = getFallbackMockResponse(messageText);
        }
    } else {
        // Local simulation delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        responseText = getFallbackMockResponse(messageText);
    }
    
    // Remove typing bubble
    const loadedTypingBubble = msgsContainer.querySelector(".typing-indicator-wrapper");
    if (loadedTypingBubble) {
        msgsContainer.removeChild(loadedTypingBubble);
    }
    
    // 4. Save response to conversation model history
    const aiMessage = { role: 'assistant', content: responseText };
    activeChat.messages.push(aiMessage);
    saveChats();
    
    // 5. Append message bubble with writing speed simulator
    state.isGenerating = false;
    appendMessageBubble('assistant', responseText, true);
    
    // Update input area state
    input.focus();
}

function getFallbackMockResponse(prompt) {
    const list = MOCK_RESPONSES[state.currentModel];
    // Return a random mock response corresponding to the brand
    return list[Math.floor(Math.random() * list.length)];
}

// ==========================================
// Interface Actions & Binding Handlers
// ==========================================
function bindUIEvents() {
    // Auth Actions
    const authForm = document.getElementById("auth-form");
    if (authForm) {
        authForm.addEventListener("submit", handleAuthSubmit);
    }
    const formToggleBtn = document.getElementById("btn-form-toggle");
    if (formToggleBtn) {
        formToggleBtn.addEventListener("click", toggleAuthMode);
    }
    const googleBtn = document.getElementById("btn-google-mock");
    if (googleBtn) {
        googleBtn.addEventListener("click", triggerSimulatedGoogleLogin);
    }
    document.getElementById("btn-quick-login").addEventListener("click", triggerDemoLogin);
    document.getElementById("btn-logout").addEventListener("click", logout);
    
    // Sidebar Control Panel Actions
    document.getElementById("btn-new-chat").addEventListener("click", createNewChatSession);
    document.getElementById("btn-sidebar-toggle").addEventListener("click", () => toggleMobileSidebar(true));
    document.getElementById("btn-sidebar-close").addEventListener("click", () => toggleMobileSidebar(false));
    
    // Chat Header Switches
    const modelTabs = document.querySelectorAll(".model-tab");
    modelTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const modelVal = tab.getAttribute("data-model");
            changeModelTheme(modelVal);
            // If there's an active chat, change its model type and save
            if (state.activeChatId) {
                const activeChat = state.chats.find(c => c.id === state.activeChatId);
                if (activeChat) {
                    activeChat.model = modelVal;
                    saveChats();
                    updateSidebarChats();
                }
            } else {
                // Just reset empty screen prompts
                resetChatView();
            }
            
            // Auto-trigger image upload if 'vision' model is selected and no image is attached
            if (modelVal === 'vision' && !attachedImageBase64) {
                const imageInput = document.getElementById('image-upload-input') || document.getElementById('imageInput');
                if (imageInput) {
                    imageInput.click();
                }
            }
        });
    });
    
    // Input Area Event Listeners
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("btn-send");
    
    chatInput.addEventListener("input", () => {
        // Auto-growing Textarea calculation
        chatInput.style.height = "24px";
        chatInput.style.height = (chatInput.scrollHeight - 12) + "px";
        
        // Disable sending empty whitespace unless an image is attached
        sendBtn.disabled = (!chatInput.value.trim() && !attachedImageBase64) || state.isGenerating;
    });
    
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if ((chatInput.value.trim() || attachedImageBase64) && !state.isGenerating) {
                sendMessage();
            }
        }
    });
    
    sendBtn.addEventListener("click", sendMessage);
    
    // Welcome prompts suggestion cards actions
    const suggestionCards = document.querySelectorAll(".suggestion-card");
    suggestionCards.forEach(card => {
        card.addEventListener("click", () => {
            const prompt = card.getAttribute("data-prompt");
            chatInput.value = prompt;
            sendBtn.disabled = false;
            chatInput.focus();
            // Automatically send suggestion
            sendMessage();
        });
    });
    
    // Clear / Reset chat logs button
    document.getElementById("btn-clear-chat").addEventListener("click", () => {
        if (state.activeChatId) {
            const activeChat = state.chats.find(c => c.id === state.activeChatId);
            if (activeChat && activeChat.messages.length > 0) {
                if (confirm("Are you sure you want to clear this chat's messages?")) {
                    activeChat.messages = [];
                    saveChats();
                    loadActiveConversation();
                    showToast("Conversation log cleared", "info");
                }
            }
        }
    });
    
    // Open/Close settings modals UI
    document.getElementById("btn-settings-open").addEventListener("click", openSettingsModal);
    document.getElementById("btn-settings-close").addEventListener("click", closeSettingsModal);
    document.getElementById("btn-settings-cancel").addEventListener("click", closeSettingsModal);
    document.getElementById("btn-settings-save").addEventListener("click", saveSettingsFromModal);
    
    // Light/Dark mode click cards in settings Modal
    document.getElementById("theme-card-dark").addEventListener("click", () => {
        state.settings.themeMode = "dark";
        initTheme();
    });
    
    document.getElementById("theme-card-light").addEventListener("click", () => {
        state.settings.themeMode = "light";
        initTheme();
    });
    
    // Theme toggle icon in header
    document.getElementById("btn-theme-toggle").addEventListener("click", toggleThemeMode);
    
    // Image attachment handling
    const paperclipBtn = document.getElementById("btn-attach") || document.querySelector('.fa-paperclip');
    const imageInput = document.getElementById('image-upload-input') || document.getElementById('imageInput');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const removeImgBtn = document.getElementById('btn-remove-image');

    if (paperclipBtn && imageInput) {
        paperclipBtn.addEventListener('click', () => imageInput.click());

        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64Data = await convertToBase64(file);
                    attachedImageBase64 = base64Data;
                    
                    // Show preview wrapper
                    if (previewContainer && previewImg) {
                        previewImg.src = base64Data;
                        previewContainer.style.display = 'flex';
                    }
                    
                    // Enable send button
                    document.getElementById("btn-send").disabled = false;
                    
                    console.log("Image loaded and ready to send!");
                } catch (err) {
                    console.error("Failed to convert image to Base64:", err);
                }
            }
        });
    }

    if (removeImgBtn) {
        removeImgBtn.addEventListener('click', () => {
            attachedImageBase64 = null;
            if (imageInput) imageInput.value = "";
            if (previewContainer) previewContainer.style.display = 'none';
            if (previewImg) previewImg.src = "";
            
            // Re-evaluate send button state
            const chatInput = document.getElementById("chat-input");
            const sendBtn = document.getElementById("btn-send");
            if (chatInput && sendBtn) {
                sendBtn.disabled = (!chatInput.value.trim() && !attachedImageBase64) || state.isGenerating;
            }
        });
    }
    
    document.getElementById("btn-mic").addEventListener("click", () => {
        showToast("Dictation processing microphone is mock simulated.", "info");
    });
    
    // Sidebar backdrop dismiss click
    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
        backdrop.addEventListener("click", () => toggleMobileSidebar(false));
    }
}

function toggleMobileSidebar(active) {
    state.sidebarActive = active;
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (active) {
        sidebar.classList.add("active");
        if (backdrop) backdrop.classList.add("active");
    } else {
        sidebar.classList.remove("active");
        if (backdrop) backdrop.classList.remove("active");
    }
}

// ==========================================
// Toast Alerts UI Notifications
// ==========================================
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let iconClass = "fa-solid fa-circle-check";
    if (type === "error") iconClass = "fa-solid fa-circle-exclamation";
    if (type === "info") iconClass = "fa-solid fa-circle-info";
    if (type === "warning") iconClass = "fa-solid fa-triangle-exclamation";
    
    toast.innerHTML = `
        <i class="${iconClass}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Fade out and remove after 4.5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s ease';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 400);
    }, 4000);
}

// Magic function to smoothly convert image file to Base64 (retains metadata prefix)
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
