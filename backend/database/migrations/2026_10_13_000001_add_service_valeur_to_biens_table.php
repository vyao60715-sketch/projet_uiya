<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('biens', function (Blueprint $table) {
            if (! Schema::hasColumn('biens', 'service_id')) {
                $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete()->after('observations');
            }
            if (! Schema::hasColumn('biens', 'valeur_acquisition')) {
                $table->unsignedBigInteger('valeur_acquisition')->nullable()->after('prix');
            }
        });
    }

    public function down(): void
    {
        Schema::table('biens', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Service::class);
            $table->dropColumn(['service_id', 'valeur_acquisition']);
        });
    }
};
