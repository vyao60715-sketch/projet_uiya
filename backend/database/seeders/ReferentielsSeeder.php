<?php

namespace Database\Seeders;

use App\Models\Batiment;
use App\Models\Categorie;
use App\Models\Fournisseur;
use App\Models\Salle;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ReferentielsSeeder extends Seeder
{
    public function run(): void
    {
        Service::firstOrCreate(['code' => 'DSI'], ['nom' => 'Direction des systèmes d\'information']);
        Service::firstOrCreate(['code' => 'DAF'], ['nom' => 'Direction administrative et financière']);
        Service::firstOrCreate(['code' => 'SCOL'], ['nom' => 'Scolarité']);

        $batimentA = Batiment::firstOrCreate(['code' => 'BAT-A'], ['nom' => 'Bâtiment A']);
        $batimentB = Batiment::firstOrCreate(['code' => 'BAT-B'], ['nom' => 'Bâtiment B']);

        Salle::firstOrCreate(['code' => 'A-101'], ['nom' => 'Salle A-101', 'batiment_id' => $batimentA->id]);
        Salle::firstOrCreate(['code' => 'A-102'], ['nom' => 'Salle A-102', 'batiment_id' => $batimentA->id]);
        Salle::firstOrCreate(['code' => 'B-201'], ['nom' => 'Salle B-201', 'batiment_id' => $batimentB->id]);

        Categorie::firstOrCreate(['nom' => 'Informatique'], ['duree_garantie_mois' => 24, 'periodicite_maintenance_mois' => 12]);
        Categorie::firstOrCreate(['nom' => 'Mobilier'], ['duree_garantie_mois' => 0, 'periodicite_maintenance_mois' => 0]);
        Categorie::firstOrCreate(['nom' => 'Climatisation'], ['duree_garantie_mois' => 12, 'periodicite_maintenance_mois' => 6]);

        Fournisseur::firstOrCreate(['nom' => 'Bureau Plus CI'], ['contact' => 'contact@bureauplus.ci', 'type' => 'fournisseur']);
        Fournisseur::firstOrCreate(['nom' => 'ClimTech Services'], ['contact' => 'contact@climtech.ci', 'type' => 'prestataire']);
    }
}
