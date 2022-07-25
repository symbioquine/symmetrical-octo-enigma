import BaseObject from 'ol/Object';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import Geolocation from 'ol/Geolocation';
import { MapInstanceManager } from '@farmos.org/farmos-map';

import 'farm_map_google/src/main.js';

const farmOSMap = new MapInstanceManager();

farmOSMap.behaviors.google = window.farmOS.map.behaviors.google;

const map = farmOSMap.create('farm-map');

const getGeolocationObject = () => {
  return new Promise((resolve, fail) => {
    const findGeolocateCtrl = () => map.map.getControls().getArray().find(c => c.element.className.indexOf('ol-geolocate') !== -1);

    let geolocateCtrl = findGeolocateCtrl();

    const awaitActivated = () => {
      if (geolocateCtrl.element.className.indexOf('active') !== -1) {
        resolve(geolocateCtrl.geolocation);
      }

      const attrObserver = new MutationObserver((mutations) => {
        mutations.forEach(mu => {
          if (mu.type !== "attributes" || mu.attributeName !== "class") {
            return;
          }
          if (geolocateCtrl.element.className.indexOf('active') !== -1) {
            attrObserver.disconnect();
            resolve(geolocateCtrl.geolocation);
          }
        });
      });

      attrObserver.observe(geolocateCtrl.element, { attributes: true });
    };

    if (geolocateCtrl) {
      awaitActivated();
    } else {
      const onMapAddCtrl = map.map.getControls().on('add', () => {
        geolocateCtrl = findGeolocateCtrl();
        if (geolocateCtrl) {
          map.map.getControls().un('add', onMapAddCtrl.listener);
          awaitActivated();
        }
      });
    }
    
    
  });
};

map.addBehavior("sidePanel").then(async () => {
  const locationInfoPane = map.sidePanel.definePane({
    paneId: 'location_info',
    name: 'Location Info',
    icon: '♞',
    weight: 80,
  });

  const instructionsWidget = locationInfoPane.addWidgetElement(el('span', {}, instructionsSpan => {
    instructionsSpan.innerHTML = "First click the geolocate button to see location info here.";
  }));

  const geolocation = await getGeolocationObject();

  instructionsWidget.remove();

  locationInfoPane.addWidgetElement(el('p', { }, infoStatsP => {

    const defineStatsFacet = (facetId, label, unit) => {
      infoStatsP.appendChild(el('div', {}, div => {
        div.innerHTML = `${label}:`;
        div.appendChild(el('code', {}, facet => {
          geolocation.on(`change:${facetId}`, evt => facet.innerText = geolocation[`get${capitalizeFirstLetter(facetId)}`]().toFixed(3) + ' ' + unit);
        }));
      }));
    };

    defineStatsFacet('accuracy', 'position accuracy', '[m]');
    defineStatsFacet('altitude', 'altitude', '[m]');
    defineStatsFacet('altitudeAccuracy', 'altitude accuracy', '[m]');
    defineStatsFacet('heading', 'heading', '[rad]');
    defineStatsFacet('speed', 'speed', '[m/s]');

    locationInfoPane.addWidgetElement(el('div', { id: 'info'}, locationErrorsDiv => {
      geolocation.on('error', function (error) {
        locationErrorsDiv.innerHTML += error.message;
      });
    }));

  }));

  const accuracyFeature = new Feature();
  geolocation.on('change:accuracyGeometry', function () {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
  });

  const positionFeature = new Feature();
  positionFeature.setStyle(
    new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: '#3399CC',
        }),
        stroke: new Stroke({
          color: '#fff',
          width: 2,
        }),
      }),
    })
  );

  geolocation.on('change:position', function () {
    const coordinates = geolocation.getPosition();
    positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
  });

  new VectorLayer({
    map: map.map,
    source: new VectorSource({
      features: [accuracyFeature, positionFeature],
    }),
  });

});

// Helper to make defining elements easier
const el = (tagName, attrs, fn) => {
  const e = document.createElement(tagName);
  Object.entries(attrs || {}).forEach(([key, value]) => e.setAttribute(key, value));
  if (fn) fn(e);
  return e;
};

// From: https://stackoverflow.com/a/1026087/1864479
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
