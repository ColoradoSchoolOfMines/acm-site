// Implements the dynamic author input component in new/edit project modals

const configureForm = (form) => {
	const authors = form.querySelector(`#${form.getAttribute('data-project-authors-id')}`);
	if (!authors) {
		throw Error("Project forms must have an author input");
	}

	// Project author input is multi-valued, hence we need to build a custom widget that allows
	// an arbitrary amount of inputs to be added/removed as needed.
	authors.innerHTML =
		`<div id="${authors.id}-control" class="row row-cols-auto align-items-start mx-0 mb-3 gx-1 gy-1">
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

	authors.querySelector(`#${authors.id}-add`).addEventListener('click', () => addAuthor(authors, ""));
	authors.querySelector(`#${authors.id}-remove`).addEventListener('click', () => removeAuthor(authors));
	form.addEventListener('reset', () => resetAuthors(authors));

	// Any project edit dialog will have pre-existing authors to show inputs for, add them here. 
	populateAuthors(authors);
}

const addAuthor = (authors, value) => {
	let control = authors.querySelector(`#${authors.id}-control`);
	let n = authors.querySelectorAll('.author-input').length
	// It's easiest to add new author input "before" the controls.
	control.insertAdjacentHTML(
		'beforebegin',
		`<div id="author-input-${n}" class="author-input mb-3">
            <label class="form-label" for="${authors.id}-${n}">Author ${n + 1}</label>
            <div class="input-group">
            	<input id="${authors.id}-${n}" class="form-control" name="author${n}" type="text" value="${value}" placeholder="Mines username" required
            		aria-label="Username" aria-describedby="email-addon" />
  				<span class="input-group-text" id="email-addon">@mines.edu</span>
            </div>
        </div>`
	);
}

const removeAuthor = (authors) => {
	let inputs = authors.querySelectorAll('.author-input');
	// Don't allow projects to have zero authors.
	if (inputs.length > 1) {
		// Currently, author removal just reduces the amount of inputs
		// in the dialog, which does mean you can't remove an arbitrary
		// author from the list. This is a little clunky, but building
		// the layout is somewhat easier this way.
		authors.removeChild(inputs[inputs.length - 1]);
	}
}

const resetAuthors = (authors, values) => {
	// Since we have to handle cases where the amount of authors is higher
	// or lower than before, it's largely easier to just remove all of the
	// authors and replace them with the initial ones.
	destroyAuthors(authors);
	populateAuthors(authors, values);
}

const populateAuthors = (authors) => {
	let authorValues = JSON.parse(authors.getAttribute(`data-project-authors-value`));
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
