const configureForm = (form) => {
	const authors = form.querySelector(`#${form.getAttribute('data-project-authors-id')}`);
	if (!authors) {
		return;
	}

	authors.innerHTML =
        `<div id="${authors.id}-control" class="row row-cols-auto align-items-start mx-0 mt-1 mb-2 gx-1 gy-1">
            <div class="col">
                <button id="${authors.id}-add" type="button" class="btn btn-outline-primary">
                    Add Author
                </button>
            </div>
            <div class="col">
                <button id="${authors.id}-remove" type="button" class="btn btn-outline-danger">
                    Remove Author
                </button>
            </div>
        </div>`

    populateAuthors(authors);
	authors.querySelector(`#${authors.id}-add`).addEventListener('click', () => addAuthor(authors));
	authors.querySelector(`#${authors.id}-remove`).addEventListener('click', () => removeAuthor(authors));
	form.addEventListener('reset', () => resetAuthors(authors));
}

const addAuthor = (authors, value = {name: '', email: '', hasProfile: false}) => {
	console.log(value);
	let control = authors.querySelector(`#${authors.id}-control`);
	let n = authors.querySelectorAll('.author-input').length
 	control.insertAdjacentHTML(
 		'beforebegin',
		`<div id="author-input-${n}" class="author-input">
            <label class="d-block py-1" for="${authors.id}-name-${n}">Author ${n + 1} Name</label>
            <input id="${authors.id}-name-${n}" name="author${n}Name" type="text" value="${value.name}" ${value.hasProfile ? "readonly" : "required"} />
            <label class="d-block py-1" for="${authors.id}-email-${n}">Author ${n + 1} Email</label>
            <input id="${authors.id}-email-${n}" name="author${n}Email" type="email" value="${value.email}" required />
        </div>`
	);
}

const removeAuthor = (authors) => {
	let inputs = authors.querySelectorAll('.author-input');
	if (inputs.length > 1) {
		authors.removeChild(inputs[inputs.length - 1]);
	}
}

const resetAuthors = (authors, values) => {
	destroyAuthors(authors);
	populateAuthors(authors, values);
}

const populateAuthors = (authors) => {
	let authorValues = JSON.parse(authors.getAttribute(`data-project-authors-value`));
	if (!authorValues) {
		addAuthor(authors);
		return;
	}
	for (let i = 0; i < authorValues.length; ++i) {
		addAuthor(authors, authorValues[i]);
	}
}

const destroyAuthors = (authors, to) => {
	let inputs = authors.querySelectorAll('.author-input');
	for (let i = 0; i < inputs.length; ++i) {
		authors.removeChild(inputs[i]);
	}
}

const forms = document.querySelectorAll('.project-form');
for (form of forms) {
	configureForm(form);
}
