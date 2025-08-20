<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('symptom_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('symptom', ['fatigue', 'pain', 'nausea', 'headache', 'mood', 'sleep_quality', 'appetite', 'energy']);
            $table->tinyInteger('severity')->unsigned()->comment('0-10 scale');
            $table->text('notes')->nullable();
            $table->datetime('occurred_at');
            $table->timestamps();
            
            $table->index(['user_id', 'occurred_at']);
            $table->index(['user_id', 'symptom', 'occurred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('symptom_logs');
    }
};
