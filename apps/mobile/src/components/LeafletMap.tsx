import { useRef } from 'react'
import { StyleSheet } from 'react-native'
import WebView from 'react-native-webview'

interface Vendor {
  id: string
  business_name: string
  category: string
  lat: number
  lng: number
  avg_rating: number
}

interface Props {
  vendors: Vendor[]
  userLat?: number
  userLng?: number
  onVendorPress?: (id: string) => void
  style?: object
}

const CATEGORY_COLORS: Record<string, string> = {
  'Event Organizer': '#6B7280',
  'Fotografer': '#3B5BDB',
  'Katering': '#F59E0B',
  'Sewa Mobil': '#EF4444',
  'Venue': '#84CC16',
  'default': '#8B5CF6',
}

export default function LeafletMap({ vendors, userLat = -6.2, userLng = 106.8, onVendorPress, style }: Props) {
  const webviewRef = useRef<WebView>(null)

  const markersJson = JSON.stringify(vendors.map((v) => ({
    id: v.id,
    name: v.business_name,
    category: v.category,
    lat: v.lat,
    lng: v.lng,
    rating: v.avg_rating,
    color: CATEGORY_COLORS[v.category] || CATEGORY_COLORS.default,
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
    .popup-name { font-weight:bold; font-size:13px; }
    .popup-cat { font-size:11px; color:#6B7280; }
    .popup-rating { font-size:12px; color:#F59E0B; margin-top:2px; }
    .popup-btn { display:block; margin-top:6px; background:#3B5BDB; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; width:100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${userLat}, ${userLng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var vendors = ${markersJson};
    vendors.forEach(function(v) {
      var icon = L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:50%;background:'+v.color+';border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
        iconSize: [14,14],
        iconAnchor: [7,7],
      });
      L.marker([v.lat, v.lng], { icon: icon })
        .addTo(map)
        .bindPopup(
          '<div class="popup-name">'+v.name+'</div>' +
          '<div class="popup-cat">'+v.category+'</div>' +
          '<div class="popup-rating">⭐ '+v.rating.toFixed(1)+'</div>' +
          '<button class="popup-btn" onclick="window.ReactNativeWebView.postMessage(v.id)">Lihat Profil</button>'
        );
    });
  </script>
</body>
</html>`

  function handleMessage(event: { nativeEvent: { data: string } }) {
    onVendorPress?.(event.nativeEvent.data)
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
