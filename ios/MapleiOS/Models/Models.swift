import Foundation

// Mirrors the web app's types/index.ts and the Supabase schema.

struct SpotifyInterests: Codable, Hashable {
    var topArtists: [String]
    var topTracks: [String]
    var genres: [String]

    enum CodingKeys: String, CodingKey {
        case topArtists = "top_artists"
        case topTracks = "top_tracks"
        case genres
    }
}

struct MapleUser: Codable, Identifiable, Hashable {
    let id: String
    var email: String
    var name: String
    var gender: String?
    var wantToDate: [String]?
    var phone: String?
    var scheduleText: String?
    var campus: String?
    var spotifyInterests: SpotifyInterests?
    var topSpots: [String]?
    var avatarURL: String?
    var age: Int?
    var year: Int?
    var createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, email, name, gender, phone, campus, age, year
        case wantToDate = "want_to_date"
        case scheduleText = "schedule_text"
        case spotifyInterests = "spotify_interests"
        case topSpots = "top_spots"
        case avatarURL = "avatar_url"
        case createdAt = "created_at"
    }
}

enum Sentiment: String, Codable {
    case like, dislike, neutral, pass, block
}

struct Swipe: Codable, Identifiable, Hashable {
    let id: String
    let fromUser: String
    let toUser: String
    let sentiment: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case fromUser = "from_user"
        case toUser = "to_user"
        case sentiment
        case createdAt = "created_at"
    }
}

struct DateCard: Codable, Hashable {
    var time: String
    var venue: String
    var walkMinutes: Int?
    var sharedContext: String?
    var reasoning: String?
    var icebreaker: String?
    var address: String?
    var lat: Double?
    var lng: Double?
    var mapsURL: String?
    var staticMap: String?

    enum CodingKeys: String, CodingKey {
        case time, venue, address, lat, lng, reasoning, icebreaker
        case walkMinutes = "walk_minutes"
        case sharedContext = "shared_context"
        case mapsURL = "maps_url"
        case staticMap = "static_map"
    }
}

struct Match: Codable, Identifiable, Hashable {
    let id: String
    let userA: String
    let userB: String
    var status: String
    var dateCard: DateCard?
    var createdAt: String?
    var userAProfile: MapleUser?
    var userBProfile: MapleUser?

    enum CodingKeys: String, CodingKey {
        case id, status
        case userA = "user_a"
        case userB = "user_b"
        case dateCard = "date_card_json"
        case createdAt = "created_at"
        case userAProfile = "user_a_profile"
        case userBProfile = "user_b_profile"
    }

    /// The other person in the match, given the current user's id.
    func partner(currentUserID: String) -> MapleUser? {
        userA == currentUserID ? userBProfile : userAProfile
    }
}

/// A ranked feed entry (built client-side, like lib/score.ts).
struct FeedCard: Identifiable, Hashable {
    let user: MapleUser
    let score: Int
    let hint: String
    let school: String
    var distanceKm: Double?
    var id: String { user.id }
}
