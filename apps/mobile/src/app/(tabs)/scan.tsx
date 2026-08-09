import { useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { checkinBooking } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function ScanScreen() {
  const router = useRouter()
  const { token } = useAuth()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning, setScanning] = useState(true)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  )

  const handleScan = async (data: string) => {
    if (pending || !scanning || !token) return
    setScanning(false)
    setPending(true)
    setResult(null)
    try {
      await checkinBooking(token, data.trim())
      setResult({ ok: true, message: 'เช็คอินสำเร็จ ✅' })
    } catch (e) {
      setResult({
        ok: false,
        message: e instanceof Error ? e.message : 'เช็คอินไม่สำเร็จ',
      })
    } finally {
      setPending(false)
    }
  }

  const resetScanner = () => {
    setResult(null)
    setScanning(true)
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>ต้องขอสิทธิ์ใช้กล้อง</Text>
        <Text style={styles.sub}>
          ใช้กล้องเพื่อสแกน QR ของการจองเครื่องมือ
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>อนุญาตใช้กล้อง</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning && !pending ? (r) => handleScan(r.data) : undefined}
      >
        <View style={styles.overlay}>
          <Text style={styles.hint}>
            นำ QR code ของการจองมาไว้ในกรอบ
          </Text>
        </View>
      </CameraView>

      <View style={styles.footer}>
        {pending ? (
          <ActivityIndicator color="#059669" />
        ) : result ? (
          <>
            <Text
              style={[
                styles.result,
                { color: result.ok ? '#047857' : '#b91c1c' },
              ]}
            >
              {result.message}
            </Text>
            <TouchableOpacity style={styles.button} onPress={resetScanner}>
              <Text style={styles.buttonText}>สแกนอีกครั้ง</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>ย้อนกลับ</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  hint: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 14,
    overflow: 'hidden',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  result: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  sub: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 20, textAlign: 'center' },
  button: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
