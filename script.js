const STORAGE_KEY = "todo-blue-app-items";

const input = document.querySelector("#todo-input");
const priorityInput = document.querySelector("#priority-input");
const addButton = document.querySelector("#add-button");
const todoList = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const feedback = document.querySelector("#feedback");
const pendingCount = document.querySelector("#pending-count");
const completedCount = document.querySelector("#completed-count");
const totalCount = document.querySelector("#total-count");
const clearAllButton = document.querySelector("#clear-all-button");

let todos = loadTodos();

render();

addButton.addEventListener("click", handleAddTodo);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleAddTodo();
  }
});
clearAllButton.addEventListener("click", handleClearAll);

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidTodo);
  } catch (error) {
    console.error("Failed to load todos:", error);
    return [];
  }
}

function isValidTodo(item) {
  const validPriorities = ["high", "medium", "low"];
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    typeof item.completed === "boolean" &&
    typeof item.createdAt === "number" &&
    (item.priority === undefined || validPriorities.includes(item.priority))
  );
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function handleAddTodo() {
  const text = input.value.trim();

  if (!text) {
    setFeedback("请输入任务内容后再添加。");
    input.focus();
    return;
  }

  const priority = priorityInput.value;

  const nextTodo = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    text,
    completed: false,
    priority,
    createdAt: Date.now(),
  };

  todos = [nextTodo, ...todos];
  input.value = "";
  priorityInput.value = "medium";
  setFeedback("任务已添加。", true);
  syncAndRender();
  input.focus();
}

function handleToggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );
  syncAndRender();
}

function handleDeleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  setFeedback("任务已删除。", true);
  syncAndRender();
}

function handleStartEdit(id) {
  const item = document.querySelector(`[data-todo-id="${id}"]`);
  if (!item) return;
  item.classList.add("is-editing");
  const editInput = item.querySelector(".edit-input");
  editInput.focus();
}

function handleSaveEdit(id) {
  const item = document.querySelector(`[data-todo-id="${id}"]`);
  if (!item) return;
  const editInput = item.querySelector(".edit-input");
  const newText = editInput.value.trim();
  if (!newText) {
    setFeedback("任务内容不能为空。");
    return;
  }
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, text: newText } : todo,
  );
  setFeedback("任务已更新。", true);
  syncAndRender();
}

function handleCancelEdit(id) {
  const item = document.querySelector(`[data-todo-id="${id}"]`);
  if (!item) return;
  const todo = todos.find((t) => t.id === id);
  const editInput = item.querySelector(".edit-input");
  if (todo) {
    editInput.value = todo.text;
  }
  item.classList.remove("is-editing");
}

function handleClearAll() {
  if (todos.length === 0) {
    setFeedback("当前没有任务可清空。");
    return;
  }
  const confirmed = window.confirm(
    `确定要清空所有 ${todos.length} 个任务吗？此操作不可恢复。`,
  );
  if (confirmed) {
    todos = [];
    setFeedback("所有任务已清空。", true);
    syncAndRender();
  }
}

function syncAndRender() {
  saveTodos();
  render();
}

function render() {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    emptyState.classList.add("is-visible");
  } else {
    emptyState.classList.remove("is-visible");
  }

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.completed ? " is-completed" : ""} priority-${todo.priority || "medium"}`;
    item.setAttribute("data-todo-id", todo.id);

    const checkWrap = document.createElement("label");
    checkWrap.className = "check-wrap";

    const checkbox = document.createElement("input");
    checkbox.className = "todo-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `标记任务“${todo.text}”为完成`);
    checkbox.addEventListener("change", () => handleToggleTodo(todo.id));

    const checkMark = document.createElement("span");
    checkMark.className = "check-mark";
    checkMark.setAttribute("aria-hidden", "true");

    checkWrap.append(checkbox, checkMark);

    const content = document.createElement("div");
    content.className = "todo-content";

    const textRow = document.createElement("div");
    textRow.style.display = "flex";
    textRow.style.alignItems = "center";
    textRow.style.gap = "8px";
    textRow.style.flexWrap = "wrap";

    const text = document.createElement("p");
    text.className = "todo-text";
    text.style.margin = "0";
    text.textContent = todo.text;

    const priorityLabel = document.createElement("span");
    priorityLabel.className = `priority-badge ${todo.priority || "medium"}`;
    priorityLabel.textContent = getPriorityLabel(todo.priority || "medium");

    textRow.append(text, priorityLabel);

    const meta = document.createElement("p");
    meta.className = "todo-meta";
    meta.textContent = `创建于 ${formatTime(todo.createdAt)}`;

    content.append(textRow, meta);

    const editForm = document.createElement("div");
    editForm.className = "edit-form";

    const editInput = document.createElement("input");
    editInput.className = "edit-input";
    editInput.type = "text";
    editInput.value = todo.text;
    editInput.maxLength = 120;
    editInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        handleSaveEdit(todo.id);
      } else if (event.key === "Escape") {
        handleCancelEdit(todo.id);
      }
    });

    const saveButton = document.createElement("button");
    saveButton.className = "save-button";
    saveButton.type = "button";
    saveButton.textContent = "保存";
    saveButton.addEventListener("click", () => handleSaveEdit(todo.id));

    const cancelButton = document.createElement("button");
    cancelButton.className = "cancel-button";
    cancelButton.type = "button";
    cancelButton.textContent = "取消";
    cancelButton.addEventListener("click", () => handleCancelEdit(todo.id));

    editForm.append(editInput, saveButton, cancelButton);

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.type = "button";
    editButton.textContent = "编辑";
    editButton.setAttribute("aria-label", `编辑任务“${todo.text}”`);
    editButton.addEventListener("click", () => handleStartEdit(todo.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "删除";
    deleteButton.setAttribute("aria-label", `删除任务“${todo.text}”`);
    deleteButton.addEventListener("click", () => handleDeleteTodo(todo.id));

    actions.append(editButton, deleteButton);

    item.append(checkWrap, content, editForm, actions);
    todoList.append(item);
  });

  updateCounts();
}

function updateCounts() {
  const completed = todos.filter((todo) => todo.completed).length;
  const pending = todos.length - completed;

  pendingCount.textContent = String(pending);
  completedCount.textContent = String(completed);
  totalCount.textContent = String(todos.length);
}

function setFeedback(message, isPositive = false) {
  feedback.textContent = message;
  feedback.style.color = isPositive ? "var(--blue-strong)" : "var(--danger)";

  if (isPositive) {
    window.clearTimeout(setFeedback.timeoutId);
    setFeedback.timeoutId = window.setTimeout(() => {
      feedback.textContent = "";
    }, 1800);
  }
}

function getPriorityLabel(priority) {
  const labels = { high: "高", medium: "中", low: "低" };
  return labels[priority] || "中";
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}
