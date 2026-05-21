import { useRef, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import WebView from 'react-native-webview'

interface Vendor {
  id: string
  business_name: string
  category: string
  lat: number
  lng: number
  avg_rating: number
  promo_text?: string
}

interface Promo {
  id: string
  text: string
  vendors: { id: string; business_name: string; category: string; lat: number; lng: number; avg_rating: number }
}

interface MapRequest {
  id: string
  lat: number
  lng: number
  category?: string
  description: string
  event_date?: string
  budget?: number
  users?: { name: string }
}

interface Props {
  vendors: Vendor[]
  promos?: Promo[]
  requests?: MapRequest[]
  userLat?: number
  userLng?: number
  radiusKm?: number
  mode?: 'view' | 'pick-location'
  onVendorPress?: (id: string) => void
  onPromoPress?: (vendorId: string, promoText: string) => void
  onRequestPress?: (requestId: string, description: string, category: string, eventDate: string, budget: number) => void
  onLocationPicked?: (lat: number, lng: number) => void
  flyTo?: { lat: number; lng: number } | null
  style?: object
}

const CATEGORY_COLORS: Record<string, string> = {
  'EO': '#7950F2',
  'Event Organizer': '#7950F2',
  'Fotografer': '#3B5BDB',
  'Wedding': '#E64980',
  'Katering': '#F76707',
  'Dekorasi': '#2F9E44',
  'Sewa Mobil': '#1971C2',
  'Musik': '#862E9C',
  'Venue': '#84CC16',
  'default': '#8B5CF6',
}

export default function LeafletMap({
  vendors, promos = [], requests = [],
  userLat = -6.2, userLng = 106.8, radiusKm = 10,
  mode = 'view',
  onVendorPress, onPromoPress, onRequestPress, onLocationPicked,
  flyTo,
  style,
}: Props) {
  const webviewRef = useRef<WebView>(null)

  useEffect(() => {
    if (flyTo) {
      webviewRef.current?.injectJavaScript(`
        if (typeof map !== 'undefined') {
          map.flyTo([${flyTo.lat}, ${flyTo.lng}], 16, { duration: 1.2 });
        }
        true;
      `)
    }
  }, [flyTo])

  const markersJson = JSON.stringify(vendors.map((v) => ({
    id: v.id,
    name: v.business_name,
    category: v.category,
    lat: v.lat,
    lng: v.lng,
    rating: v.avg_rating,
    color: CATEGORY_COLORS[v.category] || CATEGORY_COLORS.default,
  })))

  const promosJson = JSON.stringify(promos.map((p) => ({
    id: p.id,
    text: p.text,
    vendorId: p.vendors?.id,
    vendorName: p.vendors?.business_name,
    category: p.vendors?.category,
    lat: p.vendors?.lat,
    lng: p.vendors?.lng,
    rating: p.vendors?.avg_rating,
  })).filter((p) => p.lat && p.lng))

  const requestsJson = JSON.stringify(requests.map((r) => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    category: r.category || '',
    description: r.description,
    eventDate: r.event_date || '',
    budget: r.budget || 0,
    customerName: r.users?.name || 'Customer',
  })))

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body,#map { width:100%; height:100%; }
    .popup-name { font-weight:bold; font-size:13px; margin-bottom:2px; }
    .popup-cat { font-size:11px; color:#6B7280; }
    .popup-rating { font-size:12px; color:#F59E0B; margin-top:2px; }
    .popup-promo { font-size:12px; color:#92400E; background:#FEF3C7; border-radius:6px; padding:4px 8px; margin:6px 0; }
    .popup-btn { display:block; margin-top:6px; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; width:100%; font-size:13px; font-weight:600; }
    .btn-blue { background:#3B5BDB; }
    .btn-amber { background:#D97706; }
    .btn-teal { background:#0D9488; }
    .popup-desc { font-size:12px; color:#374151; margin:4px 0; line-height:1.4; }
    .popup-meta { font-size:11px; color:#6B7280; margin-top:2px; }
    .pick-hint { position:fixed; bottom:16px; left:50%; transform:translateX(-50%); background:#1F2937; color:#fff; padding:10px 20px; border-radius:20px; font-size:13px; font-weight:600; z-index:1000; pointer-events:none; }
  </style>
</head>
<body>
  <div id="map"></div>
  ${mode === 'pick-location' ? '<div class="pick-hint">📍 Tap peta untuk pilih lokasi</div>' : ''}
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${userLat}, ${userLng}], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 19
    }).addTo(map);

    // ── Lokasi user ──────────────────────────────────────────────────────
    var userIcon = L.divIcon({
      className: '',
      html: '<div style="width:16px;height:16px;border-radius:50%;background:#3B5BDB;border:3px solid #fff;box-shadow:0 0 0 3px rgba(59,91,219,0.3)"></div>',
      iconSize: [16,16], iconAnchor: [8,8],
    });
    L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map).bindPopup('<b>Lokasi Anda</b>');

    ${mode === 'view' ? `
    // Lingkaran radius
    L.circle([${userLat}, ${userLng}], {
      radius: ${radiusKm} * 1000,
      color: '#3B5BDB', fillColor: '#3B5BDB', fillOpacity: 0.05, weight: 1.5, dashArray: '5,5',
    }).addTo(map);

    // ── Vendor markers ────────────────────────────────────────────────────
    var vendors = ${markersJson};
    vendors.forEach(function(v) {
      var icon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:50%;background:'+v.color+';border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
        iconSize: [14,14], iconAnchor: [7,7],
      });
      L.marker([v.lat, v.lng], { icon: icon }).addTo(map).bindPopup(
        '<div class="popup-name">'+v.name+'</div>' +
        '<div class="popup-cat">'+v.category+'</div>' +
        '<div class="popup-rating">⭐ '+v.rating.toFixed(1)+'</div>' +
        '<button class="popup-btn btn-blue" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'vendor\\',id:v.id}))">Lihat Profil</button>'
      );
    });

    // ── Promo balloons (amber) ────────────────────────────────────────────
    var promos = ${promosJson};
    promos.forEach(function(p) {
      var promoIcon = L.divIcon({
        className: '',
        html: '<div style="background:#F59E0B;color:#fff;font-size:11px;font-weight:700;padding:4px 8px;border-radius:12px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);position:relative">' +
              '⚡ ' + p.text.slice(0,28) + (p.text.length>28?'…':'') +
              '<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #F59E0B"></div>' +
              '</div>',
        iconSize: [null, null], iconAnchor: [0, 32],
      });
      L.marker([p.lat, p.lng], { icon: promoIcon }).addTo(map).bindPopup(
        '<div class="popup-name">'+p.vendorName+'</div>' +
        '<div class="popup-cat">'+p.category+'</div>' +
        '<div class="popup-promo">⚡ '+p.text+'</div>' +
        '<div class="popup-rating">⭐ '+(p.rating||0).toFixed(1)+'</div>' +
        '<button class="popup-btn btn-amber" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'promo\\',vendorId:p.vendorId,text:p.text}))">💬 Chat & Tanya Promo</button>'
      );
    });

    // ── Customer request pins (teal) ──────────────────────────────────────
    var requests = ${requestsJson};
    requests.forEach(function(r) {
      var reqIcon = L.divIcon({
        className: '',
        html: '<div style="position:relative;width:36px;height:42px">' +
              '<div style="width:36px;height:36px;background:#0D9488;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);border:3px solid #fff"></div>' +
              '<div style="position:absolute;top:8px;left:8px;font-size:16px;transform:rotate(45deg)">🙋</div>' +
              '</div>',
        iconSize: [36,42], iconAnchor: [18,42],
      });
      var metaLine = '';
      if(r.eventDate) metaLine += '📅 '+r.eventDate+'  ';
      if(r.budget) metaLine += '💰 Rp'+r.budget.toLocaleString();
      L.marker([r.lat, r.lng], { icon: reqIcon }).addTo(map).bindPopup(
        '<div class="popup-name">'+r.customerName+'</div>' +
        (r.category ? '<div class="popup-cat">Butuh: '+r.category+'</div>' : '') +
        '<div class="popup-desc">'+r.description+'</div>' +
        (metaLine ? '<div class="popup-meta">'+metaLine+'</div>' : '') +
        '<button class="popup-btn btn-teal" style="margin-top:8px" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'request\\',id:r.id,description:r.description,category:r.category,eventDate:r.eventDate,budget:r.budget}))">💼 Kirim Penawaran</button>'
      );
    });
    ` : `
    // ── Pick-location mode: tap to set pin ────────────────────────────────
    var pickedMarker = null;
    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      if(pickedMarker) map.removeLayer(pickedMarker);
      var pinIcon = L.divIcon({
        className: '',
        html: '<div style="position:relative;width:32px;height:38px">' +
              '<div style="width:32px;height:32px;background:#3B5BDB;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4);border:3px solid #fff"></div>' +
              '<div style="position:absolute;top:7px;left:7px;font-size:14px;transform:rotate(45deg)">📍</div>' +
              '</div>',
        iconSize: [32,38], iconAnchor: [16,38],
      });
      pickedMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'location_picked', lat:lat, lng:lng}));
    });
    `}
  </script>
</body>
</html>`

  function handleMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      if (msg.type === 'vendor') onVendorPress?.(msg.id)
      else if (msg.type === 'promo') onPromoPress?.(msg.vendorId, msg.text)
      else if (msg.type === 'request') onRequestPress?.(msg.id, msg.description, msg.category, msg.eventDate, msg.budget)
      else if (msg.type === 'location_picked') onLocationPicked?.(msg.lat, msg.lng)
    } catch {
      // legacy string message from old vendor press
      onVendorPress?.(event.nativeEvent.data)
    }
  }

  return (
    <WebView
      ref={webviewRef}
      source={{ html }}
      style={[styles.map, style]}
      onMessage={handleMessage}
      javaScriptEnabled
    />
  )
}

const styles = StyleSheet.create({
  map: { flex: 1 },
})
