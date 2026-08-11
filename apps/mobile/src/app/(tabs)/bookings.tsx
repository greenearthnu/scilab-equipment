import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect } from 'expo-router'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_REQUEST_TYPE_LABELS,
} from '@scilab/shared'
import {
  getBookings,
  getBookingRequests,
  requestReturn,
  requestExtend,
  decideBookingRequest,
  uploadEvidence,
  resolveAssetUrl,
  type Booking,
  type BookingRequest,
} from '@/lib/api'
import { useAuth } from '@/lib/auth'

const STATUS_COLORS: Record<Booking['status'], { bg: string; fg: string }> = {
  PENDING: { bg: '#fef3c7', fg: '#b45309' },
  APPROVED: { bg: '#d1fae5', fg: '#047857' },
  REJECTED: { bg: '#fee2e2', fg: '#b91c1c' },
  CANCELLED: { bg: '#f1f5f9', fg: '#64748b' },
  CHECKED_OUT: { bg: '#dbeafe', fg: '#1d4ed8' },
  COMPLETED: { bg: '#e2e8f0', fg: '#334155' },
}

const UPLOADABLE_STATUSES = new Set(['CHECKED_OUT', 'COMPLETED'])

const FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'PENDING', label: 'รออนุมัติ' },
  { key: 'APPROVED', label: 'อนุมัติ' },
  { key: 'CHECKED_OUT', label: 'กำลังใช้' },
  { key: 'COMPLETED', label: 'เสร็จสิ้น' },
  { key: 'CANCELLED', label: 'ยกเลิก' },
  { key: 'REJECTED', label: 'ปฏิเสธ' },
]

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

