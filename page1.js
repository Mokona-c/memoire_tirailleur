// URL données
const POINTS_DECES_URL = 'assets/points_deces_vrai_vrai.geojson';
const AFRIQUE_GEOJSON_URL = 'assets/afrique.geojson';
const CONCENTRATION_DECES_URL = 'assets/concentration_deces_departement_wgs84.geojson';
const CONTOUR_FRANCE_URL = 'assets/contours_france.geojson';


// Valeurs spéciales : pour les catégories année, mois, pays
const ANNEE_INCONNUE_VALEUR = 9999;
const PAYS_INCONNU_VALEUR = 'Inconnu';

// Liste des années
const ANNEES_CONNUES = [1939, 1940, 1941, 1942, 1943, 1944, 1945, 1946, 1952];
const ANNEES = [...ANNEES_CONNUES, ANNEE_INCONNUE_VALEUR];

// Statistiques des décès
const STATS_DECES = {
    annee: {
        '1939': 52, '1940': 2608, '1941': 598, '1942': 275, '1943': 216,
        '1944': 635, '1945': 206, '1946': 56, '1952': 1,
        '9999': 90
    },
};

// Mappage des couleurs pour la Timeline (Division C) 
const COULEURS_ANNEES = {
    '1939': '#FF1744',
    '1940': '#1E88E5',
    '1941': '#00E676',
    '1942': '#D500F9',
    '1943': '#FFEB3B',
    '1944': '#00B0FF',
    '1945': '#7C4DFF',
    '1946': '#FF4D4D',
    '1952': '#4DD0E1',
    '9999': '#FF6D00'
};

/// cont MAXENCE ///
const infoBox = document.getElementById('info-box');
let hoveredStateId = null; 
/// fin cont MAXENCE 
/// chart MORGANE ///
let chart = null; 
/// fin chart MORGANE ///

// NOUVEAU: Variable pour stocker toutes les features (points) une fois chargées
let allPointsFeatures = [];

let currentIndexAnnee = -1;

// Carte France (Division A) 
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/positron', //'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [6.506929, 44.80],
    zoom: 4.9,
    padding: { bottom: window.innerHeight * 0.1 }
});

// Carte Afrique (Division B) 
const mapAfrique = new maplibregl.Map({
    container: 'map-afrique',
    style: 'https://tiles.openfreemap.org/styles/positron', //'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
    center: [16.614042, 0.5],
    zoom: 2.5,
    attributionControl: false
});
// Attendre que le style de la carte soit chargé
map.on('load', function () {
    // Ajouter la source des départements (concentration de décès)
    map.addSource('departements', {
        type: 'geojson',
        data: CONCENTRATION_DECES_URL
    });

    // Ajouter la couche des départements
    map.addLayer({
        id: 'departements-fill',
        type: 'fill',
        source: 'departements',
        paint: {
            'fill-color': [
                'step',
                ['get', 'proportion'],
                '#e9e9e9',
                0.014, '#d4d4d4',
                0.09950, '#9a9a9a',
                0.25250, '#707070',
                0.98650, '#030303ff'
            ],
            'fill-opacity': 0.75,
            'fill-outline-color': '#ffffff'
        }
    });

    // Ajouter une couche de lignes pour les bordures des départements
    map.addLayer({
        id: 'departements-border',
        type: 'line',
        source: 'departements',
        paint: {
            'line-color': '#ffffff',
            'line-width': 1,
            'line-dasharray': [2, 2],
            'line-opacity': 0.8
        }
    });

    // Ajouter la source du contour de la France
    map.addSource('contour-france', {
        type: 'geojson',
        data: CONTOUR_FRANCE_URL
    });

    // Ajouter la couche du contour de la France
    map.addLayer({
        id: 'contour-france-line',
        type: 'line',
        source: 'contour-france',
        paint: {
            'line-color': '#808080',
            'line-width': 2.5,
            'line-opacity': 1
        }
    });

    // Gestionnaire d'événements pour le survol
    map.on('mousemove', 'departements-fill', function (e) {
        if (e.features.length > 0) {
            const feature = e.features[0];
            const props = feature.properties;

            // Mettre à jour les informations affichées
            document.getElementById('info').innerHTML = `
                            <p><b>Département :</b> ${props.nom_departement || 'Non disponible'}</p>
                            <p><b>Nombre de décès :</b> ${formatNumber(props.Total_deces)}</p>
                            <p><b>Superficie :</b> ${props.Surface ? props.Surface.toFixed(2) + ' km²' : 'N/A'}</p>
                            <p><b>Concentration :</b> ${roundToThree(props.proportion)} morts/100km²</p>
                        `;

            // Changer le curseur
            map.getCanvas().style.cursor = 'pointer';
        }
    });

    // Réinitialiser le curseur et les informations quand la souris quitte la zone
    map.on('mouseleave', 'departements-fill', function () {
        document.getElementById('info').innerHTML = `
                        <p><b>Survolez un département</b></p>
                        <p>Les données s'afficheront ici</p>
                    `;
        map.getCanvas().style.cursor = '';
    });

    // Zoom sur le département au clic
    map.on('click', 'departements-fill', function (e) {
        if (e.features.length > 0) {
            const bounds = new maplibregl.LngLatBounds();

            // Calculer les limites de la feature
            const coordinates = e.features[0].geometry.coordinates;

            if (e.features[0].geometry.type === 'Polygon') {
                coordinates[0].forEach(coord => {
                    bounds.extend(coord);
                });
            } else if (e.features[0].geometry.type === 'MultiPolygon') {
                coordinates.forEach(polygon => {
                    polygon[0].forEach(coord => {
                        bounds.extend(coord);
                    });
                });
            }

            // Animer le zoom vers les limites
            map.fitBounds(bounds, {
                padding: 50,
                duration: 1000
            });
        }
    });

    // S'assurer que la couche des départements est visible par défaut
    map.setLayoutProperty('departements-fill', 'visibility', 'visible');
    map.setLayoutProperty('departements-border', 'visibility', 'visible');
    map.setLayoutProperty('contour-france-line', 'visibility', 'visible');
});

