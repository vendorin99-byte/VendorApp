import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, StatusBar, Modal, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import * as Location from 'expo-location'
import api from '../../services/api'

const CATEGORY_COLORS: Record<string, string> = {
  'EO': '#7950F2', 'Event Organizer': '#7950F2', 'Fotografer': '#3B5BDB',
  'Wedding': '#E64980', 'Wedding Organizer': '#E64980', 'Katering': '#F76707',
  'Dekorasi': '#2F9E44', 'Sewa Mobil': '#1971C2', 'Musik': '#862E9C',
  'Venue': '#84CC16', 'default': '#3B5BDB',
}

export default function MapScreen() {
  const insets = useSafeAreaInsets()
  const webviewRef = useRef<WebView>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [selectedReq, setSelectedReq] = useState<any>(null)
  const [bidPrice, setBidPrice] = useState('')
  const [bidNote, setBidNote] = useState('')
  const [bidDone, setBidDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userLat, setUserLat] = useState(-6.2)
  const [userLng, setUserLng] = useState(106.816)
  const [locationReady, setLocationReady] = useState(false)
  const [webviewLoaded, setWebviewLoaded] = useState(false)

  useEffect(() => {
    fetchRequests()
    getLocation()
  }, [])

  useEffect(() => {
    if (!webviewLoaded || !locationReady) return
    webviewRef.current?.injectJavaScript(`
      try {
        map.setView([${userLat}, ${userLng}], 14);
        userMarker.setLatLng([${userLat}, ${userLng}]);
      } catch(e) {}
      true;
    `)
  }, [webviewLoaded, locationReady])

  async function getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setLocationReady(true); return }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setUserLat(loc.coords.latitude)
      setUserLng(loc.coords.longitude)
    } catch {}
    finally { setLocationReady(true) }
  }

  async function fetchRequests() {
    try {
      const { data } = await api.get('/map-requests/active')
      setRequests(data || [])
    } catch {}
  }

  const requestsJson = JSON.stringify(requests.map(r => ({
    id: r.id, lat: r.lat, lng: r.lng,
    category: r.category || '',
    description: r.description,
    eventDate: r.event_date || '',
    budget: r.budget || 0,
    customerName: r.users?.name || 'Customer',
  })))

  const html = `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body,#map { width:100%; height:100%; }
    .popup-name { font-weight:700; font-size:14px; margin-bottom:3px; }
    .popup-cat { font-size:12px; color:#6B7280; }
    .popup-desc { font-size:12px; color:#374151; margin:4px 0; line-height:1.4; }
    .popup-meta { font-size:11px; color:#6B7280; margin:2px 0; }
    .popup-btn { display:block; margin-top:8px; background:#0D9488; color:#fff; border:none; padding:8px 14px; border-radius:8px; cursor:pointer; width:100%; font-size:13px; font-weight:700; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl:true }).setView([${userLat}, ${userLng}], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:'© OpenStreetMap © CARTO', subdomains:'abcd', maxZoom:19
    }).addTo(map);

    var userIcon = L.divIcon({
      className:'',
      html:'<div style="width:16px;height:16px;border-radius:50%;background:#3B5BDB;border:3px solid #fff;box-shadow:0 0 0 3px rgba(59,91,219,0.3)"></div>',
      iconSize:[16,16], iconAnchor:[8,8],
    });
    var userMarker = L.marker([${userLat}, ${userLng}], { icon:userIcon }).addTo(map).bindPopup('<b>Lokasi Anda</b>');

    var requests = ${requestsJson};
    requests.forEach(function(r) {
      var reqIcon = L.divIcon({
        className:'',
        html:'<div style="position:relative;width:36px;height:42px"><div style="width:36px;height:36px;background:#0D9488;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);border:3px solid #fff"></div><div style="position:absolute;top:8px;left:8px;font-size:16px;transform:rotate(45deg)">🙋</div></div>',
        iconSize:[36,42], iconAnchor:[18,42],
      });
      var meta = '';
      if(r.eventDate) meta += '📅 '+r.eventDate+'  ';
      if(r.budget) meta += '💰 Rp'+r.budget.toLocaleString();
      L.marker([r.lat, r.lng], { icon:reqIcon }).addTo(map).bindPopup(
        '<div class="popup-name">'+r.customerName+'</div>' +
        (r.category ? '<div class="popup-cat">Butuh: '+r.category+'</div>' : '') +
        '<div class="popup-desc">'+r.description+'</div>' +
        (meta ? '<div class="popup-meta">'+meta+'</div>' : '') +
        '<button class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'request\\',id:\\''+r.id+'\\'}))">💼 Kirim Penawaran</button>'
      );
    });
  </script>
</body></html>`

  function handleMessage(e: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(e.nativeEvent.data)
      if (msg.type === 'request') {
        const req = requests.find(r => r.id === msg.id)
        if (req) { setSelectedReq(req); setBidPrice(''); setBidNote(''); setBidDone(false) }
      }
    } catch {}
  }

  async function submitBid() {
    const price = parseInt(bidPrice)
    if (!price || price <= 0) return Alert.alert('', 'Masukkan harga penawaran')
    setSubmitting(true)
    try {
      await api.post(`/map-requests/${selectedReq.id}/bids`, {
        price, note: bidNote.trim() || undefined,
      })
      setBidDone(true)
      fetchRequests()
    } catch (e: any) {
      Alert.alert('Gagal', e.response?.data?.error || 'Error')
    } finally { setSubmitting(false) }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Peta Permintaan</Text>
        <Text style={styles.headerCount}>{requests.length} aktif</Text>
      </View>

      <WebView
        ref={webviewRef}
        source={{ html }}
        style={{ flex: 1 }}
        onMessage={handleMessage}
        onLoadEnd={() => setWebviewLoaded(true)}
        javaScriptEnabled
      />

      {/* Bid Modal */}
      <Modal visible={!!selectedReq} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedReq(null)}>
        {selectedReq && (
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💼 Kirim Penawaran</Text>
                <TouchableOpacity onPress={() => setSelectedReq(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {!bidDone ? (
                <View style={{ padding: 20, gap: 16 }}>
                  <View style={styles.reqCard}>
                    {selectedReq.category ? <Text style={styles.reqCat}>{selectedReq.category}</Text> : null}
                    <Text style={styles.reqDesc}>{selectedReq.description}</Text>
                    {selectedReq.event_date && <Text style={styles.reqMeta}>📅 {selectedReq.event_date}</Text>}
                    {selectedReq.budget ? <Text style={styles.reqMeta}>💰 Budget Rp{selectedReq.budget.toLocaleString('id-ID')}</Text> : null}
                    <Text style={styles.reqMeta}>👤 {selectedReq.users?.name || 'Customer'}</Text>
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Harga Penawaran (Rp) *</Text>
                    <TextInput style={styles.input} placeholder="contoh: 3500000" placeholderTextColor="#3A4A60"
                      value={bidPrice} onChangeText={setBidPrice} keyboardType="number-pad" />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Catatan (opsional)</Text>
                    <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                      placeholder="Jelaskan apa saja yang termasuk..." placeholderTextColor="#3A4A60"
                      value={bidNote} onChangeText={setBidNote} multiline />
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedReq(null)}>
                      <Text style={styles.cancelText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                      onPress={submitBid} disabled={submitting}>
                      <Text style={styles.submitText}>{submitting ? 'Mengirim...' : 'Kirim Penawaran'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.doneWrap}>
                  <Text style={{ fontSize: 48 }}>✅</Text>
                  <Text style={styles.doneTitle}>Penawaran Terkirim!</Text>
                  <Text style={styles.doneSub}>Customer akan mendapat notifikasi dan bisa menerima penawaran Anda.</Text>
                  <TouchableOpacity style={styles.submitBtn} onPress={() => setSelectedReq(null)}>
                    <Text style={styles.submitText}>Tutup</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  )
}

const C = { bg: '#0A1628', card: '#111827', card2: '#0D1B2E', border: '#1E3A5F', primary: '#3B5BDB', text: '#fff', muted: '#6B7DB3' }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  headerCount: { fontSize: 13, color: C.muted },
  modal: { flex: 1, backgroundColor: C.card2 },
  modalHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: C.muted, fontSize: 14, fontWeight: '700' },
  reqCard: { backgroundColor: '#0A2418', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1A4030', gap: 4 },
  reqCat: { fontSize: 12, fontWeight: '700', color: '#0D9488', textTransform: 'uppercase', letterSpacing: 0.5 },
  reqDesc: { fontSize: 14, color: C.text, lineHeight: 20 },
  reqMeta: { fontSize: 12, color: C.muted },
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: C.text, fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: C.muted, fontSize: 15, fontWeight: '600' },
  submitBtn: { flex: 2, backgroundColor: '#0D9488', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: C.text, fontSize: 15, fontWeight: '700' },
  doneWrap: { alignItems: 'center', padding: 40, gap: 14 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  doneSub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
})
