import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import {
  BOOKING_STATUS_LABELS,
  INSTRUMENT_CATEGORY_LABELS,
  type BookingStatus,
} from '@scilab/shared'
import {
  getCalendarBookings,
  getInstruments,
  type CalendarBooking,
  type Instrument,
} from '@/lib/api'
import { useAuth } from '@/lib/auth'

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const STATUS_FILTERS = [
  { key: 'ALL', label: 'ทุกสถานะ' },
  ...Object.entries(BOOKING_STATUS_LABELS).map(([key, label]) => ({
    key,
    label,
  })),
]

const STATUS_DOT: Record<BookingStatus, string> = {
  PENDING: '#fbbf24',
  APPROVED: '#10b981',
  REJECTED: '#f87171',
  CANCELLED: '#cbd5e1',
  CHECKED_OUT: '#3b82f6',
  COMPLETED: '#64748b',
}

const STATUS_BADGE: Record<BookingStatus, { bg: string; fg: string }> = {
  PENDING: { bg: '#fef3c7', fg: '#b45309' },
  APPROVED: { bg: '#d1fae5', fg: '#047857' },
  REJECTED: { bg: '#fee2e2', fg: '#b91c1c' },
  CANCELLED: { bg: '#f1f5f9', fg: '#64748b' },
  CHECKED_OUT: { bg: '#dbeafe', fg: '#1d4ed8' },
  COMPLETED: { bg: '#e2e8f0', fg: '#334155' },
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function todayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function formatThaiDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1)
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function CalendarViewMobile() {
  const { token } = useAuth()
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(todayString())
  const [instrumentId, setInstrumentId] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const [calData, instData] = await Promise.all([
        getCalendarBookings(token, monthKey(viewDate)),
        getInstruments(token),
      ])
      setBookings(calData.bookings)
      setInstruments(instData.instruments)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดปฏิทินไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [token, viewDate])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>()
    for (const b of bookings) {
      const key = b.date.slice(0, 10)
      const list = map.get(key) ?? []
      list.push(b)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return map
  }, [bookings])

  const gridDays = useMemo(() => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    const first = new Date(y, m, 1)
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const cells: (string | null)[] = []
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      )
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewDate])

  const selectedBookings = useMemo(() => {
    const list = byDate.get(selectedDate) ?? []
    const byStatus =
      statusFilter === 'ALL' ? list : list.filter((b) => b.status === statusFilter)
    return instrumentId === 'ALL'
      ? byStatus
      : byStatus.filter((b) => b.instrument.id === instrumentId)
  }, [byDate, selectedDate, statusFilter, instrumentId])

  const countByStatus = (dateStr: string) => {
    const counts = new Map<BookingStatus, number>()
    for (const b of byDate.get(dateStr) ?? []) {
      if (instrumentId !== 'ALL' && b.instrument.id !== instrumentId) continue
      counts.set(b.status, (counts.get(b.status) ?? 0) + 1)
    }
    return counts
  }

  const today = todayString()

  const changeMonth = (delta: number) => {
    setLoading(true)
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1))
  }

  const goToday = () => {
    setLoading(true)
    setViewDate(new Date())
    setSelectedDate(today)
  }

  const monthTitle = viewDate.toLocaleDateString('th-TH', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.monthRow}>
        <Pressable style={styles.monthBtn} onPress={() => changeMonth(-1)}>
          <Text style={styles.monthBtnText}>‹</Text>
        </Pressable>
        <Pressable style={styles.monthBtn} onPress={goToday}>
          <Text style={styles.monthBtnText}>วันนี้</Text>
        </Pressable>
        <Pressable style={styles.monthBtn} onPress={() => changeMonth(1)}>
          <Text style={styles.monthBtnText}>›</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{monthTitle}</Text>
      </View>

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

      <View style={styles.gridCard}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekDay}>
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {gridDays.map((dateStr, i) => {
            if (!dateStr) {
              return <View key={`empty-${i}`} style={styles.cell} />
            }
            const counts = countByStatus(dateStr)
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            return (
              <Pressable
                key={dateStr}
                style={[styles.cell, isSelected && styles.cellSelected]}
                onPress={() => setSelectedDate(dateStr)}
              >
                <View
                  style={[styles.dayCircle, isToday && styles.dayCircleToday]}
                >
                  <Text
                    style={[styles.dayText, isToday && styles.dayTextToday]}
                  >
                    {Number(dateStr.slice(8))}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {Array.from(counts.entries()).map(([status, count]) => (
                    <View key={status} style={styles.dotWrap}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: STATUS_DOT[status] },
                        ]}
                      />
                      <Text style={styles.dotCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.legend}>
        {(Object.keys(STATUS_DOT) as BookingStatus[]).map((status) => (
          <View key={status} style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: STATUS_DOT[status] }]}
            />
            <Text style={styles.legendText}>{BOOKING_STATUS_LABELS[status]}</Text>
          </View>
        ))}
      </View>

      <View style={styles.daySection}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{formatThaiDate(selectedDate)}</Text>
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
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#059669"
            style={styles.loadingBox}
          />
        ) : selectedBookings.length === 0 ? (
          <Text style={styles.empty}>ไม่มีการจองในวันนี้</Text>
        ) : (
          <FlatList
            data={selectedBookings}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const badge = STATUS_BADGE[item.status]
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.timeRange}>
                      {item.startTime}-{item.endTime}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.fg }]}>
                        {BOOKING_STATUS_LABELS[item.status]}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{item.instrument.name}</Text>
                  <Text style={styles.cardMeta}>
                    {
                      INSTRUMENT_CATEGORY_LABELS[
                        item.instrument.category as keyof typeof INSTRUMENT_CATEGORY_LABELS
                      ]
                    }
                    {item.user
                      ? ` • ${item.user.name}${
                          item.user.className ? ` (${item.user.className})` : ''
                        } • คะแนน ${item.user.score}`
                      : ''}
                  </Text>
                  {item.purpose ? (
                    <Text style={styles.cardPurpose}>{item.purpose}</Text>
                  ) : null}
                </View>
              )
            }}
          />
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  error: { color: '#dc2626', textAlign: 'center', padding: 12 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  monthBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  monthBtnText: { fontSize: 14, color: '#334155', fontWeight: '600' },
  monthTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', marginLeft: 4 },
  chipsRow: { gap: 8, paddingVertical: 4 },
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
  gridCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    overflow: 'hidden',
  },
  weekRow: { flexDirection: 'row' },
  weekDay: {
    width: '14.2857%',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    paddingTop: 6,
  },
  cellSelected: { backgroundColor: '#ecfdf5' },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: { backgroundColor: '#059669' },
  dayText: { fontSize: 13, color: '#334155' },
  dayTextToday: { color: '#fff', fontWeight: 'bold' },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center', marginTop: 2 },
  dotWrap: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotCount: { fontSize: 9, color: '#64748b' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#64748b' },
  daySection: { marginTop: 16 },
  dayHeader: { gap: 8 },
  dayTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  loadingBox: { marginVertical: 32 },
  empty: { textAlign: 'center', color: '#64748b', padding: 32 },
  list: { gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeRange: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardPurpose: { fontSize: 13, color: '#475569', marginTop: 4 },
})
