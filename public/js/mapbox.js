/* eslint-disable */
// Eslint configed for NodeJs, but not pure JavaScript

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZHVvbmdkaW5oIiwiYSI6ImNrN2VpaTVleTBxenYzbnBxenYxM2ZnOWYifQ.HYkRk0Wn51hw0qWB_Zqt2Q';

  var map = new mapboxgl.Map({
    container: 'map', // connect with element with id=map in .html
    style: 'mapbox://styles/duongdinh/ck7eiun9a1pr31imlepihg7iy',
    scrollZoom: false // Disable zoom
    //   center: [106.682181, 20.842963],
    //   zoom: 15,
    //   interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker (pin)
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker (pin)
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup infor
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
