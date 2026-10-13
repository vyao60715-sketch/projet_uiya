<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biens', function (Blueprint $table) {
            $table->id();
            $table->string('numero_inventaire')->unique();
            $table->uuid('uuid_qr')->unique();
            $table->string('designation');
            $table->foreignId('categorie_id')->constrained('categories')->restrictOnDelete();
            $table->string('marque')->nullable();
            $table->string('modele')->nullable();
            $table->string('numero_serie')->nullable();
            $table->foreignId('fournisseur_id')->nullable()->constrained('fournisseurs')->nullOnDelete();
            $table->date('date_acquisition');
            $table->unsignedBigInteger('prix')->nullable();
            $table->enum('etat', ['Neuf', 'Bon', 'Moyen', 'Dégradé', 'Hors service'])->default('Neuf');
            $table->enum('statut', ['Disponible', 'Affecté', 'En prêt', 'En maintenance', 'Perdu', 'Réformé'])->default('Disponible');
            $table->unsignedInteger('duree_garantie_mois')->default(0);
            $table->date('fin_garantie')->nullable();
            $table->date('prochaine_maintenance')->nullable();
            $table->string('photo')->nullable();
            $table->text('observations')->nullable();
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->unsignedBigInteger('valeur_acquisition')->nullable();
            $table->foreignId('cree_par')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('statut');
            $table->index('designation');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biens');
    }
};
