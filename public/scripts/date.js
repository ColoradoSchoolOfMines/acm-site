let dates = document.getElementsByClassName("date");
for (let timestamp of dates) {
	const date = new Date(timestamp.innerHTML);
	timestamp.innerHTML = new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

let dateTimes = document.getElementsByClassName("datetime");
for (let timestamp of dateTimes) {
	const split = timestamp.innerHTML.split(",");
	const date = new Date(split[0]);
	const duration = parseInt(split[1]);
	const endTime = new Date(date.getTime() + duration);
	const newDuration = " from " + date.toLocaleDateString('en-US', { hour: 'numeric' }).split(", ")[1]
		+ " to " + endTime.toLocaleDateString('en-US', { hour: 'numeric' }).split(", ")[1];

	timestamp.innerHTML = date.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}) + newDuration;
}
