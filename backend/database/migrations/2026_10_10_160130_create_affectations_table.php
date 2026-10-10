<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affectations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->restrictOnDelete();
            $table->foreignId('salle_id')->nullable()->constrained('salles')->nullOnDelete();
            $table->foreignId('responsable_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['permanente', 'pret'])->default('permanente');
            $table->timestamp('date_debut')->useCurrent();
            $table->date('date_retour_prevue')->nullable();
            $table->timestamp('date_retour_effective')->nullable();
            $table->timestamps();

            $table->index(['bien_id', 'date_retour_effective']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affectations');
    }
};