// Gestion des Données et des Couches (map.on('load')) 
map.on('load', async () => {
    ///MISAKI ///
    map.addSource('necropole', {
        'type': 'geojson',
        'data': './assets/necropole_new.geojson'
    });
    map.addLayer({
        'id': 'necropole-circle',
        'type': 'circle',
        'source': 'necropole',
        'layout': {},
        'paint': {
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['to-number', ['get', 'Nb_personnes']],
                0, 3,
                1000, 5,
                5000, 8,
                20000, 14,
                50000, 20,
                130000, 30
            ],
            'circle-color': [
                'match',
                ['get', 'Code_conflit'],
                // Mise à jour des couleurs pour les cercles
                1, '#B00000',
                2, '#FCD3D2',
                3, '#FA6B64',
                '#888'
            ],
            'circle-opacity': 0.75,
            'circle-stroke-width': 0.5,
            'circle-stroke-color': '#222',
            },
        layout: {
            // Tri pour que les grands cercles ne soient pas cachés (important !)
            'circle-sort-key': [
                '-', ['to-number', ['get', 'Nb_personnes']]
            ],
            'visibility': 'none'
        }
    });

    map.on('click', 'necropole-circle', e => {
        const props = e.features[0].properties, coords = e.features[0].geometry.coordinates.slice();
        showPopup(coords, props);
    });
    map.on('mouseenter', 'necropole-circle', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'necropole-circle', () => map.getCanvas().style.cursor = '');

    ///MISAKI ///
    // Ajout de la source des points de décès (sous forme de cluster)
    map.addSource('deces-points', {
        type: 'geojson',
        data: POINTS_DECES_URL,
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 50
    });

    // Charger toutes les features dans allPointsFeatures
    const response = await fetch(POINTS_DECES_URL);
    const geojson = await response.json();
    allPointsFeatures = geojson.features;

    // Couches d'affichage des points (clusters et points simple)
    map.addLayer({ /* clusters */ id: 'clusters', type: 'circle', source: 'deces-points', filter: ['has', 'point_count'], paint: {
        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
    }
    });

    map.addLayer({ /* clusters-count */ id: 'cluster-count', type: 'symbol', source: 'deces-points', filter: ['has', 'point_count'], layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Segoe UI, Tahoma, Geneva, Verdana, sans-serif'],
        'text-size': 12
    }, paint: { 'text-color': '#000' }
    });

    map.addLayer({ /* points simple*/ id: 'unclustered-point', type: 'circle', source: 'deces-points', filter: ['!', ['has', 'point_count']], paint: {
        'circle-color': ['get', 'display_color'],
        'circle-radius': 10,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
    }
    });

    // Initialisation des timelines
    initialiserTimeline('annee', ANNEES,
        ANNEE => ANNEE === ANNEE_INCONNUE_VALEUR ? 'Inconnu' : ANNEE.toString(),
        valeur => STATS_DECES.annee[valeur.toString()]
    );

    appliquerFiltreTemps();

    // Filtrage temporel   
    function featurePasseFiltreTemps(feature) {
        const a = parseInt(feature.properties.annee_deces);

        if (currentIndexAnnee !== -1) {
            const anneeActive = ANNEES[currentIndexAnnee];
            if (a !== anneeActive) return false;
        }

        return true;
    }

    // Gestion de l'intéraction (l'orsqu'on clique clic sur un point)
    map.on('click', 'unclustered-point', (e) => {

        const featureClicked = e.features[0];
        const communeClickee = featureClicked.properties.commune_correcte;

        // Filtrage et agrégation en mémoire 
        const statsParPays = allPointsFeatures
            .filter(f =>
                f.properties &&
                f.properties.commune_correcte === communeClickee &&
                featurePasseFiltreTemps(f)
            )
            .reduce((acc, feature) => {
                const pays = feature.properties.pays_naissance || PAYS_INCONNU_VALEUR;
                if (!acc[pays]) acc[pays] = 0;
                acc[pays]++;
                return acc;
            }, {});

        // Calculer le total des décès pour le popup
        const totalDecesCommune = Object.values(statsParPays).reduce((sum, count) => sum + count, 0);

        // Affichage du Popup
        const popupHTML = `
                            <div class="popup-header">
                                <h2 class="popup-commune" style="color:white;"> Commune : ${communeClickee}</h2>
                            </div>
                            <div class="popup-body">
                                <div class="popup-stat">
                                    <span class="popup-stat-label">Nombre de soldat(s) décédé(s) : </span>
                                    <span class="popup-stat-value">${totalDecesCommune}</span>
                                </div>
                            </div>
                        `;

        const ppopu = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            className: 'popup-france'
        })
            .setLngLat(e.lngLat)
            .setHTML(popupHTML)
            .addTo(map);

        // Affichage et mise à jour de la Sidebar Afrique (Division B)
        toggleSidebar('right', true);

        // Passage des statistiques agrégées à la fonction d'affichage
        updateAfriqueStatsSidebar(statsParPays);
    });

    // Intéraction lorsqu'on clique sur les clusters
    map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

    map.on('click', 'clusters', async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        if (!clusterId) return;
        const zoom = await map.getSource('deces-points').getClusterExpansionZoom(clusterId);
        map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 0.5, });
    });

    map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
    });
});

// Popup pour les pays africain
const popupAfrique = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false
});

