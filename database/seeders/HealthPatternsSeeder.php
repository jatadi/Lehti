<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\SymptomLog;
use App\Models\Treatment;
use App\Models\Alert;
use Carbon\Carbon;

class HealthPatternsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🌱 Populating health data for pattern analysis...');

        // Get or create demo user
        $user = User::firstOrCreate(
            ['email' => 'demo@folia.com'],
            [
                'name' => 'Demo User',
                'password' => bcrypt('password123'),
            ]
        );

        $this->command->info("👤 Using user: {$user->email}");

        // Clear existing data for this user
        $this->command->info('🧹 Clearing existing data...');
        $user->symptomLogs()->delete();
        $user->treatments()->delete();
        $user->alerts()->delete();

        // Helper function to create random dates in the past
        $randomDate = function ($daysAgo) {
            $baseDate = Carbon::now()->subDays($daysAgo);
            return $baseDate->addHours(rand(6, 22))->addMinutes(rand(0, 59));
        };

        // Create symptom patterns over the last 30 days
        $this->command->info('📊 Creating symptom logs...');

        $symptoms = [
            ['type' => 'headache', 'base_severity' => 6, 'variation' => 2],
            ['type' => 'fatigue', 'base_severity' => 5, 'variation' => 3],
            ['type' => 'pain', 'base_severity' => 4, 'variation' => 3],
            ['type' => 'mood', 'base_severity' => 3, 'variation' => 2],
            ['type' => 'energy', 'base_severity' => 4, 'variation' => 2],
            ['type' => 'nausea', 'base_severity' => 2, 'variation' => 1],
            ['type' => 'sleep_quality', 'base_severity' => 3, 'variation' => 2],
            ['type' => 'appetite', 'base_severity' => 3, 'variation' => 2],
        ];

        $symptomCount = 0;
        for ($day = 30; $day >= 0; $day--) {
            // 70% chance of having symptoms on any given day
            if (rand(1, 100) <= 70) {
                // 1-3 symptoms per day
                $numSymptoms = rand(1, 3);
                $dailySymptoms = array_rand($symptoms, min($numSymptoms, count($symptoms)));
                if (!is_array($dailySymptoms)) $dailySymptoms = [$dailySymptoms];
                
                foreach ($dailySymptoms as $symptomIndex) {
                    $symptom = $symptoms[$symptomIndex];
                    $severity = max(1, min(10, $symptom['base_severity'] + rand(-$symptom['variation'], $symptom['variation'])));
                    
                    $notes = [
                        'headache' => ['Tension headache', 'Migraine symptoms', 'Pressure behind eyes', 'Throbbing pain'],
                        'fatigue' => ['Very tired today', 'Low energy', 'Hard to concentrate', 'Feeling drained'],
                        'pain' => ['Lower back pain', 'Joint stiffness', 'Muscle soreness', 'Sharp pain in neck'],
                        'mood' => ['Feeling down', 'Irritable today', 'Low mood', 'Emotional'],
                        'energy' => ['No motivation', 'Sluggish feeling', 'Hard to get started', 'Feeling depleted'],
                        'nausea' => ['Queasy stomach', 'After eating', 'Morning sickness feeling', 'Upset stomach'],
                        'sleep_quality' => ['Trouble falling asleep', 'Woke up multiple times', 'Early morning wake-up', 'Restless night'],
                        'appetite' => ['Not hungry today', 'Overeating', 'Cravings', 'Lost appetite'],
                    ];
                    
                    SymptomLog::create([
                        'user_id' => $user->id,
                        'symptom' => $symptom['type'],
                        'severity' => $severity,
                        'notes' => $notes[$symptom['type']][array_rand($notes[$symptom['type']])],
                        'occurred_at' => $randomDate($day),
                    ]);
                    $symptomCount++;
                }
            }
        }

        $this->command->info("✅ Created {$symptomCount} symptom logs");

        // Create treatment patterns
        $this->command->info('💊 Creating treatment logs...');

        $treatments = [
            ['name' => 'Ibuprofen', 'type' => 'medication', 'dose' => '400mg', 'frequency' => 0.3],
            ['name' => 'Melatonin', 'type' => 'supplement', 'dose' => '3mg', 'frequency' => 0.4],
            ['name' => 'Yoga Session', 'type' => 'exercise', 'dose' => '30 min', 'frequency' => 0.2],
            ['name' => 'Magnesium', 'type' => 'supplement', 'dose' => '200mg', 'frequency' => 0.6],
            ['name' => 'Physical Therapy', 'type' => 'therapy', 'dose' => '45 min', 'frequency' => 0.15],
            ['name' => 'Meditation', 'type' => 'lifestyle', 'dose' => '15 min', 'frequency' => 0.25],
            ['name' => 'Vitamin D', 'type' => 'supplement', 'dose' => '1000 IU', 'frequency' => 0.8],
            ['name' => 'Acetaminophen', 'type' => 'medication', 'dose' => '500mg', 'frequency' => 0.2],
            ['name' => 'Green Tea', 'type' => 'diet', 'dose' => '2 cups', 'frequency' => 0.5],
            ['name' => 'Walking', 'type' => 'exercise', 'dose' => '20 min', 'frequency' => 0.4],
        ];

        $treatmentCount = 0;
        for ($day = 30; $day >= 0; $day--) {
            foreach ($treatments as $treatment) {
                // Random chance based on frequency
                if (rand(1, 100) <= ($treatment['frequency'] * 100)) {
                    $notes = [
                        'medication' => ['For headache relief', 'Taken with food', 'Before bedtime', 'As needed for pain'],
                        'supplement' => ['Daily vitamin', 'With breakfast', 'Evening dose', 'Health maintenance'],
                        'exercise' => ['Morning routine', 'Stress relief', 'Physical wellness', 'Flexibility training'],
                        'therapy' => ['Weekly session', 'Pain management', 'Injury recovery', 'Mobility improvement'],
                        'lifestyle' => ['Stress management', 'Daily practice', 'Mental wellness', 'Relaxation'],
                        'diet' => ['Healthy choice', 'Antioxidants', 'Morning boost', 'Caffeine alternative'],
                    ];
                    
                    Treatment::create([
                        'user_id' => $user->id,
                        'name' => $treatment['name'],
                        'type' => $treatment['type'],
                        'dose' => $treatment['dose'],
                        'notes' => $notes[$treatment['type']][array_rand($notes[$treatment['type']])],
                        'administered_at' => $randomDate($day),
                    ]);
                    $treatmentCount++;
                }
            }
        }

        $this->command->info("✅ Created {$treatmentCount} treatment logs");

        // Create some sample alerts based on patterns
        $this->command->info('🔔 Creating sample health insights...');

        $alerts = [
            [
                'user_id' => $user->id,
                'type' => 'post_treatment',
                'severity' => 3,
                'summary' => 'Headaches tend to improve 2-4 hours after taking Ibuprofen',
                'details' => [
                    'symptom' => 'headache',
                    'treatment' => 'Ibuprofen',
                    'window_hours' => [2, 4],
                    'evidence' => ['matches' => 8, 'trials' => 10],
                    'confidence' => 0.85
                ],
                'generated_at' => Carbon::now()->subDays(3),
            ],
            [
                'user_id' => $user->id,
                'type' => 'post_treatment',
                'severity' => 2,
                'summary' => 'Sleep quality improves on nights when Melatonin is taken',
                'details' => [
                    'symptom' => 'sleep_quality',
                    'treatment' => 'Melatonin',
                    'improvement' => '40% reduction in severity',
                    'evidence' => ['matches' => 12, 'trials' => 15],
                    'confidence' => 0.78
                ],
                'generated_at' => Carbon::now()->subDays(5),
            ],
            [
                'user_id' => $user->id,
                'type' => 'spike',
                'severity' => 4,
                'summary' => 'Poor mood often precedes severe headaches by 12-24 hours',
                'details' => [
                    'primary_symptom' => 'headache',
                    'trigger_symptom' => 'mood',
                    'window_hours' => [12, 24],
                    'evidence' => ['matches' => 6, 'trials' => 8],
                    'confidence' => 0.71
                ],
                'generated_at' => Carbon::now()->subDays(1),
            ],
            [
                'user_id' => $user->id,
                'type' => 'post_treatment',
                'severity' => 2,
                'summary' => 'Fatigue levels drop 18-30 hours after Yoga sessions',
                'details' => [
                    'symptom' => 'fatigue',
                    'treatment' => 'Yoga Session',
                    'improvement' => '30% severity reduction',
                    'window_hours' => [18, 30],
                    'evidence' => ['matches' => 5, 'trials' => 7],
                    'confidence' => 0.68
                ],
                'generated_at' => Carbon::now()->subDays(2),
            ],
            [
                'user_id' => $user->id,
                'type' => 'post_treatment',
                'severity' => 4,
                'summary' => 'Nausea episodes often occur 1-3 hours after Acetaminophen',
                'details' => [
                    'symptom' => 'nausea',
                    'treatment' => 'Acetaminophen',
                    'window_hours' => [1, 3],
                    'evidence' => ['matches' => 4, 'trials' => 6],
                    'confidence' => 0.67
                ],
                'generated_at' => Carbon::now()->subDays(4),
            ],
            [
                'user_id' => $user->id,
                'type' => 'co_occurrence',
                'severity' => 2,
                'summary' => 'Walking sessions correlate with reduced pain levels the following day',
                'details' => [
                    'symptom' => 'pain',
                    'treatment' => 'Walking',
                    'improvement' => '25% average reduction',
                    'timeframe' => 'next day',
                    'evidence' => ['matches' => 9, 'trials' => 12],
                    'confidence' => 0.82
                ],
                'generated_at' => Carbon::now()->subDays(6),
            ],
        ];

        foreach ($alerts as $alertData) {
            Alert::create($alertData);
        }

        $alertCount = count($alerts);
        $this->command->info("✅ Created {$alertCount} health insights");

        $this->command->info('');
        $this->command->info('🎉 Data population complete!');
        $this->command->info('');
        $this->command->info('📈 Summary:');
        $this->command->info("   • {$symptomCount} symptom logs over 30 days");
        $this->command->info("   • {$treatmentCount} treatment logs");
        $this->command->info("   • {$alertCount} AI-generated health insights");
        $this->command->info('');
        $this->command->info('🚀 Now you can explore patterns in the app:');
        $this->command->info('   • View symptoms and treatments in their respective tabs');
        $this->command->info('   • Check the Alerts tab for AI insights');
        $this->command->info('   • Use the Dashboard to see overall health stats');
        $this->command->info('   • Click "Recompute Alerts" to generate new insights');
        $this->command->info('');
    }
}