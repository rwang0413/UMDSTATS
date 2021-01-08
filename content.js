/* This will run addGPA() once page loads */
window.addEventListener ("load", addGPA, false);


/* Adding the font 'Font Awesome' to the page! */
var getFont = document.createElement('link');
getFont.setAttribute('href',"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.9.0/css/all.min.css");
getFont.setAttribute('rel', "stylesheet");

document.head.appendChild(getFont);


/* These global variables are used to assign unique ids to each professor and course */
var currIndex = 0;
var sectionIndex = 0;

let instructorsData = new Map();



if (document.getElementsByClassName("section-instructors").length > 0) {
    fetchData();
} else {
    /* Intialize all buttons with a listener, such that when "Show Section", is
    clicked, the function, addRating is executed. */
    var buttons = document.getElementsByClassName("toggle-sections-link");

    for(var i=0; i<buttons.length; i++){
        buttons[i].addEventListener("click", fetchData);
    }
}



/* Causes a pause depending on argument, ms. Note: 1000ms = 1s */
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
function fetchData() {
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
                        addRating(instructors[i], data);
                        
                        console.log("fetching...");
                        console.timeEnd("function" +tempi);
                    });
                    }
                else {
                    console.log("adding from map");
                    addRating(instructors[i], instructorsData.get(instructors[i].innerText));
                    
                    console.timeEnd("function" +i);
                }
            }
        }
    })
}



// injects rating into html
function addRating(instructor, metadata) {

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



/* This function displays the average GPA of a course. If the course is invalid or there is no grade data
on the course, this function will display N/A. It first uses PlanetTerps API to retrieve the grade data
of a specific course and then calculates the avergae GPA based off the data using UMD GPA grade scale.
It's important to note that this function inserts html and also modifies the css corresponding to the html. */
function addGPA () {
   console.log("Running addGPA");
   let classes = document.getElementsByClassName('course-id');

   for (let x = 0; x < classes.length; x++) {

        let qualityPoints = 0;
        let numStudents = 0;

        fetch('https://api.planetterp.com/v1/grades?professor?&course=' + classes[x].innerText + '&section?')
        
        .then(function(res) {

            /* This returns a list of arrays, each array having the grades of a section */
            return res.json();
        }).then(function(body) {

            /* Calculates the qualityPoints and numStudents from all the sections */
            for (var sectionIndex = 0; sectionIndex < body.length; sectionIndex++) {
                var numAPlus = body[sectionIndex]['A+'];
                var numA = body[sectionIndex]['A'];
                var numAMinus = body[sectionIndex]['A-'];
                var numBPlus = body[sectionIndex]['B+'];
                var numB = body[sectionIndex]['B'];
                var numBMinus = body[sectionIndex]['B-'];
                var numCPlus = body[sectionIndex]['C+'];
                var numC = body[sectionIndex]['C'];
                var numCMinus = body[sectionIndex]['C-'];
                var numDPlus = body[sectionIndex]['D+'];
                var numD = body[sectionIndex]['D'];
                var numDMinus = body[sectionIndex]['D-'];
                var numF = body[sectionIndex]['F'];
                var numW = body[sectionIndex]['W'];

                numStudents = numStudents + numAPlus + numA + numAMinus + numBPlus + numB + numBMinus + numCPlus + numC + numCMinus + numDPlus + numD + numDMinus + numF + numW;
                qualityPoints = qualityPoints + (numAPlus * 4) + (numA * 4) + (numAMinus * 3.7) + (numBPlus * 3.3) + (numB * 3.0) + (numBMinus * 2.7) + (numCPlus * 2.3) + (numC * 2.0) + (numCMinus * 1.7) + (numDPlus * 1.3) + (numD * 1.0) + (numDMinus * 0.7) + (numF * 0) + (numW * 0);
            }
            
            /* There is grade data available for this course */
            if (numStudents != 0) {
                var averageGPA = qualityPoints/numStudents;
                
                /* Rounds GPA to the nearest hundreth place */
                var roundedAvgGPA = Math.ceil(averageGPA * 100) / 100;

                var color = "";


                /* Determine the color of the circle based of the GPA */
                if (roundedAvgGPA >= 3.5) {
                    /* Green for As*/
                    color = '#2CE574';
                } else if (roundedAvgGPA >= 2.85 && roundedAvgGPA < 3.5) {
                    /* Light Green for Bs */
                    color = '#CDF03A';
                } else if (roundedAvgGPA >= 1.7 && roundedAvgGPA < 2.85) {
                    /* Yellow For Cs */
                    color = '#fff700';
                } else {
                    /* Red for Fs/Ws/etc */
                    color = '#FF3924'
                }
 
               

               /* Inserting html and then modifying the color of the circle */
                classes[x].innerHTML = classes[x].innerHTML + '<br> <br> <div class="circle" id="courseColor' + courseIndex + '">GPA: '+ roundedAvgGPA + '</div>';
                document.getElementById("courseColor" + courseIndex).style.background = color;
                courseIndex++;
            
                
            /* No grade data for this course */
            } else {
                classes[x].innerHTML = classes[x].innerHTML + "<br> <br> GPA: N/A";
            }
        
            
        });
  }  
}
