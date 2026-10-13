<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $svc = Service::firstOrCreate(
            ['code' => 'DSI'],
            ['nom' => 'Direction des Systèmes d\'Information']
        );

        $comptes = [
            ['name' => 'Marie Koné',   'email' => 'gestionnaire@uiya.ci', 'role' => 'gestionnaire'],
            ['name' => 'Paul Diabaté', 'email' => 'responsable@uiya.ci',  'role' => 'responsable'],
            ['name' => 'Awa Traoré',   'email' => 'agent@uiya.ci',        'role' => 'agent'],
        ];

        foreach ($comptes as $c) {
            $user = User::firstOrCreate(
                ['email' => $c['email']],
                [
                    'name'       => $c['name'],
                    'password'   => Hash::make('Test@2026'),
                    'actif'      => true,
                    'service_id' => $svc->id,
                ]
            );
            $user->syncRoles([$c['role']]);
            $this->command->info($c['email'] . ' → ' . $c['role']);
        }
    }
}
