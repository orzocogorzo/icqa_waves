var Geojson2Three = require('./geojson2three/main.js');
var Environ = require('./geojson2three/components/Environ.js');
var { request, lerpColor } = require('./helpers.js');
var DateTime = require('./views/datetime.js');


document.addEventListener("DOMContentLoaded", function (ev) {
    var resolution = 1;
    var relative = true;
    var g2t;
    var _data;
    
    var dateTime = new DateTime(requestData);
    var env = new Environ({
        el: 'canvas',
        resolutionFactor: resolution
    });

    function jsonToScene (geojson) {
        _data = geojson;
        if (!g2t) g2t = new Geojson2Three(env);

        g2t.data(geojson)
            .fitEnviron('icqa', {
                resolutionFactor: resolution,
                scaleZ: function (feature, ctxt) {
                    if (ctxt.scales.relative === true) {
                        // get the relative value to the left range
                        return (feature.properties['icqa']-ctxt.scales.range[0]) / 
                            // divide by the range extent to get the proportion
                            (ctxt.scales.range[1] - ctxt.scales.range[0]) * 
                            // map to the dimain extent
                            (ctxt.scales.domain[1]-ctxt.scales.domain[0]) +
                            // starts from the left domain
                            ctxt.scales.domain[0];
                    }
                    return feature.properties.icqa;
                },
                scales: {
                    relative: relative,
                    range: [0, 200],
                    domain: [0, 120]
                }
            }).draw({
                color: function (feature, ctxt) {
                    if (ctxt.scales.relative == true) {
                        var proportion = (feature.properties['icqa']-ctxt.scales.range[0]) / 
                            // divide by the range extent to get the proportion
                            (ctxt.scales.range[1] - ctxt.scales.range[0]);
                        return lerpColor(['#77d2b7', '#4affc3', '#d2769e', '#ff4891'] , proportion);
                    }
                    
                    return lerpColor(['#77d2b7', '#4affc3', '#d2769e', '#ff4891'], feature.properties.icqa/200);
                },
                linewidth: 1,
                linecap: 'round',
                linejoin:  'round',
                transparent: true,
                opacity: .7
            });

        env.render();
        env.animate();
    }

    function requestData (year, month, day, hour) {
        var url = "/rest/contours/10/8/"+year+"/"+month+"/"+day+"/"+hour;
        return request(url, function (geojson) {
            jsonToScene(geojson);
        });
    }
    
    requestData(2018, 1, 1, 'h01');
    
    request('/rest/municipalities', function (geojson) {
        new Geojson2Three(env).data(geojson)
        .fitEnviron(null, {
            resolutionFactor: resolution,
            scaleZ: 0,
            env: env
        }).draw({
            color: '#dbf4fa',
            transparent: true,
            opacity: 0.2
        });
        env.render();
        env.animate();
    });

    Array.apply(null, document.getElementById('scales').getElementsByClassName('scale')).map(function (el, i, els) {
        el.addEventListener('click', function (ev) {
            els.map(function (el) {
                el.classList.remove('active');
            });
            el.classList.add('active');
            relative = el.getAttribute('data-value') == 'relative';
            jsonToScene(_data);
        });
    });
});