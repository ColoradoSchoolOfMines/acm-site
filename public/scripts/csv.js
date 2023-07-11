// This is a little goofy, but we need to pass attendance data through the client side
let csvButtons = document.getElementsByClassName("attendance-csv");
for (let i = 0; i < csvButtons.length; i++) {
    csvButtons[i].addEventListener("click", () => {
        let data = csvButtons[i].getAttribute('data-attendance');
        generateCSV(data);
    });
}

// credit to https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
generateCSV = (attendanceData) => {
    attendanceData = JSON.parse(attendanceData);
    attendance = attendanceData[0];
    date = attendanceData[1].split('T')[0];

    let rows = [["Email"]];
    for (let user in attendance) {
        rows.push([attendance[user].user]);
    }

    let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance-" + date + ".csv");
    document.body.appendChild(link);
    link.click();
}
