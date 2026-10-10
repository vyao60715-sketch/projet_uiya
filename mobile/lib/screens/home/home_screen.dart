import 'package:flutter/material.dart';
import '../../api/api_client.dart';
import '../auth/login_screen.dart';
import '../scan/scan_screen.dart';
import '../inventaire/campagne_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _campagne;
  bool _loading = true;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _loadCampagne();
  }

  Future<void> _loadCampagne() async {
    try {
      final list = await ApiClient.getCampagnes(statut: 'en_cours');
      if (mounted) setState(() { _campagne = list.isNotEmpty ? list.first as Map<String, dynamic> : null; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await ApiClient.logout();
    if (!mounted) return;
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('UIYA Mobile'),
        actions: [
          IconButton(icon: const Icon(Icons.logout), tooltip: 'Déconnexion', onPressed: _logout),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _buildBody(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Accueil'),
          NavigationDestination(icon: Icon(Icons.qr_code_scanner_outlined), selectedIcon: Icon(Icons.qr_code_scanner), label: 'Scanner'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Inventaire'),
        ],
      ),
    );
  }

  Widget _buildBody() {
    return switch (_tab) {
      1 => ScanScreen(campagne: _campagne, onScanDone: _loadCampagne),
      2 => CampagneScreen(campagne: _campagne, onRefresh: _loadCampagne),
      _ => _buildAccueil(),
    };
  }

  Widget _buildAccueil() {
    final pct = _campagne != null ? (_campagne!['pct'] as num).toInt() : 0;

    return RefreshIndicator(
      onRefresh: _loadCampagne,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Campagne en cours
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: _campagne == null
                  ? const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Campagne d\'inventaire', style: TextStyle(fontSize: 13, color: Color(0xFF5A676B))),
                        SizedBox(height: 4),
                        Text('Aucune campagne en cours', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                        SizedBox(height: 4),
                        Text('Contactez le gestionnaire pour lancer une campagne.', style: TextStyle(fontSize: 13, color: Color(0xFF5A676B))),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Campagne en cours', style: TextStyle(fontSize: 13, color: Color(0xFF5A676B))),
                        const SizedBox(height: 4),
                        Text(_campagne!['nom'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${_campagne!['controles']} / ${_campagne!['total']} biens', style: const TextStyle(fontSize: 13)),
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
          const SizedBox(height: 16),

          // Bouton scan rapide
          ElevatedButton.icon(
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Scanner un bien'),
            onPressed: () => setState(() => _tab = 1),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            icon: const Icon(Icons.inventory_2_outlined),
            label: const Text('Voir la campagne'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              foregroundColor: const Color(0xFF0E5A6B),
              side: const BorderSide(color: Color(0xFF0E5A6B)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () => setState(() => _tab = 2),
          ),
        ],
      ),
    );
  }
}
