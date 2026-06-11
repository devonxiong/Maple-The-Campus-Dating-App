import { User, FeedCard, Swipe } from '@/types'

/** Build the set of user IDs to exclude from the feed.
 *  Passes expire after 30 days — that person reappears in the feed. */
export function buildSwipedSet(swipes: Pick<Swipe, 'to_user' | 'sentiment' | 'created_at'>[]): Set<string> {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  return new Set(
    swipes
      .filter(s => {
        if (s.sentiment === 'pass') return new Date(s.created_at).getTime() > thirtyDaysAgo
        return true // like/dislike/neutral/block are permanent
      })
      .map(s => s.to_user)
  )
}

/** Derive college name from email domain */
export function schoolFromEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (domain === 'pitzer.edu' || domain === 'students.pitzer.edu') return 'Pitzer'
  if (domain === 'mymail.pomona.edu') return 'Pomona'
  if (domain === 'scrippscollege.edu') return 'Scripps'
  if (domain === 'claremontmckenna.edu' || domain === 'cmc.edu') return 'CMC'
  if (domain === 'g.hmc.edu') return 'HMC'
  return '5C'
}

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** GPS proximity bonus */
function gpsScore(distKm: number): number {
  if (distKm < 0.3) return 8   // basically same spot
  if (distKm < 0.8) return 5   // nearby campus
  if (distKm < 2.0) return 3   // same general area
  if (distKm < 5.0) return 1   // Claremont area
  return 0
}

/** Returns true if a wants to date b and b wants to date a. */
function mutuallyCompatible(a: User, b: User): boolean {
  function prefMatchesGender(prefs: string[] | string | null | undefined, gender: string | null | undefined): boolean {
    if (!prefs || !gender) return true
    const arr = Array.isArray(prefs) ? prefs : [prefs]
    if (arr.length === 0) return true
    return arr.some(p =>
      (p === 'Men' && gender === 'Man') ||
      (p === 'Women' && gender === 'Woman') ||
      (p === 'Non-binary' && gender === 'Non-binary')
    )
  }
  return prefMatchesGender(a.want_to_date, b.gender) && prefMatchesGender(b.want_to_date, a.gender)
}

/** Find shared Spotify artists and genres between two users. */
function spotifyOverlap(a: User, b: User): { artists: string[]; genres: string[] } {
  const sa = a.spotify_interests
  const sb = b.spotify_interests
  if (!sa || !sb) return { artists: [], genres: [] }
  const artistsA = new Set(sa.top_artists.map(x => x.toLowerCase()))
  const genresA  = new Set(sa.genres.map(x => x.toLowerCase()))
  const artists = sb.top_artists.filter(x => artistsA.has(x.toLowerCase()))
  const genres  = sb.genres.filter(x => genresA.has(x.toLowerCase()))
  return { artists, genres }
}

export type PresenceMap = Map<string, { lat: number; lng: number }>

export function buildFeed(
  currentUser: User,
  others: User[],
  swipedIds: Set<string>,
  admiredByIds: Set<string> = new Set(),
  totalUserCount?: number,
  presenceMap?: PresenceMap,
  myPresence?: { lat: number; lng: number },
): FeedCard[] {
  const tinyPool = (totalUserCount ?? others.length + 1) < 20

  return others
    .filter((u) => !swipedIds.has(u.id))
    .map((u) => {
      const overlap = spotifyOverlap(currentUser, u)

      let score = 0
      if (!tinyPool && !mutuallyCompatible(currentUser, u)) return null

      score += 1 // baseline

      // GPS proximity boost
      let distanceKm: number | undefined
      if (myPresence && presenceMap?.has(u.id)) {
        const p = presenceMap.get(u.id)!
        distanceKm = haversineKm(myPresence.lat, myPresence.lng, p.lat, p.lng)
        score += gpsScore(distanceKm)
      }

      // Spotify boost: +2 per shared artist (max 6), +1 per shared genre (max 3)
      score += Math.min(overlap.artists.length * 2, 6)
      score += Math.min(overlap.genres.length, 3)

      // Same campus boost
      if (currentUser.campus && u.campus && currentUser.campus === u.campus) score += 1

      const school = schoolFromEmail(u.email)

      return {
        user: u,
        score,
        hint: buildHint(currentUser, u, overlap, distanceKm),
        school,
        distanceKm,
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null && c.score > 0)
    .sort((a, b) => b.score - a.score)
}

function buildHint(
  a: User,
  b: User,
  overlap: { artists: string[]; genres: string[] },
  distanceKm?: number,
): string {
  // Spotify match takes priority
  if (overlap.artists.length > 0) {
    const names = overlap.artists.slice(0, 2).join(' & ')
    return `you both fw ${names} 🎵`
  }
  if (overlap.genres.length > 0) {
    const g = overlap.genres.slice(0, 2).join(' & ')
    return `shared taste in ${g} 🎵`
  }
  // GPS nearby
  if (distanceKm !== undefined && distanceKm < 0.8) return 'literally nearby rn 📍'
  if (distanceKm !== undefined && distanceKm < 2.0) return 'around the same area 📍'
  if (a.campus && b.campus && a.campus === b.campus) return 'y\'all are literally on the same campus'
  return 'you two have probably crossed paths ngl'
}
