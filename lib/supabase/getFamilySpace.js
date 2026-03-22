import { createClient } from './server'

export async function getFamilySpace() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_space_id')
    .eq('user_id', user.id)
    .single()

  if (!familyMember) {
    return null
  }

  return familyMember.family_space_id
}

export async function createFamilySpace(name = 'Our Family') {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Generate invite code (6 random uppercase chars)
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Create family space
  const { data: space, error: spaceError } = await supabase
    .from('family_spaces')
    .insert({ name, invite_code: inviteCode })
    .select()
    .single()

  if (spaceError) throw spaceError

  // Add user to family space
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_space_id: space.id,
      user_id: user.id,
    })

  if (memberError) throw memberError

  return { space, inviteCode }
}

export async function joinFamilySpace(inviteCode) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Look up space by invite code
  const { data: space, error: spaceError } = await supabase
    .from('family_spaces')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()

  if (spaceError) throw new Error('Invalid invite code')

  // Add user to family space
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_space_id: space.id,
      user_id: user.id,
    })

  if (memberError) {
    if (memberError.code === '23505') {
      throw new Error('Already a member of this family space')
    }
    throw memberError
  }

  return space
}
