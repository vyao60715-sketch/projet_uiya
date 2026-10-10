<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Alertes quotidiennes : garanties J-30, maintenances J-15, prêts J-1/J/retard
Schedule::command('uiya:alertes')->dailyAt('07:00');
