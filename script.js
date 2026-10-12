
'use strict';

const STORAGE_KEY = 'todoList';

const form = document.querySelector('#todo-form');
const nameInput = document.querySelector('#item-name');
const dateInput = document.querySelector('#item-date');
const priorityInput = document.querySelector('#item-priority');
const formMessage = document.querySelector('#form-message');

const lists = {
    today: document.querySelector('#today-list'),
    future: document.querySelector('#future-list'),
    completed: document.querySelector('#completed-list')
};

const counts = {
    today: document.querySelector('#today-count'),
    future: document.querySelector('#future-count'),
    completed: document.querySelector('#completed-count')
};

// Get today's date in local YYYY-MM-DD format.
function localDateString() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Set today's date as the default deadline.
dateInput.value = localDateString();

// Load tasks from local storage.
function loadTasks() {
    try {
        const storedTasks = localStorage.getItem(STORAGE_KEY);

        if (!storedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(storedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks
            .filter(task =>
                task &&
                typeof task.name === 'string' &&
                typeof task.date === 'string' &&
                ['High', 'Medium', 'Low'].includes(task.priority)
            )
            .map(task => ({
                id: task.id || createId(),
                name: task.name,
                date: task.date,
                priority: task.priority,
                completed: task.completed === true
            }));
    } catch (error) {
        console.error('Unable to load tasks:', error);
        return [];
    }
}

// Generate a unique identifier for each task.
function createId() {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
}

let tasks = loadTasks();

// Save tasks to local storage.
function saveTasks() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(tasks)
        );
        return true;
    } catch (error) {
        console.error('Unable to save tasks:', error);
        showMessage(
            'Could not save tasks. Check browser storage availability.'
        );
        return false;
    }
}

// Display validation and status messages.
function showMessage(message = '') {
    formMessage.textContent = message;
}

// Convert YYYY-MM-DD to DD/MM/YYYY.
function formatDate(dateString) {
    const parts = dateString.split('-');

    if (parts.length !== 3) {
        return dateString;
    }

    const [year, month, day] = parts;

    return `${day}/${month}/${year}`;
}

// Create an accessible action button with an SVG icon.
function makeIconButton(label, svgMarkup, action, taskId) {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'icon-button';
    button.setAttribute('aria-label', label);
    button.title = label;

    button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            ${svgMarkup}
        </svg>
    `;

    button.addEventListener('click', () => {
        action(taskId);
    });

    return button;
}

// Toggle a task between completed and incomplete.
function toggleTask(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return {
                ...task,
                completed: !task.completed
            };
        }

        return task;
    });

    if (saveTasks()) {
        renderTasks();
        showMessage('Task status updated.');
    }
}

// Delete a task.
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);

    if (saveTasks()) {
        renderTasks();
        showMessage('Task deleted successfully.');
    }
}

// Create the HTML row for one task.
function createTaskRow(task, index) {
    const row = document.createElement('article');

    row.className = `task-row ${
        task.completed ? 'completed' : ''
    }`;

    const taskName = document.createElement('span');
    taskName.className = 'task-name';
    taskName.textContent = `${index + 1}. ${task.name}`;

    const taskDate = document.createElement('span');
    taskDate.className = 'task-date';
    taskDate.textContent = formatDate(task.date);

    const taskPriority = document.createElement('span');
    taskPriority.className = 'task-priority';
    taskPriority.textContent = `Priority: ${task.priority}`;

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    if (!task.completed) {
        actions.appendChild(
            makeIconButton(
                'Mark task as completed',
                '<circle cx="12" cy="12" r="8.5"></circle>' +
                '<path d="m8.5 12 2.2 2.2 4.8-5"></path>',
                toggleTask,
                task.id
            )
        );
    } else {
        actions.appendChild(
            makeIconButton(
                'Mark task as incomplete',
                '<path d="M20 7v5h-5"></path>' +
                '<path d="M19 12a7 7 0 1 1-2-5"></path>',
                toggleTask,
                task.id
            )
        );
    }

    actions.appendChild(
        makeIconButton(
            'Delete task',
            '<path d="M4 7h16"></path>' +
            '<path d="M10 11v6M14 11v6"></path>' +
            '<path d="M6 7l1 14h10l1-14"></path>' +
            '<path d="M9 7V4h6v3"></path>',
            deleteTask,
            task.id
        )
    );

    row.append(
        taskName,
        taskDate,
        taskPriority,
        actions
    );

    return row;
}

// Render tasks inside a section.
function renderList(container, listTasks) {
    container.replaceChildren();

    if (listTasks.length === 0) {
        const emptyMessage = document.createElement('p');

        emptyMessage.className = 'empty-state';
        emptyMessage.textContent = 'No tasks here.';

        container.appendChild(emptyMessage);
        return;
    }

    listTasks.forEach((task, index) => {
        container.appendChild(
            createTaskRow(task, index)
        );
    });
}

// Categorize and display all tasks.
function renderTasks() {
    const today = localDateString();

    const todayTasks = tasks.filter(task =>
        !task.completed && task.date === today
    );

    // Future section includes future-dated and overdue incomplete tasks.
    const futureTasks = tasks.filter(task =>
        !task.completed && task.date !== today
    );

    const completedTasks = tasks.filter(task =>
        task.completed
    );

    todayTasks.sort((a, b) =>
        a.date.localeCompare(b.date)
    );

    futureTasks.sort((a, b) =>
        a.date.localeCompare(b.date)
    );

    completedTasks.sort((a, b) =>
        a.date.localeCompare(b.date)
    );

    renderList(lists.today, todayTasks);
    renderList(lists.future, futureTasks);
    renderList(lists.completed, completedTasks);

    counts.today.textContent = `(${todayTasks.length})`;
    counts.future.textContent = `(${futureTasks.length})`;
    counts.completed.textContent = `(${completedTasks.length})`;
}

// Handle adding a new task.
form.addEventListener('submit', event => {
    event.preventDefault();
    showMessage();

    const name = nameInput.value.trim();
    const date = dateInput.value;
    const priority = priorityInput.value;

    // Prevent empty or invalid submissions.
    if (!name || !date || !priority) {
        showMessage(
            'Please enter a task name, deadline, and priority.'
        );
        return;
    }

    // Validate date format and actual calendar date.
    if (!isValidDate(date)) {
        showMessage('Please choose a valid deadline date.');
        return;
    }

    const newTask = {
        id: createId(),
        name: name,
        date: date,
        priority: priority,
        completed: false
    };

    tasks.push(newTask);

    if (saveTasks()) {
        renderTasks();
        form.reset();

        // Restore today's date after resetting the form.
        dateInput.value = localDateString();

        nameInput.focus();
        showMessage('Task added successfully.');
    } else {
        // Roll back the in-memory addition if saving fails.
        tasks = tasks.filter(task => task.id !== newTask.id);
        renderTasks();
    }
});

// Validate both date format and calendar validity.
function isValidDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

// Initial page rendering.
renderTasks();