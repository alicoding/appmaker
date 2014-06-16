/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(
  ["designer/utils", "ceci/ceci-designer", "l10n", "analytics", "filer", "request"],
  function(Util, CeciDesigner, L10n, analytics, filer, request) {
    "use strict";

    var fs = new filer.FileSystem({name: "component", provider: new filer.FileSystem.providers.Fallback()});

    fs.watch("/component", {recursive: true}, function(err, data) {
      if(window.nimbleClicked) {
      window.otherwindow.addEventListener('message', function(e) {
        fs.readFile("/component/component.html", "utf8", function (error, content) {
          fs.readFile("/component/component.css", "utf8", function (error2, content2) {
            var regexp1 = new RegExp('./thumbnail.png', 'g');
            var regexp2 = new RegExp('<link rel="stylesheet" href="component.css"></link>', 'g');
            var regexp3 = new RegExp('<link rel="stylesheet" href="component.css">', 'g');
            var regexp4 = new RegExp('<img src="thumbnail.png">', 'g');
            var style = "<style>" + content2 + "</style>";
            content = content.replace(regexp1, "").replace(regexp2, style).replace(regexp3, style).replace(regexp4, "");
            var link = document.createElement("link");
            link.rel = "import";
            link.href = "data:text/html;base64," + btoa(content);
            document.head.appendChild(link);
            setTimeout(function () {
              DesignerTray.addComponentsFromRegistry();
            }, 1000)
          });
        });
      });
      }
    });

    var resolvePath = function(tag, url) {
      return document.createElement(tag).resolvePath(url);
    };

    var knownComponents = [];

    var DesignerTray = {
      addComponentWithName: function(name) {
        var componentTrayContainer = document.getElementById('components');

        // Avoid adding components that are already in the tray
        if(knownComponents.indexOf(name) > -1) return;

        var item = document.createElement('designer-component-tray-item');
        var ceciDefinition = CeciDesigner.getCeciDefinitionScript(name);

        item.setAttribute('name', name);
        item.setAttribute('thumbnail', resolvePath(name, ceciDefinition.thumbnail));
        item.setAttribute('label', ceciDefinition.name || Util.prettyName(name));
        item.setAttribute('description', L10n.get(name + "/description") || ceciDefinition.description);
        item.setAttribute('author', ceciDefinition.author);
        item.setAttribute('updatedat', ceciDefinition.updatedAt);

        item.addEventListener('click', function (e) {
          var card = document.querySelector('ceci-card[visible]');

          if (card) {
            var newElement = document.createElement(name);

            // wait until Polymer has prepared the element completely
            newElement.async(function() {
              newElement.applyDefaults();
              card.appendChild(newElement);
              analytics.event("Added Component", {label: name});
            });
          }
        }, false);

        knownComponents.push(name);
        componentTrayContainer.appendChild(item);
        item.label = L10n.get(name) || item.label;
      },
      addComponentsFromRegistry: function() {
        CeciDesigner.forEachComponent(this.addComponentWithName);
      },
      isKnownComponent: function(name) {
        return knownComponents.indexOf(name) > -1;
      },
      forgetComponent: function(name) {
        var pos = knownComponents.indexOf(name);
        if (pos > -1) {
          knownComponents.splice(pos, 1);
          var componentTrayContainer = document.getElementById('components');
          var item = componentTrayContainer.querySelector("[name='" + name + "']");
          item.parentNode.removeChild(item);
        }
      }
    };

    window.addEventListener("polymer-ready", function () {
      DesignerTray.addComponentsFromRegistry();
    });

    return DesignerTray;
  }
);


