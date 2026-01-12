export function hasOrgAccess(
  userOrgId: string,
  resourceOrgId: string,
  parentOrgId?: string | null
): boolean {
  // Allow if same organization
  if (userOrgId === resourceOrgId) {
    return true;
  }

  // Allow if user org is parent of resource org
  if (parentOrgId && userOrgId === parentOrgId) {
    return true;
  }

  // Restrict deeper nesting
  return false;
}