// Gestion des Données et des Couches de la Division B : Afrique
mapAfrique.on('load', () => {

    mapAfrique.addSource('afrique-source', { type: 'geojson', data: AFRIQUE_GEOJSON_URL });

    mapAfrique.addLayer({
        id: 'afrique-fill',
        type: 'fill',
        source: 'afrique-source',
        paint: {
            'fill-color': ['case', ['==', ['get', 'NOM_PAYS'], ''], '#ccc', '#ff0000'],
            'fill-opacity': 0.7,
            'fill-outline-color': '#000'
        },
        filter: ['==', 'NOM_PAYS', '']
    });

    mapAfrique.addLayer({
        id: 'afrique-count',
        type: 'symbol',
        source: 'afrique-source',
        layout: {
            'text-field': '',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 14
        },
        paint: { 'text-color': '#000' }
    });

    // Survol : afficher nom du pays
    mapAfrique.on('mousemove', 'afrique-fill', function (e) {

        if (!e.features || e.features.length === 0) return;

        const pays = e.features[0].properties.NOM_PAYS;

        popupAfrique
            .setLngLat(e.lngLat)
            .setHTML(`<strong style="color:black">${pays}</strong>`)
            .addTo(mapAfrique);
    });

    // Quand la souris sort du pays enleve le popup
    mapAfrique.on('mouseleave', 'afrique-fill', function () {
        popupAfrique.remove();
    });
    mapAfrique.on('mouseenter', 'afrique-fill', () => {
        mapAfrique.getCanvas().style.cursor = 'pointer';
    });

    ///////MAXENCE//////////
    mapAfrique.addSource('ethnies', {
        'type': 'geojson',
        'data': './assets/ethnies_web.geojson',
        'generateId': true
    });

    mapAfrique.addLayer({
        'id': 'ethnies-fills',
        'type': 'fill',
        'source': 'ethnies',
        'layout': { 'visibility': 'none' },
        'paint': {
            'fill-color': '#627BC1',
            'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                0.5
            ]
        }
    });

    // AJOUTER une couche SYMBOL pour afficher les étiquettes d'ethnies

    mapAfrique.addLayer({
        'id': 'ethnies-labels',
        'type': 'symbol',
        'source': 'ethnies',
        'layout': {
            'visibility': 'none',
            // Le champ de texte à afficher (propriété du GeoJSON)
            'text-field': ['get', 'Ethnic_g'],
            // Taille du texte
            'text-size': 10,
            // Positionnement (si vous utilisez des polygones)
            'text-anchor': 'center',
            // Empêche les étiquettes de se chevaucher
            'text-allow-overlap': false
        },
        'paint': {
            // Couleur du texte
            'text-color': '#000000',
            // Ajout d'une lueur (halo) pour rendre le texte lisible sur n'importe quel fond
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1.5,
            'text-opacity': 0.8
        }
    });
    mapAfrique.addSource('aof', {
        'type': 'geojson',
        'data': './assets/aof_limites.geojson'
    });
    mapAfrique.addLayer({
        'id': 'aof_line',
        'type': 'line',
        'source': 'aof',
        'layout': { 'visibility': 'none' },
        'paint': {
            'line-color': '#627BC1',
            'line-width': 2
        }
    });

    mapAfrique.on('mousemove', 'ethnies-fills', (e) => {
        const feature = e.features[0];
        infoBox.innerHTML = `<strong>${feature.properties.Ethnic_g}</strong>`;
        if (e.features.length > 0) {
            if (hoveredStateId) {
                mapAfrique.setFeatureState(
                    { source: 'ethnies', id: hoveredStateId },
                    { hover: false }
                );
            }
            hoveredStateId = e.features[0].id;
            mapAfrique.setFeatureState(
                { source: 'ethnies', id: hoveredStateId },
                { hover: true }
            );
        }
    });

    mapAfrique.on('mouseleave', 'ethnies-fills', () => {
        infoBox.innerHTML = "Survolez une entité…";
        if (hoveredStateId) {
            mapAfrique.setFeatureState(
                { source: 'ethnies', id: hoveredStateId },
                { hover: false }
            );
        }
        hoveredStateId = null;
    });
    // cercles de recrutement, par clusters
    mapAfrique.addSource('cercles', {
        type: 'geojson',
        data: './assets/cercles_recrutement.geojson',
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 40
    });

    mapAfrique.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'cercles',
        filter: ['has', 'point_count'],
        layout: { 'visibility': 'none' },
        paint: {
            'circle-color': '#1f78b4',
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,   // size for 0–49 pts
                50, 30,   // size for 50–99 pts
                100, 40   // 100+ pts
            ],
            'circle-opacity': 0.7
        }
    });

    mapAfrique.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'cercles',
        filter: ['has', 'point_count'],
        layout: {
            'visibility': 'none' ,
            'text-field': '{point_count}',
            'text-size': 12,
            'text-font': ['Arial Unicode MS Bold', 'Open Sans Bold']
        },
        paint: {
            'text-color': '#ffffff'
        }
    });

    mapAfrique.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'cercles',
        filter: ['!', ['has', 'point_count']],
        layout: { 'visibility': 'none' },
        paint: {
            'circle-color': '#555599',
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
        }
    });

    mapAfrique.on('click', 'clusters', (e) => {
        const features = mapAfrique.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        mapAfrique.getSource('cercles').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            mapAfrique.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom
            });
        });
    });

    mapAfrique.on('click', 'unclustered-point', async (e) => { /* ... */
        const feature = e.features[0];
        const p = feature.properties;
        const html = `
                <h3 style="margin:0;padding-bottom:4px;">${p.Cercles}</h3>
                <p>Population avant-guerre : ${p["pop_1911/1914"]} habitants</p>
                <p>Population après-guerre : ${p["pop_1921/1922"]} habitants</p>
                <p>Nombre de recrutements : ${p.r_total}</p>
                <p>Dont ${p.r1914} en 1914, ${p.r1916} en 1916, ${p.r1917} en 1917 et ${p.r1918} en 1918 (pas de données pour 1915).</p>
            `;
        new maplibregl.Popup({ maxWidth: "300px" })
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(mapAfrique);
        createOrUpdateChart(p, p.Cercles)
    });

    mapAfrique.on('mouseenter', 'clusters', () => mapAfrique.getCanvas().style.cursor = 'pointer');
    mapAfrique.on('mouseleave', 'clusters', () => mapAfrique.getCanvas().style.cursor = '');
    mapAfrique.on('mouseenter', 'unclustered-point', () => mapAfrique.getCanvas().style.cursor = 'pointer');
    mapAfrique.on('mouseleave', 'unclustered-point', () => mapAfrique.getCanvas().style.cursor = '');
    
    
    ///////MAXENCE//////////
});

