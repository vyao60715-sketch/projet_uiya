import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

/// Base SQLite locale pour le mode hors-ligne.
/// Stocke les contrôles en attente de synchronisation.
class LocalDb {
  static Database? _db;

  static Future<Database> get db async {
    _db ??= await _open();
    return _db!;
  }

  static Future<Database> _open() async {
    final path = join(await getDatabasesPath(), 'uiya_offline.db');
    return openDatabase(
      path,
      version: 1,
      onCreate: (db, _) async {
        // Biens mis en cache localement (fiche hors-ligne)
        await db.execute('''
          CREATE TABLE biens_cache (
            id INTEGER PRIMARY KEY,
            uuid_qr TEXT UNIQUE,
            designation TEXT,
            numero_inventaire TEXT,
            statut TEXT,
            etat TEXT,
            data_json TEXT,
            cached_at INTEGER
          )
        ''');

        // Contrôles en attente de sync
        await db.execute('''
          CREATE TABLE controles_pending (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campagne_id INTEGER NOT NULL,
            uuid_qr TEXT,
            bien_id INTEGER,
            resultat TEXT NOT NULL,
            salle_constatee TEXT,
            remarque TEXT,
            controle_le TEXT,
            synced INTEGER DEFAULT 0
          )
        ''');
      },
    );
  }

  // ─── Cache biens ──────────────────────────────────────────────────────────

  static Future<void> cacheBien(Map<String, dynamic> bien) async {
    final d = await db;
    await d.insert(
      'biens_cache',
      {
        'id': bien['id'],
        'uuid_qr': bien['uuid_qr'],
        'designation': bien['designation'],
        'numero_inventaire': bien['numero_inventaire'],
        'statut': bien['statut'],
        'etat': bien['etat'],
        'data_json': jsonEncode(bien),
        'cached_at': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  static Future<Map<String, dynamic>?> getBienByUuid(String uuid) async {
    final d = await db;
    final rows = await d.query('biens_cache', where: 'uuid_qr = ?', whereArgs: [uuid]);
    if (rows.isEmpty) return null;
    return jsonDecode(rows.first['data_json'] as String) as Map<String, dynamic>;
  }

  // ─── Contrôles hors-ligne ─────────────────────────────────────────────────

  static Future<void> ajouterControle({
    required int campagneId,
    String? uuidQr,
    int? bienId,
    required String resultat,
    String? salleConstatee,
    String? remarque,
  }) async {
    final d = await db;
    await d.insert('controles_pending', {
      'campagne_id': campagneId,
      'uuid_qr': uuidQr,
      'bien_id': bienId,
      'resultat': resultat,
      'salle_constatee': salleConstatee,
      'remarque': remarque,
      'controle_le': DateTime.now().toIso8601String(),
      'synced': 0,
    });
  }

  static Future<List<Map<String, dynamic>>> getPending(int campagneId) async {
    final d = await db;
    return d.query(
      'controles_pending',
      where: 'campagne_id = ? AND synced = 0',
      whereArgs: [campagneId],
    );
  }

  static Future<void> marquerSynced(List<int> ids) async {
    if (ids.isEmpty) return;
    final d = await db;
    await d.update(
      'controles_pending',
      {'synced': 1},
      where: 'id IN (${ids.map((_) => '?').join(',')})',
      whereArgs: ids,
    );
  }

  static Future<int> countPending(int campagneId) async {
    final d = await db;
    final r = await d.rawQuery(
      'SELECT COUNT(*) as c FROM controles_pending WHERE campagne_id = ? AND synced = 0',
      [campagneId],
    );
    return Sqflite.firstIntValue(r) ?? 0;
  }
}
