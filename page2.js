const points = [
  {
    name: "1919 : naissance",
    coords: [-15.97, 12.82],
    text: "Bourama Diémé naît le 1er janvier 1919 à Marsassoum, en Casamance au Sénégal.",
    imgUrl: "https://www.senegal-online.com/wp-content/uploads/2021/02/senegal_casamance_001.jpg"
  },
  {
    name: "5 janvier 1939 : l'appel au combat",
    coords: [1.43, 44.43],
    text: "D'abord appelé au 7ème Régiment de Tirailleurs Sénégalais (RTS), il fût ensuite transféré au 16ème RTS à Cahors, dans le Lot.",
    imgUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Insigne_r%C3%A9gimentaire_du_7e_R%C3%A9giment_de_Tirailleurs_S%C3%A9n%C3%A9galais..jpg/330px-Insigne_r%C3%A9gimentaire_du_7e_R%C3%A9giment_de_Tirailleurs_S%C3%A9n%C3%A9galais..jpg"
  },
  {
    name: "Mai 1940 : les premiers combats",
    coords: [2.52, 49.87],
    text: "D'abord stationné en Alsace-Lorraine lors de la drôle de guerre, il combattit dans la Sarre, la Somme puis à Villers-Bretonneux.",
    imgUrl: "https://archives.somme.fr/images/2b37fa5b-e47d-4924-afe9-a1edd6086359_img-notice.jpg"
  },
  {
    name: "1940 : la capture par les Allemands",
    coords: [9.1, 53.38],
    text: "Capturé par les Allemands, il échappe à l'éxécution avant d'être emprisonné près de Brême, au Stalag 10B.",
    imgUrl: "https://upload.wikimedia.org/wikipedia/commons/8/86/Baracken_in_Sandbostel.jpg"
  },
  {
    name: "1941 : le transfert au camp de Buglose",
    coords: [-0.98, 43.73],
    text: "Il fût ensuite transféré en zone occupée, au camp de Buglose dans les Landes, où sont emprisonnés les troupes coloniales françaises.",
    imgUrl: "https://www.tourismelandes.com/wp-content/uploads/wpetourisme/IMG-0885-3.jpg"
  },
  {
    name: "Mars 1942 : l'évasion",
    coords: [-17.45, 14.72],
    text: "En mars 1942, il parvient à s'échapper du camp de Buglose, et gagne la zone libre. A partir de là, il gagne Dakar au Sénégal pour rejoindre les rangs de la France Libre. Il est ensuite reversé au 17ème RT en 1943, avant d'être transféré au 16ème RTS en 1944, alors déployé au Maroc.",
    imgUrl: "https://www.senegal-online.com/wp-content/uploads/2021/12/illustration12Carte4_Mil-Geo_PlanDakar_1941_B.jpg"
  },
  {
    name: "1944-1945 : Opération Dragoon et la Libération",
    coords: [5.92, 43.12],
    text: "Il participa ensuite au débarquement de Provence en septembre 1944. D'abord débarqué à Toulon, il participa ensuite à la Libération de la France jusque la fin de la guerre.",
    imgUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Operation_Dragoon_-_map.jpg/1200px-Operation_Dragoon_-_map.jpg"
  },
  {
    name: "1949-1951 puis 1953-1955 : la guerre d'Indochine",
    coords: [105.58, 21.3],
    text: "D'abord promu caporal-chef lors de déploiements en Afrique du Nord après la guerre, il servit ensuite en Indochine au sein du 29ème Bataillon de Marche de Tirailleurs Sénégalais. Il s'illustra notamment au cours de la bataille de Vinh-Yen en 1950, où il est promu sergent.",
    imgUrl: "https://imagesdefense.gouv.fr/media/catalog/product/cache/cd2692fc7d9ab1675277705532ebbce4/2/5/2564378_1_1.jpg"
  },
  {
    name: "1956 : l'expédition de Suez",
    coords: [32.55, 29.97],
    text: "A son retour d'Indochine, il fût transféré au 23ème Régiment d'Infanterie Coloniale avant d'être envoyé en Egypte pour participer à l'expédition de Suez.",
    imgUrl: "https://www.cheminsdememoire.gouv.fr/sites/default/files/2020-10/exp%C3%A9dition%20Suez.JPG"
  },
  {
    name: "1956-1959 : la guerre d'Algérie",
    coords: [2.51, 36.2],
    text: "Une fois revenu de Suez, son unité est envoyée en Algérie. Il s'illustra notamment en 1958 dans l'oued Cheurfa, où il détruisit une importante position du F.L.N.",
    imgUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/%D9%88%D8%A7%D8%AF_%D8%AD%D8%B1%D8%A8%D9%8A%D9%84.jpg/1733px-Mapcarta.jpg"
  },
  {
    name: "Après l'armée",
    coords: [2.36, 48.98],
    text: "Il est ensuite libéré de ses obligations militaires françaises, avant de rejoindre l'armée sénégalaise, où il s'illustra notamment au Congo belge. Il quitta ses fonctions militaires en 1965. Après sa retraite, il s'installe à Sarcelles en 1989. Commandeur de la Légion d'Honneur en 1991, il meurt le 6 juin 1999.",
    imgUrl: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Commandeur_de_l%27Ordre_de_la_L%C3%A9gion_d%27Honneur_avers.jpg"
  }
];
///
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

const imageEl = document.getElementById("current-image");
const textEl = document.getElementById("current-text");

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
  updateImage(0);
  updateDisplay(0);
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
  updateImage(currentIndex);
  updateDisplay(currentIndex);

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
function updateDisplay(index) {
    const point = points[index];

    if (!point) return;

    // A. Mise à jour de l'IMAGE
    if (point.imgUrl) {
        imageEl.src = point.imgUrl;
        imageEl.style.display = "block";
    } else {
        imageEl.style.display = "none";
    }

    // B. Mise à jour du TEXTE (text)
    if (textEl) {
        textEl.innerText = point.text;
    }
}

function updateImage(index) {
    const point = points[index];
    
    // Debug : On affiche ce qu'on essaie de faire
    console.log("Tentative d'affichage image pour l'index :", index);
    
    if (!imageEl) {
        console.error("ERREUR : Je ne trouve pas la balise <img id='current-image'> dans le HTML !");
        return;
    }

    if (point && point.imgUrl) {
        console.log("Image trouvée :", point.imgUrl);
        imageEl.src = point.imgUrl;
        imageEl.style.display = "block";
    } else {
        console.warn("Pas d'image définie pour ce point (propriété imgUrl manquante).");
        imageEl.style.display = "none";
    }
}

function addMarker(point, index) {
  if (markers[index]) return markers[index];

  const popup = new maplibregl.Popup({
    offset: 25,
    closeOnClick: false,
    className: 'custom-map-popup'
  }).setHTML(`
    <div style="font-size:20px;">${point.name}</div>
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
