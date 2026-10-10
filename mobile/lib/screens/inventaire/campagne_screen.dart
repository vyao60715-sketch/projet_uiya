import 'package:flutter/material.dart';
import '../../api/api_client.dart';
import '../../db/local_db.dart';

class CampagneScreen extends StatefulWidget {
  final Map<String, dynamic>? campagne;
  final VoidCallback? onRefresh;

  const CampagneScreen({super.key, this.campagne, this.onRefresh});

  @override
  State<CampagneScreen> createState() => _CampagneScreenState();
}

class _CampagneScreenState extends State<CampagneScreen> {
  Map<String, dynamic>? _rapport;
  int _pending = 0;
  bool _loading = true;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (widget.campagne == null) { setState(() => _loading = false); return; }
    setState(() => _loading = true);
    try {
      final id = widget.campagne!['id'] as int;
      final results = await Future.wait([
        ApiClient.getRapport(id),
        LocalDb.countPending(id),
      ]);
      if (mounted) {
        setState(() {
          _rapport = results[0] as Map<String, dynamic>;
          _pending = results[1] as int;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _sync() async {
    if (widget.campagne == null) return;
    setState(() => _syncing = true);
    final id = widget.campagne!['id'] as int;
    try {
      final pending = await LocalDb.getPending(id);
      if (pending.isEmpty) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Rien à synchroniser.')));
        return;
      }
      final controles = pending.map((r) => {
        'uuid_qr':        r['uuid_qr'],
        'bien_id':        r['bien_id'],
        'resultat':       r['resultat'],
        'salle_constatee': r['salle_constatee'],
        'remarque':       r['remarque'],
        'controle_le':    r['controle_le'],
      }).toList();

      await ApiClient.syncControles(id, controles);
      await LocalDb.marquerSynced(pending.map((r) => r['id'] as int).toList());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${controles.length} contrôle(s) synchronisé(s).'), backgroundColor: const Color(0xFF0E5A6B)),
        );
        widget.onRefresh?.call();
        _load();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message), backgroundColor: Colors.red.shade700));
      }
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.campagne == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.inventory_2_outlined, size: 56, color: Color(0xFF5A676B)),
              SizedBox(height: 16),
              Text('Aucune campagne en cours', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              SizedBox(height: 8),
              Text('Contactez le gestionnaire pour lancer une campagne d\'inventaire.',
                  textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Color(0xFF5A676B))),
            ],
          ),
        ),
      );
    }

    final c = widget.campagne!;
    final pct = (c['pct'] as num).toInt();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // En-tête campagne
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(c['nom'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  if (c['service'] != null) ...[
                    const SizedBox(height: 4),
                    Text('Périmètre : ${c['service']}', style: const TextStyle(fontSize: 13, color: Color(0xFF5A676B))),
                  ],
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${c['controles']} / ${c['total']} biens', style: const TextStyle(fontSize: 13)),
                      Text('$pct %', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: pct / 100,
                      minHeight: 10,
                      backgroundColor: const Color(0xFFECEEEA),
                      valueColor: const AlwaysStoppedAnimation(Color(0xFF0E5A6B)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Sync hors-ligne
          if (_pending > 0)
            Card(
              color: Colors.orange.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(Icons.cloud_upload_outlined, color: Colors.orange),
                    const SizedBox(width: 12),
                    Expanded(child: Text('$_pending contrôle(s) en attente de synchronisation.')),
                    ElevatedButton(
                      onPressed: _syncing ? null : _sync,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                      child: _syncing ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Sync'),
                    ),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 12),

          // Rapport d'écarts
          if (_loading)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
          else if (_rapport != null) ...[
            Row(
              children: [
                _kpi('Absents',   '${_rapport!['nb_absents']}',    Colors.red),
                const SizedBox(width: 12),
                _kpi('Déplacés',  '${_rapport!['nb_deplaces']}',   Colors.orange),
                const SizedBox(width: 12),
                _kpi('Détériorés','${_rapport!['nb_deteriores']}', Colors.orange),
              ],
            ),
            const SizedBox(height: 16),
            const Text('Écarts', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...(_rapport!['ecarts'] as List).where((e) => (e as Map)['resultat'] != 'present').map((e) {
              final ec = e as Map<String, dynamic>;
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(ec['designation'] ?? '—'),
                  subtitle: Text(ec['numero_inventaire'] ?? '', style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
                  trailing: _badge(ec['resultat'] as String),
                ),
              );
            }),
            if ((_rapport!['ecarts'] as List).where((e) => (e as Map)['resultat'] != 'present').isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Aucun écart constaté.', style: TextStyle(color: Color(0xFF5A676B))),
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _kpi(String label, String value, Color color) => Expanded(
    child: Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: color)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF5A676B))),
          ],
        ),
      ),
    ),
  );

  Widget _badge(String resultat) {
    final map = {
      'absent':     (Colors.red,    'Absent'),
      'deplace':    (Colors.orange, 'Déplacé'),
      'deteriore':  (Colors.orange, 'Détérioré'),
      'non_controle': (Colors.grey, 'Non contrôlé'),
    };
    final info = map[resultat] ?? (Colors.green, resultat);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: info.$1.withValues(alpha: .15), borderRadius: BorderRadius.circular(999)),
      child: Text(info.$2, style: TextStyle(fontSize: 12, color: info.$1, fontWeight: FontWeight.w500)),
    );
  }
}
