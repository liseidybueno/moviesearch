const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/movieRatingDB", {useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true })

app.get("/", function(req, res) {
  res.render("search");
});

app.post("/found", function(req, res) {

  //get movie title from search background and make lower case
  var movieTitle = _.lowerCase(req.body.movieTitle);

  //add %20 in place of spaces to add into URL
  var movieTitleURL = movieTitle.split(' ').join('%20');

  //api to get IMDB ID's
  const options = {
    "method": "GET",
    "hostname": "movies-tvshows-data-imdb.p.rapidapi.com",
    "port": null,
    "path": "/?title=" + movieTitleURL + "&type=get-movies-by-title",
    "headers": {
      "x-rapidapi-key": "47bc00c936msh21813d19de3c7e0p12c834jsn644689ad087b",
      "x-rapidapi-host": "movies-tvshows-data-imdb.p.rapidapi.com",
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
      var movieDataStr= Buffer.concat(movieData);

      //hold movie data as array of objects
      const movieDataArr = JSON.parse(movieDataStr.toString());

      //go through the array and save info into the movieID array as objects
      for (var i = 0; i < movieDataArr.movie_results.length; i++) {

        var movieInfo = {
          "title": movieDataArr.movie_results[i].title,
          "year": movieDataArr.movie_results[i].year,
          "id": movieDataArr.movie_results[i].imdb_id
        }
        movieIDs.push(movieInfo);

      }

      //render found page with the found movie data
      res.render("found", {
        movieIDs: movieIDs

      });


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

const Rating = mongoose.model("Rating", ratingSchema);

app.get("/found/:movieID", function(req, res) {

  //get the movie ID
  const movieID = req.params.movieID;

  //search through API using movie ID
  const options = {
    "method": "GET",
    "hostname": "movies-tvshows-data-imdb.p.rapidapi.com",
    "port": null,
    "path": "/?imdb=" + movieID + "&type=get-movie-details",
    "headers": {
      "x-rapidapi-key": "47bc00c936msh21813d19de3c7e0p12c834jsn644689ad087b",
      "x-rapidapi-host": "movies-tvshows-data-imdb.p.rapidapi.com",
      "useQueryString": true
    }
  };


  https.get(options, function(response) {
    //hold movie details
    const movieDetails = [];

    const movieData = [];

    response.on("data", function(data) {

      movieData.push(data);
    });

    response.on("end", function() {

      //parse movie data
      var movieDataStr= Buffer.concat(movieData);

      //hold movie data as array of objects
      const movieDataArr = JSON.parse(movieDataStr.toString());

      const title = movieDataArr.title;
      const description = movieDataArr.description;
      const year = movieDataArr.year;
      const directors = movieDataArr.directors;
      const rating = movieDataArr.imdb_rating;
      const imdb_id = movieDataArr.imdb_id;

      //look for the imdb id in the database
      //if it exists get the thumbs down and thumbs up amount and display


      Rating.findOne({imdb_id: imdb_id}, function(err, requestedMovie){
        if(!err){
          if(requestedMovie){
            let thumbs_up = requestedMovie.thumbs_up;
            let thumbs_down = requestedMovie.thumbs_down;

            res.render("details", {
              title: title,
              description: description,
              year: year,
              directors: directors,
              rating: rating,
              imdb_id: imdb_id,
              thumbs_up: thumbs_up,
              thumbs_down: thumbs_down
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
              thumbs_up: thumbs_up,
              thumbs_down: thumbs_down
            });
        }
        }

      });


    });

    });


  });

  app.post('/thumbsup', function(req, res){

      //save id and title from detaisl page
      const imdb_id = req.body.movieIDup;
      const title = req.body.movieTitleup;
      let thumbs_up = req.body.thumbsup;

      thumbs_up++;

      //check to see if the movie exists in the database
      Rating.findOneAndUpdate({imdb_id: imdb_id}, {thumbs_up: thumbs_up}, function(err, requestedMovie){
        if(!err){
          if(!requestedMovie){
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

  app.post('/thumbsdown', function(req, res){


      //save id and title from detaisl page
      const imdb_id = req.body.movieIDdown;
      const title = req.body.movieTitledown;

      let thumbs_down = req.body.thumbsdown;

      //increment thumbs down
      thumbs_down++;

      //check to see if the movie exists in the database
      Rating.findOneAndUpdate({imdb_id: imdb_id}, {thumbs_down: thumbs_down}, function(err, requestedMovie){
        if(!err){
          if(!requestedMovie){
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
            //redirect to same page to show new thumbs up amount
            res.redirect("/found/" + imdb_id);
          } else {
            //if it does exist, just redirect and show new thumbs up amount
            res.redirect("/found/" + imdb_id);
          }
        }

      });

  });




app.listen(3001, function() {
  console.log("Server is started on port 3001");
});
