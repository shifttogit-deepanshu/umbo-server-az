const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const mongoose = require('mongoose');
const cors = require('cors')
const moment = require("moment-timezone")
const chroma = require("chroma-js")

app.use(cors())

const path = require('path')
var axios = require('axios');
let scolour

const colour_scale = chroma.scale(['black','orange','yellow','white','yellow','orange','black'])

mongoose.connect('mongodb+srv://projectumbo:deepa%40SH4040@cluster0.ja4hb.mongodb.net/weathers').then(res=>{

const WeatherSchema = new mongoose.Schema({
  _id:String,
  mode:String,
  lat:Number,
  lon:Number,
  main: String,
  desc:String,
  icon:String,
  temp:Number,
  cloud:Number,
  rain: Number,
  location:String,
  wind_speed:Number,
  timezone:Number,
  rain:Number,
  timestamp:Number,
  sunrise:Number,
  sunset:Number,
  color:Array,
  currentTime:Number,
  // userColor:Array

});

const Weather = mongoose.model('Weather', WeatherSchema);


app.get("/nodemcu",(req,res)=>{
  Weather.findOne({_id:"Deepanshu"}).then(result=>{
    const resp = {
      mode:result.mode,
      main:result.main,
      color:result.color,
      // userColor:result.manColor
    }
    res.send(resp)
  }).catch(err=>{
    res.send(err)
  })
})


app.get("/dbdata",(req,res)=>{
  Weather.findOne({_id:"Deepanshu"}).then(result=>{
    res.send(result)
  }).catch(err=>{
    res.send(err)
  })
})

app.get("/web",(req,res)=>{
  const weather = {mode:"web"}
  Weather.findOneAndUpdate({_id:"Deepanshu"},weather).then(result=>{
    res.send(result)
  })
})

app.get("/rain",(req,res)=>{
  const weather = {mode:"rain"}
  Weather.findOneAndUpdate({_id:"Deepanshu"},weather).then(result=>{
    res.send(result)
  })
})

app.get("/thunder",(req,res)=>{
  const weather = new Weather({mode:"thunder"})
  Weather.findOneAndUpdate({_id:"Deepanshu"},weather).then(result=>{
    res.send(result)
  })
})

app.get("/clouds",(req,res)=>{
  const weather = new Weather({mode:"clouds"})
  Weather.findOneAndUpdate({_id:"Deepanshu"},weather).then(result=>{
    res.send(result)
  })
})

app.get("/lights",(req,res)=>{
  let r = req.query.r
  let g = req.query.g
  let b = req.query.b

  let colors = [r,g,b]

  console.log(colors)
  const weather = new Weather({userColor:[1,1,1]})
  Weather.findOneAndUpdate({_id:"Deepanshu"},weather).then(result=>{
    res.send(result)
  }).catch(err=>{
    console.log("err..................",err)
  })
})

let currentTime
app.get("/test",(req,res)=>{
    const resp = {
      main:"Clear",
      color:[255,255,255]
    }
    res.send(resp)
})

setInterval(()=>{
  Weather.findOne({_id:"Deepanshu"}).then(result=>{
    let lat = result.lat
    let lon = result.lon
    var config = {
      method: 'get',
      url: `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=b38e7738b387d4dc0bbf9fe1dfe668cb`,
      headers: { }
    };
   
    axios(config)
    .then(function (response) {

    const timezone = response.data.timezone

    // console.log("tz...",response)
    const time = Math.ceil(moment.utc().valueOf()/1000) + timezone

    currentTime = moment(time*1000).utc()

    console.log("currentTime...............",currentTime)

    // const sunrise = moment((1649505984 + 19800)*1000).utc()

    // const sunset = moment((1649552660 + 3600*7 + 19800)*1000).utc()

    var config = {
      method: 'get',
      url: `http://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0\n`,
      headers: { }
    };

    axios(config)
    .then(function (responseSun) {
      // console.log(JSON.stringify(response.data.results.sunrise));

      const sunriseUTC = moment(responseSun.data.results.sunrise)
      const sunsetUTC = moment(responseSun.data.results.sunset)

      // const currentVal = currentTime.valueOf()
      // const upVal = sunrise.valueOf()
      // const downVal = sunset.valueOf()

      // diffVal = currentTime.diff(sunrise)


      ts = Math.ceil((sunriseUTC/1000) + timezone)

      tss = Math.ceil(sunsetUTC/1000) + timezone

      const sunrise = moment(ts*1000).utc()
      const sunset = moment(tss*1000).utc()
      // console.log(sunrise)
      // console.log(currentTime)
      // console.log(sunset)

      const scaledTime = (currentTime - sunrise)/(sunset-sunrise)
      let colour
      if(scaledTime<=0){
        colour = [0,0,0]
      }
      else{
      
      scolour = colour_scale(scaledTime).rgb()

        // if(scaledTime<=0.5){
        //   opacity = (scaledTime - 0)/(0.5 - 0)         
        // }
        // else{
        //   opacity = 1 - ((scaledTime - 0.5)/(1 - 0.5))
        // }
      colour = [...scolour]
      console.log(colour)
      }

      return new Promise((resolve,reject)=>{
        resolve(colour)
      })

    }).then(col=>{
      console.log("col......",col)
      
    const weather = new Weather({ 
      _id: "Deepanshu",
      lat: response.data.coord.lat,
      lon: response.data.coord.lon,
      main: response.data.weather[0].main,
      desc: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      temp: response.data.main.temp,
      cloud: response.data.clouds.all,
      location:response.data.name,
      wind_speed:response.data.wind.speed,
      timezone:response.data.timezone,
      rain: response.data.rain?1:0,
      timestamp:new Date().getUTCSeconds(),
      sunrise:response.data.sys.sunrise,
      sunset:response.data.sys.sunset,
      color:col,
      currentTime:currentTime
    });
    
      Weather.findOneAndUpdate({_id:"Deepanshu"},weather).then(result=>{
        // console.log("data updated......",result)
      })
  
    })
    .catch(function (error) {
      console.log(error);
    });


      })
      .catch(function (error) {
        console.log(error)
      });  
  })
},5000)

app.get("/createdb",(req,res)=>{
  const weather = new Weather({ 
    _id: "Deepanshu",
    // mode:response.data.mode,
    lat: 28,
    lon: 77,
    main: "Clouds",
    desc: "Partly Cloudy",
    icon: "response.data.weather[0].icon",
    temp: 21,
    cloud: 21,
    location:"Gurgaon",
    wind_speed:31,
    timezone:19800,
    rain: 1,
    timestamp:new Date().getTime(),
    colour: [0,0,0],
    userColor:[1,1,1]
  });

  weather.save((err,result)=>{
    if(err){
      res.send(err)
    }
    else if(result){
      res.send(result)
    }
  })
})

app.get("/current",(req,res)=>{  

  const lat = req.query.lat
  const lon = req.query.lon

  var config = {
    method: 'get',
    url: `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=b38e7738b387d4dc0bbf9fe1dfe668cb`,
    headers: { }
  };
  
  axios(config)
  .then(function (response) {

  const weather = new Weather({ 
    _id: "Deepanshu",
    // mode:response.data.mode,
    lat: response.data.coord.lat,
    lon: response.data.coord.lon,
    main: response.data.weather[0].main,
    desc: response.data.weather[0].description,
    icon: response.data.weather[0].icon,
    temp: response.data.main.temp,
    cloud: response.data.clouds.all,
    location:response.data.name,
    wind_speed:response.data.wind.speed,
    timezone:response.data.timezone,
    rain: response.data.rain?1:0,
    timestamp:new Date().getTime()
  });

    Weather.findOneAndUpdate({_id:"Deepanshu"},weather).then(result=>{
      res.send(response.data)
    })

    })
    .catch(function (error) {
      res.send(error)
      console.log(error)
    });    
  })

app.use('/', express.static(path.join(__dirname, '/public')))



}).catch(err=>{
  console.log("database connection error", err)
 
})

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:` + port)
})