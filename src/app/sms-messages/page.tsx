"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export default function SmsMessages() {
  const [sendForm, setSendForm] = useState({
    recipient: '',
    message: '',
    simPort: 0,
    sending: false
  });

  const [messages, setMessages] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    loadConfig();
    loadMessages();
  }, []);

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('dinstar_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      setSendForm(prev => ({ ...prev, simPort: parsed.simPort || 0 }));
    }
  };

  const loadMessages = () => {
    const savedMessages = localStorage.getItem('dinstar_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  const sendSms = async () => {
    if (!sendForm.recipient || !sendForm.message) {
      alert('Ju lutem plotësoni numrin dhe mesazhin');
      return;
    }

    if (!config) {
      alert('Gateway nuk është i konfiguruar. Shkoni tek konfigurimi.');
      return;
    }

    setSendForm(prev => ({ ...prev, sending: true }));

    try {
      // Simulate SMS sending
      const newMessage = {
        id: Date.now(),
        direction: 'outbound',
        recipient: sendForm.recipient,
        message: sendForm.message,
        simPort: sendForm.simPort,
        status: 'sent',
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [newMessage, ...messages];
      setMessages(updatedMessages);
      localStorage.setItem('dinstar_messages', JSON.stringify(updatedMessages));

      setSendForm({ recipient: '', message: '', simPort: sendForm.simPort, sending: false });
      alert('SMS u dërgua me sukses! (Demo mode)');

    } catch (error) {
      console.error('SMS send error:', error);
      alert('Gabim në dërgimin e SMS');
    } finally {
      setSendForm(prev => ({ ...prev, sending: false }));
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('sq-AL');
  };

   if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-gray-800">Gateway nuk është i konfiguruar</CardTitle>
            <p className="text-gray-600">Shkoni tek konfigurimi për të vendosur gateway</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = '/sms-config'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Shko tek Konfigurimi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dinstar SMS Messages</h1>
              <p className="text-gray-600 mt-2">Dërgoni dhe merrni SMS përmes gateway Dinstar</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm text-blue-800">
                  {config.baseUrl}:{config.port}
                </span>
              </div>
              <Button 
                onClick={() => window.location.href = '/sms-config'}
                variant="outline"
                size="sm"
              >
                Konfigurimi
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send SMS Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Dërgo SMS</CardTitle>
                <p className="text-sm text-gray-600">Dërgoni SMS tek numrat tuaj</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipient" className="text-sm font-medium text-gray-700">
                    Numri Marrës <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="recipient"
                    type="tel"
                    placeholder="0697040852"
                    value={sendForm.recipient}
                    onChange={(e) => setSendForm(prev => ({ ...prev, recipient: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="simPort" className="text-sm font-medium text-gray-700">
                    Porta SIM
                  </Label>
                  <Input
                    id="simPort"
                    type="number"
                    min="0"
                    max="15"
                    value={sendForm.simPort}
                    onChange={(e) => setSendForm(prev => ({ ...prev, simPort: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Porta SIM (0-15). Default: {config.simPort}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Mesazhi <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Shkruani mesazhin tuaj këtu..."
                    value={sendForm.message}
                    onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                    className="mt-1 h-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {sendForm.message.length}/160 karaktere
                  </p>
                </div>
                
                <Button
                  onClick={sendSms}
                  disabled={sendForm.sending || !sendForm.recipient || !sendForm.message}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {sendForm.sending ? 'Duke dërguar...' : 'Dërgo SMS'}
                </Button>
              </CardContent>
            </Card>

            {/* Test Commands */}
            <Card className="shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Test Command</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Curl Command:</p>
                    <code className="block bg-gray-100 p-3 rounded text-xs break-all">
                      {`curl --anyauth -u "${config.username}:${config.password}" -X POST -H "Content-Type: application/json" -d '{"text":"Test","port":[${sendForm.simPort}],"param":[{"number":"${sendForm.recipient || '0697040852'}","user_id":1234,"sn":"${config.serialNumber}"}]}' ${config.baseUrl}:${config.port}/api/send_sms`}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages List */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-800">Historiku i Mesazheve</CardTitle>
                  <Button 
                    onClick={loadMessages}
                    variant="outline"
                    size="sm"
                  >
                    Rifresko
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  {messages.length > 0 ? `${messages.length} mesazhe gjithsej` : 'Nuk ka mesazhe'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div key={message.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              message.direction === 'inbound' ? 'bg-purple-500' : 'bg-blue-500'
                            }`}></div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {message.direction === 'inbound' ? 
                                  `Nga: ${message.sender}` : 
                                  `Tek: ${message.recipient}`
                                }
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDateTime(message.timestamp)} • Porta SIM: {message.simPort}
                              </p>
                            </div>
                          </div>
                          <Badge className={
                            message.status === 'sent' ? 'bg-green-100 text-green-800' :
                            message.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {message.status === 'sent' ? 'Dërguar' : 
                             message.status === 'delivered' ? 'Dorëzuar' : 'Gabim'}
                          </Badge>
                        </div>
                        <div className={`p-3 rounded-lg ${
                          message.direction === 'inbound' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-100 border-l-4 border-gray-400'
                        }`}>
                          <p className="text-sm text-gray-700">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Nuk ka mesazhe</h3>
                      <p className="text-gray-500">Dërgoni SMS-in e parë tuaj për të filluar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}