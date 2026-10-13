import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../api/api_client.dart';
import '../home/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form         = GlobalKey<FormState>();
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ApiClient.login(_emailCtrl.text.trim(), _passwordCtrl.text);
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomeScreen()));
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Impossible de joindre le serveur. Vérifiez l\'URL dans ⚙️ Paramètres.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _ouvrirParametres() async {
    final prefs = await SharedPreferences.getInstance();
    final current = prefs.getString('server_url') ?? ApiClient.defaultBase;
    if (!mounted) return;

    final ctrl = TextEditingController(text: current);
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('URL du serveur'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: ctrl,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                labelText: 'URL',
                hintText: 'http://192.168.x.x:8000/api',
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Émulateur Android : http://10.0.2.2:8000/api\n'
              'Téléphone (Wi-Fi) : http://IP_DU_PC:8000/api',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () async {
              final url = ctrl.text.trim();
              if (url.isNotEmpty) {
                await prefs.setString('server_url', url);
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0E5A6B),
      body: SafeArea(
        child: Stack(
          children: [
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const Icon(Icons.inventory_2_outlined, size: 56, color: Colors.white),
                    const SizedBox(height: 12),
                    const Text('UIYA', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 4)),
                    const SizedBox(height: 4),
                    const Text('Connexion', style: TextStyle(fontSize: 14, color: Colors.white70)),
                    const SizedBox(height: 32),
                    Card(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Form(
                          key: _form,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              TextFormField(
                                controller: _emailCtrl,
                                keyboardType: TextInputType.emailAddress,
                                decoration: const InputDecoration(labelText: 'Adresse e-mail', prefixIcon: Icon(Icons.email_outlined)),
                                validator: (v) => (v == null || !v.contains('@')) ? 'E-mail invalide' : null,
                              ),
                              const SizedBox(height: 16),
                              TextFormField(
                                controller: _passwordCtrl,
                                obscureText: _obscure,
                                decoration: InputDecoration(
                                  labelText: 'Mot de passe',
                                  prefixIcon: const Icon(Icons.lock_outline),
                                  suffixIcon: IconButton(
                                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                                    onPressed: () => setState(() => _obscure = !_obscure),
                                  ),
                                ),
                                validator: (v) => (v == null || v.isEmpty) ? 'Mot de passe requis' : null,
                              ),
                              if (_error != null) ...[
                                const SizedBox(height: 14),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
                                  child: Text(_error!, style: const TextStyle(color: Color(0xFFA23B2A), fontSize: 13)),
                                ),
                              ],
                              const SizedBox(height: 24),
                              ElevatedButton(
                                onPressed: _loading ? null : _login,
                                child: _loading
                                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                    : const Text('Se connecter'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bouton paramètres serveur
            Positioned(
              top: 8,
              right: 8,
              child: IconButton(
                icon: const Icon(Icons.settings_outlined, color: Colors.white70),
                tooltip: 'Paramètres serveur',
                onPressed: _ouvrirParametres,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
