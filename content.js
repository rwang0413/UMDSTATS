/* Adding the font 'Font Awesome' to the page! */
var my_awesome_script = document.createElement('link');

my_awesome_script.setAttribute('href',"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.9.0/css/all.min.css");
my_awesome_script.setAttribute('rel', "stylesheet");

document.head.appendChild(my_awesome_script);

var currIndex = 0;

let instructorsData = new Map();

if (document.getElementsByClassName("section-instructors").length > 0) {
    fetchRating();
}
else {
    var buttons = document.getElementsByClassName("toggle-sections-link");

    for(var i=0; i<buttons.length; i++){
        buttons[i].addEventListener("click", fetchRating);
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
    if (instructorsData.has(names[0] + " " + names[1])) {
        return true;
    }
    else if (instructorsData.has(names[0] + " " + names[1] + " " + names[2])) {
        return true;
    }

    return false;
}

// fetches instructor data
function fetchRating() {
    sleep(500).then(async () => {

        // testing purposes
        console.log("Executing addRating...");

        let instructors = document.getElementsByClassName("section-instructors");

        for (let i = 0; i < instructors.length; i++) {
            console.time("function" + i);
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
                        let tempi = i;
                        let ratingHTML = "<a href=" + urls.reviews + ">Rating: ";
                        let avgRating = 0;
                        if (response.error !== 'professor not found') {

                            if (response['reviews'].length !== 0) {
                                response['reviews'].forEach((review) => {
                                    avgRating += review['rating'];
                                })
                                avgRating = (avgRating / response['reviews'].length).toFixed(2);
                                ratingHTML += avgRating + " (" + response['reviews'].length + ")" + "</a>";
                            }
                            else  {
                                ratingHTML += "N/A (0)</a>"; 
                            }
                        }
                        else{

                            // debugging purposes
                            ratingHTML = "Instructor was not found";
                        }
                        let data = {hyperlink: ratingHTML, rating: avgRating};
                        instructorsData.set(instructors[i].innerText, data);
                        injectRating(instructors[i], data);
                        
                        console.log("fetching...");
                        console.timeEnd("function" +tempi);
                    });
                    }
                else {
                    console.log("adding from map");
                    injectRating(instructors[i], instructorsData.get(instructors[i].innerText));
                    
                    console.timeEnd("function" +i);
                }
            }
        }
    })
}

// injects rating into html
function injectRating(instructor, metadata) {

    /* Rating is out of 5 stars */
    const starsTotal = 5;

    /* Percentage of stars filled up */
    const starPercentage = (metadata.rating / starsTotal) * 100;

    var starHTML = '<div id="ratings' + currIndex + '"> ' + '<div class="stars-outer"> <div class="stars-inner"></div> </div> <span class="number-rating"></span> </div>'; 

    instructor.innerHTML += "<br>" + metadata.hyperlink + starHTML;

    // Set width of stars-inner to percentage. Draws the yellow part.                     
    document.getElementById("ratings" + currIndex).getElementsByClassName("stars-inner")[0].style.width = starPercentage + '%';
                    
    currIndex++;
}