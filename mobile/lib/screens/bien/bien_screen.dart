import 'package:flutter/material.dart';
import '../../api/api_client.dart';
import '../../db/local_db.dart';

class BienScreen extends StatefulWidget {
  final Map<String, dynamic> bien;
  final Map<String, dynamic>? campagne;
  final VoidCallback? onControle;

  const BienScreen({super.key, required this.bien, this.campagne, this.onControle});

  @override
  State<BienScreen> createState() => _BienScreenState();
}

class _BienScreenState extends State<BienScreen> {
  String _resultat = 'present';
  final _salleCtrl  = TextEditingController();
  final _remarqueCtrl = TextEditingController();
  bool _saving = false;
  bool _controleEnregistre = false;

  @override
  void dispose() {
    _salleCtrl.dispose();
    _remarqueCtrl.dispose();
    super.dispose();
  }

  Future<void> _enregistrerControle() async {
    if (widget.campagne == null) return;
    setState(() => _saving = true);

    final controle = {
      'uuid_qr':        widget.bien['uuid_qr'],
      'resultat':       _resultat,
      'salle_constatee': _salleCtrl.text.trim().isEmpty ? null : _salleCtrl.text.trim(),
      'remarque':       _remarqueCtrl.text.trim().isEmpty ? null : _remarqueCtrl.text.trim(),
    };

    try {
      // Essayer d'envoyer en ligne
      await ApiClient.syncControles(widget.campagne!['id'] as int, [controle]);
      if (mounted) {
        setState(() => _controleEnregistre = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contrôle enregistré.'), backgroundColor: Color(0xFF0E5A6B)),
        );
        widget.onControle?.call();
      }
    } on ApiException {
      // Hors-ligne : stocker localement
      await LocalDb.ajouterControle(
        campagneId:    widget.campagne!['id'] as int,
        uuidQr:        widget.bien['uuid_qr'] as String?,
        resultat:      _resultat,
        salleConstatee: controle['salle_constatee'] as String?,
        remarque:      controle['remarque'] as String?,
      );
      if (mounted) {
        setState(() => _controleEnregistre = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Hors-ligne — contrôle sauvegardé localement.'), backgroundColor: Colors.orange),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _signalerPanne() async {
    final ctrl = TextEditingController();
    final motif = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Signaler une panne'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(labelText: 'Description du problème'),
          maxLines: 3,
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Envoyer')),
        ],
      ),
    );
    if (motif == null || motif.isEmpty) return;
    try {
      await ApiClient.creerDemande({
        'bien_id': widget.bien['id'],
        'type':    'panne',
        'motif':   motif,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Signalement envoyé.'), backgroundColor: Color(0xFF0E5A6B)),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.red.shade700),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.bien;
    final hasCampagne = widget.campagne != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(b['numero_inventaire'] ?? 'Bien'),
        actions: [
          IconButton(
            icon: const Icon(Icons.report_problem_outlined),
            tooltip: 'Signaler une panne',
            onPressed: _signalerPanne,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Fiche bien
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(b['designation'] ?? '—', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(b['numero_inventaire'] ?? '', style: const TextStyle(fontFamily: 'monospace', fontSize: 13, color: Color(0xFF5A676B))),
                    const Divider(height: 24),
                    _row('Statut',    b['statut'] ?? '—'),
                    _row('État',      b['etat']   ?? '—'),
                    _row('Catégorie', b['categorie']?['nom'] ?? '—'),
                    if (b['affectation_actuelle'] != null) ...[
                      _row('Service', b['affectation_actuelle']?['service']?['nom'] ?? '—'),
                      _row('Salle',   b['affectation_actuelle']?['salle']?['nom']   ?? '—'),
                    ],
                    if (b['fin_garantie'] != null)
                      _row('Fin de garantie', b['fin_garantie']),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Formulaire contrôle inventaire
            if (hasCampagne && !_controleEnregistre) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Contrôle inventaire', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 14),
                      const Text('Résultat', style: TextStyle(fontSize: 12, color: Color(0xFF5A676B))),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: [
                          for (final e in [
                            ('present',   'Présent',   Colors.green),
                            ('absent',    'Absent',    Colors.red),
                            ('deplace',   'Déplacé',   Colors.orange),
                            ('deteriore', 'Détérioré', Colors.orange),
                          ])
                            ChoiceChip(
                              label: Text(e.$2),
                              selected: _resultat == e.$1,
                              selectedColor: e.$3.shade100,
                              onSelected: (_) => setState(() => _resultat = e.$1),
                            ),
                        ],
                      ),
                      if (_resultat == 'deplace') ...[
                        const SizedBox(height: 12),
                        TextField(
                          controller: _salleCtrl,
                          decoration: const InputDecoration(labelText: 'Salle où il se trouve'),
                        ),
                      ],
                      const SizedBox(height: 12),
                      TextField(
                        controller: _remarqueCtrl,
                        decoration: const InputDecoration(labelText: 'Remarque (optionnel)'),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.check),
                        label: const Text('Enregistrer le contrôle'),
                        onPressed: _saving ? null : _enregistrerControle,
                      ),
                    ],
                  ),
                ),
              ),
            ],

            if (_controleEnregistre)
              Card(
                color: Colors.green.shade50,
                child: const Padding(
                  padding: EdgeInsets.all(18),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green),
                      SizedBox(width: 12),
                      Text('Contrôle enregistré', style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 16),
            OutlinedButton.icon(
              icon: const Icon(Icons.report_problem_outlined),
              label: const Text('Signaler une panne'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
                foregroundColor: const Color(0xFFA23B2A),
                side: const BorderSide(color: Color(0xFFE0B4AA)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _signalerPanne,
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 120, child: Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF5A676B)))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
      ],
    ),
  );
}
