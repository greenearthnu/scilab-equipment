import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { registerDevice } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null

  if (!Device.isDevice) {
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') {
    return null
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      ...(projectId ? { projectId } : {}),
    })
    return token.data
  } catch (e) {
    console.warn('Failed to get push token:', e)
    return null
  }
}

export async function setupPushNotifications(token: string): Promise<void> {
  try {
    const pushToken = await registerForPushNotificationsAsync()
    if (!pushToken) return

    const platform =
      Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : 'web'

    await registerDevice(token, {
      pushToken,
      platform,
    })
  } catch (e) {
    console.warn('Failed to register push device:', e)
  }
}
