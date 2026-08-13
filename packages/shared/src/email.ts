export const SCHOOL_EMAIL_DOMAIN = 'school.ac.th'

export function isSchoolEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${SCHOOL_EMAIL_DOMAIN}`)
}
