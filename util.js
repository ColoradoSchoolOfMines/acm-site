module.exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
  });
}

module.exports.formatDuration = (date, duration) => {
  const endTime = new Date(new Date(date).getTime() + parseInt(duration));
  const newDuration = date.toLocaleDateString('en-US', { hour: 'numeric' }).split(", ")[1] 
    + " to " + endTime.toLocaleDateString('en-US', { hour: 'numeric' }).split(", ")[1];
  return newDuration;
}
