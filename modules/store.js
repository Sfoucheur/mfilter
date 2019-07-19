/**
 * @module store.js
 */

import Fuse from 'fuse.js';
import Mustache from 'mustache';

var busEvent = require('./bus');


/**
 * @classdesc
 * Base class for sources providing images divided into a tile grid.
 *
 */

var Fstore = class {
    /**
     * @param {options} map options (layer url, attributions,  center, zoom).
     */
    constructor(options) {
        this.className = "Fstore";
        this.options = options;
        this.template = null;
        this.fuse = null;
        this.data = [];
        this.filteredIDs = [];
        this.activefilter = false;
        this.toast = [
            '<div id="toast" class="toast" role="alert" data-autohide="false" aria-live="assertive" aria-atomic="true">',
                '<div class="toast-header">',
                    '<strong class="mr-auto">Filtre actif</strong>',
                    '<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">',
                      '<span aria-hidden="true">&times;</span>',
                    '</button>',
                '</div>',
                '<div id="toast-filter" class="toast-body">Aucun filtre</div>',
            '</div>'
        ].join("");
        this.fuseOptions = {
          shouldSort: true,
          threshold: 0.2,
          location: 0,
          distance: 100,
          maxPatternLength: 32,
          minMatchCharLength: 1,
          keys: options.searchkeys
        }

        this.initStore();
    }

    initStore() {
      $("#notifications").append(this.toast);
      $("#toast .close").click(this.removeFilter.bind(this));
      $("#btn-search").click(this.searchFeatures.bind(this));
      $.ajax({
          type: "GET",
          url: this.options.template,
          context: this,
          success: function( mst ) {
            this.template = mst;
          }
      });
      $.ajax({
          type: "GET",
          url: this.options.url,
          context: this,
          success: function( data ) {
            this.data = data;
            this.fuse = new Fuse(data.features, this.fuseOptions);
            var render = Mustache.render(this.template, data);
            $("#store").append(render);
            busEvent.on('mapChanged', this.filterFeatures, this);
            busEvent.fire("storeLoaded", this);
          }
      });

    }

    removeFilter (e) {
        this.filteredIDs = [];
        this.activefilter = false;
		$(".item:not(.selected)").addClass("selected");
        busEvent.fire("removeFilter", this);
    }

    searchFeatures (e) {
        var value = $("#txt-search").val();
        if (value.length > 3) {
            this.filteredIDs = this.fuse.search(value).map(a => a[this.options.uid]);
            this.filterFeatures({"target": this.filteredIDs, "type": "search"});
            $("#txt-search").val("");
            $("#toast-filter").text(value);
        }
    }

    filterFeatures(e) {
        console.log(e);
        var featuresIDs = e.target;
		$(".item.selected").removeClass("selected");
		featuresIDs.forEach(function(id) {
			$(document.getElementById(id)).addClass("selected");

		});
		if (e.type && e.type === "search") {
			$("#toast").toast('show');
			this.activefilter = true;
		}
        busEvent.fire("storeFiltered", this);
    };
}

module.exports = Fstore;