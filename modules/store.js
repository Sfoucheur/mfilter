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
        this.fuseOptions = {
          shouldSort: true,
          threshold: 0.2,
          location: 0,
          distance: 100,
          maxPatternLength: 32,
          minMatchCharLength: 1,
          keys: options.keys
        }
        
        this.initStore();
    }
    
    initStore() {
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
    
    searchFeatures (e) {
        var value = $("#txt-search").val();
        if (value.length > 3) {
            var _result = this.fuse.search(value).map(a => a.properties.code_rne);
            console.log(_result);
            this.filterFeatures({"target": _result});
        }
    }
    
    filterFeatures(e) {
        console.log(e);
        var featuresIDs = e.target;
        var _callback = function(elem, ind, Ar) {
            var ret =false;
            if (featuresIDs.indexOf(elem.properties.code_rne) > -1) {
                ret =true;
            }
            return ret;
        };
        var _filtered = this.data.features.filter(_callback);
        var render = Mustache.render(this.template, {"features": _filtered });
        $("#store").children().remove();
        $("#store").append(render);
        console.log(_filtered);
    };
}

module.exports = Fstore;