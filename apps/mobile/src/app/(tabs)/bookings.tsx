import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { BOOKING_STATUS_LABELS, formatTimeSlot } from '@scilab/shared'
import { getBookings, type Booking } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const STATUS_COLORS: Record<Booking['status'], { bg: string; fg: string }> = {
  PENDING: { bg: '#fef3c7', fg: '#b45309' },
  APPROVED: { bg: '#d1fae5', fg: '#047857' },
  REJECTED: { bg: '#fee2e2', fg: '#b91c1c' },
  CANCELLED: { bg: '#f1f5f9', fg: '#64748b' },
  CHECKED_OUT: { bg: '#dbeafe', fg: '#1d4ed8' },
  COMPLETED: { bg: '#e2e8f0', fg: '#334155' },
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BookingsScreen() {
  const { token } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const data = await getBookings(token)
      setBookings(data.bookings)
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
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>ยังไม่มีการจอง</Text>
        }
        renderItem={({ item }) => {
          const color = STATUS_COLORS[item.status]
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.instrument.name}</Text>
                <View style={[styles.badge, { backgroundColor: color.bg }]}>
                  <Text style={[styles.badgeText, { color: color.fg }]}>
                    {BOOKING_STATUS_LABELS[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>
                📅 {formatDate(item.date)} • 🕐 {formatTimeSlot(item.timeSlot)}
              </Text>
              {item.purpose ? (
                <Text style={styles.purpose}>{item.purpose}</Text>
              ) : null}
            </View>
          )
        }}
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
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  meta: { fontSize: 13, color: '#475569', marginTop: 8 },
  purpose: { fontSize: 13, color: '#64748b', marginTop: 4 },
  error: { color: '#dc2626', textAlign: 'center', padding: 16 },
  empty: { textAlign: 'center', color: '#64748b', padding: 32 },
})
