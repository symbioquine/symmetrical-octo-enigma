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

const map = farmOSMap.create('farm-map');

setTimeout(() => map.attachBehavior(window.farmOS.map.behaviors.google), 1000);

map.addBehavior("sidePanel").then(() => {
  const locationDrawingPane = map.sidePanel.definePane({
    paneId: 'location_drawing',
    name: 'Location Drawing',
    icon: '♞',
    weight: 80,
  });

  const geolocation = new Geolocation({
    trackingOptions: {
      enableHighAccuracy: true,
    },
    projection: map.map.getView().getProjection(),
  });

  locationDrawingPane.addWidgetElement(el('label', {'for': 'track'}, trackLocationCheckboxLabel => {
    trackLocationCheckboxLabel.innerHTML = 'track position';

    trackLocationCheckboxLabel.appendChild(el('input', {type: "checkbox", id: "track" }, trackLocationCheckbox => {
      console.log(trackLocationCheckbox, typeof trackLocationCheckbox.addEventListener);
      trackLocationCheckbox.addEventListener('change', function () {
        geolocation.setTracking(this.checked);
      });
    }));

  }));

  locationDrawingPane.addWidgetElement(el('p', { }, infoStatsP => {

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

    locationDrawingPane.addWidgetElement(el('div', { id: 'info'}, locationErrorsDiv => {
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

  locationDrawingPane.set('active', true);
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
