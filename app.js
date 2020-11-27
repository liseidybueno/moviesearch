const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/movieRatingDB", {
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var movieTitle = "";

//render search page
app.get("/", function(req, res) {
  res.render("search");
});

//found page
app.post("/found", function(req, res) {

  //movie title to display
  var displayMovieTitle = req.body.movieTitle;

  //get movie title from search background and make lower case
  movieTitle = _.lowerCase(req.body.movieTitle);

  var movieTitleURL = movieTitle.split(' ').join('%20');

  //api to get IMDB ID's
  const options = {
    "method": "GET",
    "hostname": process.env.API_URL,
    "port": null,
    "path": "/?s=" + movieTitleURL + "&r=json&type=movie",
    "headers": {
      "x-rapidapi-key": process.env.API_KEY,
      "x-rapidapi-host": process.env.API_URL,
      "useQueryString": true
    }
  };

  https.get(options, function(response) {

    //hold movie id's
    var movieIDs = [];

    //hold movie data
    var movieData = [];

    response.on("data", function(data) {
      //push data into movie data array
      movieData.push(data);

    });

    response.on("end", function() {

      //parse movie data
      var movieDataStr = Buffer.concat(movieData);

      // //hold movie data as array of objects
      const movieDataArr = JSON.parse(movieDataStr.toString());

      //if no results are found, render the no results page
      if (movieDataArr.Search === undefined) {
        res.render("noresults");
      } else {

        //go through the array and save info into the movieID array as objects
        for (var i = 0; i < movieDataArr.Search.length; i++) {

          var movieInfo = {
            "title": movieDataArr.Search[i].Title,
            "year": movieDataArr.Search[i].Year,
            "id": movieDataArr.Search[i].imdbID
          }
          movieIDs.push(movieInfo);
        }

        //render found page with the found movie data
        res.render("found", {
          movieIDs: movieIDs,
          displayMovieTitle: displayMovieTitle
        });
      }

    });

  });

});


//create schema for thumbs up and down ratings
const ratingSchema = {
  title: String,
  imdb_id: String,
  thumbs_up: Number,
  thumbs_down: Number
};

//Rating model
const Rating = mongoose.model("Rating", ratingSchema);

app.get("/found/:movieID", function(req, res) {

  //get the movie ID
  const movieID = req.params.movieID;

  //search through API using movie ID
  const options = {
    "method": "GET",
    "hostname": "movie-database-imdb-alternative.p.rapidapi.com",
    "port": null,
    "path": "/?i=" + movieID + "&type=movie&r=json",
    "headers": {
      "x-rapidapi-key": process.env.API_KEY,
      "x-rapidapi-host": "movie-database-imdb-alternative.p.rapidapi.com",
      "useQueryString": true
    }
  };


  https.get(options, function(response) {
    //hold movie details
    const movieDetails = [];

    //hold movie data
    const movieData = [];

    response.on("data", function(data) {
      //save data into movie data
      movieData.push(data);
    });

    response.on("end", function() {

      //parse movie data
      var movieDataStr = Buffer.concat(movieData);

      //hold movie data as array of objects
      const movieDataArr = JSON.parse(movieDataStr.toString());

      //save movie data in variables
      const title = movieDataArr.Title;
      const description = movieDataArr.Plot;
      const year = movieDataArr.Year;
      const directors = movieDataArr.Director;
      const rating = movieDataArr.imdbRating;
      const imdb_id = movieDataArr.imdbID;
      const poster_url = movieDataArr.Poster;

      //look for the imdb id in the database
      //if it exists get the thumbs down and thumbs up amount and display on page
      //if it doesn't exist, set thumbs up and down to 0 and display
      Rating.findOne({
        imdb_id: imdb_id
      }, function(err, requestedMovie) {
        if (!err) {
          if (requestedMovie) {
            let thumbs_up = requestedMovie.thumbs_up;
            let thumbs_down = requestedMovie.thumbs_down;

            res.render("details", {
              title: title,
              description: description,
              year: year,
              directors: directors,
              rating: rating,
              imdb_id: imdb_id,
              poster_url: poster_url,
              thumbs_up: thumbs_up,
              thumbs_down: thumbs_down,
              movieTitle: movieTitle
            });
          } else {
            let thumbs_up = 0;
            let thumbs_down = 0;

            res.render("details", {
              title: title,
              description: description,
              year: year,
              directors: directors,
              rating: rating,
              imdb_id: imdb_id,
              poster_url: poster_url,
              thumbs_up: thumbs_up,
              thumbs_down: thumbs_down,
              movieTitle: movieTitle
            });
          }
        }

      });

    });

  });

});

//increment thumbs up and save to database
app.post('/thumbsup', function(req, res) {

  //save id and title from details page
  const imdb_id = req.body.movieIDup;
  const title = req.body.movieTitleup;
  let thumbs_up = req.body.thumbsup;

  //increment thumbs up
  thumbs_up++;

  //check to see if the movie exists in the database
  Rating.findOneAndUpdate({
    //use id to search data base
    imdb_id: imdb_id
  }, {
    //update thumbs up
    thumbs_up: thumbs_up
  }, function(err, requestedMovie) {
    if (!err) {
      if (!requestedMovie) {
        //if it doesn't exist, then add it to the database
        //create new movie model
        const movie_rating = new Rating({
          title: title,
          imdb_id: imdb_id,
          thumbs_up: thumbs_up,
          thumbs_down: 0
        });
        //save movie rating
        movie_rating.save();
        //redirect to same page to show new thumbs up amount
        res.redirect("/found/" + imdb_id);
      } else {
        //if it does exist, just redirect and show new thumbs up amount
        res.redirect("/found/" + imdb_id);
      }
    }

  });

});

app.post('/thumbsdown', function(req, res) {

  //save id and title from detaisl page
  const imdb_id = req.body.movieIDdown;
  const title = req.body.movieTitledown;

  let thumbs_down = req.body.thumbsdown;

  //increment thumbs down
  thumbs_down++;

  //check to see if the movie exists in the database
  Rating.findOneAndUpdate({
    //use id to search database
    imdb_id: imdb_id
  }, {
    //update thumbs down
    thumbs_down: thumbs_down
  }, function(err, requestedMovie) {
    if (!err) {
      if (!requestedMovie) {
        //if it doesn't exist, then add it to the database
        //create new movie model
        const movie_rating = new Rating({
          title: title,
          imdb_id: imdb_id,
          thumbs_up: 0,
          thumbs_down: thumbs_down
        });
        //save movie rating
        movie_rating.save();
        //redirect to same page to show new thumbs down amount
        res.redirect("/found/" + imdb_id);
      } else {
        //if it does exist,  redirect and show new thumbs down amount
        res.redirect("/found/" + imdb_id);
      }
    }

  });

});


app.listen(3001, function() {
  console.log("Server is started on port 3001");
});
