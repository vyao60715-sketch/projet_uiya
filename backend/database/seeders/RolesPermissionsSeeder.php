<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'gerer_utilisateurs',
            'gerer_referentiels',
            'gerer_biens',
            'consulter_biens',
            'gerer_affectations',
            'gerer_demandes',
            'creer_demandes',
            'gerer_maintenances',
            'gerer_inventaires',
            'realiser_inventaires',
            'consulter_rapports',
            'consulter_audit',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        $admin = Role::findOrCreate('admin');
        $admin->syncPermissions(Permission::all());

        $gestionnaire = Role::findOrCreate('gestionnaire');
        $gestionnaire->syncPermissions([
            'gerer_referentiels',
            'gerer_biens',
            'consulter_biens',
            'gerer_affectations',
            'gerer_demandes',
            'gerer_maintenances',
            'gerer_inventaires',
            'consulter_rapports',
            'consulter_audit',
        ]);

        $responsable = Role::findOrCreate('responsable');
        $responsable->syncPermissions([
            'consulter_biens',
            'creer_demandes',
        ]);

        $agent = Role::findOrCreate('agent');
        $agent->syncPermissions([
            'consulter_biens',
            'realiser_inventaires',
        ]);
    }
}
