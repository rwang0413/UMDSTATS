chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){

    fetch(request.url,
        {
        method: 'GET'
        })
        .then(function(res) {
            if (request.type === 'json') {
                return res.json();
            }
            else if (request.type === 'text') {
                return res.text();
            }
        }).then(function(body) {
            sendResponse(body);
        })
        
        
    return true;    
})