import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { BOOKING_STATUS_LABELS, type BookingStatus } from '@scilab/shared'
import { getBookings, getInstruments, type Booking, type Instrument } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const STATUS_BADGE: Record<BookingStatus, { bg: string; fg: string }> = {
  PENDING: { bg: '#fef3c7', fg: '#b45309' },
  APPROVED: { bg: '#d1fae5', fg: '#047857' },
  REJECTED: { bg: '#fee2e2', fg: '#b91c1c' },
  CANCELLED: { bg: '#f1f5f9', fg: '#64748b' },
  CHECKED_OUT: { bg: '#dbeafe', fg: '#1d4ed8' },
  COMPLETED: { bg: '#e2e8f0', fg: '#334155' },
}

const STATUS_FILTERS = [
  { key: 'ALL', label: 'ทั้งหมด' },
  ...Object.entries(BOOKING_STATUS_LABELS).map(([key, label]) => ({
    key,
    label,
  })),
]

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function HistoryViewMobile() {
  const { token } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [instrumentId, setInstrumentId] = useState('ALL')

  const load = useCallback(async () => {
    if (!token) return
    try {
      const [bookData, instData] = await Promise.all([
        getBookings(token),
        getInstruments(token),
      ])
      setBookings(bookData.bookings)
      setInstruments(instData.instruments)
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

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: bookings.length }
    for (const b of bookings) c[b.status] = (c[b.status] ?? 0) + 1
    return c
  }, [bookings])

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => (statusFilter === 'ALL' ? true : b.status === statusFilter))
      .filter((b) =>
        instrumentId === 'ALL' ? true : b.instrument.id === instrumentId
      )
      .sort((a, b) => {
        const cmp = b.date.localeCompare(a.date)
        return cmp !== 0 ? cmp : b.startTime.localeCompare(a.startTime)
      })
  }, [bookings, statusFilter, instrumentId])

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.summary}
      >
        {STATUS_FILTERS.map((f) => (
          <View key={f.key} style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{counts[f.key] ?? 0}</Text>
            <Text style={styles.summaryLabel}>{f.label}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {STATUS_FILTERS.map((f) => {
          const selected = f.key === statusFilter
          return (
            <Pressable
              key={f.key}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {f.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {[{ id: 'ALL', name: 'เครื่องมือทั้งหมด' }, ...instruments].map((inst) => {
          const selected = inst.id === instrumentId
          return (
            <Pressable
              key={inst.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setInstrumentId(inst.id)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {inst.name}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<Text style={styles.empty}>ไม่พบการจองที่ตรงกับเงื่อนไข</Text>}
        renderItem={({ item }) => {
          const badge = STATUS_BADGE[item.status]
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.instrument.name}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.fg }]}>
                    {BOOKING_STATUS_LABELS[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>
                📅 {formatDate(item.date)} • 🕐 {item.startTime}-{item.endTime} น.
              </Text>
              {item.purpose ? <Text style={styles.purpose}>{item.purpose}</Text> : null}
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  error: { color: '#dc2626', textAlign: 'center', padding: 12 },
  summary: { paddingHorizontal: 16, paddingTop: 16 },
  chipsRow: { gap: 8, paddingVertical: 4, paddingHorizontal: 16 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 72,
  },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  summaryLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipSelected: { backgroundColor: '#059669', borderColor: '#059669' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#334155' },
  chipTextSelected: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  meta: { fontSize: 13, color: '#475569', marginTop: 8 },
  purpose: { fontSize: 13, color: '#64748b', marginTop: 4 },
  empty: { textAlign: 'center', color: '#64748b', padding: 32 },
})
