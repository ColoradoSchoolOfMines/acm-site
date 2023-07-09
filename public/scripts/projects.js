const forms = document.querySelectorAll('.project-form');

for (form of forms) {
	const authorAdd = form.querySelector('#author-add');
	authorAdd.addEventListener('click', () => addAuthorTo(form));
	const authorRemove = form.querySelector('#author-remove');
	authorRemove.addEventListener('click', () => removeAuthorFrom(form));
	let initialAuthors = form.querySelectorAll('.author');
	form.addEventListener('reset', () => resetAuthors(form, initialAuthors));
}

const addAuthorTo = (form) => {
	let authors = form.querySelectorAll('.author');
	let n = authors.length + 1;

	authors[authors.length - 1].insertAdjacentHTML(
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
	let authors = form.querySelectorAll('.author');
	for (author of authors) {
		let found = false;
		for (other of to) {
			if (author.id == other.id) {
				found = true;
				break;
			}
		}

		if (!found) {
			author.parentElement.removeChild(author);
		}
	}
}
