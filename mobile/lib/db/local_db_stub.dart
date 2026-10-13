/// Stub LocalDb pour la plateforme web (SQLite non disponible sur navigateur).
/// Toutes les opérations retournent des valeurs vides — le mode hors-ligne
/// est une fonctionnalité mobile uniquement.
class LocalDb {
  static Future<void> cacheBien(Map<String, dynamic> bien) async {}

  static Future<Map<String, dynamic>?> getBienByUuid(String uuid) async => null;

  static Future<void> ajouterControle({
    required int campagneId,
    String? uuidQr,
    int? bienId,
    required String resultat,
    String? salleConstatee,
    String? remarque,
  }) async {}

  static Future<List<Map<String, dynamic>>> getPending(int campagneId) async => [];

  static Future<void> marquerSynced(List<int> ids) async {}

  static Future<int> countPending(int campagneId) async => 0;
}
