# Local geographic navigation data

Downloaded 2026-09-05. These files are used only after the visitor requests their
location. Point-in-polygon and nearest-place lookup run in the browser. No
coordinates are sent to a reverse-geocoding provider. Map tile requests still
follow the existing CARTO/OpenStreetMap map stack.

- ADM1.json: geoBoundaries SWE ADM1, boundary ID SWE-ADM1-68755315,
  source geoBoundaries / Erik Frohne, CC BY 3.0. Represents 2009 boundaries.
  https://www.geoboundaries.org/api/current/gbOpen/SWE/ADM1/
  https://creativecommons.org/licenses/by/3.0/
  Simplified geometries retained; county labels normalized to Swedish names
  using each feature's ISO code (source labels contain replacement characters).
- ADM2.json: geoBoundaries SWE ADM2, boundary ID SWE-ADM2-70781695,
  geoBoundaries / Wikimedia Commons, CC0 1.0. Represents 2017 boundaries.
  https://www.geoboundaries.org/api/current/gbOpen/SWE/ADM2/
  https://creativecommons.org/publicdomain/zero/1.0/
- places.json: GeoNames SE.zip, CC BY 4.0. Selected populated-place records
  (PPL, PPLA, PPLA2, PPLA3, PPLC), reduced to [name, longitude, latitude].
  https://download.geonames.org/export/dump/SE.zip
  https://download.geonames.org/export/dump/readme.txt
  https://creativecommons.org/licenses/by/4.0/

Boundaries are simplified and historical, not authoritative current administrative
or cadastral boundaries. Town selection is the nearest named populated place
within 10 km, labelled "Nära …", not an assertion that the visitor is within that
settlement. Country reset is always available. Missing boundary coverage (for
example coastal simplification) omits that level rather than inventing one.
Attribution is displayed in the map information panel. Data is loaded lazily.
