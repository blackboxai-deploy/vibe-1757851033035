# 🚀 **Laravel Dinstar SMS Integration - Me Prefiks**

## 📋 **Database Schema - Me Prefiks dinstar_**

### **Migration 1: dinstar_configs**
```php
<?php
// database/migrations/xxxx_create_dinstar_configs_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDinstarConfigsTable extends Migration
{
    public function up()
    {
        Schema::create('dinstar_configs', function (Blueprint $table) {
            $table->id();
            $table->string('base_url'); // http:// ose https:// - user vendos
            $table->integer('port')->default(8081);
            $table->string('username');
            $table->string('password');
            $table->string('serial_number'); // SN parameter
            $table->integer('default_sim_port')->default(0); // Porta default 0-15
            $table->integer('timeout')->default(30);
            $table->boolean('is_active')->default(true);
            $table->json('sim_ports_data')->nullable(); // Data e portave SIM
            $table->timestamps();
            
            // Indexes
            $table->index('is_active');
        });
    }

    public function down()
    {
        Schema::dropIfExists('dinstar_configs');
    }
}
```

### **Migration 2: dinstar_sms_logs**
```php
<?php
// database/migrations/xxxx_create_dinstar_sms_logs_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDinstarSmsLogsTable extends Migration
{
    public function up()
    {
        Schema::create('dinstar_sms_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('direction', ['inbound', 'outbound']);
            $table->string('recipient', 20)->nullable(); // Për outbound
            $table->string('sender', 20)->nullable(); // Për inbound  
            $table->text('message');
            $table->string('provider', 20)->default('dinstar');
            $table->enum('status', ['pending', 'sent', 'delivered', 'failed', 'received']);
            $table->integer('sim_port')->default(0); // Porta SIM e përdorur
            $table->integer('user_session_id')->nullable(); // Session ID për tracking
            $table->integer('task_id')->nullable(); // Task ID nga Dinstar
            $table->integer('error_code')->nullable(); // Error code nga Dinstar
            $table->text('error_message')->nullable();
            $table->decimal('cost', 8, 4)->nullable();
            $table->string('currency', 3)->default('EUR');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->bigInteger('user_id')->nullable(); // Lidhja me user
            $table->bigInteger('company_id')->nullable(); // Për multi-company
            $table->timestamps();
            
            // Indexes për performance
            $table->index(['direction', 'status']);
            $table->index(['user_session_id', 'task_id']);
            $table->index(['sim_port', 'status']);
            $table->index(['user_id', 'company_id']);
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('dinstar_sms_logs');
    }
}
```

---

## 🔧 **Models me Prefiks**

### **Model 1: DinstarConfig**
```php
<?php
// app/Models/DinstarConfig.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DinstarConfig extends Model
{
    protected $table = 'dinstar_configs'; // Explicit table name

    protected $fillable = [
        'base_url',
        'port', 
        'username',
        'password',
        'serial_number',
        'default_sim_port',
        'timeout',
        'is_active',
        'sim_ports_data'
    ];

    protected $casts = [
        'sim_ports_data' => 'array',
        'is_active' => 'boolean',
        'port' => 'integer',
        'default_sim_port' => 'integer',
        'timeout' => 'integer'
    ];

    protected $hidden = [
        'password'
    ];

    public static function getActive()
    {
        return static::where('is_active', true)->first();
    }

    public function getFullUrlAttribute()
    {
        return rtrim($this->base_url, '/') . ':' . $this->port;
    }
}
```

### **Model 2: DinstarSmsLog**
```php
<?php
// app/Models/DinstarSmsLog.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DinstarSmsLog extends Model
{
    protected $table = 'dinstar_sms_logs'; // Explicit table name

    protected $fillable = [
        'direction',
        'recipient', 
        'sender',
        'message',
        'provider',
        'status',
        'sim_port',
        'user_session_id',
        'task_id',
        'error_code',
        'error_message',
        'cost',
        'currency',
        'sent_at',
        'delivered_at',
        'failed_at',
        'received_at',
        'user_id',
        'company_id'
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime', 
        'failed_at' => 'datetime',
        'received_at' => 'datetime',
        'cost' => 'decimal:4'
    ];

    // Relations
    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    // Scopes
    public function scopeOutbound($query)
    {
        return $query->where('direction', 'outbound');
    }

    public function scopeInbound($query)
    {
        return $query->where('direction', 'inbound');
    }

    public function scopeBySimPort($query, $port)
    {
        return $query->where('sim_port', $port);
    }

    public function scopeBySession($query, $sessionId)
    {
        return $query->where('user_session_id', $sessionId);
    }
}
```

---

## 🛠️ **Service me Prefiks**

