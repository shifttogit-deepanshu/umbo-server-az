const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const mongoose = require('mongoose');
const cors = require('cors')
const moment = require("moment-timezone")
const chroma = require("chroma-js")
const {MongoClient} = require('mongodb')

app.use(cors())

const path = require('path')
var axios = require('axios');
let scolour

const colour_scale = chroma.scale(['black','orange','yellow','white','yellow','orange','black'])

mongoose.connect('mongodb+srv://projectumbo:deepa%40SH4040@cluster0.ja4hb.mongodb.net/weathers',{serverSelectionTimeoutMS: 500000000000000000000000}).then(res=>{
console.log("connected to db............")
const WeatherSchema = new mongoose.Schema({
  _id:Number,
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
  currentTime:Number,
  lights_r:Number,
  lights_g:Number,
  lights_b:Number,
  lightOn:Boolean,
  color_r:Number,
  color_g:Number,
  color_b:Number
});

const Weather = mongoose.model('Weather', WeatherSchema);

app.get("/nodemcu",(req,res)=>{
  Weather.findOne({_id:1}).then(result=>{
    let respo
    if(result.mode=="web"){
      respo = {
        type:"web",
        mode:result.main,
        color_r:result.color_r,
        color_g:result.color_g,
        color_b:result.color_b
      }
    }
    else{
      respo = {
        type:"manual",
        mode:result.mode,
        color_r:result.lights_r,
        color_g:result.lights_g,
        color_b:result.lights_b
      }
    }  
    res.send(respo)
  }).catch(err=>res.send({error:err}))
})


app.get("/test",(req,res)=>{
  res.send({
    mode:"Clouds",
    color:[123,34,200]
  })
})

app.get("/dbdata",(req,res)=>{
  Weather.findOne({_id:1}).then(result=>{
    res.send(result)
  }).catch(err=>{
    res.send(err)
  })
})

app.get("/web",(req,res)=>{
  const weatherWeb = {mode:"web"}
  Weather.findOneAndUpdate({_id:1},weatherWeb).then(result=>{
    res.send(result)
  })
})

app.get("/rain",(req,res)=>{
  const weatherRain = {mode:"Rain"}
  Weather.findOneAndUpdate({_id:1},weatherRain).then(result=>{
    res.send(result)
  })
})

app.get("/thunder",(req,res)=>{
  const weatherStorm = new Weather({mode:"Thunderstorm"})
  Weather.findOneAndUpdate({_id:1},weatherStorm).then(result=>{
    res.send(result)
  })
})

app.get("/clouds",(req,res)=>{
  const weatherClouds = new Weather({mode:"Clouds"})
  Weather.findOneAndUpdate({_id:1},weatherClouds).then(result=>{
    res.send(result)
  })
})

app.get("/setToLights",(req,res)=>{
  const weatherClouds = new Weather({lightOn:req.query.val})
  Weather.findOneAndUpdate({_id:1},weatherClouds).then(result=>{
    res.send(result)
  })
})

app.get("/getLights",(req,res)=>{
  Weather.findOne({_id:1}).then(result=>{
    res.send({r:result.lights_r,g:result.lights_g,b:result.lights_b})
  })
})

app.get('/deletedb',(req,res)=>{
  Weather.deleteOne({_id:1}).then(result=>{
    console.log("weth deleted...........")
    res.send(result)
  }).catch(err=>{
    console.log("error deleting db....",err)
  })
})

app.get("/lights",(req,res)=>{
  let r = Number(req.query.r)
  let g = Number(req.query.g) 
  let b = Number(req.query.b) 

  const weatherLights = new Weather({lights_r:r,lights_g:g,lights_b:b})
  Weather.findOneAndUpdate({_id:1},{$set:weatherLights}).then(result=>{
    console.log("lights set................")
    res.send(result)
  }).catch(err=>{
    res.sendStatus(err)
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
  Weather.findOne({_id:1}).then(result=>{
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
      }

      return new Promise((resolve,reject)=>{
        resolve(colour)
      })

    }).then(col=>{ 
      
    const weatherData = new Weather({ 
      _id: 1,
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
      color_r:col[0],
      color_g:col[1],
      color_b:col[2],
      currentTime:currentTime
    });

    Weather.findOneAndUpdate({_id:1},{$set:weatherData}).then(resultL=>{
      // res.send(response.data)
      console.log("result.....",resultL)
    })
    .catch(function (error) {
      // res.send(error)
      console.log(error)
    }); 
  
    })
    .catch(function (error) {
      console.log(error);
    });


      })
      .catch(function (error) {
        console.log(error)
      });  
  })
},2000)

app.get("/createdb",(req,res)=>{
  
  const weather = new Weather({ 
    _id: 1,
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
    mode:"web",
    lights_r:123,
    lights_g:234,
    lights_b:231,
    lightOn:0,
    color_r:0,
    color_g:0,
    color_b:0,
  });

  weather.save((err,result)=>{
    if(err){
      console.log(err)
    }
    else if(result){
      console.log("db created............")
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
  Weather.findById({_id:1}).then(gotResult=>{
    const weatherArr = new Weather({ 
      _id: 1,
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
    console.log("...............",weatherArr)
    return weatherArr
  }).then(weth=>{
    Weather.findOneAndUpdate({_id:1},{$set:weth}).then(result=>{
      console.log("weth...........",weth)
      res.send(result)
    })
  }).catch(err=>{
    console.log(err)
    res.send(err)
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


app.post("/cred",(req,res)=>{
  const uri = "mongodb+srv://projectumbo:deepa%40SH4040@cluster0.ja4hb.mongodb.net";
  const client = new MongoClient(uri, { useUnifiedTopology: true, socketTimeoutMS: 30000000000000000,serverSelectionTimeoutMS: 500000000000000000000000});

  client.connect().then(_=>{
    const db = client.db("cred");
    const collect = db.collection("cred")

    ssid = req.query.ssid
    psk = req.query.psk

    collect.findOneAndUpdate({_id:1},{$set:{newid:ssid,newpsk:psk}}).then(result=>{
      // console.log("lights set................")
      res.send({result:result})
      client.close()
    }).catch(err=>{
      res.send({error:err})
      client.close()
      // console.log("err..................",err)
    })

  })
  
})

app.get("/getCred",(req,res)=>{
  const uri = "mongodb+srv://projectumbo:deepa%40SH4040@cluster0.ja4hb.mongodb.net";
  const client = new MongoClient(uri, { useUnifiedTopology: true ,socketTimeoutMS: 3000000000000000000,serverSelectionTimeoutMS: 500000000000000000000000 });

  client.connect().then(_=>{
    const db = client.db("cred");
    const collect = db.collection("cred")

    ssid = req.query.ssid
    psk = req.query.psk

    collect.findOne({_id:1}).then(result=>{
      // console.log("lights set................")
      res.send({result:result})
      client.close()
    }).catch(err=>{
      console.log("error.......",error)
      res.send({error:err})
      // console.log("err..................",err)
      client.close()
    })

  })
  
})


app.listen(port, () => {
  console.log(`Example app listening on http://localhost:` + port)
})