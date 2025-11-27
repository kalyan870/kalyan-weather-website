const API_KEY = "f447f02b4979f801fd81a2f6a66d919a";
let lat = null, lon = null;
let sunrise = null, sunset = null;
let forecastData = null;

document.getElementById('visitDate').valueAsDate = new Date();

// Dark Mode Toggle
document.getElementById('themeToggle').onclick = () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document.getElementById('themeToggle').innerHTML = isDark ?
    '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
};

// Auto theme
function applyAutoTheme() {
  if (!sunrise || !sunset) return;
  const now = Date.now();
  const isNight = now > sunset * 1000 || now < sunrise * 1000;
  document.body.classList.toggle('dark', isNight);
}

// Location functions
function getLocationWeather() {
  if (!navigator.geolocation) return alert("Geolocation not supported");
  document.getElementById('loading').classList.remove('hidden');
  navigator.geolocation.getCurrentPosition(pos => {
    lat = pos.coords.latitude; lon = pos.coords.longitude;
    loadEverything();
  }, () => alert("Location denied"));
}

function searchFlexibleLocation() {
  let q = document.getElementById('city').value.trim() || document.getElementById('district').value.trim() || document.getElementById('state').value.trim();
  if (!q) return alert("Enter city");
  document.getElementById('loading').classList.remove('hidden');
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${q},IN&appid=${API_KEY}&units=metric`)
    .then(r => r.json()).then(d => {
      if (d.cod === 200) { lat = d.coord.lat; lon = d.coord.lon; loadEverything(); }
      else alert("City not found");
    });
}

function loadEverything() {
  const currentURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  fetch(currentURL).then(r => r.json()).then(d => {
    sunrise = d.sys.sunrise; sunset = d.sys.sunset;
    const temp = Math.round(d.main.temp);

    // Current Display
    document.getElementById('currentIcon').innerHTML = `<img src="https://openweathermap.org/img/wn/${d.weather[0].icon}@4x.png">`;
    document.getElementById('temp').innerHTML = `${temp}°C<br><small>Feels ${Math.round(d.main.feels_like)}°C</small>`;
    document.getElementById('minMax').textContent = `${Math.round(d.main.temp_min)}° – ${Math.round(d.main.temp_max)}°`;
    document.getElementById('description').textContent = d.weather[0].description;
    document.getElementById('location').innerHTML = 
      `${d.name}, ${d.sys.country}<br><small>Sunrise ${new Date(sunrise*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} • Sunset ${new Date(sunset*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small>`;

    document.getElementById('humidity').textContent = d.main.humidity;
    document.getElementById('wind').innerHTML = `${d.wind.speed.toFixed(1)} m/s <i class="fas fa-arrow-up" style="transform:rotate(${d.wind.deg||0}deg);margin-left:8px;"></i>`;
    document.getElementById('visibility').textContent = (d.visibility/1000).toFixed(1);

    // UV + AQI
    fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`).then(r=>r.json()).then(u=>{
      const c = u.value<3?"#2ed573":u.value<7?"#ffa502":u.value<9?"#ff6348":"#ff4757";
      document.getElementById('uvBadge').innerHTML = `<div style="background:${c};">UV Index: ${u.value.toFixed(1)}</div>`;
    });

    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`).then(r=>r.json()).then(a=>{
      const l=a.list[0].main.aqi;
      const q=["Good","Fair","Moderate","Poor","Very Poor"][l-1];
      const c=["#2ed573","#7bed9f","#ffa502","#ff6348","#ff4757"][l-1];
      document.getElementById('aqiBadge').innerHTML = `<div style="background:${c};">Air ${q}</div>`;
    });

    // Tips
    let tips = [];
    if (temp > 34) tips.push("Very hot — stay hydrated");
    if (temp > 32) tips.push("Light cotton clothes");
    if (temp < 20) tips.push("Carry jacket");
    if (d.weather[0].main.toLowerCase().includes('rain')) tips.push("Carry umbrella");
    if (d.main.humidity > 80) tips.push("Humid — stay cool");
    const tipsDiv = document.createElement('div');
    tipsDiv.innerHTML = `<strong>Today Tips</strong><br>${tips.join(" • ") || "Perfect weather!"}`;
    tipsDiv.style.cssText = "margin:20px 0;padding:18px;background:rgba(255,255,255,0.2);border-radius:16px;text-align:center;";
    document.querySelector('.weather-info').appendChild(tipsDiv);

    // Moon Phase
    const phases = ["New Moon","Waxing Crescent","First Quarter","Waxing Gibbous","Full Moon","Waning Gibbous","Last Quarter","Waning Crescent"];
    const icons = ["New Moon","Waxing Crescent","First Quarter Moon","Waxing Gibbous","Full Moon","Waning Gibbous","Last Quarter Moon","Waning Crescent"];
    const phase = Math.floor((Date.now()/1000 - 946684800) / 2551442.8 % 8);
    const nextFull = new Date(); nextFull.setDate(nextFull.getDate() + (14 - phase + 8) % 8);
    document.getElementById('aqiBadge').insertAdjacentHTML('afterend', `
      <div style="margin:20px 0;padding:18px;background:rgba(255,255,255,0.15);border-radius:16px;text-align:center;">
        <strong>Moon Phase</strong><br>${icons[phase]} ${phases[phase]}<br>
        <small>Next Full Moon: ${nextFull.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</small>
      </div>`);

    // Weather Quote
    const quotes = {
      rain: ["Perfect weather for chai & pakoras","Rain = blanket + movie time","Barish mein bheegne ka mood?"],
      clear: ["Sky is smiling today!","Perfect day to go out","Sunshine = free therapy"],
      clouds: ["Moody weather, cozy vibes","Cloudy with a chance of laziness"],
      thunderstorm: ["Zeus is in a mood today","Stay safe, stay cozy!"],
      default: ["Weather kaisa bhi ho, mood accha rakho!"]
    };
    const key = d.weather[0].main.toLowerCase().includes('rain') ? 'rain' :
                d.weather[0].main === 'Clear' ? 'clear' :
                d.weather[0].main === 'Clouds' ? 'clouds' :
                d.weather[0].main === 'Thunderstorm' ? 'thunderstorm' : 'default';
    const quote = quotes[key][Math.floor(Math.random()*quotes[key].length)];
    const quoteDiv = document.createElement('div');
    quoteDiv.innerHTML = `"${quote}"`;
    quoteDiv.style.cssText = "margin:25px 0 10px;padding:22px;background:rgba(0,0,0,0.35);border-radius:20px;font-style:italic;opacity:0.9;font-size:17px;";
    document.querySelector('.container').appendChild(quoteDiv);

    updateBackground(d.weather[0].main, d.weather[0].icon.endsWith('n'));
    applyAutoTheme();
    showSunProgress();
    document.getElementById('weatherInfo').classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
  });

  // Forecast
  fetch(forecastURL).then(r => r.json()).then(f => {
    forecastData = f.list;

    // Hourly & Daily (same as before)
    document.getElementById('hourlyForecast').innerHTML = "";
    f.list.slice(0,8).forEach(i => {
      document.getElementById('hourlyForecast').innerHTML += `
        <div class="hour-card">
          <div>${new Date(i.dt*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
          <img src="https://openweathermap.org/img/wn/${i.weather[0].icon}@2x.png">
          <div>${Math.round(i.main.temp)}°</div>
          <div class="rain-chance">${Math.round((i.pop||0)*100)}% rain</div>
        </div>`;
    });

    // Daily forecast (same logic)
    let days = {};
    f.list.forEach(i => {
      let k = new Date(i.dt*1000).toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'});
      if (!days[k]) days[k] = {temps:[],icons:{}};
      days[k].temps.push(i.main.temp);
      days[k].icons[i.weather[0].icon] = (days[k].icons[i.weather[0].icon]||0)+1;
    });
    document.getElementById('dailyForecast').innerHTML = "";
    Object.keys(days).slice(0,5).forEach(day => {
      let h = Math.round(Math.max(...days[day].temps));
      let l = Math.round(Math.min(...days[day].temps));
      let ic = Object.keys(days[day].icons).sort((a,b)=>days[day].icons[b]-days[day].icons[a])[0];
      document.getElementById('dailyForecast').innerHTML += `
        <div class="day-card"><div class="day">${day}</div><img src="https://openweathermap.org/img/wn/${ic}@2x.png"><div class="temps"><span class="high">${h}°</span> / <span class="low">${l}°</span></div></div>`;
    });
  });
}

// Background + Sun Progress + Check Safe + Voice + Favorites (all working!)
function updateBackground(main, isNight) {
  document.body.className = '';
  if (main.toLowerCase().includes('rain') || main.toLowerCase().includes('drizzle')) document.body.classList.add('rainy');
  else if (main.toLowerCase().includes('thunder')) document.body.classList.add('thunder');
  else if (main.toLowerCase().includes('fog')) document.body.classList.add('foggy');
  else if (isNight) document.body.classList.add('clear-night');
  else document.body.classList.add('clear-day');
}

function showSunProgress() {
  if (!sunrise || !sunset) return;
  const now = Date.now()/1000;
  let p = ((now - sunrise) / (sunset - sunrise)) * 100;
  p = Math.max(0, Math.min(100, p));
  const bar = `<div style="margin:30px 0;text-align:center;"><div style="font-size:14px;margin-bottom:8px;">Sun Progress</div>
    <div style="height:12px;background:rgba(255,255,255,0.3);border-radius:10px;overflow:hidden;position:relative;">
      <div style="width:${p}%;height:100%;background:linear-gradient(90deg,#ffe66d,#ff9f43);"></div>
      <div style="position:absolute;top:-10px;left:${p}%;transform:translateX(-50%);font-size:28px;">Sun</div>
    </div><div style="margin-top:8px;">${Math.round(p)}% daylight</div></div>`;
  const e = document.getElementById('sunBar'); if(e) e.remove();
  const n = document.createElement('div'); n.id='sunBar'; n.innerHTML=bar;
  document.querySelector('.details').insertAdjacentElement('afterend', n);
}

function checkIfSafeToGo() {
  if (!forecastData) return alert("Wait a sec...");
  const date = document.getElementById('visitDate').value;
  const time = document.getElementById('visitTime').value || "12:00";
  if (!date) return alert("Select date");
  const target = new Date(`${date}T${time}:00`).getTime() / 1000;
  const closest = forecastData.reduce((a,b) => Math.abs(a.dt-target) < Math.abs(b.dt-target) ? a : b);
  const temp = closest.main.temp, rain = (closest.pop||0)*100, wind = closest.wind.speed;
  const desc = closest.weather[0].description.toLowerCase();

  let score = 10;
  if (rain > 70 || desc.includes('storm') || desc.includes('thunder')) score -= 6;
  else if (rain > 40) score -= 3;
  if (temp > 38 || temp < 5) score -= 5;
  else if (temp > 34 || temp < 10) score -= 2;
  if (wind > 15) score -= 2;
  score = Math.max(1, Math.round(score));

  const msg = ["Stay home!","Very bad","Not great","Think twice","Okay","Be prepared","Good day","Very good","Excellent!","PERFECT!"][score-1];
  const color = score >= 8 ? "good" : score >= 5 ? "warning" : "danger";

  document.getElementById('recommendation').innerHTML = `<strong>Travel Score: ${score}/10</strong><br><br>${msg}`;
  document.getElementById('recommendation').className = color;
}

function speakWeather() {
  const text = `In Kalyan, it's currently ${document.getElementById('temp').innerText.replace('<br>',' ')} and ${document.getElementById('description').textContent}. ${document.querySelector('#recommendation strong')?.innerText || ''}`;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-IN'; utter.rate = 0.9;
  speechSynthesis.speak(utter);
}

function saveCurrentLocation() {
  const name = document.getElementById('location').innerText.split(',')[0].trim();
  let favs = JSON.parse(localStorage.getItem('weatherFavs') || '[]');
  if (!favs.includes(name)) {
    favs.push(name);
    localStorage.setItem('weatherFavs', JSON.stringify(favs));
    alert(`${name} saved! Tap heart to view`);
  } else alert("Already saved");
}

function showFavorites() {
  const favs = JSON.parse(localStorage.getItem('weatherFavs') || '[]');
  if (favs.length === 0) return alert("No favorites yet");
  const choice = prompt("Your Favorite Cities:\n" + favs.join('\n') + "\n\nType city name to load:");
  if (choice && favs.includes(choice.trim())) {
    document.getElementById('city').value = choice;
    searchFlexibleLocation();
  }
}

function shareWeather() {
  const text = `Kalyan Live Weather\n${document.getElementById('location').innerText}\n${document.getElementById('temp').innerText}\n${document.getElementById('description').textContent}\n\nMade with love — https://yourlink.com`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

window.onload = () => {
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  getLocationWeather();
};