### **DinstarService (Updated):**
```php
<?php
// app/Services/DinstarService.php - ME PREFIKS
namespace App\Services;

use App\Models\DinstarConfig;
use App\Models\DinstarSmsLog;

class DinstarService
{
    private $config;

    public function __construct()
    {
        $this->config = DinstarConfig::getActive(); // Updated model name
        
        if (!$this->config) {
            throw new \Exception('Dinstar gateway not configured');
        }
    }

    public function sendSms($phone, $message, $port = null, $name = "Klient")
    {
        $simPort = $port !== null ? $port : $this->config->default_sim_port;
        
        // User-defined URL (http:// ose https://)
        $url = "{$this->config->full_url}/api/send_sms";
        
        $userSessionId = rand(1000, 9999);
        
        $data = [
            "text" => $message,
            "port" => [(int)$simPort],
            "param" => [[
                "number" => $phone,
                "user_id" => $userSessionId,
                "sn" => $this->config->serial_number
            ]]
        ];

        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->config->username}:{$this->config->password}");
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json; charset=utf-8"]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->config->timeout);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            \Log::error('Dinstar CURL Error', [
                'error' => $curlError,
                'url' => $url,
                'phone' => $phone
            ]);
            
            return [
                'success' => false,
                'message' => "CURL Error: $curlError"
            ];
        }

        $decoded = json_decode($response, true);
        
        if (!$decoded) {
            \Log::error('Dinstar Invalid JSON', [
                'response' => $response,
                'url' => $url
            ]);
            
            return [
                'success' => false,
                'message' => "Invalid JSON response: $response"
            ];
        }

        $success = $decoded['error_code'] === 202;

        // Log në dinstar_sms_logs table
        $log = DinstarSmsLog::create([ // Updated model name
            'direction' => 'outbound',
            'recipient' => $phone,
            'message' => $message,
            'provider' => 'dinstar',
            'status' => $success ? 'sent' : 'failed',
            'sim_port' => $simPort,
            'user_session_id' => $userSessionId,
            'task_id' => $decoded['task_id'] ?? null,
            'error_code' => $decoded['error_code'],
            'error_message' => $success ? null : ($decoded['error_msg'] ?? 'Unknown error'),
            'sent_at' => $success ? now() : null,
            'failed_at' => $success ? null : now(),
            'user_id' => auth()->id() ?? null,
            'company_id' => auth()->user()->company_id ?? null
        ]);

        \Log::info('Dinstar SMS Result', [
            'success' => $success,
            'phone' => $phone,
            'sim_port' => $simPort,
            'session_id' => $userSessionId,
            'task_id' => $decoded['task_id'] ?? null,
            'error_code' => $decoded['error_code']
        ]);

        return [
            'success' => $success,
            'message' => $success ? 'SMS sent successfully' : "Dinstar Error {$decoded['error_code']}: {$decoded['error_msg'] ?? 'Unknown'}",
            'user_session_id' => $userSessionId,
            'task_id' => $decoded['task_id'] ?? null,
            'sim_port_used' => $simPort,
            'sms_in_queue' => $decoded['sms_in_queue'] ?? null,
            'error_code' => $decoded['error_code'],
            'log_id' => $log->id,
            'response' => $response
        ];
    }

    public function checkStatus($userSessionId, $taskId = null)
    {
        $url = "{$this->config->full_url}/api/get_sms_status";
        
        $payload = [
            "user_id" => $userSessionId,
            "task_id" => $taskId,
            "sn" => $this->config->serial_number
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-type: application/json']);
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->config->username}:{$this->config->password}");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $response = curl_exec($ch);
        $decoded = json_decode($response, true);
        curl_close($ch);

        // Update status në dinstar_sms_logs
        if ($decoded && $decoded['error_code'] === 200) {
            $log = DinstarSmsLog::where('user_session_id', $userSessionId)->first();
            if ($log) {
                $log->update([
                    'status' => $decoded['delivery_status'] === 'delivered' ? 'delivered' : 'sent',
                    'delivered_at' => $decoded['delivery_status'] === 'delivered' ? now() : null
                ]);
            }
        }

        return [
            'success' => $decoded['error_code'] === 200,
            'delivery_status' => $decoded['delivery_status'] ?? 'pending',
            'error_code' => $decoded['error_code'] ?? null,
            'response' => $decoded
        ];
    }

    public function testConnection()
    {
        return $this->sendSms('+355694000000', 'Connection test', 0, 'Test');
    }
}
```

---

## 🎮 **Controllers me Prefiks**

