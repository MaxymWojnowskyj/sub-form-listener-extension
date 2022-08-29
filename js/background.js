
chrome.webRequest.onBeforeRequest.addListener(
    logResponse, {
    urls: ["https://docs.google.com/forms/*", "https://www.google.com/recaptcha/*", "https://*.typeform.com/*"],
}, ["requestBody"])

function logResponse(responseDetails) {
    let captcha_request, new_task

    if (responseDetails.method === "POST") {
        if (responseDetails.url.includes('formResponse')) {
            let data = responseDetails.requestBody.formData
            new_task = {
                Type: 'GoogleForm',
                TabId: responseDetails.tabId,
                URL: responseDetails.url,
                TimeStamp: responseDetails.timeStamp,
                Inputs: Object.entries(data),
                Captcha: false
            }
        }

        if (responseDetails.url.includes('recaptcha') && responseDetails.url.includes('reload')) {
            captcha_request = responseDetails
        }
        if (responseDetails.url.includes('complete')) {
            console.log(responseDetails)
            let body = (decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(responseDetails.requestBody.raw[0].bytes))))
            let answers = JSON.parse(body.split('answers":')[1].split('}],"')[0] + '}]')
            let data = []
            answers.forEach(input => {
                if (input.field.type === "multiple_choice") {
                    data.push([input.field.id, input.field.type, input.choices[0].id, input.choices[0].label])
                } else if (input.field.type === "short_text" || input.field.type === "long_text") {
                    data.push([input.field.id, input.field.type, "", input.text])
                } else console.log('not multiple_choice or text')
            })
            let typeform_url = responseDetails.url.split('.com/')[0] + '.com/to/' + responseDetails.url.split('.com/')[1].split('/')[1].split('/')[0]
            //creates original /to/ typeform url needed for cog raffle task
            new_task = {
                Type: 'TypeForm',
                TabId: responseDetails.tabId,
                URL: typeform_url,
                TimeStamp: responseDetails.timeStamp,
                Inputs: data,
                TypeFormAnswersBackup: answers,
                Captcha: false
            }
        }
    }
    if (new_task || captcha_request) {
        chrome.storage.local.get('raffleTasks', (storage) => {
            if (storage && storage.raffleTasks) {
                if (new_task) {
                    let repeat_tasks = storage.raffleTasks.filter(task => task.URL === new_task.url)
                    //returns array of all the tasks that have the same url (same raffle task)
                    if (repeat_tasks.length > 0) {
                        //if there is even one that is found
                        if (Math.round(new_task.timeStamp - repeat_tasks[repeat_tasks.length - 1].TimeStamp / 1000) < 86400) {
                            //if the task with the most recent date was created within 24 hours then overwrite that task
                            storage.raffleTasks[storage.raffleTasks.indexOf(repeat_tasks[repeat_tasks.length - 1])] = new_task
                            chrome.browserAction.getBadgeText({}, (currentCount) => {
                                if (currentCount !== "") {
                                    chrome.browserAction.setBadgeText({ text: String(Number(currentCount) + 1) })
                                } else chrome.browserAction.setBadgeText({ text: "1" })
                            })
                            //overwrite with the new task (temporary get method until I can confirm that tabId is unique for all googlForm raffles)
                        }
                    } else {
                        storage.raffleTasks.push(new_task)
                        chrome.browserAction.getBadgeText({}, (currentCount) => {
                            if (currentCount !== "") {
                                chrome.browserAction.setBadgeText({ text: String(Number(currentCount) + 1) })
                            } else chrome.browserAction.setBadgeText({ text: "1" })
                        })
                    }
                }
                // if theres no repeat tasks then just add this new task to the list

                if (captcha_request) {
                    //if a captcha was found
                    if (new_task.TabId === captcha_request.tabId) new_task.Captcha = captcha_request.url.split('reload?k=')[1]
                    chrome.browserAction.getBadgeText({}, (currentCount) => {
                        if (currentCount !== "") {
                            chrome.browserAction.setBadgeText({ text: String(Number(currentCount) + 1) })
                        } else chrome.browserAction.setBadgeText({ text: "1" })
                    })
                    //if the new_task contains the same tabId add the captcha sitekey
                    storage.raffleTasks.forEach(task => {
                        if (task.tabId === captcha_request.tabId) task.Captcha = captcha_request.url.split('reload?k=')[1]
                    }) // this is just in case (will most likely remove after beta as I dont think its needed, but better safe then sorry)
                    //run through all raffleTasks and if the tabId's match with the new found captcha then add that sitekey
                }

                chrome.storage.local.set({ raffleTasks: storage.raffleTasks })
                //resave the list of raffleTasks
            } else chrome.storage.local.set({ raffleTasks: [new_task] })
            //if no tasks have been created create an array with the first task


        })
    }
}