const configureForm = (form) => {
	const authorAdd = form.querySelector('#author-add');
	authorAdd.addEventListener('click', () => addAuthorTo(form));
	const authorRemove = form.querySelector('#author-remove');
	authorRemove.addEventListener('click', () => removeAuthorFrom(form));
	let initialAuthors = form.querySelectorAll('.author');
	form.addEventListener('reset', () => resetAuthors(form, initialAuthors));
}

const addAuthorTo = (form) => {
	let authors = form.querySelectorAll('.author');
	
	let tail;
	if (authors) {
		tail = authors[authors.length - 1];
	} else {
		tail = form.querySelectorAll('#website');
	}

	let n = authors.length + 1;
 	tail.insertAdjacentHTML(
		'afterend', 
		`
        <div id="author-${n}" class="author">
            <label class="d-block py-1" for="author-name-${n}">Author ${n}</label>
            <input id="author-name-${n}" name="author${n}" type="email" required />
        </div>
		`
	);
}

const removeAuthorFrom = (form) => {
	let authors = form.querySelectorAll('.author');
	if (authors.length > 1) {
		let author = authors[authors.length - 1];
		author.parentElement.removeChild(author);
	}
}

const resetAuthors = (form, to) => {
	// TODO: Need to handle if there were less authors than original
	let authors = form.querySelectorAll('.author');
	let container = authors[0].parentElement
	for (author of authors) {
		author.parentElement.removeChild(author);
	}
	for (author of to) {
		container.removeChild(author);
	}
}

const forms = document.querySelectorAll('.project-form');
for (form of forms) {
	configureForm(form);
}