////// FONCTION POUR CARTE ETHNIE MAXENCE//////
function toggleEthnies() {
    // Liste des IDs des couches à afficher/cacher
    const layers = ['ethnies-fills', 'ethnies-labels', 'aof_line','clusters','cluster-count','unclustered-point'];
    const sidebar = document.getElementById('right');

    // On vérifie l'état de la première couche
    const firstLayer = layers[0];
    const visibility = mapAfrique.getLayoutProperty(firstLayer, 'visibility');

    if (visibility === 'visible') {
        // Si c'est visible, on cache tout
        layers.forEach(layerId => {
            mapAfrique.setLayoutProperty(layerId, 'visibility', 'none');
        });
        sidebar.style.width = "600px";
        console.log("Couches Maxence masquées");
    } else {
        // Sinon, on affiche tout
        layers.forEach(layerId => {
            mapAfrique.setLayoutProperty(layerId, 'visibility', 'visible');
        });
        sidebar.style.width = "1200px";
        console.log("Couches Maxence affichées");
    }
    setTimeout(() => {
        map.resize();
        mapAfrique.resize();
    }, 300);
}
//////FONCTION POUR CARTE ETHNIE MAXENCE//////:
////// FONCTION POUR CARTE MISAKI-ANGE//////

function toggleNecropoles() {
    // --- 1. CONFIGURATION DES COUCHES MAPBOX ---
    const couchesDeces = ['clusters', 'cluster-count', 'unclustered-point'];
    const couchesNecro = ['necropole-circle'];

    // --- 2. SÉLECTION DES ÉLÉMENTS HTML ---
    
    // Groupe "TEMPOREL" (Mode Décès)
    // ID : legend | Class : .echelle
    const temporelId = document.getElementById('legend');
    const temporelClass = document.querySelectorAll('.echelle');

    // Groupe "NÉCROPOLES" (Mode Nécropoles)
    // ID : graph_perso | Class : .categorie
    const necroId = document.getElementById('graph_perso');
    const necroClass = document.querySelectorAll('.categorie');

    // Bouton d'action
    const bouton = document.getElementById('btn-toggle-layers');

    // --- 3. DÉTECTION DE L'ÉTAT ACTUEL ---
    // On vérifie si une couche "Décès" est visible
    const estAfficheDeces = map.getLayoutProperty(couchesDeces[0], 'visibility') !== 'none';

    if (estAfficheDeces) {
        // ============================================
        // >>> PASSAGE EN MODE NÉCROPOLES (ON ACTIVE)
        // ============================================

        // 1. Carte : Masquer Décès / Afficher Nécropoles
        couchesDeces.forEach(id => map.setLayoutProperty(id, 'visibility', 'none'));
        couchesNecro.forEach(id => map.setLayoutProperty(id, 'visibility', 'visible'));

        // 2. HTML : Masquer le groupe TEMPOREL
        if (temporelId) temporelId.style.display = 'none';
        temporelClass.forEach(el => el.style.display = 'none');

        // 3. HTML : Afficher le groupe NÉCROPOLES
        if (necroId) necroId.style.display = 'block'; // ou 'flex' selon ton CSS
        necroClass.forEach(el => el.style.display = 'block'); // ou 'flex'

        // 4. Mettre à jour le texte du bouton
        if (bouton) bouton.innerText = "Afficher les décès (2GM)";

    } else {
        // ============================================
        // >>> PASSAGE EN MODE DÉCÈS (RETOUR DÉFAUT)
        // ============================================

        // 1. Carte : Afficher Décès / Masquer Nécropoles
        couchesNecro.forEach(id => map.setLayoutProperty(id, 'visibility', 'none'));
        couchesDeces.forEach(id => map.setLayoutProperty(id, 'visibility', 'visible'));

        // 2. HTML : Afficher le groupe TEMPOREL
        // Note: Si tes éléments .echelle étaient en flex, mets 'flex' ici
        if (temporelId) temporelId.style.display = 'block'; 
        temporelClass.forEach(el => el.style.display = 'flex'); 

        // 3. HTML : Masquer le groupe NÉCROPOLES
        if (necroId) necroId.style.display = 'none';
        necroClass.forEach(el => el.style.display = 'none');

        // 4. Mettre à jour le texte du bouton
        if (bouton) bouton.innerText = "Afficher les Nécropoles";
    }
}

////// FONCTION POUR CARTE MISAKI-ANGE//////

