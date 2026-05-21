export const ROLE_LABELS = {
  admin: 'Завуч',
  user: 'Учитель',
  guest: 'Ученик',
}

export const getRoleLabel = (role) => ROLE_LABELS[role] ?? role ?? '—'
