import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../api/api_client.dart';
import '../../db/local_db.dart';
import '../bien/bien_screen.dart';

class ScanScreen extends StatefulWidget {
  final Map<String, dynamic>? campagne;
  final VoidCallback? onScanDone;

  const ScanScreen({super.key, this.campagne, this.onScanDone});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final _controller = MobileScannerController();
  bool _scanning = true;
  bool _processing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (!_scanning || _processing) return;
    final code = capture.barcodes.firstOrNull?.rawValue;
    if (code == null) return;

    // Extraire l'UUID : format attendu http://…/biens/scan/{uuid}
    final uri = Uri.tryParse(code);
    final uuid = uri?.pathSegments.lastOrNull ?? code;

    setState(() { _scanning = false; _processing = true; });

    try {
      Map<String, dynamic>? bien;
      try {
        bien = await ApiClient.getBienByUuid(uuid);
        await LocalDb.cacheBien(bien); // mise en cache
      } on ApiException {
        // Hors-ligne : chercher dans le cache local
        bien = await LocalDb.getBienByUuid(uuid);
      }

      if (!mounted) return;

      if (bien == null) {
        _showError('Bien non reconnu (UUID : $uuid)');
        return;
      }

      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => BienScreen(
            bien: bien!,
            campagne: widget.campagne,
            onControle: widget.onScanDone,
          ),
        ),
      );
    } catch (e) {
      if (mounted) _showError(e.toString());
    } finally {
      if (mounted) setState(() { _scanning = true; _processing = false; });
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red.shade700),
    );
    setState(() { _scanning = true; _processing = false; });
  }

  void _saisieManuelle() async {
    final ctrl = TextEditingController();
    final num = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Saisie manuelle'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(labelText: 'N° inventaire ou UUID'),
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Valider')),
        ],
      ),
    );
    if (num == null || num.isEmpty) return;
    // Traiter comme un UUID direct
    if (mounted) _onDetect(BarcodeCapture(barcodes: [Barcode(rawValue: num)]));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scanner un QR code'),
        actions: [
          IconButton(
            icon: const Icon(Icons.keyboard_outlined),
            tooltip: 'Saisie manuelle',
            onPressed: _saisieManuelle,
          ),
          IconButton(
            icon: const Icon(Icons.flash_on_outlined),
            tooltip: 'Torche',
            onPressed: () => _controller.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          // Viseur central
          Center(
            child: Container(
              width: 240,
              height: 240,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 2),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          if (_processing)
            Container(
              color: Colors.black45,
              child: const Center(child: CircularProgressIndicator(color: Colors.white)),
            ),
          Positioned(
            bottom: 32,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                widget.campagne != null
                    ? 'Campagne : ${widget.campagne!['nom']}'
                    : 'Aucune campagne active — mode consultation',
                style: const TextStyle(color: Colors.white, fontSize: 13, shadows: [Shadow(blurRadius: 4)]),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
