let instructorMap = new Map();

if (document.getElementsByClassName("section-instructors").length > 0) {
    addRating();
}
else {
    var buttons = document.getElementsByClassName("toggle-sections-link");

    for(var i=0; i<buttons.length; i++){
        buttons[i].addEventListener("click", addRating);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Checks if a planetterp review url link is correct
function validReviewsUrl(urls, firstName) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
            url: urls.reviews,
            type: "text"
        }, function(response) {

            // Review url is not correct, therefore adding their firstName
            if (response === "Professor not found.") {
                urls.reviews = urls.reviews + "_" + firstName;
                resolve();
            }
            else {
                resolve();
            }
        });
    });
}

// generates both url for planetterp's api and the professor's review page
// on planetterp
async function generateUrls(fullName) {
    let ret = {api: 'https://api.planetterp.com/v1/professor?name=',
               reviews: ''
              };

    for (let i = 0; i < fullName.length; i++) {

        // checking if last name is reached
        if(i === fullName.length - 1) {
            ret.api += fullName[i] + '&reviews=true';
            ret.reviews = "https://planetterp.com/professor/" + fullName[i];
        }
        else {
            ret.api += fullName[i] + '%20';
        }
    }
    
    // Waiting for asynchronous function to complete
    await validReviewsUrl(ret, fullName[0]);

    return ret;
}

// Checks if the instructor has been processed prior
function alreadyProcessed(names) {
    if (names.length === 2 && instructorMap.has(names[0] + " " + names[1])) {
        return true;
    }
    else if (names.length === 3 && instructorMap.has(names[0] + " " + names[1] + " " + names[2])) {
        return true;
    }

    return false;
}

// injects the rating of the instructor into the page
function addRating() {
    sleep(500).then(async () => {

        // testing purposes
        console.log("Executing addRating...");

        let instructors = document.getElementsByClassName("section-instructors");

        for (let i = 0; i < instructors.length; i++) {
            console.log('start of i = ' + i);
            let avgRating = 0;
            let urls;
            let names = instructors[i].innerText.split(' ');

                
            // Don't think this is a good way to test if a prior rating was injected
            // but using it for convenience now
            if (names.length <= 3) {

                if (!alreadyProcessed(names)){
                    urls = await generateUrls(names);

                    chrome.runtime.sendMessage({
                        url: urls.api,
                        type: "json"
                    }, function (response) {
                        let rating = "<a href=" + urls.reviews + ">Rating: ";
                        if (response.error !== 'professor not found') {

                            if (response['reviews'].length !== 0) {
                                response['reviews'].forEach((review) => {
                                    avgRating += review['rating'];
                                })
                                avgRating= (avgRating / response['reviews'].length).toFixed(2);
                                rating = rating + avgRating + " (" + response['reviews'].length + ")" + "</a>";
                            }
                            else  {
                                rating = rating + "N/A (0)</a>"; 
                            }
                        }
                        else{

                            // debugging purposes
                            rating = rating + "Instructor was not found";
                        }

                        instructorMap.set(instructors[i].innerText, instructors[i].innerHTML + "<br>" + rating);
                        instructors[i].innerHTML = instructors[i].innerHTML + "<br>" + rating;
                    });
                    }
                else {
                    console.log("adding from map");
                    instructors[i].innerHTML = instructorMap.get(instructors[i].innerText);
                }
                console.log('end i = ' + i);
            }
        }
    })
}

