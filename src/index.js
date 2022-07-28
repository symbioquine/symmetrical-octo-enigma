import Control from 'ol/control/Control';
import { CLASS_CONTROL, CLASS_UNSELECTABLE } from 'ol/css';
import { MapInstanceManager } from '@farmos.org/farmos-map';

import 'farm_map_google/src/main';

import './styles.css';

const farmOSMap = new MapInstanceManager();

farmOSMap.behaviors.google = window.farmOS.map.behaviors.google;

const pageMap = farmOSMap.create('farm-map', { units: 'us' });

const drawingLayer = pageMap.addLayer('vector');

pageMap.addBehavior('edit', { layer: drawingLayer }).then(() => {
  pageMap.addBehavior('measure', { layer: drawingLayer });
});

const getGeolocationObject = () => new Promise((resolve) => {
  const findGeolocateCtrl = () => pageMap.map.getControls().getArray().find((c) => c.element.className.indexOf('ol-geolocate') !== -1);

  let geolocateCtrl = findGeolocateCtrl();

  const awaitActivated = () => {
    if (geolocateCtrl.element.className.indexOf('active') !== -1) {
      resolve(geolocateCtrl.geolocation);
    }

    const attrObserver = new MutationObserver((mutations) => {
      mutations.forEach((mu) => {
        if (mu.type !== 'attributes' || mu.attributeName !== 'class') {
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
    const onMapAddCtrl = pageMap.map.getControls().on('add', () => {
      geolocateCtrl = findGeolocateCtrl();
      if (geolocateCtrl) {
        pageMap.map.getControls().un('add', onMapAddCtrl.listener);
        awaitActivated();
      }
    });
  }
});

class GeolocationDrawing extends Control {
  /**
   * @param {Options=} opts GeolocationDrawing options.
   */
  constructor(opts) {
    const options = opts || {};

    super({
      element: document.createElement('div'),
      target: options.target,
    });

    this.geolocation = options.geolocation;

    const self = this;

    const { element } = this;

    const className = options.className || 'ol-geoloc-drawing';
    element.className = `${className} ${CLASS_UNSELECTABLE} ${CLASS_CONTROL}`;

    this.innerControlElements = {};

    /* eslint-disable no-param-reassign */
    function createControlElement(elementTag, name, builderFn) {
      const controlElem = document.createElement(elementTag);
      controlElem.className = `${className} ${name}`;
      builderFn.call(self, controlElem);
      self.innerControlElements[name] = controlElem;
      element.appendChild(controlElem);
    }

    createControlElement('button', 'singlePointButton', (button) => {
      // https://materialdesignicons.com/icon/map-marker-plus
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M9,11.5A2.5,2.5 0 0,0 11.5,9A2.5,2.5 0 0,0 9,6.5A2.5,2.5 0 0,0 6.5,9A2.5,2.5 0 0,0 9,11.5M9,2C12.86,2 16,5.13 16,9C16,14.25 9,22 9,22C9,22 2,14.25 2,9A7,7 0 0,1 9,2M15,17H18V14H20V17H23V19H20V22H18V19H15V17Z" /></svg>';
      button.title = 'Capture a single point';
      button.type = 'button';

      button.addEventListener('click', this.handleSinglePointCaptureButtonClick.bind(this), false);
    });

    createControlElement('button', 'streamPointButton', (button) => {
      // https://materialdesignicons.com/icon/map-marker-path
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M18,15A3,3 0 0,1 21,18A3,3 0 0,1 18,21C16.69,21 15.58,20.17 15.17,19H14V17H15.17C15.58,15.83 16.69,15 18,15M18,17A1,1 0 0,0 17,18A1,1 0 0,0 18,19A1,1 0 0,0 19,18A1,1 0 0,0 18,17M18,8A1.43,1.43 0 0,0 19.43,6.57C19.43,5.78 18.79,5.14 18,5.14C17.21,5.14 16.57,5.78 16.57,6.57A1.43,1.43 0 0,0 18,8M18,2.57A4,4 0 0,1 22,6.57C22,9.56 18,14 18,14C18,14 14,9.56 14,6.57A4,4 0 0,1 18,2.57M8.83,17H10V19H8.83C8.42,20.17 7.31,21 6,21A3,3 0 0,1 3,18C3,16.69 3.83,15.58 5,15.17V14H7V15.17C7.85,15.47 8.53,16.15 8.83,17M6,17A1,1 0 0,0 5,18A1,1 0 0,0 6,19A1,1 0 0,0 7,18A1,1 0 0,0 6,17M6,3A3,3 0 0,1 9,6C9,7.31 8.17,8.42 7,8.83V10H5V8.83C3.83,8.42 3,7.31 3,6A3,3 0 0,1 6,3M6,5A1,1 0 0,0 5,6A1,1 0 0,0 6,7A1,1 0 0,0 7,6A1,1 0 0,0 6,5M11,19V17H13V19H11M7,13H5V11H7V13Z" /></svg>';
      button.title = 'Capture multiple points';
      button.type = 'button';

      button.addEventListener('click', this.handleMultiPointCaptureButtonClick.bind(this), false);
    });

    createControlElement('button', 'finishFeatureButton', (button) => {
      // https://materialdesignicons.com/icon/map-marker-check
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M12,2C15.86,2 19,5.14 19,9C19,14.25 12,22 12,22C12,22 5,14.25 5,9C5,5.14 8.14,2 12,2M10.47,14L17,7.41L15.6,6L10.47,11.18L8.4,9.09L7,10.5L10.47,14Z" /></svg>';
      button.title = 'Finish current feature';
      button.type = 'button';
      button.classList.add('hidden');

      button.addEventListener('click', this.handleFinishFeatureButtonClick.bind(this), false);
    });

    // Get the drawing layer from the options.
    this.layer = options.layer;
  }

  /**
   * @inheritDoc
   * @api
   */
  setMap(map) {
    const oldMap = this.getMap();
    if (map === oldMap) {
      return;
    }
    if (oldMap) {
      // Cleanup the old event listeners
      this.clearActiveDrawingListeners();
      if (this.onMapAddInteraction) {
        oldMap.getInteractions().un('add', this.onMapAddInteraction.listener);
        this.onMapAddInteraction = undefined;
      }
      if (this.onMapRemoveInteraction) {
        oldMap.getInteractions().un('remove', this.onMapRemoveInteraction.listener);
        this.onMapRemoveInteraction = undefined;
      }
    }
    super.setMap(map);

    if (map) {
      // When interactions are added or removed update our internal state
      // to track the active drawing interaction/feature - if any
      const trackDrawingInteractions = () => {
        const drawingInteraction = map.getInteractions().getArray().find((i) => typeof i.finishDrawing === 'function');

        if (this.activeDrawingInteraction) {
          this.clearActiveDrawingListeners();
          // TODO
        }

        this.activeDrawingInteraction = drawingInteraction;

        if (!this.activeDrawingInteraction) {
          return;
        }

        this.onDrawStart = this.activeDrawingInteraction.on('drawstart', (drawEvt) => {
          this.activeDrawingFeature = drawEvt.feature;
          if (['Polygon', 'LineString'].includes(this.activeDrawingFeature.getGeometry().getType())) {
            this.innerControlElements.finishFeatureButton.classList.remove('hidden');
          }
        });
        this.onDrawAbort = this.activeDrawingInteraction.on('drawabort', () => {
          this.activeDrawingFeature = undefined;
          this.innerControlElements.finishFeatureButton.classList.add('hidden');
        });
        this.onDrawEnd = this.activeDrawingInteraction.on('drawend', () => {
          this.activeDrawingFeature = undefined;
          this.innerControlElements.finishFeatureButton.classList.add('hidden');
        });
      };

      this.onMapAddInteraction = map.getInteractions().on('add', () => trackDrawingInteractions());
      this.onMapRemoveInteraction = map.getInteractions().on('remove', () => trackDrawingInteractions());
      trackDrawingInteractions();
    }
  }

  clearActiveDrawingListeners() {
    const clearListener = (eventsKeyAttrName) => {
      if (this[eventsKeyAttrName]) {
        this[eventsKeyAttrName].target
          .un(this[eventsKeyAttrName].type, this[eventsKeyAttrName].listener);
        this[eventsKeyAttrName] = undefined;
      }
    };

    clearListener('onDrawStart');
    clearListener('onDrawAbort');
    clearListener('onDrawEnd');
  }

  handleSinglePointCaptureButtonClick() {
    if (this.isStreamingActive()) {
      this.stopMultiPointCapture({ finishDrawing: false });
    }

    const drawInteractions = this.getMap().getInteractions().getArray()
      .filter((interaction) => typeof interaction.finishDrawing === 'function');

    // If we're not already drawing, then simulate a click on the edit control's "point" button
    if (!drawInteractions.length) {
      const editControl = this.getMap().getControls().getArray().find((c) => c.element.className.indexOf('ol-edit') !== -1);

      if (editControl) {
        const evt = new Event('click', { bubbles: true });
        editControl.buttons.point.dispatchEvent(evt);
      }
    }

    this.captureSinglePoint();
  }

  captureSinglePoint() {
    const drawInteractions = this.getMap().getInteractions().getArray()
      .filter((interaction) => typeof interaction.finishDrawing === 'function');

    const pos = this.geolocation.getPosition();

    if (drawInteractions.length) {
      drawInteractions[0].appendCoordinates([pos]);

      /* eslint-disable no-underscore-dangle */
      if (drawInteractions[0].mode_ === 'Point') {
        drawInteractions[0].finishDrawing();
      }
    }
  }

  isStreamingActive() {
    return this.innerControlElements.streamPointButton.classList.contains('active');
  }

  handleMultiPointCaptureButtonClick() {
    if (this.isStreamingActive()) {
      this.stopMultiPointCapture({ finishDrawing: true });
    } else {
      this.startMultiPointCapture();
    }
  }

  handleFinishFeatureButtonClick() {
    if (this.isStreamingActive()) {
      this.stopMultiPointCapture({ finishDrawing: true });
    } else {
      this.activeDrawingInteraction.finishDrawing();
    }
  }

  startMultiPointCapture() {
    this.innerControlElements.streamPointButton.classList.add('active');

    const drawInteractions = this.getMap().getInteractions().getArray()
      .filter((interaction) => typeof interaction.finishDrawing === 'function');

    // If we're not already drawing, then simulate a click on the edit control's "polygon" button
    if (!drawInteractions.length) {
      const editControl = this.getMap().getControls().getArray().find((c) => c.element.className.indexOf('ol-edit') !== -1);

      if (editControl) {
        const evt = new Event('click', { bubbles: true });
        editControl.buttons.polygon.dispatchEvent(evt);
      }
    }

    this.onPositionChange = this.geolocation.on('change:position', () => {
      this.captureSinglePoint();
    });
  }

  stopMultiPointCapture({ finishDrawing }) {
    this.innerControlElements.streamPointButton.classList.remove('active');

    if (this.onPositionChange) {
      this.geolocation.un('change:position', this.onPositionChange.listener);
      this.onPositionChange = null;
    }

    const drawInteractions = this.getMap().getInteractions().getArray()
      .filter((interaction) => typeof interaction.finishDrawing === 'function');

    if (drawInteractions.length && finishDrawing) {
      drawInteractions[0].finishDrawing();
    }
  }
}

(async function main() {
  const geolocation = await getGeolocationObject();

  const control = new GeolocationDrawing({ geolocation });

  if (geolocation.getTracking()) {
    pageMap.map.addControl(control);
  }

  geolocation.on('change:tracking', () => {
    if (geolocation.getTracking()) {
      pageMap.map.addControl(control);
    } else {
      pageMap.map.removeControl(control);
    }
  });
}());

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

pageMap.addBehavior('sidePanel').then(async () => {
  const locationInfoPane = pageMap.sidePanel.definePane({
    paneId: 'location_info',
    name: 'Location Info',
    icon: '♞',
    weight: 80,
  });

  const instructionsWidget = locationInfoPane.addWidgetElement(el('span', {}, (instructionsSpan) => {
    instructionsSpan.innerHTML = 'First click the geolocate button to see location info here.';
  }));

  const geolocation = await getGeolocationObject();

  instructionsWidget.remove();

  locationInfoPane.addWidgetElement(el('p', { }, (infoStatsP) => {
    const defineStatsFacet = (facetId, label, format) => {
      infoStatsP.appendChild(el('div', {}, (div) => {
        div.innerHTML = `${label}:`;
        div.appendChild(el('code', {}, (facet) => {
          const updateFacetInnerText = () => {
            let facetGetterFn = geolocation[`get${capitalizeFirstLetter(facetId)}`];
            if (typeof facetGetterFn !== 'function') {
              return;
            }
            facetGetterFn = facetGetterFn.bind(geolocation);

            const facetValue = facetGetterFn();

            if (!facetValue) {
              return;
            }

            let formatFn;
            if (typeof format === 'function') {
              formatFn = format;
            } else if (typeof facetValue === 'number') {
              formatFn = (v) => `${v.toFixed(3)} ${format}`;
            } else {
              formatFn = (v) => `${JSON.stringify(v)} ${format}`;
            }

            facet.innerText = formatFn(facetValue);
          };
          updateFacetInnerText();
          geolocation.on(`change:${facetId}`, () => updateFacetInnerText());
        }));
      }));
    };

    defineStatsFacet('position', 'position', '');
    defineStatsFacet('accuracy', 'position accuracy', '[m]');
    defineStatsFacet('altitude', 'altitude', '[m]');
    defineStatsFacet('altitudeAccuracy', 'altitude accuracy', '[m]');
    defineStatsFacet('heading', 'heading', '[rad]');
    defineStatsFacet('speed', 'speed', '[m/s]');

    locationInfoPane.addWidgetElement(el('div', { id: 'info' }, (locationErrorsDiv) => {
      geolocation.on('error', (error) => {
        locationErrorsDiv.innerHTML += error.message;
      });
    }));
  }));
});
