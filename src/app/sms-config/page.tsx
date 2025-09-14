"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function SmsConfig() {
  const [config, setConfig] = useState({
    baseUrl: '',
    port: 8081,
    username: '',
    password: '',
    serialNumber: '',
    simPort: 0
  });

  const [status, setStatus] = useState('offline');
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      if (!config.baseUrl || !config.username || !config.password || !config.serialNumber) {
        alert('Ju lutem plotësoni të gjitha fushat e kërkuara');
        return;
      }

      localStorage.setItem('dinstar_config', JSON.stringify(config));
      alert('Konfigurimi u ruajt me sukses!');
      setStatus('configured');
    } catch (error) {
      console.error('Save error:', error);
      alert('Gabim në ruajtjen e konfigurimit');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    alert(`Test Connection:\nURL: ${config.baseUrl}:${config.port}\nUsername: ${config.username}\nSN: ${config.serialNumber}\n\nPërdorni curl command nga CMD për të testuar gateway tuaj.`);
  };

  React.useEffect(() => {
    const savedConfig = localStorage.getItem('dinstar_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
      setStatus('configured');
    }
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case 'configured':
        return <Badge className="bg-green-100 text-green-800">I Konfiguruar</Badge>;
      case 'testing':
        return <Badge className="bg-yellow-100 text-yellow-800">Duke testuar...</Badge>;
      case 'offline':
      default:
        return <Badge className="bg-red-100 text-red-800">Jo i Konfiguruar</Badge>;
    }
  };

   return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Konfigurimi i Dinstar Gateway</h1>
              <p className="text-gray-600 mt-2">Konfiguro lidhjen me gateway Dinstar për SMS</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Status:</span>
              {getStatusBadge()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Konfigurimi i Gateway</CardTitle>
                <p className="text-sm text-gray-600">Plotësoni të dhënat për lidhjen me Dinstar Gateway</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connection Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="baseUrl" className="text-sm font-medium text-gray-700">
                      Base URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="baseUrl"
                      type="text"
                      placeholder="http://185.120.181.129 ose https://185.120.181.129"
                      value={config.baseUrl}
                      onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Vendosni URL-në e plotë me http:// ose https://
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="port" className="text-sm font-medium text-gray-700">
                      Port <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="8081"
                      value={config.port}
                      onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 8081)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Authentication */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Gjergji"
                      value={config.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={config.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Serial Number */}
                <div>
                  <Label htmlFor="serialNumber" className="text-sm font-medium text-gray-700">
                    Serial Number (SN) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="serialNumber"
                    type="text"
                    placeholder="dbd2-0325-0044-0088"
                    value={config.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Serial number i gateway Dinstar (e nevojshme për API)
                  </p>
                </div>

                {/* SIM Port Default */}
                <div>
                  <Label htmlFor="simPort" className="text-sm font-medium text-gray-700">
                    Porta SIM Default
                  </Label>
                  <Input
                    id="simPort"
                    type="number"
                    min="0"
                    max="15"
                    placeholder="0"
                    value={config.simPort}
                    onChange={(e) => handleInputChange('simPort', parseInt(e.target.value) || 0)}
                    className="mt-1 md:w-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Porta SIM default (0-15). Mund të ndryshohet për çdo mesazh.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    onClick={saveConfiguration} 
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                  >
                    {saving ? 'Duke ruajtur...' : 'Ruaj Konfigurimin'}
                  </Button>
                  
                  <Button 
                    onClick={testConnection} 
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    Info Testimi
                  </Button>

                  <Button 
                    onClick={() => window.location.href = '/sms-messages'}
                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                  >
                    SMS Messages
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Connection Status */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Status i Gateway</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'configured' ? 'bg-green-500' : 
                        status === 'testing' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium">Gateway Status</span>
                    </div>
                    {getStatusBadge()}
                  </div>

                  <div className="text-sm text-gray-600">
                    <p className="mb-2"><strong>URL:</strong> {config.baseUrl}:{config.port}</p>
                    <p className="mb-2"><strong>Username:</strong> {config.username || 'Jo i caktuar'}</p>
                    <p className="mb-2"><strong>Serial Number:</strong> {config.serialNumber || 'Jo i caktuar'}</p>
                    <p><strong>SIM Port Default:</strong> {config.simPort}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Commands */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Test Commands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">HTTP Test:</p>
                    <code className="block bg-gray-100 p-3 rounded text-xs break-all">
                      {`curl --anyauth -u "${config.username}:${config.password}" -X POST -H "Content-Type: application/json" -d '{"text":"Test SMS","port":[${config.simPort}],"param":[{"number":"0697040852","user_id":1234,"sn":"${config.serialNumber}"}]}' ${config.baseUrl}:${config.port}/api/send_sms`}
                    </code>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">HTTPS Test:</p>
                    <code className="block bg-gray-100 p-3 rounded text-xs break-all">
                      {`curl --anyauth -u "${config.username}:${config.password}" -X POST -H "Content-Type: application/json" -d '{"text":"Test HTTPS","port":[${config.simPort}],"param":[{"number":"0697040852","user_id":1234,"sn":"${config.serialNumber}"}]}' ${config.baseUrl.replace('http://', 'https://')}:${config.port}/api/send_sms -k`}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Guide */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Udhëzues i Shpejtë</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs text-blue-600 font-medium">1</span>
                    </div>
                    <p>Plotësoni URL-në (http:// ose https://)</p>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs text-blue-600 font-medium">2</span>
                    </div>
                    <p>Vendosni port, username, password dhe SN</p>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs text-blue-600 font-medium">3</span>
                    </div>
                    <p>Kopjoni curl command dhe testoni në CMD</p>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs text-blue-600 font-medium">4</span>
                    </div>
                    <p>Ruani konfigurimin dhe shkoni tek SMS Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}