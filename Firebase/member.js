// 導入所需的Firebase模組
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 日誌功能
const logContainer = document.getElementById('log-container');

function addLog(message, type = 'info') {
    const logItem = document.createElement('div');
    logItem.className = `log-item log-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logItem.textContent = `[${timestamp}] ${message}`;
    
    logContainer.appendChild(logItem);
    logContainer.scrollTop = logContainer.scrollHeight; // 自動捲動到最新日誌
    
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// 錯誤處理函數
function handleError(error, context) {
    const errorCode = error.code || 'unknown';
    const errorMessage = error.message || 'Unknown error';
    
    addLog(`${context} 失敗: (${errorCode}) ${errorMessage}`, 'error');
    
    // 處理常見錯誤
    let userMessage = '';
    
    switch(errorCode) {
        // Firebase 認證錯誤
        case 'auth/email-already-in-use':
            userMessage = '此電子郵件已被使用';
            break;
        case 'auth/invalid-email':
            userMessage = '無效的電子郵件格式';
            break;
        case 'auth/weak-password':
            userMessage = '密碼強度太弱，請使用更強的密碼';
            break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            userMessage = '電子郵件或密碼錯誤';
            break;
        case 'auth/user-disabled':
            userMessage = '此帳號已被停用';
            break;
        
        // Firebase 連接錯誤
        case 'auth/network-request-failed':
            userMessage = '網絡請求失敗，請檢查您的網絡連接';
            break;
        case 'auth/too-many-requests':
            userMessage = '操作過於頻繁，請稍後再試';
            break;
        
        // Firestore 錯誤
        case 'permission-denied':
            userMessage = '沒有足夠的權限操作數據庫';
            break;
        case 'unavailable':
            userMessage = '數據庫服務暫時不可用';
            break;
            
        // 一般錯誤
        default:
            userMessage = `操作失敗: ${errorMessage}`;
    }
    
    alert(userMessage);
    return userMessage;
}

// 更新連接狀態
function updateStatus(element, status, message) {
    const statusElement = document.getElementById(element);
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = status === 'success' ? 'green' : 
                                    status === 'error' ? 'red' : 'orange';
    }
}

// Firebase配置
const firebaseConfig = {
    apiKey: "AIzaSyCSPTeNEi1ZCMTfXD2Fu8z_BRkdRzJN2u8",
    authDomain: "fruit-shop-bf15a.firebaseapp.com",
    projectId: "fruit-shop-bf15a",
    storageBucket: "fruit-shop-bf15a.appspot.com",
    messagingSenderId: "646036076141",
    appId: "1:646036076141:web:e904d0c038a06b59163164",
    measurementId: "G-TE09TSSZS9"
};

// 初始化Firebase
let app, auth, db;

try {
    addLog('正在初始化Firebase...', 'info');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    updateStatus('firebase-status', 'success', '已成功初始化');
    addLog('Firebase初始化成功', 'success');
} catch (error) {
    updateStatus('firebase-status', 'error', '初始化失敗');
    handleError(error, 'Firebase初始化');
}

// DOM元素
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const toggleDebugBtn = document.getElementById('toggle-debug');
const debugContent = document.getElementById('debug-content');

// 切換顯示調試面板
toggleDebugBtn.addEventListener('click', () => {
    if (debugContent.style.display === 'block') {
        debugContent.style.display = 'none';
        toggleDebugBtn.textContent = '顯示詳情';
    } else {
        debugContent.style.display = 'block';
        toggleDebugBtn.textContent = '隱藏詳情';
    }
});

// 測試Firestore連接
async function testFirestoreConnection() {
    try {
        const testRef = doc(db, '_test_connection', 'test');
        await setDoc(testRef, { 
            timestamp: serverTimestamp(),
            test: 'connection_test'
        });
        updateStatus('firestore-status', 'success', '連接成功');
        addLog('Firestore連接測試成功', 'success');
    } catch (error) {
        updateStatus('firestore-status', 'error', '連接失敗');
        handleError(error, 'Firestore連接測試');
    }
}

// 註冊功能
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // 基本驗證
    if (password !== confirmPassword) {
        alert('密碼與確認密碼不符');
        addLog('註冊失敗: 密碼與確認密碼不符', 'error');
        return;
    }
    
    if (password.length < 6) {
        alert('密碼長度至少需要6個字符');
        addLog('註冊失敗: 密碼長度不足', 'error');
        return;
    }
    
    try {
        addLog(`嘗試註冊用戶: ${email}`, 'info');
        // 創建用戶
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        addLog(`用戶創建成功: ${user.uid}`, 'success');
        
        // 將用戶資料存儲到Firestore
        addLog('正在保存用戶資料到Firestore...', 'info');
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            createdAt: serverTimestamp()
        });
        
        addLog('用戶資料保存成功', 'success');
        alert('註冊成功！您已自動登入');
        registerForm.reset();
    } catch (error) {
        handleError(error, '用戶註冊');
    }
});

// 登入功能
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        addLog(`嘗試登入: ${email}`, 'info');
        await signInWithEmailAndPassword(auth, email, password);
        addLog('登入成功', 'success');
        alert('登入成功！');
        loginForm.reset();
    } catch (error) {
        handleError(error, '用戶登入');
    }
});

// 登出功能
logoutBtn.addEventListener('click', async () => {
    try {
        addLog('嘗試登出', 'info');
        await signOut(auth);
        addLog('登出成功', 'success');
        alert('已成功登出');
    } catch (error) {
        handleError(error, '用戶登出');
    }
});

// 監聽認證狀態變化
onAuthStateChanged(auth, async (user) => {
    if (user) {
        addLog(`用戶已登入: ${user.uid}`, 'info');
        updateStatus('auth-status', 'success', '已登入');
        
        // 顯示用戶資訊區域
        userInfo.style.display = 'block';
        
        // 顯示電子郵件
        userEmail.textContent = user.email;
        
        try {
            // 從Firestore獲取用戶資料
            addLog('正在獲取用戶資料...', 'info');
            const docSnap = await getDoc(doc(db, 'users', user.uid));
            
            if (docSnap.exists()) {
                const userData = docSnap.data();
                addLog('獲取用戶資料成功', 'success');
                userName.textContent = userData.name || '-';
            } else {
                addLog('用戶資料不存在', 'error');
                userName.textContent = '(資料不存在)';
            }
        } catch (error) {
            handleError(error, '獲取用戶資料');
            userName.textContent = '(獲取失敗)';
        }
    } else {
        addLog('用戶未登入', 'info');
        updateStatus('auth-status', 'warning', '未登入');
        
        // 隱藏用戶資訊區域
        userInfo.style.display = 'none';
        
        // 清空用戶資訊
        userName.textContent = '-';
        userEmail.textContent = '-';
    }
});

// 在頁面加載完成後測試Firestore連接
window.addEventListener('load', () => {
    addLog('頁面加載完成', 'info');
    testFirestoreConnection();
});

addLog('Firebase會員系統初始化完成', 'info');