// Mise à jour de la Sidebar B avec les statistiques de la commune cliquée 
function updateAfriqueStatsSidebar(statsParPays) {

    const afriqueMessage = document.getElementById('afrique-message');
    const mapAfriqueDiv = document.getElementById('map-afrique-container');

    // mettre des couleurs dans les pays correspondants aux lieux de naissances des soldats de la commune cliquée
    const paysPresent = Object.keys(statsParPays).filter(pays => pays !== PAYS_INCONNU_VALEUR);

    if (paysPresent.length === 0) {
        mapAfriqueDiv.style.display = 'block';
        afriqueMessage.style.display = 'block';
        afriqueMessage.innerHTML = '<h2 style="color:white; margin-top: -6px;">Pays d\'origine non visualisable</h2><p style="color:white;">Le(s) soldat(s) morts ici ont un pays de naissance inconnu.</p>';
        if (mapAfrique.getSource('afrique-source')) {
            mapAfrique.setFilter('afrique-fill', ['==', 'NOM_PAYS', '']);
        }
        return;
    }

    // Afficher la carte
    mapAfriqueDiv.style.display = 'block';

    // Filtre les polygones de l'Afrique pour colorier les pays concernés
    mapAfrique.setFilter('afrique-fill', ['in', ['get', 'NOM_PAYS'], ['literal', paysPresent]]);
    mapAfrique.setFilter('afrique-count', ['in', ['get', 'NOM_PAYS'], ['literal', paysPresent]]);

    // Construire la liste des statistiques pour l'affichage textuel (décompte par pays)
    let statsHTML = `<h3 style="color:white; margin-top: 5px;">Décès par Pays de naissance dans cette commune :</h3><ul style="padding-left: 0;">`;

    // Trier par nombre de décès décroissant
    const paysSorted = Object.entries(statsParPays)
        .sort(([, countA], [, countB]) => countB - countA);

    paysSorted.forEach(([pays, count]) => {
        const isAfrica = paysPresent.includes(pays);
        // La couleur de fond de la liste indique si le pays est coloré sur la carte Afrique
        statsHTML += `<li style="margin-bottom: 5px; color:white; background-color: ${isAfrica ? 'rgba(255, 0, 0, 0.3)' : 'rgba(100, 100, 100, 0.3)'}; padding: 3px 5px; border-radius: 3px;">
                                    <strong>${pays}:</strong> ${count} soldat(s)
                                </li>`;
    });
    statsHTML += `</ul>`;

    afriqueMessage.innerHTML = statsHTML;
}

// Fonction pour basculer la sidebar (Division B)
function toggleSidebar(id, forceOpen = false) {
    const elem = document.getElementById(id);
    const classes = elem.className.split(' ');
    const collapsed = classes.indexOf('collapsed') !== -1;

    // Si on veut forcer l'ouverture de la sidebar et qu'elle est déjà ouverte, on sort.
    if (forceOpen && !collapsed) return;

    const padding = {};

    if (collapsed || forceOpen) {
        // Enleve la classe qui cache la sidebar : elle s'ouvre
        if (collapsed) classes.splice(classes.indexOf('collapsed'), 1);
        padding[id] = 600;
    } else {
        // Ajoute la classe pour cacher la sidebar : elle se ferme
        classes.push('collapsed');
        padding[id] = 0;
        
        // --- AJOUTE JUSTE CETTE LIGNE ICI ---
        // Cela force la sidebar à redevenir normale (600px) dès qu'on la ferme
        elem.style.width = "600px"; 
    }

    elem.className = classes.join(' ');

    // Animation de la carte principale 
    map.easeTo({
        padding,
        duration: 1000 // 1000ms
    });

    if (collapsed || forceOpen) {
        setTimeout(() => {
            mapAfrique.resize();
            console.log('mapAfrique.resize() exécuté pour afficher la carte Afrique.');
        }, 1100);
    }
}

// Fonctions de la couche "concentration de décès par département" -    
// Fonction pour formater les nombres
function formatNumber(num) {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString('fr-FR');
}

// Fonction pour arrondir à 3 décimales
function roundToThree(num) {
    if (num === undefined || num === null) return 'N/A';
    return num.toFixed(3);
}

// Gestion des erreurs de chargement
map.on('error', function (e) {
    console.error('Erreur de carte:', e.error);
});

// Fonctions de la Timeline (Division C) -
function initialiserTimeline(type, valeurs, getLabel, getCount) {
    const timeline = document.getElementById(`timeline-${type}`);
    timeline.innerHTML = '';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.id = `progress-${type}`;
    timeline.appendChild(progressBar);

    // Détermine la source de couleurs
    const couleurSource = (type === 'annee') ? COULEURS_ANNEES : COULEURS_MOIS;

    valeurs.forEach((valeur, index) => {
        let circle = document.createElement('div');
        circle.className = 'timeline-item';

        const idValeur = valeur.toString();
        circle.id = `${type}-${idValeur}`;

        const couleurDuCercle = couleurSource[idValeur] || '#CCCCCC'; // Couleur grise

        // Stocker la couleur cible dans un attribut data-color
        circle.setAttribute('data-color', couleurDuCercle);

        // Ajout du Label (Année/Inconnu)
        let label = document.createElement('span');
        label.className = 'timeline-label';
        label.textContent = getLabel(valeur);
        label.style.color = 'white';
        circle.appendChild(label);

        // Ajout du Compteur
        let count = document.createElement('span');
        count.className = 'timeline-count';
        count.textContent = getCount(valeur).toLocaleString('fr-FR');
        circle.appendChild(count);

        circle.onclick = () => { selectTime(type, index); };
        timeline.appendChild(circle);
    });
}

function selectTime(type, index) {
    let valeurs;
    if (type === 'annee') {
        valeurs = ANNEES;
    }

    const timeline = document.getElementById(`timeline-${type}`);

    // Récupérer l'élément actif avant le masquage
    const prevElement = timeline.querySelector('.timeline-item.active');

    let isDeactivating = false;
    if (type === 'annee' && currentIndexAnnee === index) {
        // On clique sur l'année déjà active : on désactive
        isDeactivating = true;
        currentIndexAnnee = -1; // Réinitialiser à "aucun filtre"
    } else {
        // On active une nouvelle année
        if (type === 'annee') {
            currentIndexAnnee = index;
        }
    }

    // Masquer tous les compteurs
    timeline.querySelectorAll('.timeline-count').forEach(span => {
        span.style.display = 'none';
    });

    if (prevElement) {
        prevElement.classList.remove('active');
        prevElement.style.backgroundColor = '#CCCCCC';
    }

    if (isDeactivating) {
        appliquerFiltreTemps(); // Applique le filtre "aucun" pour tout réafficher
        return; // Sort de la fonction
    }

    // RETARDER L'AFFICHAGE DU CERCLE ET DU COMPTEUR
    setTimeout(() => {

        const idValeur = valeurs[index].toString();
        const selectedItem = document.getElementById(`${type}-${idValeur}`);


        if (selectedItem) {
            // Appliquer la couleur stockée
            const couleurActive = selectedItem.getAttribute('data-color');
            selectedItem.style.backgroundColor = couleurActive;

            // Activation du cercle visuel
            selectedItem.classList.add('active');

            // Affichage du compteur
            const countSpan = selectedItem.querySelector('.timeline-count');
            if (countSpan) {
                countSpan.style.display = 'block';
            }
        }

    }, 0.2);

    appliquerFiltreTemps();

}

