<?php

namespace App\Exports;

use App\Models\Bien;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BiensExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    public function __construct(private array $filters = []) {}

    public function collection()
    {
        return Bien::with(['categorie', 'service'])
            ->when($this->filters['service_id'] ?? null, fn ($q, $v) => $q->where('service_id', $v))
            ->when($this->filters['statut']     ?? null, fn ($q, $v) => $q->where('statut', $v))
            ->orderBy('numero_inventaire')
            ->get();
    }

    public function headings(): array
    {
        return ['N° inventaire', 'Désignation', 'Catégorie', 'Service', 'Statut', 'État', 'Valeur (F)', 'Acquisition', 'Fin garantie', 'Sous garantie'];
    }

    public function map($bien): array
    {
        return [
            $bien->numero_inventaire,
            $bien->designation,
            $bien->categorie?->nom,
            $bien->service?->nom,
            $bien->statut,
            $bien->etat,
            $bien->valeur_acquisition,
            $bien->date_acquisition?->format('d/m/Y'),
            $bien->fin_garantie?->format('d/m/Y'),
            $bien->sous_garantie ? 'Oui' : 'Non',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '0E5A6B']]],
        ];
    }
}
