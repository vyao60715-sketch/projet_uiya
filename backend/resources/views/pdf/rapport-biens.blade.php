<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #222; }
  h1   { font-size: 16px; color: #0E5A6B; margin-bottom: 4px; }
  .sub { font-size: 10px; color: #888; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th   { background: #0E5A6B; color: #fff; padding: 6px 8px; text-align: left; font-size: 9px; }
  td   { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 9px; }
  tr:nth-child(even) td { background: #f8fafb; }
  .badge-disponible  { color: #065f46; }
  .badge-maintenance { color: #92400e; }
  .badge-perdu       { color: #991b1b; }
</style>
</head>
<body>
  <h1>UIYA – Rapport des biens</h1>
  <p class="sub">Exporté le {{ now()->format('d/m/Y à H:i') }} · {{ $biens->count() }} bien(s)</p>

  <table>
    <thead>
      <tr>
        <th>N° inventaire</th>
        <th>Désignation</th>
        <th>Catégorie</th>
        <th>Service</th>
        <th>Statut</th>
        <th>État</th>
        <th>Valeur (F)</th>
        <th>Acquisition</th>
        <th>Fin garantie</th>
      </tr>
    </thead>
    <tbody>
      @foreach($biens as $b)
      <tr>
        <td>{{ $b->numero_inventaire }}</td>
        <td>{{ $b->designation }}</td>
        <td>{{ $b->categorie?->nom ?? '—' }}</td>
        <td>{{ $b->service?->nom ?? '—' }}</td>
        <td>{{ $b->statut }}</td>
        <td>{{ $b->etat }}</td>
        <td>{{ $b->valeur_acquisition ? number_format($b->valeur_acquisition, 0, ',', ' ') : '—' }}</td>
        <td>{{ $b->date_acquisition?->format('d/m/Y') ?? '—' }}</td>
        <td>{{ $b->fin_garantie?->format('d/m/Y') ?? '—' }}</td>
      </tr>
      @endforeach
    </tbody>
  </table>
</body>
</html>