function defilerTemps(type, direction) {
    let currentIndex, maxIndex, valeurs;
    if (type === 'annee') {
        currentIndex = currentIndexAnnee;
        valeurs = ANNEES;
    }
    maxIndex = valeurs.length - 1;

    let newIndex = currentIndex + direction;

    // Logique de la boucle des boutons "NEXT" et "PREVIOUS"

    // CAS 1: Gérer l'état initial inactif (-1)
    if (currentIndex === -1) {
        // Au premier clic (Next ou Previous), on commence toujours par l'index 0.
        newIndex = 0;
    }

    // CAS 2: Boucle NEXT (Aller du dernier élément au début)
    else if (newIndex > maxIndex) {
        newIndex = -1;
    }

    // CAS 3: Boucle PREVIOUS (Aller du premier élément à la fin)
    else if (newIndex < 0) {
        newIndex = -1;
    }


    selectTime(type, newIndex);

    defilerTemps()
}

function appliquerFiltreTemps() {
    if (!map.getSource || !map.getSource('deces-points')) return;

    // Détermination de l'état actif basé sur les index globaux
    const anneeActive = currentIndexAnnee !== -1;
    const filtreTemporalActif = anneeActive;

    let annee = anneeActive ? ANNEES[currentIndexAnnee] : null;

    // Déterminer la couleur active pour les points individuels
    let couleurActive = null;
    if (annee !== null) {
        couleurActive = COULEURS_ANNEES[annee.toString()] || null;
    }

    // Définir la couleur du Clusters en premier 
    // Si un filtre est actif, utilisez la couleur du filtre
    if (filtreTemporalActif) {

        map.setPaintProperty('clusters', 'circle-color', couleurActive);
        map.setPaintProperty('cluster-count', 'text-color', '#000');
    } else {
        // Si inactif (currentIndex = -1), remet le style d'origine ci-dessous
        map.setPaintProperty('clusters', 'circle-color', [
            'step',
            ['get', 'point_count'],
            '#51bbd6', 100, '#f1f075', 750, '#f28cb1'
        ]);
        map.setPaintProperty('cluster-count', 'text-color', '#000');
    }

    // Filtrage des données 
    const filtered = {
        type: "FeatureCollection",
        features: allPointsFeatures
            .filter(f => {
                const a = parseInt(f.properties.annee_deces);

                if (annee !== null && a !== annee) return false;
                return true;
            })
            .map(f => {
                const ff = JSON.parse(JSON.stringify(f));

                // Si un filtre est actif, on utilise la couleur du filtre.
                if (couleurActive) {
                    ff.properties.display_color = couleurActive;
                } else {
                    // Sinon on utilise la couleur_annee stockée dans le GeoJSON
                    ff.properties.display_color = ff.properties.couleur_annee || '#CCCCCC';
                }
                return ff;
            })
    };

    // Mettre à jour la source (reconstruit les clusters pour ce sous-ensemble)
    map.getSource('deces-points').setData(filtered);


    // S'assurer que la couche 'unclustered-point' utilise bien display_color
    if (map.getLayer('unclustered-point')) {
        map.setPaintProperty('unclustered-point', 'circle-color', ['get', 'display_color']);
    }

    // Mise à jour visuelle de la progress bar / timeline si besoin (retiré car géré par selectTime)
    if (currentIndexAnnee !== -1) updateProgressBar('annee', currentIndexAnnee, ANNEES.length);
}

function togglePopup() {
    const popup = document.getElementById('popup');
    if (popup.style.display === 'none') {
        popup.style.display = 'block';
        // Forcer la réanimation
        popup.style.animation = 'none';
        setTimeout(() => {
            popup.style.animation = 'popupSlideIn 0.3s ease-out';
        }, 10);
    } else {
        popup.style.display = 'none';
    }
}

// Popup informatif à l'ouverture de la visualisation ===
let currentSection = 0;
const totalSections = 4;

function updateSection(index) {
    // Cacher toutes les sections
    document.querySelectorAll('.popup-content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Afficher la section actuelle
    document.getElementById(`section${index + 1}`).classList.add('active');

    // Mettre à jour les dots
    document.querySelectorAll('.popup-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Mettre à jour les boutons
    document.getElementById('btnPrevSection').disabled = index === 0;
    document.getElementById('btnNextSection').textContent = index === totalSections - 1 ? 'Commencer' : 'Suivant';

    currentSection = index;
}

function nextSection() {
    if (currentSection < totalSections - 1) {
        updateSection(currentSection + 1);
    } else {
        closeInfoPopup();
    }
}

function previousSection() {
    if (currentSection > 0) {
        updateSection(currentSection - 1);
    }
}

function goToSection(index) {
    updateSection(index);
}

function closeInfoPopup() {
    // On cherche l'overlay par son ID (vérifie si c'est bien popupOverlay dans ton HTML)
    const overlay = document.getElementById('popupOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        console.log("Popup fermée");
    } else {
        console.error("Impossible de trouver l'élément avec l'ID popupOverlay");
    }
}

// Fermer avec la touche Échap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const popup = document.getElementById('popupOverlay');
        if (popup && !popup.classList.contains('hidden')) {
            closeInfoPopup();
        }
    }
});

