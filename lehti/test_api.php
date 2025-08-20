<?php
// Simple API test script
echo "Testing Lehti API...\n\n";

// Test login
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/auth/login');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'demo@folia.com',
    'password' => 'password123'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($httpCode === 200) {
    echo "✅ Login successful!\n";
    $data = json_decode($response, true);
    echo "User: " . $data['user']['name'] . "\n";
    echo "Token: " . substr($data['token'], 0, 50) . "...\n\n";
    
    $token = $data['token'];
    
    // Test getting alerts
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/alerts');
    curl_setopt($ch, CURLOPT_HTTPGET, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ]);
    
    $alertsResponse = curl_exec($ch);
    $alertsCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($alertsCode === 200) {
        echo "✅ Alerts endpoint working!\n";
        $alertsData = json_decode($alertsResponse, true);
        echo "Found " . count($alertsData['data']) . " alerts\n";
        
        if (!empty($alertsData['data'])) {
            $alert = $alertsData['data'][0];
            echo "Sample alert: " . $alert['summary'] . "\n";
        }
    } else {
        echo "❌ Alerts endpoint failed: " . $alertsCode . "\n";
    }
    
} else {
    echo "❌ Login failed: " . $httpCode . "\n";
    echo "Response: " . $response . "\n";
}

curl_close($ch);

echo "\n🎉 API test completed!\n";
?>
