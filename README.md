Sea Rocket Website V3

Open index.html in a browser to preview. Images are bundled under assets/ and should work offline.

18 photos were uploaded, a selection of 8 unique scenes was optimized and included. Coastal illustrations remain for local attraction cards pending original destination photography.

Booking form remains demo-only until BOOKINGS_EMAIL is configured in index.html. Guesty live booking is not connected.

Walking guide: open `cleveland-way.html`. Styles are in `assets/walking-guide.css`. Existing Whitby photographs remain in place for design review; content-status notices are intentionally omitted at the owner's request. The guide permits indexing and has canonical/social metadata for https://searocketwhitby.co.uk/cleveland-way. The homepage Field Guide links to the walk in a fourth card, with a coastal teaser, route distance and estimated duration.

Search discovery: root-level `robots.txt` permits all crawlers, explicitly including OAI-SearchBot and ChatGPT-User, and points to `sitemap.xml`. This does not provide access control or change Cloudflare crawler/security settings. The manually maintained sitemap contains only the canonical homepage and Cleveland Way guide. Keep it updated when public editorial/accommodation pages are added; omit redirects, fragments and pages marked noindex. `/stay` (including the redirect from `/stay/`) is a guest operations guide with `noindex,follow`, so it is excluded. No reliable page modification dates are maintained, so the sitemap omits lastmod.

Deployment: the repository has no checked-in Wrangler configuration, package manifest or build pipeline. GitHub checks for production `main` identify the existing `Workers Builds: searocketwhitby` Cloudflare integration. Publish through that existing integration by pushing the validated commit to `main`; confirm the Cloudflare check succeeds and independently GET the production files. Live static-asset routing serves `/cleveland-way` and `/stay`, redirects their `.html` and trailing-slash variants, and redirects `/index.html` to `/`. Use the extensionless canonical URLs in production links.

Route source: `assets/gpx/whitby-to-rhb-clevelandway.gpx` (supplied by the owner). The download serves this original file. Run `node scripts/prepare-walk.cjs` to regenerate `assets/walking-route-data.js` after replacing the GPX. This importer targets the supplied single-segment gpx.studio export. The HTML route overview, distances, stage descriptions and POI index must also be reviewed when the source changes.

The track has 481 points and measures 10.763 km using cumulative horizontal great-circle distances. The three stage boundaries use track indices 0, 92 (Saltwick waypoint), 169 (path beside Whitby Lighthouse), and 480. The lighthouse boundary uses the nearest existing GPX point to Trinity House’s published WGS84 location (54° 28.667′ N, 000° 34.094′ W), approximately 18 m away. They partition the original track without routing to off-track POIs. Estimates use 3–4 km/h, rounded up to five-minute intervals for each stage; the overall 170–225 minutes sums those stage estimates. These are planning estimates, not recorded travel times. Elevation changes are not used to infer precise ascent or surface condition. Difficulty is an editorial moderate grading for the coastal walk, not GPX metadata.

The cafe POI is roughly 446 m from its nearest track point in a straight line, not an access path. The Robin Hood's Bay POI is about 131 m beyond the nearest track point; the supplied track ends at the village approach. Optional cafe access and village exploration are excluded from distance/time. Toilet and picnic icons have been removed because the supplied GPX does not identify those facilities. The final stage includes food/drink at the owner’s request for the village, as well as the optional cafe.

`assets/walking-map.js` loads pinned Leaflet 1.9.4 JS/CSS from jsDelivr only when Explore map is pressed. Standard OpenStreetMap tiles retain visible attribution, normal browser caching and no prefetch/offline tile feature. The static SVG route overview and POI list work without map JavaScript. Basemap availability is external; GPX download is local. Map and stage fullscreen use independent native dialogs.

Practical sources: North York Moors National Park walking safety, North Yorkshire Council beach/cliff safety, and Arriva's X93/X94 service page (linked in the article). No departure times, fares, turn-by-turn beach access or cafe access route are invented. Verify sources and the supplied track before publishing.

Before completing the guide:
- Review the GPX-based stages and editorial difficulty grading. Walking instructions must not mention Sea Rocket. The cafe access route is not in the supplied track.
- Current photography is accepted for launch by the owner; replacement route photographs are planned for January.
- Verify terrain, footwear, weather, tide relevance, route notices and return transport. Add source links, attribution and a genuine route review date. The mockup is concept material, not a source for directions or route facts.
- The owner will check phone layout, map gestures, fullscreen and GPX import before publishing. No deployment has been performed.

Launch preparation (9 November 2026): fixed the coastal safety URL, separated static overview labels with leaders to unchanged waypoint positions, and corrected Leaflet retries when JS loads but CSS fails. Partial map initialization restores the SVG. Run `node --test tests/walking-map.test.cjs` for asset failure/retry and modal regression coverage. Header/footer remain matched to the homepage.

Content sources checked online: Trinity House lighthouse location; Coast Cafe Bar’s own Find Us page (Northcliffe Holiday Park, Bottoms Lane, adjacent to the Cinder Track); Robin Hood’s Bay Tourism Association village maps; Arriva X93/X94 Thorpe Lane stop information; GOV.UK National Trail guidance; council coastal safety. These support the named landmarks and links, not invented junction-by-junction cafe or beach directions. National Trails current notices could not be independently read because of its anti-bot gate; the article links directly to the notices and does not claim the absence of diversions. The displayed date is an editorial update date, not a field inspection date.
