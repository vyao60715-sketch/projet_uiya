<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campagnes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->enum('statut', ['en_cours', 'cloturee'])->default('en_cours');

            $table->date('date_debut');
            $table->date('date_fin_prevue')->nullable();
            $table->date('date_cloture')->nullable();

            // Périmètre optionnel : si vide = tous les biens
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();

            $table->foreignId('cree_par')->constrained('users')->restrictOnDelete();

            // Compteurs snapshottés à la clôture
            $table->unsignedInteger('nb_biens_attendus')->default(0);
            $table->unsignedInteger('nb_controles')->default(0);

            $table->timestamps();

            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campagnes');
    }
};
