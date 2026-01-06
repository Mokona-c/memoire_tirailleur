const points = [
  {
    name: "1919 : naissance",
    coords: [-15.97, 12.82],
    text: "Bourama Diémé naît le 1er janvier 1919 à Marsassoum, en Casamance au Sénégal."
  },
  {
    name: "5 janvier 1939 : l'appel au combat",
    coords: [1.43, 44.43],
    text: "D'abord appelé au 7ème Régiment de Tirailleurs Sénégalais (RTS), il fût ensuite transféré au 16ème RTS à Cahors, dans le Lot."
  },
  {
    name: "Mai 1940 : les premiers combats",
    coords: [2.52, 49.87],
    text: "D'abord stationné en Alsace-Lorraine lors de la drôle de guerre, il combattit dans la Sarre, la Somme puis à Villers-Bretonneux."
  },
  {
    name: "1940 : la capture par les Allemands",
    coords: [9.1, 53.38],
    text: "Capturé par les Allemands, il échappe à l'éxécution avant d'être emprisonné près de Brême, au Stalag 10B."
  },
  {
    name: "1941 : le transfert au camp de Buglose",
    coords: [-0.98, 43.73],
    text: "Il fût ensuite transféré en zone occupée, au camp de Buglose dans les Landes, où sont emprisonnés les troupes coloniales françaises."
  },
  {
    name: "Mars 1942 : l'évasion",
    coords: [-17.45, 14.72],
    text: "En mars 1942, il parvient à s'échapper du camp de Buglose, et gagne la zone libre. A partir de là, il gagne Dakar au Sénégal pour rejoindre les rangs de la France Libre. Il est ensuite reversé au 17ème RT en 1943, avant d'être transféré au 16ème RTS en 1944, alors déployé au Maroc."
  },
  {
    name: "1944-1945 : Opération Dragoon et la Libération",
    coords: [5.92, 43.12],
    text: "Il participa ensuite au débarquement de Provence en septembre 1944. D'abord débarqué à Toulon, il participa ensuite à la Libération de la France jusque la fin de la guerre."
  },
  {
    name: "1949-1951 puis 1953-1955 : la guerre d'Indochine",
    coords: [105.58, 21.3],
    text: "D'abord promu caporal-chef lors de déploiements en Afrique du Nord après la guerre, il servit ensuite en Indochine au sein du 29ème Bataillon de Marche de Tirailleurs Sénégalais. Il s'illustra notamment au cours de la bataille de Vinh-Yen en 1950, où il est promu sergent."
  },
  {
    name: "1956 : l'expédition de Suez",
    coords: [32.55, 29.97],
    text: "A son retour d'Indochine, il fût transféré au 23ème Régiment d'Infanterie Coloniale avant d'être envoyé en Egypte pour participer à l'expédition de Suez."
  },
  {
    name: "1956-1959 : la guerre d'Algérie",
    coords: [2.51, 36.2],
    text: "Une fois revenu de Suez, son unité est envoyée en Algérie. Il s'illustra notamment en 1958 dans l'oued Cheurfa, où il détruisit une importante position du F.L.N."
  },
  {
    name: "Après l'armée",
    coords: [2.36, 48.98],
    text: "Il est ensuite libéré de ses obligations militaires françaises, avant de rejoindre l'armée sénégalaise, où il s'illustra notamment au Congo belge. Il quitta ses fonctions militaires en 1965."
  }

];

const map = new maplibregl.Map({
  container: "map",
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: points[0].coords,
  zoom: 3
});

map.addControl(new maplibregl.NavigationControl());

let currentIndex = 0;
const markers = [];
const lineCoords = [];

const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
let activePopup = null;


/* ------------------ Setup ------------------ */

map.on("load", () => {
  map.setProjection({ type: 'globe' });
  map.addSource("path", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: []
      }
    }
  });

  map.addLayer({
    id: "path-line",
    type: "line",
    source: "path",
    paint: {
      "line-color": "#456990",
      "line-width": 1,
    }
  });
  updateButtonStates();
  const firstMarker = addMarker(points[0], 0);
  firstMarker.togglePopup();
  activePopup = firstMarker.getPopup();

});

/* ------------------ Navigation ------------------ */

nextBtn.addEventListener("click", () => moveTo(currentIndex + 1, true));
prevBtn.addEventListener("click", () => moveTo(currentIndex - 1, false));

function moveTo(index, forward) {
  if (index < 0 || index >= points.length) return;

  updateButtonStates(true);

  const prevPoint = points[currentIndex];
  const nextPoint = points[index];
  currentIndex = index;

  map.flyTo({
    center: nextPoint.coords,
    zoom: 4,
    speed: 1,
    curve: 1.4,
    easing: t => t,
    essential: true
  });

  map.once("moveend", () => {
    updateButtonStates(false);
    const marker = addMarker(nextPoint, currentIndex);
    if (activePopup) {
      activePopup.remove();
    }
    marker.togglePopup();
    activePopup = marker.getPopup();
  });
  const segmentCoords = [prevPoint.coords, nextPoint.coords];

  // On met à jour la source avec uniquement ces deux points
  map.getSource("path").setData({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: segmentCoords
    }
  });

}

/* ------------------ Fonctions ------------------ */

function addMarker(point, index) {
  if (markers[index]) return markers[index];

  const popup = new maplibregl.Popup({
    offset: 25,
    closeOnClick: false,
    className: 'custom-map-popup'
  }).setHTML(`
    <strong>${point.name}</strong>
    <div>${point.text}</div>
  `);
  const marker = new maplibregl.Marker({ color: "#2D3142" })
    .setLngLat(point.coords)
    .setPopup(popup)
    .addTo(map);
  markers[index] = marker;
  return marker;
}

function setButtonsDisabled(disabled) {
  nextBtn.disabled = disabled;
  prevBtn.disabled = disabled;
}

function updateButtonStates(isAnimating = false) {
  if (isAnimating) {
    nextBtn.disabled = true;
    prevBtn.disabled = true;
    return;
  }
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === points.length - 1;
  prevBtn.title = prevBtn.disabled ? "Pas de point précédent" : "";
  nextBtn.title = nextBtn.disabled ? "Pas de point suivant" : "";

}
