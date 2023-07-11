let dates = document.getElementsByClassName("date");
for (let i = 0; i < dates.length; i++) {
	const date = new Date(dates[i].innerHTML.split(",")[0]);
	const duration = dates[i].innerHTML.split(",")[1];
	const endTime = new Date(date.getTime() + parseInt(duration));
	const newDuration = " from " + date.toLocaleDateString('en-US', { hour: 'numeric' }).split(", ")[1]
		+ " to " + endTime.toLocaleDateString('en-US', { hour: 'numeric' }).split(", ")[1];

	dates[i].innerHTML = new Date(date).toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}) + newDuration;
}
