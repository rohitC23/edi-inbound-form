let formData = {}; // Object to store form data for each tab

async function fetchAndPopulateForm(url, formId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data from ' + url);
        }
        const data = await response.json();
        populateForm(data, formId);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateForm(questions, formId) {
    const form = document.getElementById(formId);
    form.innerHTML = ''; // Clear previous form content
    questions.forEach(question => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');

        const questionLabel = document.createElement('label');
        questionLabel.textContent = question['X12 Node name'];
        questionDiv.appendChild(questionLabel);

        const radioGroupDiv = document.createElement('div');
        radioGroupDiv.classList.add('radio-group');

        question['X12 Comments'].forEach((option, index) => {
            const optionLabel = document.createElement('label');
            const optionInput = document.createElement('input');
            optionInput.type = 'radio';
            optionInput.name = `question_${question.Id}`; // Ensure each question has a unique name
            optionInput.value = option;
            optionInput.id = `question_${question.Id}_option_${index}`;
            optionLabel.htmlFor = optionInput.id;
            optionLabel.textContent = option;

            // Pre-select the first option or previously saved option
            if (option === question['Canonical Node name'] || (formData[formId] && formData[formId][`question_${question.Id}`] === option)) {
                optionInput.checked = true;
            }

            optionLabel.prepend(optionInput);
            radioGroupDiv.appendChild(optionLabel);
        });

        questionDiv.appendChild(radioGroupDiv);
        form.insertBefore(questionDiv, form.querySelector('.submit-btn'));
    });
}

document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        alert('Form submitted successfully!');
    });
});

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;

    // Hide all tab content by default
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Remove the active class from all tab links
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    // Save form data before switching tab
    document.querySelectorAll('form').forEach(form => {
        const formId = form.id;
        formData[formId] = {};
        form.querySelectorAll('.question').forEach(questionDiv => {
            const questionId = questionDiv.querySelector('input[type="radio"]').name;
            const selectedOption = questionDiv.querySelector('input[type="radio"]:checked');
            formData[formId][questionId] = selectedOption ? selectedOption.value : null;
        });
    });

    // Fetch data for the selected tab
    let url, formId;
    switch (tabName) {
        case 'General':
            url = 'http://34.121.205.40:5000/general';
            formId = 'feedbackFormGeneral';
            break;
        case 'Load':
            url = 'http://34.121.205.40:5000/load/references';
            formId = 'feedbackFormLoad';
            break;
        case 'Equipment':
            url = 'http://34.121.205.40:5000/equipment';
            formId = 'feedbackFormEquipment';
            break;
        case 'Stop':
            url = 'http://34.121.205.40:5000/stop';
            formId = 'feedbackFormStop';
            break;
        case 'Summary':
            updateSummary();
            return; // Exit the function early as no form data needs to be fetched
        default:
            url = 'http://34.121.205.40:5000/general';
            formId = 'feedbackFormGeneral';
    }
    fetchAndPopulateForm(url, formId);
}

function updateSummary() {
    const summaryContent = document.getElementById('Summary').querySelector('p');
    const responses = [];

    document.querySelectorAll('form').forEach(form => {
        const formResponses = {};
        form.querySelectorAll('.question').forEach(questionDiv => {
            const questionLabel = questionDiv.querySelector('label').textContent;
            const selectedOption = questionDiv.querySelector('input[type="radio"]:checked');
            formResponses[questionLabel] = selectedOption ? selectedOption.value : 'No response';
        });
        responses.push(formResponses);
    });

    // Create a table for the summary
    const table = document.createElement('table');
    table.classList.add('summary-table');

    responses.forEach(response => {
        Object.keys(response).forEach(question => {
            const row = document.createElement('tr');

            const questionCell = document.createElement('td');
            questionCell.innerHTML = `<strong>${question}</strong>`;
            row.appendChild(questionCell);

            const responseCell = document.createElement('td');
            responseCell.textContent = response[question];
            row.appendChild(responseCell);

            table.appendChild(row);
        });
    });

    // Clear previous summary content and append the new table
    summaryContent.innerHTML = '';
    summaryContent.appendChild(table);
}

