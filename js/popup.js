
window.onload = main()
function main() {
    chrome.browserAction.setBadgeText({ text: "" })
    document.getElementById('savedTasks').innerHTML = ""
    chrome.storage.local.get('raffleTasks', (data) => {
        if (data && data.raffleTasks) {
            data.raffleTasks.forEach(task => {
                addTaskToDiv(task)
            })
        }
    })
}
function addTaskToDiv(Task) {
    let task_div = document.createElement('div')
    task_div.classList.add('task-div')
    let date_string = new Date(Task.TimeStamp).toString()
    task_div.innerText = Task.Type + '-' + date_string.substring(0, date_string.length - 30)
    let task_open = document.createElement('button')
    let task_delete = document.createElement('button')
    task_open.innerText = 'Open'
    task_open.classList.add('task-open')
    task_delete.innerText = 'Delete'
    task_delete.classList.add('task-delete')
    task_div.appendChild(task_open)
    task_div.appendChild(task_delete)
    task_open.addEventListener('click', () => {
        document.getElementById('savedTasks').style.display = "none"
        document.getElementById('taskDetails').style.display = "block"
        document.getElementById('url').value = Task.URL
        document.getElementById('captcha').value = Task.Captcha ? Task.Captcha : ""
        if (Task.Type === 'GoogleForm') {
            document.getElementById('googleForm-header').style.display = "block"
        } else if (Task.Type === 'TypeForm') document.getElementById('typeForm-header').style.display = "block"
        Task.Inputs.forEach(input => {
            let tr = document.createElement('tr')
            input.map(section => {
                let td = document.createElement('td')
                td.innerText = section
                tr.appendChild(td)
            })
            document.getElementById('inputs-tbody').appendChild(tr)
        })
    })
    task_delete.addEventListener('click', () => {
        chrome.storage.local.get('raffleTasks', (data) => {
            let indexDelete = data.raffleTasks.indexOf(data.raffleTasks.find(task => task.TimeStamp === Task.TimeStamp))
            data.raffleTasks.splice(indexDelete, 1)
            chrome.storage.local.set({ raffleTasks: data.raffleTasks }, () => main())
        })
    })
    document.getElementById('savedTasks').appendChild(task_div)
}

document.getElementById('copy-url').addEventListener('click', () => {
    document.getElementById('url').disabled = false
    document.getElementById('url').select()
    document.execCommand("copy")
    document.getElementById('url').disabled = true
})
document.getElementById('copy-captcha').addEventListener('click', () => {
    document.getElementById('captcha').disabled = false
    document.getElementById('captcha').select()
    document.execCommand("copy")
    document.getElementById('captcha').disabled = true
})

document.getElementById('export').addEventListener('click', () => {
    document.getElementById('export-modal').style.display = "block"
    document.getElementById('exportFile').addEventListener('click', () => {
        let rows = Array.from(document.getElementsByTagName('tbody')[0].rows)
        let inputs = []
        rows.forEach(row => {
            let row_array = []
            Array.from(row.cells).forEach(cell => row_array.push(cell.innerText))
            inputs.push(row_array)
        })
        let fileName = document.getElementById('fileName')
        if (fileName.value !== "") {
            var vLink = document.createElement('a'),
                vBlob = new Blob([JSON.stringify(inputs)], { type: "octet/stream" }),
                vName = fileName.value + '.json',
                vUrl = window.URL.createObjectURL(vBlob)
            vLink.setAttribute('href', vUrl)
            vLink.setAttribute('download', vName)
            vLink.click()
        } else alert('Please enter a file name.')
    })
})
document.getElementById('close').addEventListener('click', () => {
    document.getElementById('export-modal').style.display = "none"
})

document.getElementById('cancel').addEventListener('click', () => {
    document.getElementById('taskDetails').style.display = "none"
    document.getElementById('url').value = ""
    document.getElementById('captcha').value = ""
    document.getElementById('googleForm-header').style.display = "none"
    document.getElementById('typeForm-header').style.display = "none"
    document.getElementById('savedTasks').style.display = "block"
})