//////// CREATE CHART MORGANE //////

function createOrUpdateChart(properties, name) {
    const ctx = document.getElementById('pieChart');

    if (chart) {
        chart.destroy();
    }

    const r1914 = Number(properties["r1914"]);
    const r1916 = Number(properties["r1916"]);
    const r1917 = Number(properties["r1917"]);
    const r1918 = Number(properties["r1918"]);

    if (isNaN(r1914) || isNaN(r1916) || isNaN(r1917) || isNaN(r1918)) {
        console.warn(`Données de recrutement incomplètes ou manquantes pour : ${name}`);
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }

    // Création du graphique Chart.js
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Recrutement 1914', 'Recrutement 1916', 'Recrutement 1917', 'Recrutement 1918'],
            datasets: [{
                label: `Recrutement par année - ${name}`,
                data: [r1914, r1916, r1917, r1918],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.parsed;
                                const percentage = ((value / total) * 100).toFixed(1) + '%';
                                label += `${value} (${percentage})`;
                            }
                            return label;
                        }
                    }
                },
                title: {
                    display: true,
                    text: ['Recrutement par année pour :', `${name}`],
                    font: { size: 18 },
                    color: '#000000ff'
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 13, family: 'Arial' },
                        color: '#000000ff',
                    },
                }
            }
        }
    });
}
//////// CREATE CHART MORGANE //////

///////MISAKI ////////////
///////MISAKI ////////////
const categories = ['Hauts-de-France','Marne','Meuse','Autres Grand Est','Autres'];
const featuresByCat = new Map(categories.map(c=>[c,[]]));
const tokensByCat = new Map(categories.map(c=>[c,[]]));

// Constantes des pictogrammes
const PERSON_R = 3, RECT_W=2, RECT_H=3;
const spacingX=12, spacingY=12, paddingX=3, paddingY=5;

// Popup
const mapPopup = new maplibregl.Popup({closeButton:true,closeOnClick:true});

// Tooltip
const tooltipDiv = d3.select('body').append('div')
  .style('position','absolute').style('background','#fff').style('padding','4px 8px')
  .style('border','1px solid #666').style('border-radius','4px').style('pointer-events','none')
  .style('opacity',0);
d3.select('body').on('mousemove', (event)=>{tooltipDiv.style('left',(event.pageX+12)+'px').style('top',(event.pageY+12)+'px');});

async function loadCemeteries() {
    try {
        const response = await fetch('assets/necropole_new.geojson');
        cemeteries = await response.json(); // On remplit la variable globale

        
        // 1. Initialiser les catégories (votre boucle forEach)
        cemeteries.features.forEach(f => {
            const p = f.properties || {};
            const cat = classifier(p);
            featuresByCat.get(cat).push(f);
            
            const n = parseInt(p.Nb_personnes) || 0;
            const fullTokens = Math.floor(n / 1000), remainder = n % 1000;
            let color = '#B00000';
            if (p.Code_conflit == 2) color = '#FCD3D2';
            if (p.Code_conflit == 3) color = '#FA6B64';
            
            const tokenGroup = [];
            for (let i = 0; i < fullTokens; i++) tokenGroup.push({ color, opacity: 1 });
            if (remainder > 0) tokenGroup.push({ color, opacity: 0.7 });
            
            tokensByCat.get(cat).push({ feature: f, tokens: tokenGroup });
        });

        // 2. Remplir les filtres (Départements et Communes)
        populateFilters();

        // 3. Premier rendu des graphiques
        renderCategories();

    } catch (error) {
        console.error("Erreur lors du chargement :", error);
    }
}

// Appeler la fonction
loadCemeteries();
console.log(cemeteries);

function populateFilters() {
    const deptSelect = document.getElementById('filter-dept');
    const communeSelect = document.getElementById('filter-commune');

    // Récupérer les départements uniques
    const depts = [...new Set(cemeteries.features.map(f => f.properties.Departement))].sort();
    depts.forEach(d => {
        const o = document.createElement('option');
        o.value = d; o.text = d;
        deptSelect.appendChild(o);
    });

    // Récupérer les communes uniques
    const communes = [...new Set(cemeteries.features.map(f => f.properties.Commune))].sort();
    communes.forEach(c => {
        const o = document.createElement('option');
        o.value = c; o.text = c;
        communeSelect.appendChild(o);
    });
}

// Catégorisation
function classifier(props){
  const region = (props.Region||"").trim();
  const dept = (props.Departement||props.Dep2||"").trim();
  if (dept === 'Marne') return 'Marne';
  if (dept === 'Meuse') return 'Meuse';
  if (region.includes('Hauts-de-France')) return 'Hauts-de-France';
  if (region.includes('Grand Est')) return 'Autres Grand Est';
  return 'Autres';
}


// =======================


// Reset view
class ResetViewControl {
  onAdd(map){this._map=map;this._container=document.createElement("div");this._container.className="maplibregl-ctrl maplibregl-ctrl-group";this._container.innerHTML=`<button title="Vue initiale">⟳</button>`;this._container.onclick=()=>{map.easeTo({center:[2.2,46.3],zoom:5.2,pitch:0,bearing:0})};return this._container;}
  onRemove(){this._container.remove();}
}
map.addControl(new ResetViewControl(),"top-right");

