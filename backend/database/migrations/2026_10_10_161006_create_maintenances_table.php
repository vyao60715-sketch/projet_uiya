<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->cascadeOnDelete();
            $table->enum('type', ['preventive', 'corrective']);
            $table->enum('statut', ['planifiee', 'en_cours', 'terminee'])->default('planifiee');
            $table->date('date_prevue');
            $table->timestamp('date_realisee')->nullable();
            $table->foreignId('prestataire_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            $table->unsignedBigInteger('cout')->nullable();
            $table->text('pieces')->nullable();
            $table->text('resultat')->nullable();
            $table->boolean('sous_garantie')->default(false);
            $table->foreignId('demande_id')->nullable()->constrained('demandes')->nullOnDelete();
            $table->foreignId('cree_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['bien_id', 'statut']);
            $table->index('date_prevue');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenances');
    }
};
