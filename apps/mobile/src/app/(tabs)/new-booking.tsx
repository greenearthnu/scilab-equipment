import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { TIME_SLOTS } from '@scilab/shared'
import { createBookingApi, getInstruments, type Instrument } from '@/lib/api'
import { useAuth } from '@/lib/auth'

function nextDays(count: number): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function formatDay(dateStr: string): { label: string; sub: string } {
  const d = new Date(`${dateStr}T00:00:00`)
  const weekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ]
  return {
    label: weekdays[d.getDay()],
    sub: `${d.getDate()} ${months[d.getMonth()]}`,
  }
}

export default function NewBookingScreen() {
  const router = useRouter()
  const { token } = useAuth()

  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [selectedInstrument, setSelectedInstrument] =
    useState<Instrument | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [days] = useState(() => nextDays(7))
  const [selectedDate, setSelectedDate] = useState<string>(days[1] ?? days[0])
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [purpose, setPurpose] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInstruments = useCallback(async () => {
    if (!token) return
    try {
      const data = await getInstruments(token)
      setInstruments(data.instruments.filter((i) => i.status === 'AVAILABLE'))
    } catch {
      setError('โหลดรายการเครื่องมือไม่สำเร็จ')
    }
  }, [token])

  useFocusEffect(
    useCallback(() => {
      loadInstruments()
    }, [loadInstruments])
  )

  const handleSubmit = async () => {
    if (!selectedInstrument || selectedSlots.length === 0 || !token) {
      setError('กรุณาเลือกเครื่องมือ วันที่ และช่วงเวลาอย่างน้อย 1 คาบ')
      return
    }
    setError(null)
    setPending(true)
    try {
      await createBookingApi(token, {
        instrumentId: selectedInstrument.id,
        date: selectedDate,
        timeSlots: selectedSlots,
        purpose: purpose.trim() || undefined,
      })
      router.push('/bookings')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่งคำขอจองไม่สำเร็จ')
    } finally {
      setPending(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>เครื่องมือ</Text>
      <Pressable style={styles.select} onPress={() => setPickerOpen(true)}>
        <Text
          style={selectedInstrument ? styles.selectText : styles.selectPlaceholder}
        >
          {selectedInstrument
            ? `${selectedInstrument.name} (${selectedInstrument.availableCount} ชิ้น)`
            : 'เลือกเครื่องมือ...'}
        </Text>
      </Pressable>

      <Text style={styles.label}>วันที่</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysRow}
      >
        {days.map((day) => {
          const { label, sub } = formatDay(day)
          const selected = day === selectedDate
          return (
            <Pressable
              key={day}
              style={[styles.dayChip, selected && styles.chipSelected]}
              onPress={() => setSelectedDate(day)}
            >
              <Text
                style={[
                  styles.dayLabel,
                  selected && styles.chipTextSelected,
                ]}
              >
                {label}
              </Text>
              <Text
                style={[
                  styles.daySub,
                  selected && styles.chipTextSelected,
                ]}
              >
                {sub}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <Text style={styles.label}>ช่วงเวลา (คาบเรียน) — เลือกได้หลายคาบ</Text>
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.map((slot) => {
          const selected = selectedSlots.includes(slot.id)
          return (
            <Pressable
              key={slot.id}
              style={[styles.slotChip, selected && styles.chipSelected]}
              onPress={() => {
                setSelectedSlots((prev) =>
                  prev.includes(slot.id)
                    ? prev.filter((id) => id !== slot.id)
                    : [...prev, slot.id]
                )
              }}
            >
              <Text
                style={[
                  styles.slotLabel,
                  selected && styles.chipTextSelected,
                ]}
              >
                {slot.label}
              </Text>
              <Text
                style={[
                  styles.slotTime,
                  selected && styles.chipTextSelected,
                ]}
              >
                {slot.start}
              </Text>
            </Pressable>
          )
        })}
      </View>
      {selectedSlots.length === 0 && (
        <Text style={styles.slotHint}>ยังไม่ได้เลือกช่วงเวลา</Text>
      )}

      <Text style={styles.label}>วัตถุประสงค์การใช้งาน</Text>
      <TextInput
        style={styles.input}
        placeholder="เช่น ใช้ประกอบการทดลองเรื่องเซลล์พืช"
        placeholderTextColor="#94a3b8"
        multiline
        value={purpose}
        onChangeText={setPurpose}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.submit, pending && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={pending}
      >
        {pending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>ส่งคำขอจอง</Text>
        )}
      </Pressable>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>เลือกเครื่องมือ</Text>
            <FlatList
              data={instruments}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.instrumentRow}
                  onPress={() => {
                    setSelectedInstrument(item)
                    setPickerOpen(false)
                  }}
                >
                  <Text style={styles.instrumentName}>{item.name}</Text>
                  <Text style={styles.instrumentMeta}>
                    จำนวน: {item.availableCount} ชิ้น
                    {item.location ? ` • ${item.location}` : ''}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>ไม่มีเครื่องมือที่พร้อมใช้งาน</Text>
              }
            />
            <Pressable style={styles.cancelBtn} onPress={() => setPickerOpen(false)}>
              <Text style={styles.cancelText}>ปิด</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginTop: 16, marginBottom: 8 },
  select: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
  },
  selectText: { fontSize: 15, color: '#0f172a' },
  selectPlaceholder: { fontSize: 15, color: '#94a3b8' },
  daysRow: { gap: 8 },
  dayChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  chipSelected: { backgroundColor: '#059669', borderColor: '#059669' },
  chipTextSelected: { color: '#fff' },
  dayLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  daySub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '23%',
  },
  slotLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  slotTime: { fontSize: 11, color: '#64748b', marginTop: 2 },
  slotHint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#0f172a',
  },
  error: { color: '#dc2626', fontSize: 13, marginTop: 12, textAlign: 'center' },
  submit: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
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
  instrumentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  instrumentName: { fontSize: 15, fontWeight: '500', color: '#0f172a' },
  instrumentMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: '#059669', fontSize: 15, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#64748b', padding: 24 },
})