// Function to save summary content to a file
function saveSummaryToFile() {
    const summaryTable = document.querySelector('.summary-table');
    if (!summaryTable) {
        console.error('Summary table not found');
        return;
    }

    let summaryContent = '';
    const rows = summaryTable.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {  // Ensure there are at least 2 cells
            const question = cells[0].innerText.trim();
            const response = cells[1].innerText.trim();
            summaryContent += `${question}: ${response}\n`;
        }
    });

    // Create a JSON object to send in the POST request
    const summaryData = {
        summary: summaryContent
    };

    // Send the summary data as a POST request
    fetch('http://34.121.205.40:5000/summary', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(summaryData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to refresh all forms
function refreshAllForms() {
    document.querySelectorAll('.tablinks').forEach(tablink => {
        const tabName = tablink.getAttribute('data-tab');
        let url, formId;
        switch (tabName) {
            case 'General':
                url = 'http://34.121.205.40:5000/general';
                formId = 'feedbackFormGeneral';
                break;
            case 'Load':
                url = 'http://34.121.205.40:5000/load/references';
                formId = 'feedbackFormLoad';
                break;
            case 'Equipment':
                url = 'http://34.121.205.40:5000/equipment';
                formId = 'feedbackFormEquipment';
                break;
            case 'Stop':
                url = 'http://34.121.205.40:5000/stop';
                formId = 'feedbackFormStop';
                break;
            // Add more cases for other tabs as needed
            default:
                url = 'http://34.121.205.40:5000/general';
                formId = 'feedbackFormGeneral';
        }
        fetchAndPopulateForm(url, formId);
    });
}


// Function to download preview content as a DOC file
function downloadDocFile() {
    // Get the preview content
    let previewContent = document.getElementById('previewContent').innerHTML;

    // Replace commas with newline characters in the Comments1 column
    const parser = new DOMParser();
    const doc = parser.parseFromString(previewContent, 'text/html');
    const cells = doc.querySelectorAll('td');

    cells.forEach(cell => {
        if (cell.textContent.includes(',')) {
            cell.innerHTML = cell.innerHTML.replace(/,/g, '<br>');
        }
    });

    previewContent = doc.body.innerHTML;

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
    "xmlns:w='urn:schemas-microsoft-com:office:word' "+
    "xmlns='http://www.w3.org/TR/REC-html40'>"+
    "<head><meta charset='utf-8'><title>Document</title>"+
    "<style>"+
    "body { font-family: Arial, sans-serif; }"+
    "table { border-collapse: collapse; width: 100%; table-layout: fixed; }"+
    "th, td { border: 1px solid black; padding: 4px; text-align: left; font-size: 7px; word-wrap: break-word; }"+
    "th { background-color: #f2f2f2; }"+
    "</style>"+
    "</head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + previewContent + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = 'EDI_204_INBOUND_FORM.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
}

// Set default tab to be open on page load
document.addEventListener("DOMContentLoaded", function() {
    document.getElementsByClassName("tablinks")[0].click();

    // Add event listener to update summary when switching to the Summary tab
    document.querySelector('button.tablinks[onclick="openTab(event, \'Summary\')"]').addEventListener('click', updateSummary);

    // Add event listener to the save button
    document.getElementById('save-btn').addEventListener('click', saveSummaryToFile);

    // Add event listener to the download button
    document.getElementById('download-btn').addEventListener('click', downloadDocFile);
});


document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll(".tabcontent");
    const nextButtons = document.querySelectorAll(".next-btn");
    const tabLinks = document.querySelectorAll(".tablinks");
    const saveButton = document.getElementById('save-btn');
    const backButton = document.getElementById('backButton');
    const previewSection = document.getElementById('previewSection');
    const previewContent = document.getElementById('previewContent');
    const tabsSection = document.getElementById('tabsSection');
    const downloadButton = document.getElementById('download-btn');
    const thankYouMsg = document.getElementById('thankyou-msg');
    const closeButton = document.getElementById('close-btn');
    const previewTitle = document.getElementById('preview-title');

    if (tabs.length > 0) {
        tabs[0].style.display = "block";
        tabLinks[0].classList.add("active");
    }

    nextButtons.forEach((button, index) => {
        button.addEventListener("click", function() {
            const nextIndex = index + 1;
            if (nextIndex < tabs.length) {
                tabLinks[nextIndex].click();
            }
        });
    });

    saveButton.addEventListener('click', async function() {
        try {
            const response = await fetch('http://34.121.205.40:5000/get/details');
            if (!response.ok) {
                throw new Error('Failed to fetch details');
            }
            const data = await response.json();
    
            const table = document.createElement('table');
            table.classList.add('preview-table');
    
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const keys = Object.keys(data[0]);
            keys.forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
    
            const tbody = document.createElement('tbody');
            data.forEach(item => {
                const row = document.createElement('tr');
                keys.forEach(key => {
                    const td = document.createElement('td');
                    if (Array.isArray(item[key])) {
                        if (key === 'X12 Comments') {
                            // Filter out empty elements and join with comma and newline
                            const filteredElements = item[key].filter(el => el.trim() !== '');
                            td.innerHTML = filteredElements.map(el => `${el},`).join('<br>');
                        } else {
                            td.textContent = item[key].join(', ');
                        }
                    } else {
                        td.textContent = item[key];
                    }
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
    
            previewContent.innerHTML = '';
            previewContent.appendChild(table);
    
            tabsSection.style.display = 'none';
            previewSection.style.display = 'block';
        } catch (error) {
            console.error('Error fetching preview:', error);
        }
    });
    
    
    

    backButton.addEventListener('click', function() {
        previewSection.style.display = 'none';
        tabsSection.style.display = 'block';
        document.getElementById('generalTabLink').click();
    });

    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            alert('Form submitted successfully!');
        });
    });

    const uploadButton = document.getElementById('uploadButton');
    const uploadLabel = document.getElementById('uploadLabel');

    uploadButton.addEventListener('change', () => {
        const fileName = uploadButton.files.length > 0 ? uploadButton.files[0].name : 'No file chosen';
        uploadLabel.textContent = `Choose File (${fileName})`;
    });

    document.getElementById('uploadButton').addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('http://34.121.205.40:5000/upload/file', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Failed to upload file');
                }

                const result = await response.json();

                const alertBox = document.createElement('div');
                alertBox.innerText = 'File uploaded successfully';
                alertBox.style.position = 'fixed';
                alertBox.style.top = '10px';
                alertBox.style.left = '50%';
                alertBox.style.transform = 'translateX(-50%)';
                alertBox.style.backgroundColor = '#38A70C';
                alertBox.style.color = 'white';
                alertBox.style.padding = '15px';
                alertBox.style.borderRadius = '5px';
                document.body.appendChild(alertBox);

                setTimeout(() => {
                    alertBox.style.display = 'none';
                    document.getElementById('uploadSection').style.display = 'none';
                    document.getElementById('tabsSection').style.display = 'block';
                    refreshAllForms();
                }, 1000);
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }
    });

    document.getElementById('continueDefaultTemplate').addEventListener('click', async function() {
        try {
            const response = await fetch('http://34.121.205.40:5000/default/file', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to upload default template');
            }

            const result = await response.json();

            const alertBox = document.createElement('div');
            alertBox.innerText = 'Default template uploaded successfully';
            alertBox.style.position = 'fixed';
            alertBox.style.top = '10px';
            alertBox.style.left = '50%';
            alertBox.style.transform = 'translateX(-50%)';
            alertBox.style.backgroundColor = '#38A70C';
            alertBox.style.color = 'white';
            alertBox.style.padding = '15px';
            alertBox.style.borderRadius = '5px';
            document.body.appendChild(alertBox);
            

            setTimeout(() => {
                alertBox.style.display = 'none';
                document.getElementById('uploadSection').style.display = 'none';
                document.getElementById('tabsSection').style.display = 'block';
                refreshAllForms();
            }, 1000);
        } catch (error) {
            console.error('Error uploading default template:', error);
        }
    });

    document.getElementById('close-btn').addEventListener('click', function() {
        // Open the current page in a new window
        var newWindow = window.open(window.location.href, '_self');
        // Close the new window
        // newWindow.close();
    });

    downloadButton.addEventListener('click', function() {
        previewTitle.style.display='none';
        previewContent.style.display = 'none';
        backButton.style.display = 'none';
        downloadButton.style.display = 'none';
        thankYouMsg.style.display = 'block';
        closeButton.style.display = 'block';
    });
});
