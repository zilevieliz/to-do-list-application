// ─── Simple hash (djb2) ───────────────────────────────────────────────────────
function hashPassword(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// ─── Auth state ───────────────────────────────────────────────────────────────
let currentUser = null;
let authMode = 'login'; // 'login' | 'register'

function switchTab(mode) {
  authMode = mode;
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('tab-register').classList.toggle('active', mode === 'register');
  document.getElementById('auth-submit-btn').textContent = mode === 'login' ? 'Login' : 'Register';
  document.getElementById('auth-error').textContent = '';
}

function handleAuth() {
  const username = document.getElementById('auth-username').value.trim().toLowerCase();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');

  if (!username || !password) {
    errorEl.textContent = 'Please fill in both fields.';
    shakeInputs();
    return;
  }

  const usersKey = 'tdl_users';
  const users = JSON.parse(localStorage.getItem(usersKey) || '{}');
  const hashed = hashPassword(password);

  if (authMode === 'register') {
    if (users[username]) {
      errorEl.textContent = 'Username already exists.';
      return;
    }
    users[username] = hashed;
    localStorage.setItem(usersKey, JSON.stringify(users));
    errorEl.style.color = '#aaffcc';
    errorEl.textContent = 'Registered! Logging you in…';
    setTimeout(() => loginUser(username), 800);

  } else {
    if (!users[username] || users[username] !== hashed) {
      errorEl.style.color = '#ffaaaa';
      errorEl.textContent = 'Incorrect username or password.';
      shakeInputs();
      return;
    }
    loginUser(username);
  }
}

function shakeInputs() {
  ['auth-username', 'auth-password'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 400);
  });
}

function loginUser(username) {
  currentUser = username;
  localStorage.setItem('tdl_session', username);
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  document.getElementById('welcome-name').textContent = `👤 ${username}`;
  loadTasks();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('tdl_session');
  document.getElementById('task-list').innerHTML = '';
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
  document.getElementById('auth-error').textContent = '';
  switchTab('login');
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
const taskStorageKey = () => `tdl_tasks_${currentUser}`;

document.addEventListener('DOMContentLoaded', () => {

  // Auto-login if session exists
  const session = localStorage.getItem('tdl_session');
  if (session) {
    const users = JSON.parse(localStorage.getItem('tdl_users') || '{}');
    if (users[session]) {
      loginUser(session);
    }
  }

  const taskInput = document.getElementById('task-input');
  const addTaskBtn = document.getElementById('add-task-button');

  const addTask = (event) => {
    event.preventDefault();
    const taskText = taskInput.value.trim();
    if (!taskText) {
      taskInput.classList.add('shake');
      setTimeout(() => taskInput.classList.remove('shake'), 400);
      return;
    }
    createTaskElement(taskText);
    saveTasks();
    taskInput.value = '';
    taskInput.focus();
  };

  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask(e);
  });
});

function createTaskElement(text, completed = false) {
  const taskList = document.getElementById('task-list');
  const li = document.createElement('li');
  li.className = 'task-item' + (completed ? ' completed' : '');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = completed;
  checkbox.addEventListener('change', () => {
    li.classList.toggle('completed', checkbox.checked);
    saveTasks();
  });

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = text;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
  deleteBtn.title = 'Delete task';
  deleteBtn.addEventListener('click', () => {
    li.classList.add('removing');
    setTimeout(() => {
      li.remove();
      saveTasks();
      checkEmpty();
    }, 300);
  });

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteBtn);
  taskList.appendChild(li);
  requestAnimationFrame(() => li.classList.add('visible'));
  checkEmpty();
}

function checkEmpty() {
  const taskList = document.getElementById('task-list');
  const emptyMsg = document.getElementById('empty-msg');
  emptyMsg.style.display = taskList.children.length === 0 ? 'block' : 'none';
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll('.task-item').forEach(li => {
    tasks.push({
      text: li.querySelector('.task-text').textContent,
      completed: li.classList.contains('completed')
    });
  });
  localStorage.setItem(taskStorageKey(), JSON.stringify(tasks));
}

function loadTasks() {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';
  const stored = localStorage.getItem(taskStorageKey());
  if (stored) {
    JSON.parse(stored).forEach(task => createTaskElement(task.text, task.completed));
  }
  checkEmpty();
}