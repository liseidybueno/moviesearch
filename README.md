<p align="center">

  <h3 align="center">THE MOVIE DATABASE</h3>

  <p align="center">
    A web app where users can look up movies based on their title, get a list of movies matching their query, and view more details about the movie. Users can also 
    thumbs up or down each movie, and view how many thumbs up and thumbs down a movie has received. 
   <br />
</p>

<h3 align="center>ABOUT THE PROJECT</h3>

<p align = "center">
The Movie Database is a JavaScript project using Nodejs, Express, and MongoDB. The app fetches data from the 
<a href="https://rapidapi.com/rapidapi/api/movie-database-imdb-alternative/details">Movie Database API</a> from rapidapi.com. The user searches for a movie based
on the movie title and all movies matching the query are displayed with the title, year, and an option to view more details. The user can either view more details 
on a specific movie or go back to the search page. If the user selects to view more details, they are shown an image of the poster and the plot, year, director(s),
and IMDB rating of the movie. Additionally, the user can thumbs up or down the movie and view how many thumbs up or down the movie has received. If the movie has
received 0 thumbs up or down, upon clicking on of these options, the movie data (title, imdb id, thumbs up, and thumbs down is saved into a database. If it already
exists in the database, then the values for either thumbs up or thumbs down will be updated. Whenever one of the thumbs up or down options are clicked, the page
refreshes to display the new amounts. If there are more thumbs up than thumbs down, the thumbs up image will be green; if there are more thumbs down then the thumbs
down image will be red; if they are equal, both will remain black. From the details page, the user can opt to go back to their search results for the movie.
</p>


<!-- GETTING STARTED -->
## Getting Started

This project was built using Node.js, Express, and Mongoose. It requires the following dependecies: npm, express, https, body-parser, ejs, lodash, mongoose, and dotenv.
Use on localhost on the browser of your choice.

<!-- SCREENSHOTS -->
## Images

Some images of the app in use: 

<p align="center">

</p>

