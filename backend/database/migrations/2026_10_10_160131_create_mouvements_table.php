<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mouvements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->cascadeOnDelete();
            $table->enum('type', ['affectation', 'transfert', 'pret', 'retour']);
            $table->string('origine')->nullable();
            $table->string('destination')->nullable();
            $table->text('motif')->nullable();
            $table->foreignId('auteur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('date')->useCurrent();

            $table->index(['bien_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements');
    }
};
