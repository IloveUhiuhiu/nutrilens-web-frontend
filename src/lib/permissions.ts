import { useAuth } from '../auth/AuthProvider'

export function usePermissions() {
  const { permissions, isSuperuser } = useAuth()
  return {
    hasPermission: (perm: string) => isSuperuser || permissions.includes(perm),
    hasAnyPermission: (perms: string[]) =>
      isSuperuser || perms.some((p) => permissions.includes(p)),
    hasAllPermissions: (perms: string[]) =>
      isSuperuser || perms.every((p) => permissions.includes(p)),
  }
}
