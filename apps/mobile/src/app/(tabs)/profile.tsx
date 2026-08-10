import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ROLE_LABELS } from '@scilab/shared'
import { useAuth } from '@/lib/auth'
import { resolveAssetUrl } from '@/lib/api'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const avatarUrl = resolveAssetUrl(user?.avatarUrl)

  const infoRows: { label: string; value: string | null }[] = [
    { label: 'ห้องเรียน', value: user?.className ?? null },
    { label: 'รหัสนักเรียน', value: user?.studentId ?? null },
    { label: 'เบอร์โทร', value: user?.phone ?? null },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>
          {user ? ROLE_LABELS[user.role] : ''}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.infoBox}>
          {infoRows.map(
            (row) =>
              row.value && (
                <View key={row.label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              )
          )}
          {infoRows.every((row) => !row.value) && (
            <Text style={styles.emptyInfo}>ยังไม่มีข้อมูลส่วนตัว</Text>
          )}
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarFallback: {
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  role: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 10,
    overflow: 'hidden',
  },
  email: { fontSize: 13, color: '#64748b', marginTop: 8 },
  infoBox: {
    alignSelf: 'stretch',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  emptyInfo: { textAlign: 'center', color: '#94a3b8', fontSize: 13 },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
})
