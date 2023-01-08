import '../node_modules/normalize.css/normalize.css';
import './style.css';

/*
 * Задание:
 * Реализовать ToDoList приложение которое будет отображать список всех дел
 * Можно: просмотреть список всех дел, добавить todo и удалить, а так же изменить
 *
 * */


class ApiService {

    fetchAllNames() {
        return fetch('https://jsonplaceholder.typicode.com/users').then((res) => res.json());
    }

    fetchNamesById(id) {
        return fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((res) => res.json());
    }


    fetchAllTodos() {
        return fetch('https://jsonplaceholder.typicode.com/posts').then((res) => res.json());
    }

    create(data) {
        return fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify(data),
        }).then((res) => {
            return res.json();
        });
    }

    update(id, data) {
        return fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify(data),
        }).then((res) => {
            return res.json();
        });
    }

    remove(id) {
        return fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
            method: 'DELETE',
        });
    }
}

class TodoService {
    toToList;

    constructor(api) {
        this.api = api;
        this.toToList = window.document.querySelector('.todo-list');
        this._handleUpdate = this._handleUpdate.bind(this);
        this._handleRemove = this._handleRemove.bind(this);
        
        this.modalServiceUpdate = new ModalServiceUpdate(this, api);
    }

    addTodo(number, title, body, userId) {
        this.toToList.append(this._createTodo(number, title, body, userId));
    }

    _createTodo(number, title, body, userId) {
        const container = document.createElement('div');
        container.classList.add('todo-list__item');
        container.cardId = number;
        container.cardUserId = userId;
        container.classList.add('card');
        const header = document.createElement('div');
        header.classList.add('card__header');
        const content = document.createElement('div');
        content.classList.add('card__content');

        const numberTask = document.createElement('h3');
        numberTask.append(document.createTextNode(number));
        numberTask.classList.add('card__number');

        const userIdTask = document.createElement('h3');
        this.api.fetchNamesById(userId).then((result) => userIdTask.append(document.createTextNode('Name: '+ result.username)));
        userIdTask.classList.add('card__userId');

        const titleTask = document.createElement('h3');
        titleTask.append(document.createTextNode(title));
        titleTask.classList.add('card__title');

        content.append(document.createTextNode(body));
        content.classList.add('card__body');

        const buttonTask2 = document.createElement('button');
        buttonTask2.append(document.createTextNode('Update'));
        buttonTask2.classList.add('card__remove');

        const buttonTask = document.createElement('button');
        buttonTask.append(document.createTextNode('Drop'));
        buttonTask.classList.add('card__remove');

        const containerTask = document.createElement('div');
        containerTask.append(buttonTask2);
        containerTask.append(buttonTask);
        
        header.append(numberTask);
        header.append(userIdTask);
        header.append(titleTask);
        header.append(containerTask);

        container.append(header);
        container.append(content);
        buttonTask2.addEventListener('click', this._handleUpdate);
        buttonTask.addEventListener('click', this._handleRemove);
        
        return container;
    }

    updateTodo(card, title, body, userId) {
        card.childNodes[0].childNodes[2].innerText = title;
        card.childNodes[1].innerText = body;

        this.api.fetchNamesById(userId).then((result) => card.childNodes[0].childNodes[1].innerText = 'User: '+ result.username);
    }

    _handleUpdate(event) {
        const card = event.target.parentElement.parentElement.parentElement;
        this.modalServiceUpdate.open(card);
    }

    _handleRemove(event) {
        const card = event.target.parentElement.parentElement.parentElement;
        this.api.remove(card.cardId).then((res) => {
            if (res.status >= 200 && res.status <= 300) {
                event.target.removeEventListener('click', this._handleRemove);
                card.remove();
            }
        });
    }
}

class ModalService {
    constructor(todoService, api) {
        this.api = api;
        this.todoService = todoService;
        this.overlay = document.querySelector('.overlay');
        this.modal = document.querySelector('.modal');

        this.listener = this.close.bind(this);
        document
            .querySelector('.modal svg')
            .addEventListener('click', this.listener);

        this.submitButton = document.querySelector('.submit-btn');
        this.submitButton.addEventListener('click', this._onCreate.bind(this));
    }

    open() {
        this.modal.classList.add('active');
        this.overlay.classList.add('active');
    }