export default function BookingsScreen() {
  const { token, user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [filter, setFilter] = useState('ALL')
  const [extendBooking, setExtendBooking] = useState<Booking | null>(null)
  const [extendTime, setExtendTime] = useState('')

  const isManager = user?.role === 'TEACHER' || user?.role === 'LAB_ADMIN'

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

  const loadRequests = useCallback(async () => {
    if (!token || !isManager) {
      setRequests([])
      return
    }
    try {
      const data = await getBookingRequests(token)
      setRequests(data.requests)
    } catch {
      // ไม่ขัดขวางการใช้งานหลัก
    }
  }, [token, isManager])

  const loadAll = useCallback(async () => {
    await Promise.all([load(), loadRequests()])
  }, [load, loadRequests])

  useFocusEffect(
    useCallback(() => {
      loadAll()
    }, [loadAll])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadAll()
  }, [loadAll])

  const pendingBookingIds = useMemo(
    () => new Set(requests.filter((r) => r.status === 'PENDING').map((r) => r.booking.id)),
    [requests]
  )

  const filteredBookings = useMemo(() => {
    if (filter === 'ALL') return bookings
    return bookings.filter((b) => b.status === filter)
  }, [bookings, filter])

  const handleUploadEvidence = useCallback(
    async (booking: Booking) => {
      if (!token) return
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        setError('ไม่ได้รับสิทธิ์เข้าถึงคลังรูปภาพ')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
      })
      if (result.canceled || result.assets.length === 0) return

      const asset = result.assets[0]
      const formData = new FormData()
      const mime = asset.mimeType ?? 'image/jpeg'
      formData.append('evidence', {
        uri: asset.uri,
        name: asset.fileName ?? `evidence-${Date.now()}.jpg`,
        type: mime,
      } as unknown as Blob)

      setUploadingId(booking.id)
      setError(null)
      try {
        await uploadEvidence(token, booking.id, formData)
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ')
      } finally {
        setUploadingId(null)
      }
    },
    [token, load]
  )

  const handleRequestReturn = useCallback(
    async (booking: Booking) => {
      if (!token) return
      setActioningId(booking.id)
      setError(null)
      try {
        await requestReturn(token, booking.id)
        await loadAll()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'ส่งคำขอไม่สำเร็จ')
      } finally {
        setActioningId(null)
      }
    },
    [token, loadAll]
  )

  const handleSubmitExtend = useCallback(async () => {
    if (!token || !extendBooking) return
    if (!isValidTime(extendTime) || extendTime <= extendBooking.endTime) {
      setError('เวลาสิ้นสุดใหม่ต้องอยู่หลังเวลาสิ้นสุดปัจจุบัน (HH:MM)')
      return
    }
    setActioningId(extendBooking.id)
    setError(null)
    try {
      await requestExtend(token, extendBooking.id, extendTime)
      setExtendBooking(null)
      setExtendTime('')
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่งคำขอไม่สำเร็จ')
    } finally {
      setActioningId(null)
    }
  }, [token, extendBooking, extendTime, loadAll])

  const handleDecide = useCallback(
    async (request: BookingRequest, approve: boolean) => {
      if (!token) return
      setActioningId(request.id)
      setError(null)
      try {
        await decideBookingRequest(token, request.id, approve)
        await loadAll()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ')
      } finally {
        setActioningId(null)
      }
    },
    [token, loadAll]
  )

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

      {isManager && requests.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.requestsSection}
          contentContainerStyle={styles.requestsContent}
        >
          <Text style={styles.requestsHeader}>คำขอคืน/ขยายเวลา</Text>
          {requests.map((r) => (
            <View key={r.id} style={styles.requestCard}>
              <Text style={styles.requestTitle}>
                {BOOKING_REQUEST_TYPE_LABELS[r.type]} • {r.booking.instrument.name}
              </Text>
              <Text style={styles.requestMeta}>
                {r.requestedBy.name} • {formatDate(r.booking.date)} •{' '}
                {r.booking.startTime}-{r.booking.endTime}
                {r.type === 'EXTEND' && r.newEndTime ? ` → ${r.newEndTime}` : ''}
              </Text>
              <View style={styles.requestActions}>
                <Pressable
                  style={[styles.approveBtn, actioningId === r.id && styles.btnDisabled]}
                  disabled={actioningId !== null}
                  onPress={() => handleDecide(r, true)}
                >
                  <Text style={styles.approveBtnText}>อนุมัติ</Text>
                </Pressable>
                <Pressable
                  style={[styles.rejectBtn, actioningId === r.id && styles.btnDisabled]}
                  disabled={actioningId !== null}
                  onPress={() => handleDecide(r, false)}
                >
                  <Text style={styles.rejectBtnText}>ปฏิเสธ</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {FILTERS.map((f) => {
              const selected = f.key === filter
              return (
                <Pressable
                  key={f.key}
                  style={[styles.filterChip, selected && styles.filterChipSelected]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selected && styles.filterChipTextSelected,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
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
                📅 {formatDate(item.date)} • 🕐 {item.startTime}-{item.endTime} น.
              </Text>
              {item.purpose ? (
                <Text style={styles.purpose}>{item.purpose}</Text>
              ) : null}
              {item.evidenceUrl ? (
                <Image
                  source={{
                    uri: resolveAssetUrl(item.evidenceUrl) ?? undefined,
                  }}
                  style={styles.evidenceImage}
                  resizeMode="cover"
                />
              ) : null}
              {item.status === 'CHECKED_OUT' && (
                <View style={styles.actionRow}>
                  {pendingBookingIds.has(item.id) ? (
                    <Text style={styles.pendingHint}>มีคำขอกำลังรออนุมัติ</Text>
                  ) : (
                    <>
                      <Pressable
                        style={[
                          styles.secondaryBtn,
                          actioningId === item.id && styles.btnDisabled,
                        ]}
                        disabled={actioningId !== null}
                        onPress={() => handleRequestReturn(item)}
                      >
                        <Text style={styles.secondaryBtnText}>
                          {actioningId === item.id ? 'กำลังส่ง...' : 'ขอคืนก่อนเวลา'}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.secondaryBtn,
                          actioningId === item.id && styles.btnDisabled,
                        ]}
                        disabled={actioningId !== null}
                        onPress={() => {
                          setExtendBooking(item)
                          setExtendTime(item.endTime)
                        }}
                      >
                        <Text style={styles.secondaryBtnText}>ขยายเวลา</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
              {UPLOADABLE_STATUSES.has(item.status) ? (
                <Pressable
                  style={[
                    styles.uploadBtn,
                    uploadingId === item.id && styles.btnDisabled,
                  ]}
                  disabled={uploadingId !== null}
                  onPress={() => handleUploadEvidence(item)}
                >
                  <Text style={styles.uploadBtnText}>
                    {uploadingId === item.id
                      ? 'กำลังอัปโหลด...'
                      : item.evidenceUrl
                        ? 'เปลี่ยนรูปหลักฐาน'
                        : '📷 อัปโหลดรูปหลักฐาน'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )
        }}
      />

      <Modal
        visible={extendBooking !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setExtendBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>ขอขยายเวลา</Text>
            {extendBooking ? (
              <>
                <Text style={styles.modalMeta}>
                  {extendBooking.instrument.name} • เวลาสิ้นสุดปัจจุบัน{' '}
                  {extendBooking.endTime} น.
                </Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="HH:MM เช่น 16:00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numbers-and-punctuation"
                  value={extendTime}
                  onChangeText={setExtendTime}
                />
                <Pressable
                  style={[
                    styles.submitBtn,
                    actioningId !== null && styles.btnDisabled,
                  ]}
                  disabled={actioningId !== null}
                  onPress={handleSubmitExtend}
                >
                  <Text style={styles.submitBtnText}>ส่งคำขอขยายเวลา</Text>
                </Pressable>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setExtendBooking(null)}
                >
                  <Text style={styles.cancelText}>ปิด</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  list: { padding: 16, gap: 12 },
  filtersRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipSelected: { backgroundColor: '#059669', borderColor: '#059669' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#334155' },
  filterChipTextSelected: { color: '#fff' },
  requestsSection: { maxHeight: 150, backgroundColor: '#fffbeb' },
  requestsContent: { padding: 12, gap: 10, alignItems: 'flex-start' },
  requestsHeader: { fontWeight: '700', color: '#b45309', fontSize: 14 },
  requestCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 10,
    width: 260,
  },
  requestTitle: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  requestMeta: { fontSize: 11, color: '#64748b', marginTop: 4 },
  requestActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  approveBtn: {
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  approveBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  rejectBtn: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rejectBtnText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
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
  evidenceImage: { width: '100%', height: 160, borderRadius: 8, marginTop: 10 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryBtnText: { color: '#b45309', fontSize: 13, fontWeight: '600' },
  pendingHint: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#b45309',
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
  },
  uploadBtn: {
    marginTop: 10,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  error: { color: '#dc2626', textAlign: 'center', padding: 16 },
  empty: { textAlign: 'center', color: '#64748b', padding: 32 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  modalMeta: { fontSize: 13, color: '#475569', marginBottom: 12 },
  timeInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: '#059669', fontSize: 15, fontWeight: '600' },
})
