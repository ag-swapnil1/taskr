/* ==========================================
   Taskr — script.js
   Author: Swapnil Agrahari
   ========================================== */

// ---------- State ----------
let taskActive    = JSON.parse(localStorage.getItem("taskActive"))    || [];
let taskCompleted = JSON.parse(localStorage.getItem("taskCompleted")) || [];

// ---------- DOM References ----------
const dueDateInput     = document.querySelector("#due-date-input");
const themeBtn         = document.querySelector("#theme");
const addBtn           = document.querySelector("#add-btn");
const textInput        = document.querySelector("#text-input");
const clearBtn         = document.querySelector("#clear-btn");
const tasksActiveEl    = document.querySelector("#tasks-active");
const taskCompletedEl  = document.querySelector("#task-completed");
const yearSpan         = document.querySelector("#year");

// ---------- Init ----------
dueDateInput.min = new Date().toISOString().split("T")[0];
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Restore theme
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  themeBtn.textContent = "☀️ Light";
}

// ---------- Theme Toggle ----------
themeBtn.addEventListener("click", function () {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
  themeBtn.textContent = isDark ? "🌙 Dark" : "☀️ Light";
  localStorage.setItem("theme", isDark ? "light" : "dark");
});

// ---------- Persist ----------
function saveTasks() {
  localStorage.setItem("taskActive",    JSON.stringify(taskActive));
  localStorage.setItem("taskCompleted", JSON.stringify(taskCompleted));
}

// ---------- Helpers ----------
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getPriorityLabel(priority) {
  if (priority === "high") return "🔴 High priority";
  if (priority === "low")  return "🟢 Low priority";
  return "🟡 Medium priority";
}

