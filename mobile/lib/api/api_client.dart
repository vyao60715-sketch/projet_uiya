import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const _storage = FlutterSecureStorage();
  static const _defaultBase = 'http://10.0.2.2:8000/api'; // Android emulator → localhost

  static Future<String> _baseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('server_url') ?? _defaultBase;
  }

  static Future<Map<String, String>> _headers() async {
    final token = await _storage.read(key: 'token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final base = await _baseUrl();
    final res = await http.post(
      Uri.parse('$base/login'),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) throw ApiException(body['message'] ?? 'Erreur de connexion');
    final data = body['data'] as Map<String, dynamic>;
    await _storage.write(key: 'token', value: data['token'] as String);
    return data['user'] as Map<String, dynamic>;
  }

  static Future<void> logout() async {
    try {
      final base = await _baseUrl();
      await http.post(Uri.parse('$base/logout'), headers: await _headers());
    } catch (_) {}
    await _storage.delete(key: 'token');
  }

  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'token');
    return token != null;
  }

  // ─── Campagnes ────────────────────────────────────────────────────────────

  static Future<List<dynamic>> getCampagnes({String? statut}) async {
    final base = await _baseUrl();
    final uri = Uri.parse('$base/inventaires').replace(
      queryParameters: statut != null ? {'statut': statut} : null,
    );
    final res = await http.get(uri, headers: await _headers());
    _check(res);
    return (jsonDecode(res.body)['data'] as List);
  }

  static Future<Map<String, dynamic>> getRapport(int campagneId) async {
    final base = await _baseUrl();
    final res = await http.get(
      Uri.parse('$base/inventaires/$campagneId/rapport'),
      headers: await _headers(),
    );
    _check(res);
    return jsonDecode(res.body)['data'] as Map<String, dynamic>;
  }

  static Future<List<dynamic>> syncControles(
      int campagneId, List<Map<String, dynamic>> controles) async {
    final base = await _baseUrl();
    final res = await http.post(
      Uri.parse('$base/inventaires/$campagneId/sync'),
      headers: await _headers(),
      body: jsonEncode({'controles': controles}),
    );
    _check(res);
    return jsonDecode(res.body)['data'] as List;
  }

  // ─── Biens ────────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> getBienByUuid(String uuid) async {
    final base = await _baseUrl();
    final res = await http.get(
      Uri.parse('$base/biens/qr/$uuid'),
      headers: await _headers(),
    );
    _check(res);
    return jsonDecode(res.body)['data'] as Map<String, dynamic>;
  }

  // ─── Demandes ─────────────────────────────────────────────────────────────

  static Future<void> creerDemande(Map<String, dynamic> data) async {
    final base = await _baseUrl();
    final res = await http.post(
      Uri.parse('$base/demandes'),
      headers: await _headers(),
      body: jsonEncode(data),
    );
    _check(res);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  static void _check(http.Response res) {
    if (res.statusCode >= 400) {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      throw ApiException(body['message'] ?? 'Erreur ${res.statusCode}');
    }
  }
}

class ApiException implements Exception {
  final String message;
  const ApiException(this.message);
  @override
  String toString() => message;
}