// =======================
// Fonctions de dessin des catégories
function renderCategories(){
  const catsDiv = d3.select('#cats');
  categories.forEach(cat=>{
    const tokenGroups = tokensByCat.get(cat).filter(tg=>featuresByCat.get(cat).includes(tg.feature));
    const totalPeople = tokenGroups.reduce((sum,g)=>sum+g.tokens.reduce((s,t)=>s+(t.opacity===1?1000:parseInt(g.feature.properties.Nb_personnes)%1000),0),0);
    const card = catsDiv.append('div').attr('class','categorie').attr('data-cat',cat);
    const head = card.append('div').attr('class','entete-cat');
    head.append('div').attr('class','titre-cat').text(cat);
    const totalDiv = head.append('div').attr('class','total-personnes').text(totalPeople+' personnes');
    totalDiv.append('span').attr('class','nombre-lieux').text('('+featuresByCat.get(cat).length+' lieux)');

    const svg = card.append('svg').attr('class','grid-svg');
    let totalTokens = 0; tokenGroups.forEach(tg=>totalTokens+=tg.tokens.length);
    const cols = 25, rows = Math.ceil(totalTokens/cols);
    svg.attr('viewBox', `0 0 ${cols*spacingX+paddingX*2} ${rows*spacingY+paddingY*2}`).attr('preserveAspectRatio','xMidYMid meet');
    const g = svg.append('g'); let tokenIndex=0;

    tokenGroups.forEach(tg=>{
      const graveGroup = g.append('g').attr('class','grave-group').style('cursor','pointer');
      tg.tokens.forEach(t=>{
        const col=tokenIndex%cols,row=Math.floor(tokenIndex/cols);
        const x=col*spacingX+paddingX, y=row*spacingY+paddingY;
        const person = graveGroup.append('g').attr('transform',`translate(${x},${y})`);
        person.append('circle').attr('r',PERSON_R).attr('cy',-PERSON_R).attr('fill',t.color).attr('stroke','#333').attr('stroke-width',0.2).attr('opacity', t.opacity);
        person.append('rect').attr('x',-RECT_W/2).attr('y',0).attr('width',RECT_W).attr('height',RECT_H).attr('rx',0.8).attr('fill',t.color).attr('stroke','#333').attr('stroke-width',0.2).attr('opacity', t.opacity);
        tokenIndex++;
      });

      // popup pictogram
      graveGroup.on('click', event=>{
        const coords=tg.feature.geometry.coordinates;
        const props=tg.feature.properties;
        if(map&&coords){
          map.flyTo({center:coords,zoom:12});
          showPopup(coords,props);
        }
        event.stopPropagation();
      });
      graveGroup.on('mouseenter', ()=>{graveGroup.selectAll('circle,rect').attr('stroke','#000').attr('stroke-width',1.2);
        const props=tg.feature.properties; tooltipDiv.style('z-index',500).style('opacity',1).html(`<strong>${props.Nom||'—'}</strong><br/>Commune: ${props.Commune||'—'}<br/>Nombre: ${props.Nb_personnes||'0'}`);
      });
      graveGroup.on('mouseleave', ()=>{graveGroup.selectAll('circle,rect').attr('stroke','#333').attr('stroke-width',0.2);tooltipDiv.style('z-index',500).style('opacity',0);});
    });

    card.append('div').attr('class','label-cat').style('display','none');
    card.on('click', ()=>{
      const feats = featuresByCat.get(cat);
      if(!feats.length) return;
      const coords = feats.map(f=>f.geometry.coordinates);
      const lons = coords.map(c=>c[0]), lats=coords.map(c=>c[1]);
      map.fitBounds([[Math.min(...lons),Math.min(...lats)],[Math.max(...lons),Math.max(...lats)]],{padding:40});
    });
  });
}

// =======================
// Fonction popup
function showPopup(coords,props){
  let html=`<strong>${props.Nom||'—'}</strong><br/>Département: ${props.Departement||props.Dep2||'—'}<br/>Commune: ${props.Commune||'—'}<br/>Nombre de personnes: ${props.Nb_personnes||'0'}`;
  if(props.image) html+=`<br><img class="popup-img" src="${props.image}">`;
  if(coords) html+=`<br><a href="https://www.google.com/maps?q=&layer=c&cbll=${coords[1]},${coords[0]}" target="_blank">Google Street View</a>`;
  if(props.wikipedia) html+=`<br><a href="${props.wikipedia}" target="_blank">Wikipedia</a>`;
  mapPopup.setLngLat(coords).setHTML(html).addTo(map);
}

// =======================
// Filtrage
const deptSelect=document.getElementById('filter-dept');
const communeSelect=document.getElementById('filter-commune');
Array.from(new Set(cemeteries.features.map(f=>f.properties.Departement))).sort().forEach(d=>{const o=document.createElement('option');o.value=d;o.text=d;deptSelect.appendChild(o);});
Array.from(new Set(cemeteries.features.map(f=>f.properties.Commune))).sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.text=c;communeSelect.appendChild(o);});

function applyFilters(){
  const code=document.getElementById('filter-conflit').value;
  const dept=document.getElementById('filter-dept').value;
  const commune=document.getElementById('filter-commune').value;
  const nb=document.getElementById('filter-nb').value;
  const search=document.getElementById('filter-search').value.toLowerCase();

  const filtered = cemeteries.features.filter(f=>{
    const p=f.properties;
    if(code&&p.Code_conflit.toString()!==code) return false;
    if(dept&&p.Departement!==dept) return false;
    if(commune&&p.Commune!==commune) return false;
    if(nb){
      const n=parseInt(p.Nb_personnes)||0;
      let [min,max]=nb.split('-'); min=parseInt(min); max=(max==='+'?Infinity:parseInt(max));
      if(n<min||n>max) return false;
    }
    if(search && !( (p.Nom||'').toLowerCase().includes(search) || (p.Commune||'').toLowerCase().includes(search) )) return false;
    return true;
  });

  map.getSource('cemeteries').setData({type:'FeatureCollection',features:filtered});

  // Refaire featuresByCat + tokensByCat
  categories.forEach(cat=>{
    const featsCat = filtered.filter(f=>classifier(f.properties)===cat);
    featuresByCat.set(cat,featsCat);
  });

  d3.select('#cats').selectAll('.categorie').remove();
  renderCategories();
}

document.getElementById('filter-go').addEventListener('click',applyFilters);

//////////MISAKI////////