function formatDate(dateStr) {
  if (!dateStr) return "No due date";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// ---------- Stats ----------
function updateStats() {
  const total = taskActive.length + taskCompleted.length;
  document.querySelector("#total").textContent          = total;
  document.querySelector("#active").textContent         = taskActive.length;
  document.querySelector("#completed").textContent      = taskCompleted.length;
  document.querySelector("#span-all").textContent       = total;
  document.querySelector("#span-active").textContent    = taskActive.length;
  document.querySelector("#span-completed").textContent = taskCompleted.length;
}

function updateEmptyStates() {
  const emptyActive    = document.querySelector("#empty-active");
  const emptyCompleted = document.querySelector("#empty-completed");
  if (emptyActive)    emptyActive.style.display    = taskActive.length    === 0 ? "" : "none";
  if (emptyCompleted) emptyCompleted.style.display = taskCompleted.length === 0 ? "" : "none";
}

// ---------- Build Task Object ----------
function buildTaskObject() {
  return {
    id:       crypto.randomUUID(),
    task:     textInput.value.trim(),
    category: document.querySelector('input[name="category"]:checked').value,
    priority: document.querySelector('input[name="priority"]:checked').value,
    dueDate:  dueDateInput.value,
  };
}

// ---------- Create Elements ----------
function createTaskElement(taskObj) {
  const taskDiv = document.createElement("div");
  taskDiv.className  = "status-active";
  taskDiv.dataset.id = taskObj.id;

  const checkbox = document.createElement("div");
  checkbox.className = "checkbox";
  checkbox.title = "Mark as complete";

  const taskInfo = document.createElement("div");
  taskInfo.className = "task-info";

  const taskName = document.createElement("h4");
  taskName.className = "task-name";
  taskName.textContent = toTitleCase(taskObj.task);

  const taskSubinfo = document.createElement("p");
  taskSubinfo.className = "task-subinfo";
  taskSubinfo.textContent = `${getPriorityLabel(taskObj.priority)} · ${taskObj.category} · Due ${formatDate(taskObj.dueDate)}`;

  const functionBtn = document.createElement("div");
  functionBtn.className = "function-btn";

  const deleteBtn = document.createElement("button");
  deleteBtn.className   = "edit-cross";
  deleteBtn.textContent = "❌";
  deleteBtn.title       = "Delete task";

  deleteBtn.addEventListener("click", () => {
    taskActive = taskActive.filter(t => t.id !== taskObj.id);
    taskDiv.remove();
    saveTasks();
    updateStats();
    updateEmptyStates();
  });

  taskInfo.append(taskName, taskSubinfo);
  functionBtn.append(deleteBtn);
  taskDiv.append(checkbox, taskInfo, functionBtn);

  return taskDiv;
}

function createCompletedElement(taskObj) {
  const taskDiv = document.createElement("div");
  taskDiv.className  = "status-completed";
  taskDiv.dataset.id = taskObj.id;

  const checkbox = document.createElement("div");
  checkbox.className   = "completed-checkbox";
  checkbox.textContent = "✅";
  checkbox.title       = "Mark as active";

  const taskInfo = document.createElement("div");
  taskInfo.className = "completed-task-info";

  const taskName = document.createElement("h4");
  taskName.className   = "completed-task-name";
  taskName.textContent = toTitleCase(taskObj.task);

  const taskSubinfo = document.createElement("p");
  taskSubinfo.className   = "completed-task-subinfo";
  taskSubinfo.textContent = `${getPriorityLabel(taskObj.priority)} · ${taskObj.category} · Due ${formatDate(taskObj.dueDate)}`;

  taskInfo.append(taskName, taskSubinfo);
  taskDiv.append(checkbox, taskInfo);

  return taskDiv;
}

// ---------- Toggle Complete / Active ----------
function markAsCompleted(taskEl, taskObj) {
  taskActive = taskActive.filter(t => t.id !== taskObj.id);
  taskCompleted.push(taskObj);

  const completedEl = createCompletedElement(taskObj);
  completedEl.children[0].addEventListener("click", () => markAsActive(completedEl, taskObj), { once: true });
  taskEl.remove();
  taskCompletedEl.append(completedEl);

  saveTasks();
  updateStats();
  updateEmptyStates();
}

function markAsActive(completedEl, taskObj) {
  taskCompleted = taskCompleted.filter(t => t.id !== taskObj.id);
  taskActive.push(taskObj);

  const activeEl = createTaskElement(taskObj);
  activeEl.firstElementChild.addEventListener("click", () => markAsCompleted(activeEl, taskObj), { once: true });
  completedEl.remove();
  tasksActiveEl.append(activeEl);

  saveTasks();
  updateStats();
  updateEmptyStates();
}

// ---------- Add Task ----------
function addTask() {
  const taskText = textInput.value.trim();
  const dueDate  = dueDateInput.value;

  if (!taskText || !dueDate) {
    alert("Please enter a task name and due date.");
    return;
  }

  const taskObj = buildTaskObject();
  taskActive.push(taskObj);

  const taskEl = createTaskElement(taskObj);
  taskEl.firstElementChild.addEventListener("click", () => markAsCompleted(taskEl, taskObj), { once: true });
  tasksActiveEl.append(taskEl);

  textInput.value   = "";
  dueDateInput.value = "";

  saveTasks();
  updateStats();
  updateEmptyStates();
}

// ---------- Filter ----------
function applyFilter(value) {
  const showActive    = value === "active"    || value === "all";
  const showCompleted = value === "completed" || value === "all";

  tasksActiveEl.style.display                            = showActive    ? "" : "none";
  document.querySelector("#label-active").style.display  = showActive    ? "" : "none";
  taskCompletedEl.style.display                          = showCompleted ? "" : "none";
  document.querySelector("#label-completed").style.display = showCompleted ? "" : "none";
}

// ---------- Load from Storage ----------
function loadTasksFromStorage() {
  taskActive.forEach(taskObj => {
    const taskEl = createTaskElement(taskObj);
    taskEl.firstElementChild.addEventListener("click", () => markAsCompleted(taskEl, taskObj), { once: true });
    tasksActiveEl.append(taskEl);
  });

  taskCompleted.forEach(taskObj => {
    const completedEl = createCompletedElement(taskObj);
    completedEl.children[0].addEventListener("click", () => markAsActive(completedEl, taskObj), { once: true });
    taskCompletedEl.append(completedEl);
  });

  updateStats();
  updateEmptyStates();
}

// ---------- Event Listeners ----------
addBtn.addEventListener("click", addTask);

textInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addTask();
});

clearBtn.addEventListener("click", function () {
  taskCompleted = [];
  taskCompletedEl.innerHTML = '<div class="empty-state" id="empty-completed">No completed tasks yet 🎯</div>';
  saveTasks();
  updateStats();
  updateEmptyStates();
});

document.querySelectorAll('input[name="filter"]').forEach(radio => {
  radio.addEventListener("change", function () {
    applyFilter(this.value);
  });
});

// ---------- Boot ----------
loadTasksFromStorage();
