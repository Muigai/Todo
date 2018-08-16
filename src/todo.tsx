import { CheckBox, TextBox } from "rahisi";
import { React } from "rahisi";

import {
    Renderable,
    Template,
    VersionedList,
} from "rahisi";

import {
    A1,
    ENTER_KEY,
    ESCAPE_KEY,
    F0,
    F1,
    notNullOrWhiteSpace,
} from "rahisi-type-utils";

class Todo {
    constructor(public description: string, public isCompleted: boolean) { }
}

class FilterUrl {
    constructor(
        public readonly text: string,
        public readonly hash: string,
        public readonly isHidden: F1<Todo, boolean>) { }
}

const currentHash = () => window.location.hash;

const todos = new VersionedList<Todo>();

const loadTodos =
    () => {

        // todos = new VersionedList<Todo>();

        // const a = window.localStorage.getItem(storage);

        // todos = a !== null ?
        //     new VersionedList<Todo>(JSON.parse(a)) :
        //     new VersionedList<Todo>();
    };

// tslint:disable-next-line:no-empty
const saveTodos = () => { }; // window.localStorage.setItem(storage, JSON.stringify(todos.getItems()));

export let main =
    () => {

        loadTodos();

        const activeCount = () => todos.filter((a) => !a.isCompleted).length;

        const filters =
            new VersionedList<FilterUrl>(
                [
                    { key: 1, value: new FilterUrl("All", "#!/", () => false) },
                    { key: 2, value: new FilterUrl("Active", "#/active", (a) => a.isCompleted) },
                    { key: 3, value: new FilterUrl("Completed", "#/completed", (a) => !a.isCompleted) },
                ]);

        const currentFilter =
            () => filters.filter((a: FilterUrl) => currentHash().includes(a.hash))[0] || filters.getItem(0);

        const header = headerSection(todos);

        const removeTodo = (a: Todo) => todos.remove(a);

        const main = mainSection(
            todos,
            activeCount,
            todoTemplate(removeTodo, currentFilter),
        );

        const footer = footerSection(todos, activeCount, filters);

        const section = (
            <>
                <section className="todoapp">{header}{main}{footer}</section>
                <footer className="info">
                    <p>Double-click to edit a todo</p>
                    <p>Written by <a href="https://github.com/muigai">Muigai Mwaura</a></p>
                    <p>*Not* part of <a href="http://todomvc.com">TodoMVC</a></p>
                </footer>;
            </>);

        const body = document.body;

        window.addEventListener("blur", saveTodos);

        section.mount(body);
    };

const headerSection =
    (todos: VersionedList<Todo>) => {

        let editingDescription = "";

        const addTodo =
            (e: React.KeyboardEvent<HTMLInputElement>) => {

                if (e.keyCode !== ENTER_KEY || !notNullOrWhiteSpace(editingDescription)) {
                    return;
                }

                todos.add(new Todo(editingDescription.trim(), false));

                editingDescription = "";
            };

        const description = () => editingDescription;

        const s =
            <header className="header">
                <h1>todos</h1>
                <TextBox className="new-todo" autoFocus={true} placeholder="What needs to be done?"
                   onTextChanged={(s) => editingDescription = s} onKeyUp={addTodo} value={description} />
            </header>;

        return s;
    };

const todoTemplate =
    (removeTodo: A1<Todo>, currentFilter: F0<FilterUrl>) => {

        const result =
            (item: Todo) => {

                let currentDescription = item.description;

                let isEditMode = false;

                const edit =
                    () => {

                        currentDescription = item.description;

                        isEditMode = true;
                    };

                const submit =
                    () => {
                        if (!notNullOrWhiteSpace(item.description)) {
                            removeTodo(item);
                        }

                        saveTodos();
                    };

                const submitOrCancel =
                    (e: React.KeyboardEvent<HTMLInputElement>) => {
                        switch (e.keyCode) {
                            case ESCAPE_KEY:
                                item.description = currentDescription;
                                isEditMode = false;
                                break;
                            case ENTER_KEY:
                                submit();
                                isEditMode = false;
                                break;
                            default:
                                item.description = e.currentTarget.value;
                                break;
                        }
                    };

                const submitOnBlur =
                    () => {
                        if (isEditMode) {
                            submit();
                        }
                    };

                const itemClass =
                    () =>
                        currentFilter().isHidden(item) ? "hidden" :
                            item.isCompleted ? "completed" :
                                isEditMode ? "editing" : "";

                const template =
                    <li className={itemClass}>
                        <div className="view">
                            <CheckBox className="toggle"
                                checked={() => item.isCompleted}
                                onCheckChanged={(e) => item.isCompleted = e} />
                            <label onDoubleClick={edit}>{() => item.description}</label>
                            <button className="destroy" onClick={() => removeTodo(item)}></button>
                        </div>
                        <TextBox className="edit" focus={() => isEditMode} value={() => item.description}
                            onKeyUp={submitOrCancel} onBlur={submitOnBlur} />
                    </li>;

                return template;
            };

        return result;
    };

const mainSection = (
    todos: VersionedList<Todo>,
    activeCount: F0<number>,
    todoTemplate: F1<Todo, Renderable>) => {

    const toggleAll =
        (isDone: boolean) => todos.forEach((a) => a.isCompleted = isDone);

    const noActiveTodos = () => activeCount() === 0;

    const shouldShowMain = () => todos.count() === 0 ? "hidden" : "main";

    const m =
        <section className={shouldShowMain}>
            <CheckBox
                className="toggle-all" checked={noActiveTodos}
                onCheckChanged={(e) => toggleAll(e)} />
            <label htmlFor="toggle-all">Mark all as complete</label>
            <ul className="todo-list">
                <Template source={() => todos} template={todoTemplate} />
            </ul>
        </section>;

    return m;
};

const footerSection = (
    todos: VersionedList<Todo>,
    activeCount: F0<number>,
    filters: VersionedList<FilterUrl>) => {

    const footerClass = () => todos.count() === 0 ? "hidden" : "footer";

    const numberActive = () => activeCount().toString();

    const itemsLeft = () => ` item${activeCount() === 1 ? "" : "s"} left`;

    const clearButtonClass =
        () => todos.filter((a) => a.isCompleted).length === 0 ? "hidden" : "clear-completed";

    const clearCompleted =
        () => todos
            .filter((a) => a.isCompleted)
            .forEach((a) => todos.remove(a));

    const selectedAnchor = (f: FilterUrl) => () => document.URL.indexOf(f.hash) > 0 ? "selected" : "";

    const result =
        <footer className={footerClass}>
            <span className="todo-count">
                <strong>{numberActive}</strong> {itemsLeft}
            </span>
            <ul className="filters">
                <Template
                    source={() => filters}
                    template={(f) =>
                        <li>
                            <a className={selectedAnchor(f)} href={f.hash} >{f.text}</a>
                        </li>}
                />
            </ul>
            <button className={clearButtonClass} onClick={clearCompleted}>Clear completed</button>
        </footer>;

    return result;
};

document.addEventListener("DOMContentLoaded", main, false);
