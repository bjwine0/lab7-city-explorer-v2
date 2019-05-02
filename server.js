'use strict'

// Load environment variables
require('dotenv').config();

//Load express to do the heavey lifting -- Application dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors'); //Cross Origin Resource Sharing

//Application setup
const app = express();
app.use(cors()); //tell express to use cors
const PORT = process.env.PORT;

//Incoming API routes
app.get('/testing', (request, response)=>{
  response.send('<h1>HELLO WORLD..</h1>')

});

app.get('/location', searchToLatLong)
app.get('/weather', getWeather);
app.get('/events', getEvent);

//server listening for requests
app.listen(PORT, ()=>console.log(`Listening on PORT ${PORT}`));

//Helper Functions
function searchToLatLong(request, response){
  //giving url for Geocode Api
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  superagent.get(url)
    .then(result => {
      const location = new Location(request.query.data, result);
      response.send(location);
    })
    .catch(err => handleError(err, response));
}

// Constructor for location data
function Location(query, response) {
  
  this.search_query = query;
  this.formatted_query = response.body.results[0].formatted_address;
  this.latitude = response.body.results[0].geometry.location.lat;
  this.longitude = response.body.results[0].geometry.location.lng;
}

function getWeather(request, response) {
  //give url for Darksky API
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(result => {
      
      const weatherSummaries = result.body.daily.data.map(day => new Weather(day));
      response.send(weatherSummaries);
      // getEvent();
    })
    .catch(err => handleError(err, response));
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function getEvent(request, response) {
  //give url for Eventbrite API

  const url = `https://www.eventbriteapi.com/v3/events/search/?token=${process.env.EVENTBRITE_API_KEY}&location.latitude=${request.query.data.latitude}&location.longitude=${request.query.data.longitude}`;
  superagent.get(url)
    .then(result => {
      const eventSummaries = result.body.events.map(events => new Event(events));
      console.log(eventSummaries)
      response.send(eventSummaries);
    })
    .catch(err => handleError(err, response));
}

function Event(event) {
  this.link = event.url;
  this.name = event.name.text;
  //below is a placeholder, it's a number not a name, but i didn't see any names so we can come back to this later. 
  this.host = event.organization_id;
  this.event_date = event.start.local;
}

//error handler
function handleError(err, response) {
  console.log(err);
  if (response) response.status(500).send('Sorry something went wrong');
}