### **SmsController (Updated):**
```php
<?php
// app/Http/Controllers/SMS/SmsController.php
namespace App\Http\Controllers\SMS;

use App\Http\Controllers\Controller;
use App\Models\DinstarConfig; // Updated model
use App\Models\DinstarSmsLog; // Updated model  
use App\Services\DinstarService;
use Illuminate\Http\Request;

class SmsController extends Controller
{
    public function index()
    {
        $config = DinstarConfig::getActive();
        $messages = DinstarSmsLog::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(50);
            
        return view('sms.messages', compact('config', 'messages'));
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'recipient' => 'required|string',
            'message' => 'required|string|max:160',
            'sim_port' => 'integer|min:0|max:15|nullable'
        ]);

        try {
            $dinstarService = new DinstarService();
            
            $result = $dinstarService->sendSms(
                $validated['recipient'],
                $validated['message'],
                $validated['sim_port']
            );

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
                'session_id' => $result['user_session_id'],
                'task_id' => $result['task_id'],
                'sim_port_used' => $result['sim_port_used'],
                'data' => $result
            ]);

        } catch (\Exception $e) {
            \Log::error('Dinstar SMS send error', [
                'recipient' => $validated['recipient'],
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'SMS sending failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function checkStatus(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|integer',
            'task_id' => 'integer|nullable'
        ]);

        try {
            $dinstarService = new DinstarService();
            $status = $dinstarService->checkStatus(
                $validated['session_id'],
                $validated['task_id']
            );

            return response()->json($status);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Status check failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function receive(Request $request)
    {
        // Webhook për SMS të ardhshëm
        $validated = $request->validate([
            'sender' => 'required|string',
            'message' => 'required|string',
            'received_at' => 'string|nullable'
        ]);

        $log = DinstarSmsLog::create([ // Updated model
            'direction' => 'inbound',
            'sender' => $validated['sender'],
            'message' => $validated['message'],
            'provider' => 'dinstar', 
            'status' => 'received',
            'received_at' => $validated['received_at'] ? 
                \Carbon\Carbon::parse($validated['received_at']) : now(),
            'company_id' => 1 // Your company logic
        ]);

        return response()->json([
            'success' => true,
            'message' => 'SMS received and logged',
            'data' => $log
        ]);
    }
}
```

---

## 📋 **Installation Steps**

### **1. Create Migrations:**
```bash
php artisan make:migration create_dinstar_configs_table
php artisan make:migration create_dinstar_sms_logs_table
```

### **2. Create Models:**
```bash
php artisan make:model DinstarConfig
php artisan make:model DinstarSmsLog
```

### **3. Create Service:**
```bash
mkdir -p app/Services
# Copy DinstarService.php content
```

### **4. Create Controller:**
```bash
php artisan make:controller SMS/SmsController
# Copy controller content
```

### **5. Add Routes:**
```php
// routes/web.php
Route::group(['prefix' => 'dinstar-sms', 'middleware' => ['auth']], function () {
    Route::get('/config', function() {
        $config = \App\Models\DinstarConfig::getActive();
        return view('sms.config', compact('config'));
    })->name('dinstar.sms.config');
    
    Route::get('/messages', [App\Http\Controllers\SMS\SmsController::class, 'index'])
        ->name('dinstar.sms.messages');
        
    Route::post('/send', [App\Http\Controllers\SMS\SmsController::class, 'send'])
        ->name('dinstar.sms.send');
        
    Route::post('/check-status', [App\Http\Controllers\SMS\SmsController::class, 'checkStatus'])
        ->name('dinstar.sms.status');
});

// Webhook (pa auth)
Route::post('/dinstar-sms/receive', [App\Http\Controllers\SMS\SmsController::class, 'receive'])
    ->name('dinstar.sms.receive');
```

### **6. Run Migrations:**
```bash
php artisan migrate
```

---

## 🎯 **Test Command për ju:**

```bash
# Test me HTTP
curl --anyauth -u "Gjergji:Password" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"Test SMS nga CMD","port":[0],"param":[{"number":"0697040852","user_id":1234,"sn":"dbd2-0325-0044-0088"}]}' \
  http://185.120.181.129:8081/api/send_sms

# Test me HTTPS  
curl --anyauth -u "Gjergji:Password" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"Test SMS HTTPS","port":[0],"param":[{"number":"0697040852","user_id":1234,"sn":"dbd2-0325-0044-0088"}]}' \
  https://185.120.181.129:8081/api/send_sms \
  -k
```

---

## ✨ **Përfitimet e Prefiksit dinstar_:**

✅ **No Name Conflicts** - Nuk mbivendo me tabela ekzistuese  
✅ **Clear Purpose** - Qartë se janë për Dinstar SMS  
✅ **Easy Management** - Të gjitha tabela Dinstar së bashku  
✅ **Future Proof** - Mund të shtoni provider të tjerë pa konflikt  

**Tani mund ta instaloni pa u shqetësuar për mbivendosje emrash!** 🚀