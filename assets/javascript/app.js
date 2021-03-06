$(document).ready(function() {

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDm6wfYiroeycCdVHwK2tkV572AEQ1UJJw",
    authDomain: "farmersmarket-f2d0f.firebaseapp.com",
    databaseURL: "https://farmersmarket-f2d0f.firebaseio.com",
    projectId: "farmersmarket-f2d0f",
    storageBucket: "farmersmarket-f2d0f.appspot.com",
    messagingSenderId: "74005566748"
  };
  firebase.initializeApp(config);

  // Creating a variable to reference the database
  var database = firebase.database();

  // Initial Values
  var zipCode = "";
  var rating = "";
  var comments = "";
  var marketId = "";

  // jQuery functions so certain classes work on dynamic created elements
  $('.collapsible').collapsible();
  $('.scrollspy').scrollSpy();
  $(".button-collapse").sideNav();
  $("#modal1").modal();

  // update star ratings inside comment modal
  $("#starRatings > i").on("click", function(){
    $("#starRatings > i").html("<i class='material-icons'/>star_border</i>");
    $(this).html("<i class='material-icons'/>star</i>");
    rating = $(this).attr("data-value");

    // data-values less than "this", also changed to star
    for (i = rating ; i > 0 ; i--) {
      if (rating < $("#star" + i).attr("data-value")){
        $("#star" + i).html("<i class='material-icons'/>star_border</i>");
      } else {
        $("#star" + i).html("<i class='material-icons'/>star</i>");
      } // end else
    } // end for loop
  }); // star rating click event

  $(document).on("click", "#submit", function(event) {
      event.preventDefault();
      //retrieve input from user
      zipCode = $("#zipSearch").val().trim();
      $("#zipSearch").html("").val("");
      //call initMap function, passing the zipCode variable as an argument
      var map = ourFunctions.initMap(zipCode);
      //call renderResults function, passing the map variable as an argument
      ourFunctions.renderResults(map);
      ourFunctions.getFirstResults(zipCode);
  }); //end submit on click event

  $(document).on("click", ".collapsible-header", function(event){
    event.preventDefault();
    marketId = $(this).attr("id");
    ourFunctions.getSecondResults(marketId);
  }); //end accordion click event

  $(document).on("click", "#commentSubmit", function(event) {
    event.preventDefault();
    comments = $("#comment").val().trim();
    var newReview = database.ref().push();

    //set database values
    newReview.set({
      marketId: marketId,
      rating: rating,
      comments: comments,
      zipCode: zipCode
    }); //end setter for database values

    // clearing comment form inputs
    $( "#comment" ).html("").val("");
    $("#starRatings > i").html("<i class='material-icons'/>star_border</i>");

    // 2500 is the duration of the toast
    Materialize.toast('Thanks for submitting your review!', 2500)
  }); //end comment submit event

/*
  object to hold the functions
*/

var ourFunctions = {
  /*
    renderResults function takes one parameter, loop through the mapResults array and
    dynamically create iframe elements to load to our page
    @param source: source is the value returned from initMap function
  */
  renderResults: function(source) {
    $("#mapResults-go-here").empty();
    var iframes = $("<iframe>", {
      src: source,
      frameborder: "0",
      zoom: "10",
      width: "650px",
      height: "450px"
    }).appendTo("#mapResults-go-here");
  },

  /*
    initMap function takes one parameter and concatenates that parameter with the global
    url variable, google maps embed API key, and other pertinent q (query) information
    @param zip: zip will be the value returned from the user input form
  */
  initMap: function(address) {
    //beginning of google maps embed api url
    var url = "https://www.google.com/maps/embed/v1/search"
    url += "?" + $.param({
      "key": "map key goes here",
      "q": "Farmers+Markets+near" + address
    });
    return url;
  },

  /*
    getFirstResults function accepts one parameter and makes an ajax call using the USDA API to pull back
    the ID of each farmers market within a certain radius of the given zip code.  This function will also dynamically
    create collapsible elements on the page and place divs within those elements, that will later be populated
    on the call of the getSecondResults function.
    @param zip: the value of the zip code entered by the user on the search page
  */
  getFirstResults: function(zip) {
    var id = "";
    var name = "";
    $("#ajaxResults").html("");
    $.ajax({
      type: "GET",
      contentType: "application/json; charset=utf-8",
      // submit a get request to the restful service zipSearch or locSearch.
      url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/zipSearch?zip=" + zip,
      // or
      // url: "http://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=" + lat + "&lng=" + lng,
      dataType: 'jsonp',
      jsonpCallback: 'searchResultsHandler'
    }).done(function(response) {
      var results = response.results;
      // builds beginning of collapsible list
      var popoutList = $("<ul class='collapsible popout' data-collapsible='accordion'>");
      popoutList.collapsible();

      for (var i = 0; i < results.length; i++) {
        id = results[i].id;
        name = results[i].marketname;

        var popoutHeader = "<div id='" + id + "' class='collapsible-header'><i class='material-icons'>favorite_border</i>" + name + "</div>";
        var popoutBody = "<div class='collapsible-body'><span>Lorem Ipsum</span></div>";
        var listItem = "<li>";

        // append each returned result as a list item to the DOM
        popoutList.append(listItem + popoutHeader + popoutBody);
        $("#ajaxResults").append(popoutList);
      } //end for loop for dynamic collapse elements

    }); //end ajax call
  },

  /*
    getSecondResults takes one parameter, makes a second call to the USDA api
    and pulls back the marketdetails associated with the ID that we pass into
    the parameter.  Using the marketdetails, this function will also dynamically
    create iframe elements where a call to the google maps embed API will show the
    location on a google map element
    @param argID: value returned from the getFirstResults function
  */
  getSecondResults: function(argID){
    //dynamically create elements
    var commentModal = ("<button class='waves-effect waves-light btn modal-trigger' data-target='modal1'>Leave a Comment!</button>")
    $(".collapsible-body").html("");
    var lastComment = ("<div id='" + argID + "'</div>");

    var ref = firebase.database().ref();
            ref.orderByChild("marketId").equalTo(argID).on("child_added", function(snapshot) {
              console.log(snapshot.val().marketId);
              console.log(snapshot.val().comments);
              lastComment = snapshot.val().comments;
            }); //end database query

  $.ajax({
    type: "GET",
    contentType: "application/json; charset=utf-8",
    // submit a get request to the restful service mktDetail.
    url: "https://search.ams.usda.gov/farmersmarkets/v1/data.svc/mktDetail?id=" + argID,
    dataType: 'jsonp',
    jsonpCallback: 'detailResultHandler'
  }).done(function(detailresults){

    for (var key in detailresults) {
      /*variables to hold results of second usda API call.  Results printed to HTML in onclick event
        starting on line 23*/
        var address = detailresults.marketdetails.Address;
        var linky = detailresults.marketdetails.GoogleLink;
        var schedule = detailresults.marketdetails.Schedule;
        var products = detailresults.marketdetails.Products;

        //TODO: Jim/Stacy - query firebase to check if a comment exists for marketID (argID)

        $(".collapsible-body").html("<a target='_blank' href= " + linky + ">Google Link</a>"
                                  + "<p> Address: " + address + "</p>"
                                  + "<p> Schedule: " + schedule + "</p>"
                                  + "<p> Products: " + products + "</p>"
                                  + "<p> Most Recent Comment: " + lastComment + "</p>"
                                  + "<p>" + commentModal + "</p>");

      }; //end for loop
    }); //end ajax call
  }, //end getSecondResults function

  /* foodsInSeason displays list of the current foods in season on page load
     based on current month */
  foodsInSeason: function () {
      // (moment.js for current month)
      var currentMonth = moment().month();
      var currentMonthText = moment().format('MMMM');
      // console.log("Current Month: " + currentMonth);
      $("#current-month").text("Foods in season for the month of " + currentMonthText);

      // JSON data obtained via web crawler Apifier API:
      // https://www.apifier.com/crawlers/DpP4r2ouwftwZT5Ym
      var foodsDataURL = "https://api.apifier.com/v1/execs/vm5CwJ6Rr6ePdugwK/results";

      $.ajax({
        type: "GET",
        contentType: "application/json",
        url: foodsDataURL
      })
      .done(function(response){
        var foodString = response[currentMonth].pageFunctionResult.foods;

        // remove all /n from foodString array
        foodString = foodString.replace(/(\r\n|\n|\r)/gm,',').trim();
        var foodArray = foodString.split(',');

        // remove blank items in foodString array
        for(var i = foodArray.length-1; i >= 0; i--){
            if(foodArray[i] === ''){
                foodArray.splice(i,1);
            }
        }

        $("#foodTable > tbody").append("<tr><td>" + foodArray[0] + "</td></tr>");

        for (i = -1 ; i < (foodArray.length - 3) ; i+=2){
          $("#foodTable > tbody").append("<tr><td>" + foodArray[i + 2] + "</td><td>"
          + foodArray[i+3] + "</td></tr>");
        }
      });
  }, // end foodsInSeason() function


  }//end function object

  ourFunctions.foodsInSeason(); // show foods in season on document load

}) //end document ready
