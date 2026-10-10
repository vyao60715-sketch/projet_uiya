<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('service_id')->nullable()->after('id')->constrained('services')->nullOnDelete();
            $table->boolean('actif')->default(true)->after('password');
            $table->unsignedTinyInteger('tentatives_echouees')->default(0)->after('actif');
            $table->timestamp('bloque_jusqu_a')->nullable()->after('tentatives_echouees');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('service_id');
            $table->dropColumn(['actif', 'tentatives_echouees', 'bloque_jusqu_a']);
        });
    }
};
