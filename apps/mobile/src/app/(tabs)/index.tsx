import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  INSTRUMENT_STATUS_LABELS,
  INSTRUMENT_CATEGORY_LABELS,
} from '@scilab/shared'
import { useFocusEffect } from 'expo-router'
import { getInstruments, resolveAssetUrl, type Instrument } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function InstrumentsScreen() {
  const { token } = useAuth()
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const data = await getInstruments(token)
      setInstruments(data.instruments)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [load])

  const statusColor = (status: Instrument['status']) => {
    if (status === 'AVAILABLE') return '#059669'
    if (status === 'MAINTENANCE') return '#d97706'
    return '#94a3b8'
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={instruments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>ยังไม่มีเครื่องมือในระบบ</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUrl ? (
              <Image
                source={{ uri: resolveAssetUrl(item.imageUrl) ?? undefined }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${statusColor(item.status)}1a` },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: statusColor(item.status) }]}
                >
                  {INSTRUMENT_STATUS_LABELS[item.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.category}>
              {INSTRUMENT_CATEGORY_LABELS[item.category]}
            </Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                จำนวน: {item.availableCount}/{item.totalQuantity} ชิ้น
              </Text>
              {item.location ? (
                <Text style={styles.meta}>📍 {item.location}</Text>
              ) : null}
            </View>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  image: { height: 160, borderRadius: 8, marginBottom: 10, width: '100%' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  category: { fontSize: 12, color: '#059669', fontWeight: '600', marginTop: 4 },
  description: { fontSize: 13, color: '#475569', marginTop: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  meta: { fontSize: 12, color: '#64748b' },
  error: { color: '#dc2626', textAlign: 'center', padding: 16 },
  empty: { textAlign: 'center', color: '#64748b', padding: 32 },
})
