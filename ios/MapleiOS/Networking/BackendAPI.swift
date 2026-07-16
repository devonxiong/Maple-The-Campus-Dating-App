import Foundation

/// Client for the deployed Next.js server routes (app/api/*).
/// These handle logic that must stay server-side: OTP email, password hashing,
/// AI date planning, SMS, avatar upload, account deletion.
struct BackendAPI {
    static let shared = BackendAPI()
    private var base: URL { AppConfig.apiBase.appendingPathComponent("api") }

    private func post(_ path: String, json: [String: Any]) async throws -> [String: Any] {
        var req = URLRequest(url: base.appendingPathComponent(path))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: json)
        let (data, resp) = try await URLSession.shared.data(for: req)
        let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.message((obj["error"] as? String) ?? "Request failed")
        }
        return obj
    }

    // MARK: - Auth / onboarding

    func sendEmailCode(email: String) async throws {
        _ = try await post("send-email-code", json: ["email": email])
    }

    func verifyEmailCode(email: String, code: String) async throws {
        _ = try await post("verify-email-code", json: ["email": email, "code": code])
    }

    /// Returns the new user's id.
    func signup(_ payload: [String: Any]) async throws -> String {
        let obj = try await post("signup", json: payload)
        guard let id = obj["id"] as? String else { throw APIError.message("Sign up failed") }
        return id
    }

    /// Returns (id, name).
    func login(email: String, password: String) async throws -> (String, String) {
        let obj = try await post("login", json: ["email": email, "password": password])
        guard let id = obj["id"] as? String else { throw APIError.message("Login failed") }
        return (id, obj["name"] as? String ?? "")
    }

    func checkEmail(_ email: String) async throws -> Bool {
        var comps = URLComponents(url: base.appendingPathComponent("check-email"), resolvingAgainstBaseURL: false)!
        comps.queryItems = [URLQueryItem(name: "email", value: email)]
        let (data, _) = try await URLSession.shared.data(from: comps.url!)
        let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        return obj["exists"] as? Bool ?? false
    }

    // MARK: - Matches / dates

    /// Ask the backend to plan (or re-plan) the date for a match. Returns the raw card JSON.
    func planDate(matchId: String) async throws -> DateCard {
        let obj = try await post("plan-date", json: ["matchId": matchId])
        let data = try JSONSerialization.data(withJSONObject: obj)
        return try JSONDecoder().decode(DateCard.self, from: data)
    }

    func notifyMatch(matchId: String) async throws {
        _ = try? await post("notify-match", json: ["matchId": matchId])
    }

    func shareContact(matchId: String, fromUserId: String) async throws {
        _ = try await post("share-contact", json: ["matchId": matchId, "fromUserId": fromUserId])
    }

    // MARK: - Safety / account

    func report(reporterId: String, reportedId: String, reason: String) async throws {
        _ = try await post("report", json: ["reporter_id": reporterId, "reported_id": reportedId, "reason": reason])
    }

    func deleteAccount(userId: String) async throws {
        _ = try await post("delete-account", json: ["userId": userId])
    }

    // MARK: - Blind date

    func openBlindBox(requesterId: String) async throws -> [String: Any] {
        try await post("blind-date", json: ["requester_id": requesterId])
    }

    // MARK: - Avatar upload (multipart)

    func uploadAvatar(userId: String, imageData: Data, filename: String = "avatar.jpg", mime: String = "image/jpeg") async throws -> String {
        let boundary = "Boundary-\(UUID().uuidString)"
        var req = URLRequest(url: base.appendingPathComponent("upload-avatar"))
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        func field(_ name: String, _ value: String) {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }
        field("userId", userId)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mime)\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let (data, resp) = try await URLSession.shared.data(for: req)
        let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode), let url = obj["url"] as? String else {
            throw APIError.message((obj["error"] as? String) ?? "Upload failed")
        }
        return url
    }
}
