import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ROLE_LABELS } from '@scilab/shared'
import { useAuth } from '@/lib/auth'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase() ?? '?'}
        </Text>
        <Text style={styles.name}>{user?.name}</Text>
        {user?.className ? (
          <Text style={styles.sub}>ห้องเรียน: {user.className}</Text>
        ) : null}
        <Text style={styles.role}>
          {user ? ROLE_LABELS[user.role] : ''}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#059669',
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 72,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  sub: { fontSize: 14, color: '#475569', marginTop: 2 },
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
