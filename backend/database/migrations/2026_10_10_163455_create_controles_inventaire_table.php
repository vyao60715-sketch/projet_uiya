<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('controles_inventaire', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campagne_id')->constrained('campagnes')->cascadeOnDelete();
            $table->foreignId('bien_id')->constrained('biens')->cascadeOnDelete();

            // Résultat du contrôle physique
            $table->enum('resultat', ['present', 'absent', 'deplace', 'deteriore'])->default('present');
            $table->string('salle_constatee')->nullable(); // salle où le bien a été trouvé (si déplacé)
            $table->text('remarque')->nullable();

            $table->foreignId('controle_par')->constrained('users')->restrictOnDelete();
            $table->timestamp('controle_le')->useCurrent();

            $table->timestamps();

            // Un bien ne peut être contrôlé qu'une fois par campagne
            $table->unique(['campagne_id', 'bien_id']);
            $table->index('campagne_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('controles_inventaire');
    }
};
