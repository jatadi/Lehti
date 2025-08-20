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
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['spike', 'post_treatment', 'co_occurrence']);
            $table->tinyInteger('severity')->unsigned()->comment('1-5 scale for alert importance');
            $table->string('summary');
            $table->json('details');
            $table->datetime('generated_at');
            $table->datetime('resolved_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'generated_at']);
            $table->index(['user_id', 'type', 'resolved_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