    close() {
        document.getElementsByClassName('form-errors')[0].innerHTML = '';
        document.forms[1].reset();
        this.modal.classList.remove('active');
        this.overlay.classList.remove('active');
    }

    _onCreate(e) {
        e.preventDefault();

        const formData = {};
        const form = document.forms[0];

        Array.from(form.elements)
            .filter((item) => !!item.name)
            .forEach((elem) => {
                formData[elem.name] = elem.value;
        });

        if (!this._validateForm(form, formData)){
            return;
        }

        

        this.api.create(formData).then((data) => {
            this.todoService.addTodo(data.id, data.title, data.body, data.userId);
        });
        form.reset();
        this.close();
    }

    _validateForm(form, formData) {
        const errors = [];

        if (formData.userId >= 11 || formData.userId <= 0) {
            errors.push('Поле пользователь должно содержать число от 1 до 10');
        }
        if (formData.title.length > 100) {
            errors.push('Поле наименование должно иметь не более 100 символов');
        }
        if (!formData.body.length) {
            errors.push('Поле описание должно быть заполнено');
        }

        if (errors.length) {
            const errorEl = form.getElementsByClassName('form-errors')[0];
            errorEl.innerHTML = errors.map((er) => `<div>${er}</div>`).join('');

            return false;
        }

        return true;
    }
}

class ModalServiceUpdate{
    _card;
    constructor(todoService, api) {
        this.api = api;
        this.todoService = todoService;
        this.overlay = document.querySelector('.overlay');
        this.modal = document.querySelector('.modalUpdate');

        this.listener = this.close.bind(this);
        document.querySelector('.modalUpdate svg').addEventListener('click', this.listener);

        this.submitBtn = document.querySelector('.submit-btn-upd');
        this.submitBtn.addEventListener('click', this._onUpdate.bind(this));
    }


    open(card) {
        this.modal.classList.add('active');
        this.overlay.classList.add('active');

        this._card = card;
        document.querySelector('.modal__title-id').innerText = this._card.cardId;
        
        const form = document.forms[1];

        form.elements[0].value = card.cardUserId;
        form.elements[1].value = card.childNodes[0].childNodes[2].innerText;
        form.elements[2].value = card.childNodes[1].innerText;

    }

    close() {
        document.getElementsByClassName('formUpdate-errors')[0].innerHTML = '';
        document.forms[1].reset();
        this.modal.classList.remove('active');
        this.overlay.classList.remove('active');
    }

    _onUpdate(e) {

        const formData = {id: this._card.cardId};
        const form = document.forms[1];

        Array.from(form.elements)
            .filter((item) => !!item.name)
            .forEach((elem) => {
                formData[elem.name.slice(0,-3)] = elem.value;
        });

        if (!this._validateFormUpd(form, formData)) {
            return;
        }
   
        this.api.update(this._card.cardId, formData).then((data) => {
            this.todoService.updateTodo(this._card, data.title, data.body, data.userId);
        });

        form.reset();
        this.close();
    }

    _validateFormUpd(form, formData) {
        const errors = [];
        
        if (formData.userId >= 11 || formData.userId <= 0) {
            errors.push('Поле пользователь должно содержать число от 1 до 10');
        }
        if (formData.title.length > 100) {
            errors.push('Поле наименование должно иметь не более 100 символов');
        }
        if (!formData.body.length) {
            errors.push('Поле описание должно быть заполнено');
        }
        
        if (errors.length) {
            const errorEl = form.getElementsByClassName('formUpdate-errors')[0];
            errorEl.innerHTML = errors.map((er) => `<div>${er}</div>`).join('');

            return false;
        }

        return true;
    }
}

class MainService {
    constructor(todoService, modalService, api) {
        this.modalService = modalService;
        this.api = api;
        this.todoService = todoService;
        document.getElementsByClassName('app');
        this.buttonAdd = document.getElementById('createButton');
        this.buttonAdd.addEventListener('click', (e) => this._onOpenModal(e));
    }

    fetchAllTodo() {
        this.api.fetchAllTodos().then((todos) => {
            todos.forEach((todo) =>
                this.todoService.addTodo(todo.id, todo.title, todo.body, todo.userId)
            );
        });
    }

    _onOpenModal() {
        this.modalService.open();
    }
}







const api = new ApiService();
const todoService = new TodoService(api);
const modalService = new ModalService(todoService, api);
const service = new MainService(todoService, modalService, api);
service.fetchAllTodo();