<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->cascadeOnDelete();
            $table->enum('type', ['transfert', 'panne', 'perte']);
            $table->text('motif')->nullable();
            $table->string('photo')->nullable();

            // Utilisés seulement pour le type "transfert" (service/salle demandés).
            $table->foreignId('service_destination_id')->nullable()->constrained('services')->nullOnDelete();
            $table->foreignId('salle_destination_id')->nullable()->constrained('salles')->nullOnDelete();

            $table->enum('statut', ['soumise', 'validee', 'rejetee'])->default('soumise');
            $table->text('decision_motif')->nullable();

            $table->foreignId('demandeur_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('traite_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('traite_le')->nullable();

            $table->timestamps();

            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes');
    }
};
