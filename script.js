'use strict';

const btn = document.querySelector('.btn-country');
const countriesContainer = document.querySelector('.countries');

///////////////////////////////////////

const renderCountry = function (data, className = '') {
  // converts languages value to array
  const languages =
    data.languages !== undefined ? Object.values(data.languages) : '';

  // converts currencies value to array
  const currencies =
    data.currencies !== undefined ? Object.values(data.currencies) : '';
  const html = `
    <article class="country ${className}">
    <img class="country__img" src="${data.flags.svg}" />
    <div class="country__data">
    <h3 class="country__name">${data.name.common}</h3>
    <h4 class="country__region">${data.region}</h4>
    <p class="country__row"><span>👫</span>${(
      +data.population / 1000000
    ).toFixed(1)} people</p>
      <p class="country__row"><span>🗣️</span>${languages[0]}</p>
      <p class="country__row"><span>💰</span>${currencies[0].name}</p>
      </div>
      </article>
      `;

  countriesContainer.insertAdjacentHTML('beforeend', html);
  // countriesContainer.style.opacity = 1;
};

const renderError = function (msg) {
  countriesContainer.insertAdjacentText('beforeend', msg);
  countriesContainer.style.opacity = 1;
};

// Old school way
const getCountryAndNeighbourOld = function (country) {
  // AJAX call country 1
  const request = new XMLHttpRequest();
  request.open('GET', 'https://restcountries.com/v3.1/name/' + country);
  console.log(request);
  request.send();
  console.log(request.responseText);
  request.addEventListener('load', function () {
    const [data] = JSON.parse(this.responseText);
    renderCountry(data);

    // Get neighbour country border
    const [neighbour] = data.borders;

    if (!neighbour) return;

    // AJAX call country 2
    // Callback hell
    const request2 = new XMLHttpRequest();
    request2.open('GET', 'https://restcountries.com/v3.1/alpha/' + neighbour);
    request2.send();
    request2.addEventListener('load', function () {
      const [data] = JSON.parse(this.responseText);
      renderCountry(data, 'neighbour');
    });
  });
};

// getCountryAndNeighbourOld('usa');

const getJSON = function (url, errorMsg = 'Something went wrong') {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(errorMsg);
    return response.json();
  });
};

// New way
const getCountryAndNeighbourNew = function (country) {
  // Country 1
  getJSON('https://restcountries.com/v3.1/name/' + country, 'Country not found')
    .then(([data]) => {
      renderCountry(data);
      if (!data.borders) throw new Error('Country is borderless');
      const [neighbour] = data.borders;
      // Country 2
      return getJSON(
        'https://restcountries.com/v3.1/alpha/' + neighbour,
        'Country not found'
      );
    })
    .then(([data]) => renderCountry(data, 'neighbour'))
    .catch(err => {
      console.error(`${err} 📛📛📛`);
      renderError(`Something went wrong 📛📛📛 ${err.message}. Try again`);
    })
    .finally(() => {
      countriesContainer.style.opacity = 1;
    });
};

// btn.addEventListener('click', function () {
//   getCountryAndNeighbourNew('madagascar');
// });

// Promisifying the geolocation  api
const getPosition = function () {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

// Get the flag of current location with reverse geocoding
const whereAmI = function () {
  // getPosition returns a promise
  getPosition()
    .then(res => {
      console.log(res);
      const { latitude: lat, longitude: lng } = res.coords;
      return fetch(`https://geocode.xyz/${lat},${lng}?json=1`);
    })
    .then(res => res.json())
    .then(data => {
      if (!data.country) throw new Error('You have exceeded the request limit');
      console.log(`You are in ${data.city}, ${data.country}`);
      getCountryAndNeighbourNew(data.country);
    })
    .catch(err => {
      renderError(`${err.message} 📛📛📛`);
    })
    .finally(() => (countriesContainer.style.opacity = 1));
};

btn.addEventListener('click', function () {
  whereAmI();
});

// Recreate whereAmI Using AsyncAwait to consume promises instead of the then method to make it look more elegant
const whereAmIAsync = async function () {
  try {
    // Geolocation
    const pos = await getPosition();
    console.log(pos);
    const { latitude: lat, longitude: lng } = pos.coords;

    // Reverse geocoding
    const resGeo = await fetch(`https://geocode.xyz/${lat},${lng}?json=1`);
    console.log(resGeo);
    const data = await resGeo.json();
    if (!data.country) throw new Error('You have exceeded the request limit');
    console.log(`You are in ${data.city}, ${data.country}`);
    getCountryAndNeighbourNew(data.country);
  } catch (err) {
    console.error(err.message);
    renderError(err.message);
  }
};

// whereAmIAsync();

// Running Promises in parallel
const get3Countries = async function (c1, c2, c3) {
  try {
    const data = await Promise.all([
      getJSON(`https://restcountries.com/v3.1/name/${c1}`),
      getJSON(`https://restcountries.com/v3.1/name/${c2}`),
      getJSON(`https://restcountries.com/v3.1/name/${c3}`),
    ]);
    console.log(data.map(([d]) => d.capital[0]));
  } catch (error) {
    console.error(error.message);
  }
};

get3Countries('nigeria', 'togo', 'usa');
