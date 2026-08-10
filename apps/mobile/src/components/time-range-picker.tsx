import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { rangesOverlap, type TimeRange } from '@scilab/shared'

const DAY_START_MIN = 7 * 60
const DAY_END_MIN = 19 * 60
const STEP_MIN = 30

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function toTime(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function blockRange(start: string): TimeRange {
  return { startTime: start, endTime: toTime(toMinutes(start) + STEP_MIN) }
}

interface TimeRangePickerProps {
  takenRanges: TimeRange[]
  startTime: string
  endTime: string
  onChange: (startTime: string, endTime: string) => void
}

export default function TimeRangePicker({
  takenRanges,
  startTime,
  endTime,
  onChange,
}: TimeRangePickerProps) {
  const blocks = useMemo(() => {
    const list: string[] = []
    for (let m = DAY_START_MIN; m < DAY_END_MIN; m += STEP_MIN) {
      list.push(toTime(m))
    }
    return list
  }, [])

  const isTaken = (block: string) =>
    takenRanges.some((r) => rangesOverlap(r, blockRange(block)))

  const selStart =
    startTime && endTime ? (startTime < endTime ? startTime : endTime) : null
  const selEnd =
    startTime && endTime ? (startTime < endTime ? endTime : startTime) : null

  const isSelected = (block: string) => {
    if (!selStart || !selEnd) return false
    const b = toMinutes(block)
    return b >= toMinutes(selStart) && b < toMinutes(selEnd)
  }

  const selectedConflicts =
    selStart && selEnd
      ? takenRanges.filter((r) =>
          rangesOverlap(r, { startTime: selStart, endTime: selEnd })
        )
      : []

  const handleClick = (block: string) => {
    if (isTaken(block)) return
    if (!startTime || (startTime && endTime)) {
      onChange(block, '')
      return
    }
    if (block <= startTime) {
      onChange(block, '')
      return
    }
    onChange(startTime, block)
  }

  return (
    <View>
      <View style={styles.grid}>
        {blocks.map((block) => {
          const taken = isTaken(block)
          const selected = isSelected(block)
          const inConflict = selected && selectedConflicts.length > 0
          const isStart = block === startTime
          const isEnd = block === endTime

          return (
            <Pressable
              key={block}
              disabled={taken}
              onPress={() => handleClick(block)}
              style={[
                styles.block,
                taken && styles.blockTaken,
                inConflict && styles.blockConflict,
                selected && !inConflict && styles.blockSelected,
                (isStart || isEnd) && styles.blockEdge,
              ]}
            >
              <Text
                style={[
                  styles.blockText,
                  taken && styles.blockTextTaken,
                  selected && !inConflict && styles.blockTextSelected,
                  inConflict && styles.blockTextConflict,
                ]}
              >
                {block}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendTaken]} />
          <Text style={styles.legendText}>ถูกจองแล้ว</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendSelected]} />
          <Text style={styles.legendText}>ช่วงที่เลือก</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendEdge]} />
          <Text style={styles.legendText}>เริ่ม/สิ้นสุด</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        แตะเวลาเริ่มก่อน แล้วแตะเวลาสิ้นสุดเพื่อเลือกช่วง (ครั้งละ 30 นาที)
      </Text>

      {selectedConflicts.length > 0 && (
        <Text style={styles.conflict}>
          ช่วงเวลาที่เลือกทับซ้อนกับการจอง{' '}
          {selectedConflicts.map((r) => `${r.startTime}-${r.endTime}`).join(', ')}{' '}
          กรุณาเลือกช่วงอื่น
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  block: {
    width: '14%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
  },
  blockTaken: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  blockSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  blockConflict: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  blockEdge: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  blockText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  blockTextTaken: { color: '#94a3b8', textDecorationLine: 'line-through' },
  blockTextSelected: { color: '#fff' },
  blockTextConflict: { color: '#b91c1c' },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendTaken: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  legendSelected: { backgroundColor: '#059669' },
  legendEdge: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#f59e0b' },
  legendText: { fontSize: 11, color: '#64748b' },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 8 },
  conflict: {
    fontSize: 13,
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
})
