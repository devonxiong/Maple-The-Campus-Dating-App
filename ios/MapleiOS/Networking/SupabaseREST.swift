import Foundation

enum APIError: LocalizedError {
    case http(Int, String)
    case decoding(String)
    case message(String)

    var errorDescription: String? {
        switch self {
        case .http(let code, let body): return "HTTP \(code): \(body)"
        case .decoding(let s): return "Decoding failed: \(s)"
        case .message(let s): return s
        }
    }
}

/// Thin PostgREST client for reading/writing Supabase tables directly from the app.
/// Reads and writes are governed by the tables' Row-Level Security policies.
struct SupabaseREST {
    static let shared = SupabaseREST()

    private var restBase: URL { AppConfig.supabaseURL.appendingPathComponent("rest/v1") }
    private var anonKey: String { AppConfig.supabaseAnonKey }

    private var jsonDecoder: JSONDecoder { JSONDecoder() }

    private func request(_ path: String, query: [URLQueryItem] = []) -> URLRequest {
        var comps = URLComponents(url: restBase.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { comps.queryItems = query }
        var req = URLRequest(url: comps.url!)
        req.setValue(anonKey, forHTTPHeaderField: "apikey")
        req.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return req
    }

    private func run(_ req: URLRequest) async throws -> Data {
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw APIError.message("No response") }
        guard (200..<300).contains(http.statusCode) else {
            throw APIError.http(http.statusCode, String(data: data, encoding: .utf8) ?? "")
        }
        return data
    }

    // MARK: - Reads

    /// Generic select. `filters` are PostgREST query items, e.g. `eq.<value>`.
    func select<T: Decodable>(
        _ table: String,
        columns: String = "*",
        filters: [URLQueryItem] = [],
        order: String? = nil,
        limit: Int? = nil,
        as type: T.Type
    ) async throws -> T {
        var query = [URLQueryItem(name: "select", value: columns)] + filters
        if let order { query.append(URLQueryItem(name: "order", value: order)) }
        if let limit { query.append(URLQueryItem(name: "limit", value: String(limit))) }
        let data = try await run(request(table, query: query))
        do { return try jsonDecoder.decode(T.self, from: data) }
        catch { throw APIError.decoding("\(error) — \(String(data: data, encoding: .utf8) ?? "")") }
    }

    // MARK: - Writes

    /// Insert one row and return the inserted rows.
    @discardableResult
    func insert<T: Decodable>(_ table: String, body: [String: Any], returning type: T.Type) async throws -> T {
        var req = request(table)
        req.httpMethod = "POST"
        req.setValue("return=representation", forHTTPHeaderField: "Prefer")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let data = try await run(req)
        return try jsonDecoder.decode(T.self, from: data)
    }

    /// Upsert (on conflict) — used for swipes.
    func upsert(_ table: String, body: [String: Any], onConflict: String) async throws {
        var req = request(table, query: [URLQueryItem(name: "on_conflict", value: onConflict)])
        req.httpMethod = "POST"
        req.setValue("resolution=merge-duplicates,return=minimal", forHTTPHeaderField: "Prefer")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        _ = try await run(req)
    }

    /// Update rows matching filters.
    func update(_ table: String, body: [String: Any], filters: [URLQueryItem]) async throws {
        var req = request(table, query: filters)
        req.httpMethod = "PATCH"
        req.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        _ = try await run(req)
    }
}
